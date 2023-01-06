const UI = require("./ui.js");

/**
 * @typedef DiscordUISettings
 * @summary An object that represent the Discord settings for {@link UserInterface}.
 * @property {string} token The token of the discord bot.
 * @property {string} commandChannelId The channel id the bot should use to fetch commands.
 * @property {string} chatChannelId The channel id the bot should use to forward in game chats.
 * @property {number} botId The id of the discord bot.
 */

/**
 * @typedef Client
 * @summary See [Client]{@link https://discord.js.org/#/docs/discord.js/main/class/Client}.
 */

/**
 * @typedef BaseChannel
 * @summary See [BaseChannel]{@link https://discord.js.org/#/docs/discord.js/main/class/BaseChannel}.
 */

/**
 * @class
 * Creates a user interface to send commands to the bot. Only supports one bot.
 * @extends UI
 */
class DiscordUI extends UI {
    /**
     * @param {DiscordUISettings} settings 
     */
    constructor(settings) {
        super();

        this.mbot = null;

        // Init Discord Client
        /**
         * @property {string} discordToken The token of the discord bot.
         */
        this.discordToken = settings["token"];
        
        /**
         * @property {number} discordBotId The id of the discord bot.
         */
        this.discordBotId = settings["botId"];

        /**
         * @property {Client} discordClient The discord client instance for this user interface.
         */
        this.discordClient = new (require("discord.js").Client)({
            intents: ["Guilds", "GuildMessages", "MessageContent"] 
        });

        this.discordClient.login(this.discordToken);

        this.discordClient.on("ready", () => {
            // Set up channels for Discord Client

            /**
             * @property {BaseChannel} commandChannel The channel instance of command channel.
             */
            this.commandChannel = this.discordClient.channels.cache.get(settings["commandChannelId"]);

            /**
             * @property {BaseChannel} chatChannel The channel instance of chat channel.
             */
            this.chatChannel = this.discordClient.channels.cache.get(settings["chatChannelId"]);
    
            // Set up listeners
            this.discordClient.on("messageCreate", message => {
                // Do not do anything if the bot sends the message
                if (message.author.id == this.discordBotId) return;

                // Check where the message is sent
                if (message.channel.id == this.commandChannel.id) {
                    this.mbot?.instructionManager.getCommand(message.content)
                    .then(() => message.channel.send("Finished command " + message.content))
                    .catch(e => this.logError(e));
                }
                else if (message.channel.id == this.chatChannel.id) {
                    this.mbot?.bot?.chat(message.content) ?? message.channel.send("Could not send message");
                }
            });
    
            // Let the user know the discord bot is ready
            this.notify("Discord Bot is Initialized");
        });
    }

    logMinecraftWhisper(username, message) { // ?? Can be modified to allow receiving chats from many mbots
        this.chatChannel.send(`*${username.replace(/\_/, "\\_").replace(/\*/, "\\*")} whispers to you: ${message}*`);
    }

    logMinecraftChat(username, message) { // ?? Can be modified to allow receiving chats from many mbots
        this.chatChannel.send(`${username.replace(/\_/, "\\_").replace(/\*/, "\\*")}: ${message}`);
    }

    notify(message) {
        this.commandChannel.send(message);
    }

    addMbot(mbot) {
        this.mbot = mbot;
    }
}

module.exports = DiscordUI;
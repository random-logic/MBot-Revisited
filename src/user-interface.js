/**
 * @typedef DiscordClient
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
 * Creates a user interface to send commands to the bot.
 */
class UserInterface {
    /**
     * @param {Mbot} mbot The instance of Mbot that this module will be mounted to.
     */
    constructor(mbot) {
        /**
         * @property {Mbot} mbot The instance of Mbot that this module is mounted to.
         */
        this.mbot = mbot;

        // Init Discord Client
        /**
         * @property {string} discordToken The token of the discord bot.
         */
        this.discordToken = this.mbot.settings["discordClient"]["token"];
        
        /**
         * @property {number} discordBotId The id of the discord bot.
         */
        this.discordBotId = this.mbot.settings["discordClient"]["botId"];

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
            this.commandChannel = this.discordClient.channels.cache.get(this.mbot.settings["discordClient"]["commandChannelId"]);

            /**
             * @property {BaseChannel} chatChannel The channel instance of chat channel.
             */
            this.chatChannel = this.discordClient.channels.cache.get(this.mbot.settings["discordClient"]["chatChannelId"]);
    
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
                    this.mbot?.bot?.chat(message.content);
                }
            });
    
            // Let the user know the discord bot is ready
            this.commandChannel.send("Discord Bot is Initialized");
        });
    }

    /**
     * Logs a minecraft whisper message.
     * @param {string} username The username associated with the message.
     * @param {string} message The message.
     */
    logMinecraftWhisper(username, message) { // ?? Can be modified to allow receiving chats from many mbots
        this.chatChannel.send(`*${username} whispers to you: ${message}*`);
    }

    /**
     * Logs a minecraft chat message.
     * @param {string} username The username associated with the message.
     * @param {string} message The message.
     */
    logMinecraftChat(username, message) { // ?? Can be modified to allow receiving chats from many mbots
        this.chatChannel.send(`${username}: ${message}`);
    }

    /**
     * Push notification to user interface.
     * @param {string} message The message.
     */
    notify(message) {
        this.commandChannel.send(message);
    }

    /**
     * Log for debugging.
     * @param {string} what String to log
     */
    log(what) {
        console.log(what);
    }

    /**
     * Log error for debugging.
     * @param {string | Error} what Error to log
     */
    logError(what) {
        console.error(what);
    }
}

module.exports = UserInterface;
/**
 * This class interracts with the user
 */
class UserInterface {
    /**
     * Constructor
     * @param {Mbot} mbot The instance of Mbot to link to
     */
    constructor(settings, mbot) {
        // Link to mbot reference
        // Can be modified to handle many mbot references
        this.mbot = mbot;

        // Init Discord Client
        this.discordToken = this.mbot.settings["discordClient"]["token"];
        this.discordBotId = this.mbot.settings["discordClient"]["botId"];
        this.discordClient = new (require("discord.js").Client)({
            intents: ["Guilds", "GuildMessages", "MessageContent"] 
        });
        this.discordClient.login(this.discordToken);

        this.discordClient.on("ready", () => {
            // Set up channels for Discord Client
            this.commandChannel = this.discordClient.channels.cache.get(settings["discordClient"]["commandChannelId"]);
            this.chatChannel = this.discordClient.channels.cache.get(settings["discordClient"]["chatChannelId"]);
    
            // Set up listeners
            this.discordClient.on("messageCreate", message => {
                // Do not do anything if the bot sends the message
                if (message.author.id == this.discordBotId) return;

                // Check where the message is sent
                if (message.channel.id == this.commandChannel.id) {
                    this.mbot?.instruction.getCommand(message.content)
                    .then(() => message.channel.send("Finished command " + message.content))
                    .catch(e => logError(e));
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
     * Logs a minecraft whisper message
     * Can be modified to allow receiving chats from many mbots
     */
    logMinecraftWhisper(username, message) {
        this.chatChannel.send(`*${username} whispers to you: ${message}*`);
    }

    /**
     * Logs a minecraft chat message
     * Can be modified to allow receiving chats from many mbots
     */
    logMinecraftChat(username, message) {
        this.chatChannel.send(`${username}: ${message}`);
    }

    /**
     * Push notification to user interface
     */
    notify(message) {
        this.commandChannel.send(message);
    }

    /**
     * Log for debugging
     * @param {string} what String to log
     */
    log(what) {
        console.log(what);
    }

    /**
     * Log error for debugging
     * @param {string | Error} what Error to log
     */
    logError(what) {
        console.error(what);
    }
}

module.exports = UserInterface;
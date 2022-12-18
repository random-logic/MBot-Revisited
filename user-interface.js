/**
 * This class mainly interracts with the user
 */
class UserInterface {
    /**
     * Constructor
     * Viewer streams to localhost:5000
     * Inventory streams to localhost:3000
     * Assumes that the bot is already spawned
     * @param {Settings} settings Refer to index.js
     */
    constructor(bot, settings, instruction) {
        this.instruction = instruction;

        // Init Discord Client
        this.discordToken = settings["discordClient"]["token"];
        this.discordBotId = settings["discordClient"]["botId"];
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
                if (message.author.id == this.discordBotId) return;
                if (message.channel.id == this.commandChannel.id) {
                    this.instruction.getCommand(message.content)
                    .then(() => message.channel.send("Finished command " + message.content))
                    .catch(e => message.channel.send(e.toString()));
                }
                else if (message.channel.id == this.chatChannel.id) {
                    bot.chat(message.content);
                }
            });

            bot.on("whisper", (username, message) => {
                if (username == bot.username) return;
                this.chatChannel.send(`*${username} whispers to you: ${message}*`);
            });
    
            bot.on("chat", (username, message) => {
                if (username == bot.username) return;
                this.chatChannel.send(`${username}: ${message}`);
            });
    
            // Let the user know the discord bot is ready
            this.commandChannel.send("Discord Bot is Ready");
        });

        // Display viewer on web
        require('prismarine-viewer').mineflayer(bot, { firstPerson: false, port: 5000 });

        // Display inventory on web
        require('mineflayer-web-inventory')(bot);
    }

    /**
     * Log message to output
     * @param {string} message The message to print
     */
    log(message) {
        // ??
    }
}

module.exports = UserInterface;
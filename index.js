const FileManager = require("./file-utility.js");
const Interrupt = require("./interrupt.js");
const Utility = require("./utility.js");
const Miner = require("./miner");

var settings, commands; // JSON files

var bot, mcData, movements; // Mineflayer

var token, discordBotId, client, commandChannel, chatChannel; // Discord client

var utility, interrupt; var modules = {}; // Custom scripts

var doingInstruction = false; // In the process of doing an instruction?

async function init() {
    // Load JSON files
    settings = await FileManager.readJsonFile("./login.json");
    commands = await FileManager.readJsonFile("./commands.json");

    // Create bot
    bot = require("mineflayer").createBot(settings["createBotArgs"]);
    
    // Load all bot plugins
    const { pathfinder, Movements } = require("mineflayer-pathfinder");
    //bot.loadPlugin(require("mineflayer-dashboard"))
    bot.loadPlugin(pathfinder);

    // Init Discord Client
    token = settings["discordClient"]["token"];
    discordBotId = settings["discordClient"]["botId"];
    client = new (require("discord.js").Client)({ intents: ["Guilds", "GuildMessages", "MessageContent"] });
    client.login(token);

    client.on("ready", () => {
        // Set up channels for Discord Client
        commandChannel = client.channels.cache.get(settings["discordClient"]["commandChannelId"]);
        chatChannel = client.channels.cache.get(settings["discordClient"]["chatChannelId"]);

        // Set up listeners
        bot.on("whisper", (username, message) => {
            if (username == bot.username) return;
            chatChannel.send(`*${username} whispers to you: ${message}*`);
        });

        bot.on("chat", (username, message) => {
            if (username == bot.username) return;
            chatChannel.send(`${username}: ${message}`);
        });

        // Let the user know the discord bot is ready
        commandChannel.send("Bot is ready");
    });

    bot.once("spawn", () => {
        // Init in game data
        mcData = require("minecraft-data")(bot.version);
        movements = new Movements(bot);

        // Init the custom scripts
        interrupt = new Interrupt();
        utility = new Utility(bot, mcData, movements);
        modules["miner"] = new Miner(bot, utility);

        // Set up listeners
        client.on("messageCreate", message => {
            if (message.author.id == discordBotId) return;
            if (message.channel.id == commandChannel.id) {
                getCommand(message.content)
                .then(() => message.channel.send("Finished command " + message.content))
                .catch(e => message.channel.send(e));
            }
            else if (message.channel.id == chatChannel.id) {
                bot.chat(message.content);
            }
        });
    });

    /*bot.once("inject_allowed", () => {
        bot.dashboard.addMode(
            new bot.dashboard.Mode("commander", {
                "bg": "blue",
                interpreter(string) {
                    getCommand(string)
                    .then(() => this.println("Finished command " + string))
                    .catch(e => bot.dashboard.log(e));
                },
                async completer (string) {
                    // We're using already well defined minecraft completer
                    return bot.dashboard._minecraftCompleter(string)
                }
            })
        );
    });*/
}

async function doInstruction(module, instructionName, args, options) {
    doingInstruction = true;

    var instructionError = null, instructionThrewError = false;

    try {
        await module[instructionName](args, options, interrupt);
    }
    catch (e) {
        instructionError = e;
        instructionThrewError = true;
    }
    finally {
        // Check for interrupt
        if (interrupt.hasInterrupt) {
            interrupt.resolve(); // Resolve interrupt for the next instruction
        }
        else {
            doingInstruction = false; // Otherwise we are not doing an instruction
        }

        if (instructionThrewError)
            throw instructionError;
    }
}

async function getCommand(commandName) {
    const command = commands[commandName];
    if (!command || typeof command !== "object")
        throw "Invalid Command Name";
    
    await parseInstruction(command);
}

async function parseInstruction(contents) {
    // Verify valid contents
    if (typeof contents !== "object" || contents === null) throw "Invalid contents";

    // Get module name
    const moduleName = contents["module"];
    if (typeof moduleName !== "string") throw "Invalid Module Name";

    // Get module
    const module = modules[moduleName];
    if (!module) throw "Invalid Module";

    // Get instruction name
    const instructionName = contents["instruction"];
    if (typeof instructionName !== "string") throw "Invalid Instruction Name";

    // Get instruction
    const instruction = module[instructionName];
    if (!instruction) throw "Invalid Instruction";

    // Do instruction
    if (!doingInstruction) {
        await doInstruction(module, instructionName, contents["args"], contents["options"]);
    }
    else {
        // Interrupt instruction before doing instruction
        await interrupt.interruptInstruction();
        await doInstruction(module, instructionName, contents["args"], contents["options"]);
    }
}

init().catch(e => console.log(e));
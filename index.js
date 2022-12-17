const { pathfinder, Movements } = require("mineflayer-pathfinder");

const FileManager = require("./file-utility.js");
const Miner = require("./miner");
const Utility = require("./utility.js");
const Interrupt = require("./interrupt.js");

var settings, commands; // JSON files

var bot, mcData, movements; // Mineflayer

var utility, interrupt; var modules = {}; // Custom scripts

var doingInstruction = false; // In the process of doing an instruction?

async function init() {
    // Load JSON files
    settings = await FileManager.readJsonFile("./settings.json");
    commands = await FileManager.readJsonFile("./commands.json");

    // Create bot
    bot = require("mineflayer").createBot(settings["createBotArgs"]);
    
    // Load all bot plugins
    bot.loadPlugin(require("mineflayer-dashboard"))
    bot.loadPlugin(pathfinder);

    bot.once("spawn", async () => {
        // Init in game data
        mcData = require("minecraft-data")(bot.version);
        movements = new Movements(bot);

        // Init the custom scripts
        interrupt = new Interrupt();
        utility = new Utility(bot, mcData, movements);
        modules["miner"] = new Miner(bot, utility);
    });

    bot.once("inject_allowed", () => {
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
    });
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
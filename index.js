const Utility = require("./utility.js");
const Miner = require("./miner.js");

const Interrupt = require("./interrupt.js");
const Instruction = require("./instruction.js");
const UserInterface = require("./user-interface.js");

var settings, commands; // JSON files

var bot, mcData, movements; // Mineflayer

var utility, interrupt, userInterface, instruction; var modules = {}; // Custom scripts

async function init() {
    // Load JSON files
    settings = await Utility.readJsonFile("./login.json");
    commands = await Utility.readJsonFile("./commands.json");

    // Create bot
    bot = require("mineflayer").createBot(settings["createBotArgs"]);
    
    // Load all bot plugins
    const { pathfinder, Movements } = require("mineflayer-pathfinder");
    //bot.loadPlugin(require("mineflayer-dashboard"))
    bot.loadPlugin(pathfinder);

    bot.once("spawn", () => {
        // Initialize game data
        mcData = require("minecraft-data")(bot.version);
        movements = new Movements(bot);

        // Load custom scripts
        utility = new Utility(bot, mcData, movements);
        modules["miner"] = new Miner(bot, utility, userInterface);

        interrupt = new Interrupt();
        instruction = new Instruction(bot, commands, modules, interrupt);
        userInterface = new UserInterface(bot, settings, instruction);
    })
}

init().catch(e => console.log(e));
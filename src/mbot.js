// Custom modules
const Instruction = require("./instruction");
const Interrupt = require("./interrupt");
const UserInterface = require("./user-interface");

// Custom modules with dependence on mineflayer
const Utility = require("./utility");
const Miner = require("./miner.js");
const Health = require("./health.js");

// Mineflayer modules
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const autoEat = require("mineflayer-auto-eat").default;
const botView = require('prismarine-viewer').mineflayer;
const inventoryView = require('mineflayer-web-inventory');

/**
 * Handles the bare minimum for the bot
 * Join and quit game
 * View bot and inventory in web browser
 * Has user interface to interact with bot, handled by user-interface.js
 * Other functionality is handled by other modules
 */
class Mbot {
    /**
     * @param {object} settings Refer to login-example.json
     * @param {object} commands Refer to command-example.json
     */
    constructor(settings, commands) {
        // Custom settings
        // These variables shall not change reference
        this.settings = settings;
        this.commands = commands;
        
        // Mineflayer
        this.bot = null;
        this.mcData = null;
        this.movements = null;

        // The object that stores all of the custom modules like miner.js and health.js
        this.modules = {};

        // Interrupts and instructions are independent from mineflayer
        // These variables shall not change its reference
        this.interrupt = new Interrupt();
        this.userInterface = new UserInterface(this.settings, this); // Can be modified to handle many mbot references
        this.instruction = new Instruction(this.commands, this.modules, this.interrupt, this.userInterface);
    }

    /**
     * @typedef {CreateBotArgs}
     * @param {bool} createBotView Creates bot view if true
     * @param {object} botViewOptions Refer to https://github.com/PrismarineJS/prismarine-viewer#mineflayer
     * @param {bool} createInventoryView Creates inventory view if true
     * @param {object} inventoryViewOptions Refer to https://github.com/imharvol/mineflayer-web-inventory#usage
     */
    /**
     * Instruction that creates the bot
     * @param {CreateBotArgs} args Associated args for this instruction
     * @param {Interrupt} interrupt Has no effect for this instruction
     * @return {Promise} Resolved after bot spawns and everything is set up
     */
    async createBot(args = null, interrupt = null) {
        // Instantiate bot
        this.bot = require("mineflayer").createBot(this.settings["createBotArgs"]);

        // Load all required bot plugins
        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(autoEat);

        // Wait for bot to finish spawning
        var resolveSpawn;
        var waitForSpawn = new Promise(resolve => {
            resolveSpawn = resolve;
        });

        this.bot.once("spawn", () => {
            // Initialize game data
            this.mcData = require("minecraft-data")(this.bot.version);
            this.movements = new Movements(this.bot);
    
            // Load custom scripts
            this.modules["utility"] = new Utility(this.bot, this.mcData, this.movements);
            this.modules["miner"] = new Miner(this.bot, this.modules["utility"], this.userInterface);
            this.modules["health"] = new Health(this.bot);

            // Display viewer on web
            if (args && args["createBotView"]) {
                botView(this.bot, args["botViewOptions"]);
            }

            // Display inventory on web
            if (args && args["createInventoryView"]) {
                inventoryView(this.bot, args["inventoryViewOptions"]);
            }

            // Link newly created bot to display any messages in chat on userInterface
            this.bot.on("whisper", (username, message) => {
                if (username == this.bot.username) return;
                this.userInterface.logMinecraftWhisper(username, message);
            });

            this.bot.on("chat", (username, message) => {
                if (username == this.bot.username) return;
                this.userInterface.logMinecraftChat(username, message);
            });

            resolveSpawn();
        });

        await waitForSpawn;

        this.userInterface.log("Spawned");
    }

    /**
     * Instruction that makes the bot quit the game
     * After this, the bot has to be recreated via createBot
     * @param {object} args Has no effect for this instruction
     * @param {Interrupt} interrupt Has no effect for this instruction
     */
    quit(args = null, interrupt = null) {
        this.bot.quit();
        this.bot = null;
        this.mcData = null;
        this.movements = null;
        this.modules = {};
    }

    /**
     * Quits the game for count milliseconds
     * @param {QuitGameForArgs} args The args for this instruction
     * @param {Interrupt} interrupt Refer to interrupt.js
     */
    /*quitGameFor(count) {
        this.bot.quit();
        // ??
    }*/
}

module.exports = Mbot;
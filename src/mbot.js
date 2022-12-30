// Custom modules
const InstructionManager = require("./instruction-manager");
const UserInterface = require("./user-interface");

// Custom modules with dependence on mineflayer
const Utility = require("./utility");
const Miner = require("./miner.js");
const Health = require("./health.js");

// Mineflayer essential
const mineflayer = require("mineflayer");
const mcData = require("minecraft-data");

// Mineflayer modules
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const autoEat = require("mineflayer-auto-eat").default;
const botView = require('prismarine-viewer').mineflayer;
const inventoryView = require('mineflayer-web-inventory');

/**
 * @typedef Module
 * @property {function} onCreateBot This function is called when the bot is created.
 */

/**
 * @class
 * Handles the bare minimum.
 * Join and quit game.
 * View bot and inventory in web browser.
 * Has user interface to interact with bot (handled by user-interface.js).
 * Loads all mineflayer plugins that the modules depend on.
 * Other functionality is handled by other modules.
 */

// ?? To do: provide better documentation for this
class Mbot {
    /**
     * @typedef Settings
     * @property {object} loginArgs See [createBot]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#mineflayercreatebotoptions}.
     * @property {DiscordClient} discordClient Login information for the discord bot.
     */

    /**
     * @typedef Commands
     * @summary An object with only instances of {@link Instruction} as values. 
     */

    /**
     * @param {Settings} settings Refer to login-example.json
     * @param {Commands} commands Refer to command-example.json
     */
    constructor(settings, commands) {
        // Custom settings
        // These variables shall not change reference
        this.settings = settings;
        this.commands = commands;
        
        /**
         * @property {object} bot The actual [mineflayer]{@link https://github.com/PrismarineJS/mineflayer#mineflayer} bot.
         */
        this.bot = null;

        /**
         * @property {object} mcData The [minecraft-data]{@link https://github.com/PrismarineJS/minecraft-data} associated with the bot.
         */
        this.mcData = null;

        /**
         * @property {Movements} movements ?? Todo: Deprecate
         */
        this.movements = null;

        /**
         * @property {object} modules The object that stores all of the [modules]{@link Module}.
         */
        this.modules = {
            "utility" : new Utility(this),
            "miner" : new Miner(this),
            "health" : new Health(this)
        };

        /**
         * @property {UserInterface} userInterface The user interface linked to this bot.
         */
        this.userInterface = new UserInterface(this); // Can be modified to handle many mbot references

        /**
         * @property {InstructionManager} instructionManager The instruction manager for this bot.
         */
        this.instructionManager = new InstructionManager(this);
    }

    /**
     * @typedef CreateBotArgs
     * @property {bool} createBotView Creates bot view if true.
     * @property {object} botViewOptions See [prismarine-viewer]{@link https://github.com/PrismarineJS/prismarine-viewer#mineflayer}.
     * @property {bool} createInventoryView Creates inventory view if true.
     * @property {object} inventoryViewOptions See [mineflayer-web-inventory]{@link https://github.com/imharvol/mineflayer-web-inventory#usage}.
     */

    /**
     * Instruction that creates the bot.
     * @param {CreateBotArgs} args Associated args for this instruction.
     * @param {Interrupt} interrupt Has no effect for this instruction.
     * @return {Promise} Resolved after bot spawns and everything is set up.
     */
    async createBot(args = null, interrupt = null) {
        // Instantiate bot
        this.bot = mineflayer.createBot(this.settings["loginArgs"]);

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
            this.mcData = mcData(this.bot.version);
            this.movements = new Movements(this.bot);

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

            // Invoke the callbacks for all modules
            for (const property in this.modules) {
                if (this.modules[property].onCreateBot) this.modules[property].onCreateBot();
            }

            resolveSpawn();
        });

        await waitForSpawn;

        this.userInterface.log("Spawned");
    }

    /**
     * Instruction that makes the bot quit the game.
     * After this, the bot has to be recreated via createBot.
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

    /*
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
// Custom modules
const InstructionManager = require("./instruction-manager");
const UserInterface = require("./user-interface");

// Custom modules with dependence on mineflayer
const Mover = require("./mover");
const Utility = require("./utility");
const Miner = require("./miner");
const Health = require("./health");

// Mineflayer essential
const mineflayer = require("mineflayer");
const mcData = require("minecraft-data");

// Mineflayer modules
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const autoEat = require("mineflayer-auto-eat").default;
const botView = require('prismarine-viewer').mineflayer;
const inventoryView = require('mineflayer-web-inventory');

/**
 * @typedef Bot
 * @summary See [mineflayer]{@link https://github.com/PrismarineJS/mineflayer#mineflayer}.
 */

/**
 * @class
 * Handles the bare minimum for [mineflayer]{@link https://github.com/PrismarineJS/mineflayer}.
 * Join and quit game.
 * View [bot]{@link https://github.com/PrismarineJS/prismarine-viewer} and [inventory]{@link https://github.com/imharvol/mineflayer-web-inventory} in web browser.
 * Has {@link UserInterface} to interact with bot.
 * Loads all mineflayer plugins that the modules depend on.
 * Other functionality is handled by other modules.
 */

class Mbot {
    /**
     * @typedef Settings
     * An object that stores the settings for {@link Mbot}.
     * @property {object} loginArgs See [createBot]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#mineflayercreatebotoptions}.
     * @property {DiscordClient} discordClient Login information for the discord bot.
     */

    /**
     * @typedef Commands
     * @summary An object with only instances of {@link Instruction} as values. 
     */

    /**
     * @param {Settings} settings The settings for the bot.
     * @param {Commands} commands The commands that act like shortcuts to call instructions.
     */
    constructor(settings, commands) {
        /**
         * @property {Settings} settings The settings for the bot.
         */
        this.settings = settings;
        
        /**
         * @property {Commands} commands The commands that act like shortcuts to call instructions.
         */
        this.commands = commands;
        
        /**
         * @property {Bot} bot The actual mineflayer bot.
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
         * @property {object} modules The object that only stores instances of {@link Module} (that are mounted to this bot) as values.
         */
        this.modules = {
            "mover" : new Mover(this),
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
     * @summary An object that stores that determines what plugins to add to the bot upon creation.
     * @property {bool} [createBotView = false] Creates bot view if true.
     * @property {object} [botViewOptions = null] See [prismarine-viewer]{@link https://github.com/PrismarineJS/prismarine-viewer#mineflayer}.
     * @property {bool} [createInventoryView = false] Creates inventory view if true.
     * @property {object} [inventoryViewOptions = null] See [mineflayer-web-inventory]{@link https://github.com/imharvol/mineflayer-web-inventory#usage}.
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
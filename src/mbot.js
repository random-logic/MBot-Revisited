const InstructionManager = require("./instruction-manager");
const Module = require("./modules/module");

// Mineflayer
const mineflayer = require("mineflayer");
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
 * Can use {@link UI} to interact with bot.
 * Other functionality is handled by other modules.
 */

class Mbot extends Module {
    /**
     * @typedef Commands
     * @summary An object with only instances of {@link InstructionCall} as values. 
     */

    /**
     * @param {object} modules An object with only instances of {@link Module} to mount onto the bot. The key "mbot" is reserved for this instance of Mbot.
     * @param {Commands} commands The commands that act like shortcuts to call instructions.
     * @param {UI} ui The user interface that will control this bot.
     */
    constructor(modules, commands, ui) {
        super("mbot");
        
        /**
         * @property {Commands} commands The commands that act like shortcuts to call instructions.
         */
        this.commands = commands;
        
        /**
         * @property {Bot} bot The actual mineflayer bot.
         */
        this.bot = null;

        /**
         * @property {object} modules The object that only stores {@link Module}. The names are keys and the actual {@link Module} are values. These modules are mounted to Mbot.
         */
        this.modules = modules;

        // Mount all modules onto Mbot
        for (const property in this.modules) {
            this.modules[property].mount(this);
        }

        // Add this instance of Mbot into modules so that instructions here can also be accessed.
        this.modules["mbot"] = this;

        /**
         * @property {UI} ui The user interface linked to this bot.
         */
        this.ui = ui;
        ui.mount(this);

        /**
         * @property {InstructionManager} instructionManager The instruction manager for this bot.
         */
        this.instructionManager = new InstructionManager(this);
    }

    /**
     * @typedef CreateBotArgs
     * @summary An object that stores that determines what plugins to add to the bot upon creation.
     * @property {object} options See properties of [createBot]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#mineflayercreatebotoptions}.
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
        this.bot = mineflayer.createBot(args["options"]);

        // Invoke the callbacks for all modules
        for (const property in this.modules) {
            this.modules[property].onCreateBot();
        }

        // Wait for bot to finish spawning
        var resolveSpawn;
        var waitForSpawn = new Promise(resolve => {
            resolveSpawn = resolve;
        });

        this.bot.once("spawn", () => {
            // Display viewer on web
            if (args && args["createBotView"]) {
                botView(this.bot, args["botViewOptions"]);
            }

            // Display inventory on web
            if (args && args["createInventoryView"]) {
                inventoryView(this.bot, args["inventoryViewOptions"]);
            }

            // Link newly created bot to display any messages in chat on ui
            this.bot.on("whisper", (username, message) => {
                if (username == this.bot.username) return;
                this.ui.logMinecraftWhisper(username, message);
            });

            this.bot.on("chat", (username, message) => {
                if (username == this.bot.username) return;
                this.ui.logMinecraftChat(username, message);
            });

            // Invoke the callbacks for all modules
            for (const property in this.modules) {
                this.modules[property].onSpawn();
            }

            resolveSpawn();
        });

        await waitForSpawn;

        this.ui.log("Spawned");
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
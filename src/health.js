const Module = require("./module");

const autoEat = require("mineflayer-auto-eat").default;

/**
 * @class
 * Manages the health of the bot.
 * Requires [mineflayer-auto-eat]{@link https://github.com/link-discord/mineflayer-auto-eat}.
 * @extends Module
 */
class Health extends Module {
    constructor() {
        super("health");

        /**
         * @property {bool} [autoEat = true] The bot will auto eat when needed if set to true.
         */
        this.autoEat = true;

        /**
         * @property {bool} [canExitBeforeDeath = false] The bot will attempt to log off when reaching a certain health threshold to avoid death if set to true.
         */
        this.canExitBeforeDeath = false;

        /**
         * @property {number} [exitBeforeDeathThreshold = 10] The theshold where the bot will exit the game.
         */
        this.exitBeforeDeathThreshold = 10;
    }

    onCreateBot() {
        super.onCreateBot();
        this.mbot.bot.loadPlugin(autoEat);
    }

    onSpawn() {
        this.mbot.bot.on("health", () => {
            this.mbot.ui.log("Health: " + this.mbot.bot.health);

            if (this.autoEat) {
                this.mbot.bot.autoEat.enable();

                if (this.mbot.bot.health >= 18) {
                    this.mbot.bot.autoEat.options = {
                        "priority" : "foodPoints",
                        "startAt" : 14,
                        "bannedFood" : []
                    }
                }
                else {
                    this.mbot.bot.autoEat.options = {
                        "priority" : "foodPoints",
                        "startAt" : 19,
                        "bannedFood" : []
                    }
                }
            }
            else {
                this.mbot.bot.autoEat.disable();
            }

            if (this.canExitBeforeDeath) {
                if (this.mbot.bot.health < this.exitBeforeDeathThreshold) {
                    this.mbot.instructionManager.parseInstruction({
                        "module": "mbot",
                        "instruction": "quit"
                    });

                    this.mbot.ui.notify("Bot low in health, quitting");
                }
            }
        });
    }

    /**
     * @typedef ExitBeforeDeathArgs
     * @property {bool} set Sets canExitBeforeDeath.
     * @property {number} [threshold = 10] Sets exitBeforeDeathThreshold.
     */

    /**
     * Instruction to set exit before death.
     * @param {MineBlockArgs} args The args for this instruction.
     * @param {Interrupt} [interrupt = null] No effect for this instruction.
     */
    exitBeforeDeath(args, interrupt = null) {
        if (!args)
            throw new Error("Invalid ExitBeforeDeathArgs");

        if (typeof args["set"] !== "boolean")
            throw new Error("Invalid ExitBeforeDeathArgs set");

        if (typeof args["threshold"] !== "number")
            args["threshold"] = 10;

        this.canExitBeforeDeath = args["set"];
        this.exitBeforeDeathThreshold = args["threshold"];
    }
}

module.exports = Health;
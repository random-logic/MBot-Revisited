const Module = require("./module");
const EnhancedMovements = require("./enhanced-movements");

const pathfinder = require("mineflayer-pathfinder").pathfinder;

/**
 * @class
 * Moves the bot using [mineflayer-pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
 * Requires {@link Utility} module.
 * @extends Module
 */
class Mover extends Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     */
    constructor(mbot) {
        super(mbot, "mover", ["utility"]);

        /**
         * @property {EnhancedMovements} movements Can be applied to the [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
         */
        this.movements = null;
    }

    onCreateBot() {
        super.onCreateBot();
        this.mbot.bot.loadPlugin(pathfinder);
    }

    onSpawn() {
        this.movements = new EnhancedMovements(this.mbot.bot);
    }

    /**
     * Resets saved {@link Movements}.
     */
    resetMovements() {
        this.movements = new EnhancedMovements(this.mbot.bot);
    }

    /**
     * Instruction to apply the saved movements to [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
     * @param {MovementsSettings} [args = null] Modifies {@link EnhancedMovements} using the settings provided before applying it to [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
     * @param {Interrupt} [interrupt = null] Has no effect for this method.
     */
    applyMovements(args = null, interrupt = null) {
        this.movements.modifyMovements(args);
        this.mbot.bot.pathfinder.setMovements(this.movements);
    }

    /**
     * Instruction that calls resetMovements and applyMovements.
     * @param {MovementsSettings} [args = null] Modifies {@link EnhancedMovements} using the settings provided before applying it to [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
     * @param {Interrupt} [interrupt = null] Has no effect for this method.
     */
    resetAndApplyMovements(args = null, interrupt = null) {
        this.resetMovements();
        this.applyMovements(args, interrupt);
    }

    /**
     * Wrapper for findBlocks method in {@link Utility}.
     * Only returns blocks that are safe to break. Overrides options["useExtraInfo"].
     * @param {object} options See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     * @return {Array} See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     */
    findSafeToBreakBlocks(options) {
        options["useExtraInfo"] = block => this.movements.safeToBreak(block);
        return this.mbot.modules["utility"].findBlocks(options);
    }
}

module.exports = Mover;
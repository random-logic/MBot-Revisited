const EnhancedMovements = require("./enhanced-movements");

const Module = require("./module");

/**
 * @class
 * Moves the bot using [mineflayer-pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
 * @extends Module
 */
class Mover extends Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     */
    constructor(mbot) {
        super(mbot);

        /**
         * @property {EnhancedMovements} movements Can be applied to the [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
         */
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
     * @param {object} args Has no effect for this method.
     * @param {Interrupt} interrupt Has no effect for this method.
     */
    applyMovements(args = null, interrupt = null) {
        this.mbot.bot.pathfinder.setMovements(this.movements);
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
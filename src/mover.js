/**
 * @typedef Movements
 * @summary See [Movements]{@link https://github.com/PrismarineJS/mineflayer-pathfinder#movements-class-default-properties}.
 */
const { Movements } = require("mineflayer-pathfinder");

/**
 * @class Controls moving the bot using mineflayer-pathfinder.
 * @extends Module
 */
class Mover {
    /**
     * @param {Mbot} mbot The instance of Mbot that this module will be mounted to.
     */
    constructor(mbot) {
        /**
         * @property {Mbot} mbot The instance of Mbot that this module is mounted to.
         */
        this.mbot = mbot;

        /**
         * @property {Movements} movements Stores instance of Movements class that can be applied to the pathfinder.
         */
        this.movements = new Movements();
    }

    onCreateBot() {}

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
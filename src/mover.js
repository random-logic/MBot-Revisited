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
     * Sets a property of this instance. See members of this instance. Block names are converted to block ids.
     * @param {string} key The name of the property to set.
     * @param {object} value The new value. If the property is a {@link Set} and this is an {@link Array}, then this will be converted to a set.
     */
    setMovements(key, value) {
        if (Array.isArray(value) && this.movements[key] instanceof Set) {
            // Convert the array to a set
            value = new Set(value);
        }

        // Convert any block or item names to ids
        value = this.mbot.modules["utility"].getIdsIfExists(value, key == "scafoldingBlocks" ? "item" : "block");

        this.movements[key] = value;
    }

    /**
     * Adds to a property of this instance. See members of this instance. Block names are converted to block ids. This function only supports properties that are of type {@link Array} or {@link Set}.
     * @param {string} propertyName The name of the property to add to.
     * @param {Array | Set} valuesToAdd The values to add to the property.
     */
    addMovements(propertyName, valuesToAdd) {
        var property = this.movements[propertyName];

        for (const value of valuesToAdd) {
            if (Array.isArray(property)) {
                property.push(this.mbot.modules["utility"].getIdsIfExists(value, propertyName == "scafoldingBlocks" ? "item" : "block"));
            }
            else { // if (property instanceof Set)
                property.add(this.mbot.modules["utility"].getIdsIfExists(value, propertyName == "scafoldingBlocks" ? "item" : "block"));
            }
        }

        this.movements[propertyName] = property;
    }

    /**
     * Modifies this instance using the settings provided
     * @param {MovementsSettings} modifications Specifies what to modify.
     */
    modifyMovements(modifications) {
        if (!modifications) return;

        if (modifications["set"]) {
            for (const [key, value] of Object.entries(modifications["set"])) {
                this.setMovements(key, value);
            }
        }

        if (modifications["add"]) {
            for (const [key, value] of Object.entries(modifications["add"])) {
                this.addMovements(key, value);
            }
        }
    }

    /**
     * Instruction to apply the saved movements to [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
     * @param {MovementsSettings} [args = null] Modifies {@link EnhancedMovements} using the settings provided before applying it to [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder}.
     * @param {Interrupt} [interrupt = null] Has no effect for this method.
     */
    applyMovements(args = null, interrupt = null) {
        this.modifyMovements(args);
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
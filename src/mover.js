const Module = require("./module");
const EnhancedMovements = require("./enhanced-movements");
const Utility = require("./utility");

const pathfinder = require("mineflayer-pathfinder").pathfinder;
const { GoalBlock } = require("mineflayer-pathfinder").goals;

/**
 * @typedef Vector3
 * @summary See [vec3]{@link https://github.com/PrismarineJS/node-vec3#vec3}.
 */

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

        /**
         * @property {object} positionData An object that holds position names as keys and instances of {@link Vector3} as values.
         */
        this.positionData = {};

        /**
         * @property {string} positionDataPath The path where the positionData has been loaded from.
         */
        this.positionDataPath = null;
    }

    onCreateBot() {
        super.onCreateBot();
        this.mbot.bot.loadPlugin(pathfinder);
    }

    onSpawn() {
        this.movements = new EnhancedMovements(this.mbot.bot);

        // ?? Temporary, eventually move this to configurable options.
        this.mbot.bot.pathfinder.thinkTimeout = 20000;
    }

    /**
     * Instruction to load position data.
     * @param {string} args The path to the file.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     * @returns {Promise} Promise that resolves when read file finishes.
     */
    async loadPositionData(args, interrupt = null) {
        this.positionData = await Utility.readJsonFile(args);
        this.positionDataPath = args;
    }

    /**
     * Instruction to store position data.
     * @param {string} [args = null] The path to the file, only use this if you want to store to a different file.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     * @returns {Promise} Promise that resolves when write file finishes.
     */
    async storePositionData(args = null, interrupt = null) {
        if (!args)
            args = this.positionDataPath;

        await Utility.writeJsonFile(args, this.positionData);
    }

    /**
     * @typedef SavePositionArgs
     * @summary Object that represents the arguments.
     * @property {string} name The name of the position.
     * @property {Vector3} [position = null] The actual position to save. By default, it saves the position of where the bot is at.
     */

    /**
     * Instruction to save position.
     * @param {SavePositionArgs} args
     * @param {Interrupt} [interrupt = null]
     */
    savePosition(args, interrupt) {
        if (!args || typeof args["name"] !== "string")
            throw new Error("Invalid SavePositionArgs name");
        
        if (!args["position"]) {
            args["position"] = this.mbot.bot.entity.position;
        }
        else if (typeof args["position"] !== "object") {
            throw new Error("Invalid SavePositionArgs position");
        }

        this.positionData[args["name"]] = args["position"];
    }
    
    /**
     * @typedef GotoPositionArgs
     * @summary Object that represents the arguments.
     * @property {string | Vector3} position The name of the position in positionData or the position can just be given.
     * @property {EnhancedMovements} [movements = null] The movements to set.
     */

    /**
     * Instruction to make bot go to a saved position.
     * @param {GotoPositionArgs} args The args for this instruction.
     * @param {Interrupt} interrupt The interrupt instance of this bot.
     * @returns {Promise} Promise that resolves on completion.
     */
    async gotoPosition(args, interrupt) {
        if (!args)
            throw new Error("Invalid GotoPositionArgs");

        this.resetAndApplyMovements(args["movements"], interrupt);

        if (typeof args["position"] === "string") {
            const position = this.positionData[args["position"]];
            await this.goto(new GoalBlock(position.x, position.y, position.z), interrupt);
        }
        else if (typeof args["position"] === "object") {
            const position = args["position"];
            await this.goto(new GoalBlock(position.x, position.y, position.z), interrupt);
        }
        else {
            throw new Error("Invalid GotoPositionArgs position");
        }
    }

    /**
     * @typedef GotoPlayerArgs
     * @summary Object that represents the arguments.
     * @property {string} playerName The name of the player to go to.
     * @property {EnhancedMovements} [movements = null] The movements to set.
     */
    
    /**
     * Instruction to make bot go to a player.
     * @param {GotoPlayerArgs} args The args for this instruction.
     * @param {Interrupt} interrupt The interrupt instance of this bot.
     * @returns {Promise} Promise that resolves on completion.
     */
    async gotoPlayer(args, interrupt) {
        if (!args || typeof !args["playerName"] === "string")
            throw new Error("Invalid GotoPlayerArgs playerName");

        const position = this.mbot.bot.players[args["playerName"]]?.entity?.position;

        if (!position)
            throw new Error("Player not found");

        this.resetAndApplyMovements(args["movements"], interrupt);
        await this.goto(new GoalBlock(position.x, position.y, position.z), interrupt);
    }

    /**
     * Set a specific goal for the [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder#functions}, but allow the interrupts to stop the [pathfinder]{@link https://github.com/PrismarineJS/mineflayer-pathfinder#functions}.
     * @param {Goal} goal The goal that will be set in pathfinder.
     * @param {Interrupt} interrupt The interrupt instance of this bot.
     * @returns {Promise} Promise that resolves on completion.
     */
    async goto(goal, interrupt) {
        // Set interrupts
        interrupt.onInterrupt = this.mbot.bot.pathfinder.stop;

        await this.mbot.bot.pathfinder.goto(goal);

        // Clear onInterrupt
        interrupt.onInterrupt = null;
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
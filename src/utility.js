const fsPromise = require("fs").promises;

const Module = require("./module");

const mcData = require("minecraft-data");

/**
 * @class
 * These are helper methods.
 * @extends Module
 */
class Utility extends Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     */
    constructor(mbot) {
        super(mbot, "utility");

        /**
         * @property {object} mcData The [minecraft-data]{@link https://github.com/PrismarineJS/minecraft-data} associated with the bot.
         */
        this.mcData = null;
    }

    onSpawn() {
        // Initialize game data
        this.mcData = mcData(this.mbot.bot.version);

        // For calculating physics ticks
        this.mbot.bot.physicsEnabled = true;
        this.mbot.bot.on("physicsTick", () => {
            if (this.doPhysicsTickCountDown) {
                --this.physicsTickCount;
                if (this.physicsTickCount <= 0) {
                    this.doPhysicsTickCountDown = false;
                    this.onPhysicsTickCountHitsZero();
                }
            }
        });
        this.doPhysicsTickCountDown = false;

        // For determining when an entity disappears
        this.mbot.bot.on("entityGone", entity => {
            if (this.checkForEntityGone) {
                if (entity == this.entityGoneToMatch) {
                    this.checkForEntityGone = false;
                    this.onEntityGoneMatch();
                }
            }
        });
        this.checkForEntityGone = false;
    }
    
    /**
     * Wrapper for [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     * Allows options["matching"] to be the block name (typeof string) or a mixed array of block names and ids.
     * Changes any block names to its corresponding block ids using utility["getId"].
     * @param {object} options See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     * @return {Array} See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     */
    findBlocks(options) {
        // Parse matching
        var matching = options["matching"];
        if (typeof matching === "string") {
            matching = this.getId(matching);
        }
        else if (Array.isArray(matching)) {
            for (var i = 0; i < matching.length; ++i) {
                if (typeof matching[i] === "string") {
                    matching[i] = this.getId(matching[i]);
                }
            }
        }
        options["matching"] = matching;

        // Call the original function
        return this.mbot.bot.findBlocks(options);
    }

    /**
     * Wrapper for getIdIfExists, but it will iterate through an {@link Array} or {@link Set}
     * @param {*} blockNames The name if it exists.
     * @param {string} [type = "block"] The type to querry for id.
     */
    getIdsIfExists(blockNames, type = "block") {
        if (Array.isArray(blockNames)) {
            var blockIds = new Array();

            for (const blockName of blockNames) {
                blockIds.push(this.getIdIfExists(blockName, type));
            }

            return blockIds;
        }
        else if (blockNames instanceof Set) {
            var blockIds = new Set();

            for (const blockName of blockNames) {
                blockIds.add(this.getIdIfExists(blockName, type));
            }

            return blockIds;
        }
        else {
            return this.getIdIfExists(blockNames, type);
        }
    }

    /**
     * Wrapper for getId, except if it returns an error, then the original value is returned instead.
     * @param {*} blockName The name if it exists.
     * @param {string} [type = "block"] The type to querry for id.
     */
    getIdIfExists(blockName, type = "block") {
        try {
            return this.getId(blockName, type);
        }
        catch(e) {
            return blockName;
        }
    }

    /**
     * Converts the name of a type to the corresponding id.
     * Throws error if corresponding id not found.
     * @param {string} name The name. Throws error if not typeof string.
     * @param {string} [type = "block"] The type to querry for id.
     * @return {number} The id of that type.
     */
    getId(name, type = "block") {
        if (typeof name !== "string")
            throw "Invalid Name";

        const blockId = this.mcData[`${type}sByName`][name].id;
        if (Number.isNaN(blockId)) throw "Block Name doesn't exist";
        return blockId;
    }

    /**
     * Wait for a specified number of physics ticks.
     * @param {number} count The number of physics ticks to wait for.
     * @return {Promise} Resolves after waiting for count physics ticks.
     */
    async waitForPhysicsTicks(count) {
        return new Promise(resolve => {
            this.physicsTickCount = count;
            this.onPhysicsTickCountHitsZero = resolve;
            this.doPhysicsTickCountDown = true;
        });
    }

    /**
     * Wait for the specified entity to disappear.
     * @param {Entity} entity The entity that should disappear.
     * @return {Promise} A promise that resolves when the entity disappears.
     */
    async waitForEntityGone(entity) {
        return new Promise(resolve => {
            if (!entity) resolve();
            this.onEntityGoneMatch = resolve;
            this.entityGoneToMatch = entity;
            this.checkForEntityGone = true;
        })
    }

    /**
     * Instruction that doesn't do anything. This can be used to halt any current instruction.
     * @param {object} [args = null] Has no effect for this instruction.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     */
    halt(args = null, interrupt = null) {}

    /**
     * Parses a JSON object from a file.
     * @param {string} path The path of the json file.
     * @returns {Promise} Promise resolves with the object that represents the JSON object when finished.
     */
    static async readJsonFile(path) {
        return JSON.parse(await fsPromise.readFile(path));
    }

    /**
     * Writes a JSON object to a file.
     * @param {string} path The path of the json file.
     * @param {object} content The object that represents the JSON object.
     * @returns {Promise} Promise resolves when finished.
     */
    static async writeJsonFile(path, content) {
        return fsPromise.writeFile(path, JSON.stringify(content, null, "\t"));
    }

    /**
     * Waits for number of milliseconds.
     * @param {number} count The time to wait.
     * @returns {Promise} Promise resolves when time is up.
     */
    static async waitForMilliseconds(count) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, count);
        });
    }
}

module.exports = Utility;
const fsPromise = require("fs").promises;

/**
 * These are helper methods for various modules
 */
class Utility {
    /**
     * Constructor
     * Assuming the bot has already spawned
     * @param {object} bot The current instance of bot
     * @param {object} mcData The current instance of minecraft-data
     * @param {object} movements Refer to https://github.com/PrismarineJS/mineflayer-pathfinder#movement-class
     */
    constructor(bot, mcData, movements) {
        this.bot = bot;
        this.mcData = mcData;
        this.movements = movements;

        // For calculating physics ticks
        this.bot.physicsEnabled = true;
        this.bot.on("physicsTick", () => {
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
        this.bot.on("entityGone", entity => {
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
     * Wrapper for bot.findBlocks(options)
     * Allows options["matching"] to be the block name (typeof string) or a mixed array of block names and ids
     * Changes any block names to its corresponding block ids using utility["getBlockId"]
     * @param {object} options Refer to https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions
     * @param {bool} safeToBreakFilter Only returns blocks that are safe to break using utility.movements.safeToBreak(), overrides options["useExtraInfo"]
     * @return {Array} Refer to https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions
     */
    findBlocks(options, safeToBreakFilter = false) {
        // Parse matching
        var matching = options["matching"];
        if (typeof matching === "string") {
            matching = this.getBlockId(matching);
        }
        else if (Array.isArray(matching)) {
            for (var i = 0; i < matching.length; ++i) {
                if (typeof matching[i] === "string") {
                    matching[i] = this.getBlockId(matching[i]);
                }
            }
        }
        options["matching"] = matching;

        if (safeToBreakFilter) {
            options["useExtraInfo"] = block => this.movements.safeToBreak(block);
        }

        // Call the original function
        return this.bot.findBlocks(options);
    }

    /**
     * Converts the block name to the corresponding id
     * Throws error if corresponding id not found
     * @param {string} blockName The name of the block
     * @return {number} The block id
     */
    getBlockId(blockName) {
        const blockId = this.mcData.blocksByName[blockName].id;
        if (Number.isNaN(blockId)) throw "Invalid Block Name";
        return blockId;
    }

    /**
     * Wait for a specified number of physics ticks
     * @param {number} count The number of physics ticks to wait for
     * @return {Promise} Resolves after waiting for count physics ticks
     */
    async waitForPhysicsTicks(count) {
        return new Promise(resolve => {
            this.physicsTickCount = count;
            this.onPhysicsTickCountHitsZero = resolve;
            this.doPhysicsTickCountDown = true;
        });
    }

    /**
     * Wait for the specified entity to disappear
     * @param {Entity} entity The entity that should disappear
     * @return {Promise} A promise that resolves when the entity disappears
     */
    async waitForEntityGone(entity) {
        return new Promise(resolve => {
            if (!entity) resolve();
            this.onEntityGoneMatch = resolve;
            this.entityGoneToMatch = entity;
            this.checkForEntityGone = true;
        })
    }

    static async readJsonFile(path) {
        return JSON.parse(await fsPromise.readFile(path));
    }

    static async writeJsonFile(path, content) {
        return fsPromise.writeFile(path, JSON.stringify(content, "\t"));
    }

    static async waitForMilliseconds(count) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, count);
        });
    }
}

module.exports = Utility;
const Module = require("./module");

const { GoalFollow, GoalY, GoalCompositeAll, GoalLookAtBlock, GoalCompositeAny } = require("mineflayer-pathfinder").goals;

/**
 * @class
 * Allows the bot to mine blocks. Requires {@link Utility} and {@link Mover} modules.
 * @extends Module
 */
class Miner extends Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     */
    constructor (mbot) {
        super(mbot, "miner", ["utility", "mover"]);
    }

    /**
     * Wrapper for findBlocks method in {@link Utility}.
     * Only returns blocks that are safe to break. Overrides options["useExtraInfo"].
     * @param {object} options See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     * @param {number} [minHeight = -Infinity] The min height the blocks may be at.
     * @param {number} [maxHeight = Infinity] The max height the blocks may be at.
     * @return {Array} See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     */
    findBlocks(options, minHeight = -Infinity, maxHeight = Infinity) {
        options["useExtraInfo"] = block => minHeight <= block.position.y && maxHeight >= block.position.y &&
            this.mbot.modules["mover"].movements.safeToBreak(block);
        return this.mbot.modules["utility"].findBlocks(options);
    }

    /**
     * @typedef MineBlocksArgs
     * @property {object} findBlocksOptions See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     * @property {bool} [safeBlockFilter = true] Filters out the blocks not safe to mine. If set to true, findBlockOptions["useExtraInfo"] is overrided.
     * @property {number} [numberOfBlocksToMine = Infinity] Mines a certain number of blocks.
     * @property {bool} [resetAndApplyMovements = false] Reset and apply movements with the given movements.
     * @property {EnhancedMovements} [movements = null] Sets the {@link Movements} that the miner should use when moving.
     * @property {bool} [searchAfterMine = false] If set to true, a search will be conducted after a block is mined. Otherwise, a search is only conducted after all blocks that are accessible are mined.
     * @property {number} [minHeight = -Infinity] The min height the blocks may be at.
     * @property {number} [maxHeight = Infinity] The max height the blocks may be at.
     */

    /**
     * Instruction to mine blocks until an instruction interrupts.
     * @param {MineBlocksArgs} args The args for this instruction.
     * @param {Interrupt} interrupt The interrupt instance of this bot.
     */
    async mineBlocks(args, interrupt) {
        // Parse args
        if (!args || typeof args !== "object") throw "Invalid Args";

        // Check if the args are valid and set defaults if no args specified
        if (!args["findBlocksOptions"] || typeof args["findBlocksOptions"] !== "object") throw "Invalid Arg findBlockOptions";
        if (typeof args["safeBlockFilter"] !== "bool") args["safeBlockFilter"] = true;
        if (typeof args["numberOfBlocksToMine"] !== "number") args["numberOfBlocksToMine"] = Infinity;
        if (typeof args["movements"] !== "object") args["movements"] = null;
        if (typeof args["minHeight"] !== "nubmer") args["minHeight"] = -Infinity;
        if (typeof args["maxHeight"] !== "number") args["maxHeight"] = Infinity;

        
        // Set the pathfinder to use movements specified in args
        if (args["resetAndApplyMovements"])
            this.mbot.modules["mover"].resetAndApplyMovements(args["movements"]);
        
        // Mine a specified number of blocks
        var count = args["numberOfBlocksToMine"];
        for (var n = 0; n < count;) {
            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Find blocks, blocks is an array
            const blockPositions = this.findBlocks(args["findBlocksOptions"], args["minHeight"], args["maxHeight"]);

            // Check to see if any blocks are found
            if (blockPositions.length == 0) throw "Could not find any blocks of that type";

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Find path to any block that works
            for (var blockIndex = 0; blockIndex < blockPositions.length && n < count; ++blockIndex) {
                try {
                    // Mine the block 
                    await this.mineBlock(blockPositions[blockIndex], interrupt);

                    // We mined block successfully
                    ++n;

                    // Check for interrupts
                    interrupt.throwErrorIfHasInterrupt("mineBlocks");

                    // Search for another block or use existing search data
                    if (args["searchAfterMine"]) break;
                }
                catch(e) {
                    // Check for interrupts
                    interrupt.throwErrorIfHasInterrupt("mineBlocks");

                    // Otherwise log error and continue the loop
                    this.mbot.userInterface.logError(e);
                }
            }
        }
    }

    /**
     * Mines a single block. Helper function for mineBlocks. Throws error if pathfinder cannot reach block.
     * @param {Vector3} blockPosition The position of the block to mine.
     * @param {Interrupt} [interrupt = null] Useful when calling on instructions so that this process can be interrupted.
     * @returns {Promise} Promise that resolves when completed.
     */
    async mineBlock(blockPosition, interrupt = null) {
        // Travel to block
        this.mbot.userInterface.log(`Moving to mine block at position ${blockPosition}`);
        await this.mbot.modules["mover"].goto(
            new GoalCompositeAll([
                new GoalLookAtBlock(blockPosition, this.mbot.bot.world, { "range" : 4 }),
                new GoalCompositeAny([ // Make sure the bot doesn't jump to break the block
                    new GoalY(blockPosition.y),
                    new GoalY(blockPosition.y + 1)
                ])
            ]),
            interrupt
        );

        // Get the block that we just walked to
        const block = this.mbot.bot.blockAt(blockPosition);

        // Get the best harvest tool
        this.mbot.userInterface.log("Equipping harvesting tool");
        const harvestTool = this.mbot.bot.pathfinder.bestHarvestTool(block);
        if (!harvestTool) throw "No tool to harvest block";

        // Equip bot with correct tool to mine block
        await this.mbot.bot.equip(harvestTool, "hand");

        // Check for interrupts
        if (interrupt?.hasInterrupt) throw "mineBlock Interrupted";

        // Dig block
        this.mbot.userInterface.log("Digging block");
        await this.dig({"block" : block}, interrupt);
        this.mbot.userInterface.log("Finished digging block");

        // Check for interrupts
        if (interrupt?.hasInterrupt) throw "mineBlock Interrupted";

        // Wait for entity to spawn
        await this.mbot.modules["utility"].waitForPhysicsTicks(10);

        // Check for interrupts
        if (interrupt?.hasInterrupt) throw "mineBlock Interrupted";

        // Collect block
        this.mbot.userInterface.log("Collecting block");
        await this.collectBlock({
            "blockName" : block.name,
            "count" : 1
        }, interrupt);
        this.mbot.userInterface.log("Finished collecting block");
    }

    /**
     * Digs a block.
     * Wrapper for [dig]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botdigblock-forcelook--true-digface}.
     * Interrupts will cause bot to stop digging.
     * @param {object} args The object that represent the args for [dig]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botdigblock-forcelook--true-digface}.
     * @param {Interrupt} [interrupt = null] The interrupt instance of this bot.
     * @returns {Promise} Promise that resolves when finished.
     */
    async dig(args, interrupt = null) {
        // Check args
        if (!args || typeof args["block"] !== "object")
            throw new Error("Invalid DigArgs block");

        // Set interrupts
        interrupt?.setOnInterrupt(this.mbot.bot.stopDigging);

        try {
            // Start digging
            if (typeof args["forceLook"] !== "boolean")
                await this.mbot.bot.dig(args["block"]);
            else if (!args["digFace"])
                await this.mbot.bot.dig(args["block"], args["forceLook"]); 
            else
                await this.mbot.bot.dig(args["block"], args["forceLook"], args["digFace"]);
        }
        catch (e) {
            // Clear onInterrupt
            interrupt?.clearOnInterrupt();

            // Throw interrupt error if interrupted
            interrupt?.throwErrorIfHasInterrupt("dig");

            // Otherwise just throw a normal error
            throw e;
        }
        
        // Clear interrupts
        interrupt?.clearOnInterrupt();
    }

    /**
     * @typedef CollectBlockArgs
     * @summary Object that represents the args for an instruction.
     * @property {string} blockName The name of the block to collect.
     * @property {number} [count = Infinity] The number of blocks to collect.
     * @property {bool} [resetAndApplyMovements = false] Resets and applies movements if true.
     * @property {EnhancedMovements} [movements = null] Sets the {@link Movements} that the miner should use when moving.
     */

    /**
     * ??
     * Instruction that collects all block items nearby.
     * @param {CollectBlockArgs} args The args for this instruction.
     * @param {Interrupt} interrupt The interrupt instance for this instruction.
     */
    async collectBlock(args, interrupt) {
        if (!args || typeof args["blockName"] !== "string")
            throw new Error("Invalid CollectBlockArgs blockName");

        if (typeof args["count"] !== "number")
            args["count"] = Infinity;

        if (typeof args["movements"] !== "object")
            args["movements"] = null;

        // Set the pathfinder to use movements specified in args
        if (args["resetAndApplyMovements"])
            this.mbot.modules["mover"].resetAndApplyMovements(args["movements"]);

        for (var i = 0; i < args["count"]; ++i) {
            // See if the block entity spawned
            const entity = this.mbot.bot.nearestEntity(
                entity => entity.getDroppedItem()?.name === args["blockName"]
            );

            if (!entity) {
                this.mbot.userInterface.log("There is no entity, we are finished");
                break;
            }

            // Start checking if entity mined is picked up or not
            var waitForEntityGone = this.mbot.modules["utility"].waitForEntityGone(entity, interrupt);

            // Collect block as entity
            this.mbot.bot.pathfinder.setGoal(
                new GoalFollow(entity, 0)
            );

            await waitForEntityGone; // Do not continue until entity picked up

            this.mbot.userInterface.log("Collected one entity");
        }
    }
}

module.exports = Miner;
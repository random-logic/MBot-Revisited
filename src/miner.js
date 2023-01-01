const UserInterface = require("./user-interface");

const { GoalFollow, GoalY, GoalCompositeAll, GoalLookAtBlock, GoalCompositeAny } = require("mineflayer-pathfinder").goals;
const { Movements } = require("mineflayer-pathfinder");

const Module = require("./module");

/**
 * @class
 * Allows the bot to mine blocks.
 * Requires {@link Mover}.
 * @extends Module
 */
class Miner extends Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     */
    constructor (mbot) {
        super(mbot);
    }

    /**
     * @typedef MineBlockArgs
     * @property {object} findBlocksOptions See [findBlocks]{@link https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions}.
     * @property {bool} [safeBlockFilter = true] Filters out the blocks not safe to mine. If set to true, findBlockOptions["useExtraInfo"] is overrided.
     * @property {number} [numberOfBlocksToMine = Infinity] Mines a certain number of blocks.
     * @property {EnhancedMovements} [minerMovements = null] Sets the {@link Movements} that the miner should use when moving.
     */

    /**
     * Instruction to mine blocks until an instruction interrupts.
     * @param {MineBlockArgs} args The args for this instruction.
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
        
        // Mine a specified number of blocks
        var count = args["numberOfBlocksToMine"];
        for (var n = 0; n < count; ++n) {
            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Find blocks, blocks is an array
            const blockPositions = this.mbot.modules["utility"].findBlocks(args["findBlocksOptions"], true);

            // Check to see if any blocks are found
            if (blockPositions.length == 0) throw "Could not find any blocks of that type";

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Allow interrupts to stop the bot from moving
            interrupt.onInterrupt = this.mbot.bot.pathfinder.stop;

            // Set the pathfinder to use movements specified in args
            this.mbot.modules["mover"].resetAndApplyMovements(args["movements"]);

            // Find path to any block that works
            var reachedGoal = false;
            var blockIndex = 0;
            for (; blockIndex < blockPositions.length; ++blockIndex) {
                // Travel to block
                try {
                    this.mbot.userInterface.log("Moving to mine block at position " + blockPositions[blockIndex]);

                    await this.mbot.bot.pathfinder.goto(
                        new GoalCompositeAll([
                            new GoalLookAtBlock(blockPositions[blockIndex], this.mbot.bot.world, { "range" : 4 }),
                            new GoalCompositeAny([ // Make sure the bot doesn't jump to break the block
                                new GoalY(blockPositions[blockIndex].y),
                                new GoalY(blockPositions[blockIndex].y + 1),
                                new GoalY(blockPositions[blockIndex].y - 1)
                            ])
                        ])
                    );

                    reachedGoal = true; // Reached the target block
                    
                    // Check for interrupts
                    if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";
                    
                    break;
                }
                catch(e) {
                    // Log the error and continue loop
                    this.mbot.userInterface.logError(e);

                    // Check for interrupts
                    if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";
                }
            }

            if (!reachedGoal) throw "Couldn't reach any blocks of the specified type";

            // Pathfinder no longer used, can now unlink pathfinder from interrupt
            interrupt.onInterrupt = null;

            // Get the block that we just walked to
            const block = this.mbot.bot.blockAt(blockPositions[blockIndex]);

            // Get the best harvest tool
            this.mbot.userInterface.log("Equipping harvesting tool");
            const harvestTool = this.mbot.bot.pathfinder.bestHarvestTool(block);
            if (!harvestTool) throw "No tool to harvest block";

            // Equip bot with correct tool to mine block
            await this.mbot.bot.equip(harvestTool, "hand");

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Dig block
            this.mbot.userInterface.log("Digging block");
            await this.mbot.bot.dig(block, false);
            this.mbot.userInterface.log("Finished digging block");

            // Wait for entity to spawn
            await this.mbot.modules["utility"].waitForPhysicsTicks(10);

            // Start checking if entity mined is picked up or not
            var waitForEntityGone = this.mbot.modules["utility"].waitForEntityGone(block.entity);

            // Collect block as entity
            await this.mbot.bot.pathfinder.goto(
                new GoalFollow(block, 0)
            );

            // Do not continue until entity picked up
            await waitForEntityGone;
            this.mbot.userInterface.log("Finished harvesting");

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";
        }
    }
}

module.exports = Miner;
const { GoalGetToBlock, GoalFollow } = require("mineflayer-pathfinder").goals;

class Miner {
    /**
     * Constructor
     * @param {object} bot The current instance of bot
     * @param {object} utility For add on function calls
     */
    constructor (bot, utility) {
        this.bot = bot;
        this.utility = utility;
    }

    async mineBlocks(args, options, interrupt) {
        // Parse args
        if (!args || typeof args !== "object") throw "Invalid Args";
        var findBlocksOptions = args["findBlocksOptions"];
        if (!findBlocksOptions || typeof findBlocksOptions !== "object") throw "Invalid Arg findBlockOptions";
        //var count = args["count"];
        //if (!count || Number.isSafeInteger(count)) throw "Invalid Arg count";

        // Find count number of blocks
        // ??

        // Check for interrupts
        if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

        // Find blocks, blocks is an array
        const blockPositions = this.utility.findBlocks(findBlocksOptions);

        // Check to see if any blocks are found
        if (blockPositions.length == 0) throw "Could not find any blocks of that type";

        // Check for interrupts
        if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

        // Allow interrupts to stop the bot from moving
        interrupt.onInterrupt = this.bot.pathfinder.stop;

        // Find path to any block that works
        var i = 0, reachedGoal = false;
        while (i != blockPositions.length) {
            // Travel to block
            try {
                await this.bot.pathfinder.goto(
                    new GoalGetToBlock(blockPositions[i].x, blockPositions[i].y, blockPositions[i].z)
                );

                reachedGoal = true; // Reached the target block
                break;
            }
            catch(e) {
                ++i; // Travel to next block if we couldn't get to the block
            }
            finally {
                // Check for interrupts
                if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";
            }
        }

        if (!reachedGoal) throw "Couldn't reach any blocks of the specified type";

        // Pathfinder no longer used, can now unlink pathfinder from interrupt
        interrupt.onInterrupt = null;

        // Get the block that we just walked to
        const block = this.bot.blockAt(blockPositions[i]);

        // Get the best harvest tool
        const harvestTool = this.bot.pathfinder.bestHarvestTool(block);
        if (harvestTool === null) throw "No tool to harvest block";

        // Equip bot with correct tool to mine block
        await this.bot.equip(harvestTool, "hand");

        // Check for interrupts
        if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

        // Dig block
        await this.bot.dig(block);

        // Wait for entity to spawn
        await this.utility.waitForPhysicsTicks(10);

        // Start checking if entity mined is picked up or not
        var waitForEntityGone = this.utility.waitForEntityGone(block.entity);

        // Collect block as entity
        await this.bot.pathfinder.goto(
            new GoalFollow(block, 0)
        )

        // Do not continue until entity picked up
        await waitForEntityGone;

        // Check for interrupts
        if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";
    }
}

module.exports = Miner;
const UserInterface = require("./user-interface");

const { GoalGetToBlock, GoalFollow, GoalY, GoalCompositeAll, GoalLookAtBlock, GoalBlock, GoalCompositeAny } = require("mineflayer-pathfinder").goals;

const { Movements } = require('mineflayer-pathfinder'); // Import the Movements class from pathfinder ??

/**
 * This class is focused on mining instructions
 * Requires mineflayer-pathfinder
 */
class Miner {
    /**
     * Constructor
     * @param {object} bot The current instance of bot
     * @param {Utility} utility Refer to Utility.js
     * @param {UserInterface} userInterface Refer to UserInterface.js
     */
    constructor (bot, utility, userInterface) {
        this.bot = bot;
        this.utility = utility;
        this.userInterface = userInterface;
    }

    /**
     * @typedef MineBlockArgs
     * @param {object} findBlocksOptions Refer to https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#botfindblocksoptions
     * @param {bool} safeBlockFilter Filters out the blocks not safe to mine, default true, if set to true, findBlockOptions["useExtraInfo"] is overrided
     * @param {number} numberOfBlocksToMine Mines a certain number of blocks, default Infinity
     */

    /**
     * Instruction to mine blocks until an instruction interrupts
     * @param {MineBlockArgs} args The args for this instruction
     * @param {Interrupt} interrupt From interrupt.js, the object to refer to when checking for interrupts
     */
    async mineBlocks(args, interrupt) {
        // Parse args
        if (!args || typeof args !== "object") throw "Invalid Args";

        // Check if the args are valid
        if (!args["findBlocksOptions"] || typeof args["findBlocksOptions"] !== "object") throw "Invalid Arg findBlockOptions";
        if (typeof args["safeBlockFilter"] !== "bool") args["safeBlockFilter"] = true;
        if (typeof args["numberOfBlocksToMine"] !== "number") args["numberOfBlocksToMine"] = Infinity;
        
        // Mine a specified number of blocks
        var count = args["numberOfBlocksToMine"];
        for (var n = 0; n < count; ++n) {
            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Find blocks, blocks is an array
            const blockPositions = this.utility.findBlocks(args["findBlocksOptions"], true);

            // Check to see if any blocks are found
            if (blockPositions.length == 0) throw "Could not find any blocks of that type";

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Allow interrupts to stop the bot from moving
            interrupt.onInterrupt = this.bot.pathfinder.stop;

            // ?? Make sure netherrack is part of scafolding blocks 
            const defaultMove = new Movements(this.bot);
            defaultMove.allowParkour = false; // ?? Don't allow parkour, because he almost got stuck doing parkour
            defaultMove.scafoldingBlocks.push(this.utility.getBlockId('netherrack')); // Add nether rack to allowed scaffolding items
            this.bot.pathfinder.setMovements(defaultMove); // Update the movement instance pathfinder uses

            // Find path to any block that works
            var reachedGoal = false;
            var blockIndex = 0;
            for (; blockIndex < blockPositions.length; ++blockIndex) {
                // Travel to block
                try {
                    this.userInterface.log("Moving to mine block at position " + blockPositions[blockIndex]);

                    await this.bot.pathfinder.goto(
                        new GoalCompositeAll([
                            new GoalLookAtBlock(blockPositions[blockIndex], this.bot.world, { "range" : 4 }),
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
                    this.userInterface.logError(e);

                    // Check for interrupts
                    if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";
                }
            }

            if (!reachedGoal) throw "Couldn't reach any blocks of the specified type";

            // Pathfinder no longer used, can now unlink pathfinder from interrupt
            interrupt.onInterrupt = null;

            // Get the block that we just walked to
            const block = this.bot.blockAt(blockPositions[blockIndex]);

            // Get the best harvest tool
            this.userInterface.log("Equipping harvesting tool");
            const harvestTool = this.bot.pathfinder.bestHarvestTool(block);
            if (!harvestTool) throw "No tool to harvest block";

            // Equip bot with correct tool to mine block
            await this.bot.equip(harvestTool, "hand");

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Dig block
            this.userInterface.log("Digging block");
            await this.bot.dig(block, false);
            this.userInterface.log("Finished digging block");

            // Wait for entity to spawn
            await this.utility.waitForPhysicsTicks(10);

            // Start checking if entity mined is picked up or not
            var waitForEntityGone = this.utility.waitForEntityGone(block.entity);

            // Collect block as entity
            await this.bot.pathfinder.goto(
                new GoalFollow(block, 0)
            );

            // Do not continue until entity picked up
            await waitForEntityGone;
            this.userInterface.log("Finished harvesting");

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";
        }
    }
}

module.exports = Miner;
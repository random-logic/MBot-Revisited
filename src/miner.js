const UserInterface = require("./user-interface");

const { GoalGetToBlock, GoalFollow, GoalY, GoalCompositeAll } = require("mineflayer-pathfinder").goals;

const { Movements } = require('mineflayer-pathfinder') // Import the Movements class from pathfinder ??

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
     */
    /**
     * Instruction to mine blocks until an instruction interrupts
     * @param {MineBlockArgs} args The args for this instruction
     * @param {object} options Has no effect for this instruction
     * @param {Interrupt} interrupt From interrupt.js, the object to refer to when checking for interrupts
     */
    async mineBlocks(args, options, interrupt) {
        // Parse args
        if (!args || typeof args !== "object") throw "Invalid Args";
        var findBlocksOptions = args["findBlocksOptions"];
        if (!findBlocksOptions || typeof findBlocksOptions !== "object") throw "Invalid Arg findBlockOptions";
        
        while (true) {
            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Find blocks, blocks is an array
            const blockPositions = this.utility.findBlocks(findBlocksOptions, true);

            // Check to see if any blocks are found
            if (blockPositions.length == 0) throw "Could not find any blocks of that type";

            // Check for interrupts
            if (interrupt.hasInterrupt) throw "mineBlocks Interrupted";

            // Allow interrupts to stop the bot from moving
            interrupt.onInterrupt = this.bot.pathfinder.stop;

            // ?? Make sure netherrack is part of scafolding blocks 
            const defaultMove = new Movements(this.bot);
            defaultMove.scafoldingBlocks.push(this.utility.getBlockId('netherrack')); // Add nether rack to allowed scaffolding items
            this.bot.pathfinder.setMovements(defaultMove); // Update the movement instance pathfinder uses

            // Find path to any block that works
            var i = 0, reachedGoal = false;
            while (i != blockPositions.length) {
                // Travel to block
                try {
                    this.userInterface.log("Moving to mine block at position " + blockPositions[i]);

                    await this.bot.pathfinder.goto(
                        new GoalCompositeAll([
                            new GoalGetToBlock(blockPositions[i].x, blockPositions[i].y, blockPositions[i].z),
                            new GoalY(blockPositions[i].y)
                        ])
                    );

                    reachedGoal = true; // Reached the target block
                    break;
                }
                catch(e) {
                    this.userInterface.logError(e);
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
            this.userInterface.log("Harvesting block");
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
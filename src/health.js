/**
 * Manages the health of the bot
 * Requires mineflayer-auto-eat
 */
class Health {
    /**
     * Constructor
     * Assumes the bot has already spawned
     * @param {object} bot The current instance of bot
     * @param {Instruction} instruction Refer to instruction.js
     */
    constructor(bot, instruction) {
        this.bot = bot;
        this.instruction = instruction;

        this.autoEat = true;
        this.exitBeforeDeath = true; // ??

        bot.on("health", () => {
            console.log("Health: " + bot.health);

            if (this.autoEat) {
                bot.autoEat.enable();

                if (bot.health >= 18) {
                    bot.autoEat.options = {
                        priority: "foodPoints",
                        startAt: 14,
                        bannedFood: []
                    }
                }
                else {
                    bot.autoEat.options = {
                        priority: "foodPoints",
                        startAt: 19,
                        bannedFood: []
                    }
                }
            }
            else {
                bot.autoEat.disable();
            }
        });
    }
}

module.exports = Health;
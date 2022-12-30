/**
 * @class
 * @extends Module
 * Manages the health of the bot.
 * Requires [mineflayer-auto-eat]{@link https://github.com/link-discord/mineflayer-auto-eat}.
 */
class Health {
    /**
     * @param {Mbot} mbot The instance of Mbot that this module will be mounted to.
     */
    constructor(mbot) {
        /**
         * @property {Mbot} mbot The instance of Mbot that this module is mounted to.
         */
        this.mbot = mbot;

        /**
         * @property {bool} autoEat The bot will auto eat when needed if set to true.
         */
        this.autoEat = true;

        /**
         * @property {bool} exitBeforeDeath The bot will attempt to log off to avoid death if set to true. ?? To do
         */
        this.exitBeforeDeath = true;
    }

    onCreateBot() {
        this.mbot.bot.on("health", () => {
            this.mbot.userInterface.log("Health: " + this.mbot.bot.health);

            if (this.autoEat) {
                this.mbot.bot.autoEat.enable();

                if (this.mbot.bot.health >= 18) {
                    this.mbot.bot.autoEat.options = {
                        "priority" : "foodPoints",
                        "startAt" : 14,
                        "bannedFood" : []
                    }
                }
                else {
                    this.mbot.bot.autoEat.options = {
                        "priority" : "foodPoints",
                        "startAt" : 19,
                        "bannedFood" : []
                    }
                }
            }
            else {
                this.mbot.bot.autoEat.disable();
            }
        });
    }
}

module.exports = Health;
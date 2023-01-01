const Module = require("./module");

/**
 * @class
 * Manages the health of the bot.
 * Requires [mineflayer-auto-eat]{@link https://github.com/link-discord/mineflayer-auto-eat}.
 * @extends Module
 */
class Health extends Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     */
    constructor(mbot) {
        super(mbot);

        /**
         * @property {bool} [autoEat = true] The bot will auto eat when needed if set to true.
         */
        this.autoEat = true;

        /**
         * @property {bool} [exitBeforeDeath = true] The bot will attempt to log off to avoid death if set to true. ?? To do
         */
        this.exitBeforeDeath = true;
    }

    /**
     * Inherited from {@link Module}
     */
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
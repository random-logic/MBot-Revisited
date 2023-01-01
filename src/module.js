/**
 * @class
 * Base class for {@link Mbot} modules.
 */
class Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     */
    constructor(mbot) {
        /**
         * @property {Mbot} mbot The instance of Mbot that this {@link Module} is mounted to.
         */
        this.mbot = mbot;
    }

    /**
     * Callback when {@link Mbot} creates a Mineflayer bot.
     */
    onCreateBot() {
        // By default, do nothing
    }
}

module.exports = Module;
/**
 * @class
 * Base class for {@link Mbot} modules.
 */
class Module {
    /**
     * @param {Mbot} mbot The instance of Mbot that this {@link Module} will be mounted to.
     * @param {string} moduleName The name of this module.
     * @param {Array} [requiredModules = null] An array of strings that specifies the required modules for this module to operate. 
     */
    constructor(mbot, moduleName, requiredModules = null) {
        /**
         * @property {Mbot} mbot The instance of Mbot that this {@link Module} is mounted to.
         */
        this.mbot = mbot;

        /**
         * @property {string} moduleName The name of this module.
         */
        this.moduleName = moduleName;

        /**
         * @property {Array} requiredModules An array of strings that specifies the required modules for this module to operate. 
         */
        this.requiredModules = requiredModules;
    }

    /**
     * Callback when {@link Mbot} creates a Mineflayer bot. Default behavior is to throw an error if one of the required modules is not mounted onto Mbot.
     */
    onCreateBot() {
        // By default, throw an error if one of the requiredModules is missing
        if (!this.requiredModules) return;
        
        for (const requiredModule of this.requiredModules) {
            if (!this.mbot.modules[requiredModule]) {
                throw new Error(`${this.moduleName} requires ${this.requiredModule}, which must be mounted in mbot.modules`);
            }
        }
    }

    /**
     * Callback when {@link Mbot} creates a Mineflayer bot and the bot spawns. Default behavior is to do nothing.
     */
    onSpawn() {
        // By default, do nothing
    }
}

module.exports = Module;
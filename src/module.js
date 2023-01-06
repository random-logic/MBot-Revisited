/**
 * @class
 * Base class for {@link Mbot} modules.
 */
class Module {
    /**
     * @param {string} moduleName The name of this module.
     * @param {Array} [requiredModules = null] An array of strings that specifies the required modules for this module to operate. 
     */
    constructor(moduleName, requiredModules = null) {
        /**
         * @property {Mbot} mbot The instance of Mbot that this {@link Module} is mounted to.
         */
        this.mbot = null;

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
     * Mount this {@link Module} onto {@link Mbot}.
     * @param {Mbot} mbot The {@link Mbot} to link to this module.
     */
    mount(mbot) {
        this.mbot = mbot;
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
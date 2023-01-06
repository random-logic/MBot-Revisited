/**
 * @class
 * User interface to send commands to the bot.
 * @abstract
 */
class UI {
    /**
     * Adds a bot for the user to control.
     * @abstract
     * @param {Mbot} mbot The instance of mbot to add.
     */
    mount(mbot) {
        throw new Error("UserInterface abstract function addMbot not implemented");
    }

    /**
     * Logs a minecraft whisper message.
     * @abstract
     * @param {string} username The username associated with the message.
     * @param {string} message The message.
     */
    logMinecraftWhisper(username, message) {
        throw new Error("UserInterface abstract function logMinecraftWhisper not implemented");
    }

    /**
     * Logs a minecraft chat message.
     * @abstract
     * @param {string} username The username associated with the message.
     * @param {string} message The message.
     */
    logMinecraftChat(username, message) {
        throw new Error("UserInterface abstract function logMinecraftChat not implemented");
    }

    /**
     * Push notification to user interface.
     * @abstract
     * @param {string} message The message.
     */
    notify(message) {
        throw new Error("UserInterface abstract function notify not implemented");
    }

    /**
     * Log for debugging.
     * @param {string} what String to log
     */
    log(what) {
        console.log(what);
    }

    /**
     * Log error for debugging.
     * @param {string | Error} what Error to log
     */
    logError(what) {
        console.error(what);
    }
}

module.exports = UI;
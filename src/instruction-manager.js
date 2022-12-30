const Interrupt = require("./interrupt");

/**
 * @typedef Instruction
 * @summary A single Mbot instruction that can be decoded and executed in {@link InstructionManager}.
 * @property {string} module The name of the module that matches the key of the module.
 * @property {string} instruction The instruction (represented as a function) to run from the specified module.
 * @property {string} args The args for the instruction.
 */

/**
 * @class
 * Decodes and executes Mbot instructions.
 * Allows for other instructions to interrupt the current instruction.
 */
class InstructionManager {
    /**
     * @param {Mbot} mbot The instance of Mbot that this module will be mounted to.
     */
    constructor(mbot) {
        /**
         * @property {Mbot} mbot The instance of Mbot that this module is mounted to.
         */
        this.mbot = mbot;

        /**
         * @property {Interrupt} interrupt The current instance of interrupt.
         */
        this.interrupt = new Interrupt();

        /**
         * @property {bool} doingInstruction Set to true if an instruction is running.
         */
        this.doingInstruction = false;
    }
    
    /**
     * Gets the requested command and executes the associated instruction.
     * @param {string} commandName The name of the command to querry from commands.
     * @returns {Promise} Promise that resolves when the instruction finishes.
     */
    async getCommand(commandName) {
        const command = this.mbot.commands[commandName];
        if (!command || typeof command !== "object")
            throw "Invalid Command Name";
        
        await this.parseInstruction(command);
    }
    
    /**
     * Parses the command into an instruction and executes it.
     * @param {Instruction} contents The instruction.
     * @returns {Promise} Promise that resolves when the instruction finishes.
     */
    async parseInstruction(contents) {
        // Verify valid contents
        if (typeof contents !== "object" || contents === null) throw "Invalid contents";
    
        // Get module name
        const moduleName = contents["module"];
        if (typeof moduleName !== "string") throw "Invalid Module Name";
    
        // Get module
        const module = this.mbot.modules[moduleName];
        if (!module) throw "Invalid Module";
    
        // Get instruction name
        const instructionName = contents["instruction"];
        if (typeof instructionName !== "string") throw "Invalid Instruction Name";
    
        // Get instruction
        const instruction = module[instructionName];
        if (!instruction) throw "Invalid Instruction";
    
        // Do instruction
        if (!this.doingInstruction) {
            await this.doInstruction(module, instructionName, contents["args"]);
        }
        else {
            // Interrupt instruction before doing instruction
            await this.interrupt.interruptInstruction();
            await this.doInstruction(module, instructionName, contents["args"]);
        }
    }

    /**
     * Executes the instruction.
     * Interrupts the current instruction.
     * Logs any errors to user interface on execution.
     * @param {Module} module The module to call the instruction on.
     * @param {string} instructionName The name of the instruction.
     * @param {object} args The args associated with the instruction.
     * @returns {Promise} Promise that resolves when the instruction finishes.
     */
    async doInstruction(module, instructionName, args) {
        this.doingInstruction = true; // Start doing instruction
    
        try {
            // Try to do the instruction
            await module[instructionName](args, this.interrupt);
        }
        catch (e) {
            // Log the error to user interface if an error is thrown
            this.mbot.userInterface.logError(e);
        }
        finally {
            // Check for interrupt
            if (this.interrupt.hasInterrupt) {
                this.interrupt.resolve(); // Resolve interrupt for the next instruction
            }
            else {
                this.doingInstruction = false; // Otherwise we are not doing an instruction
            }
        }
    }
}

module.exports = InstructionManager;
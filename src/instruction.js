/**
 * Keeps track of which instruction is currently being executed from modules
 */
class Instruction {
    /**
     * Constructor
     * @param {object} commands Refer to command-example.json
     * @param {object} modules The object that stores all of the custom modules like miner.js and health.js
     * @param {Interrupt} interrupt Refer to Interrupt.js
     */
    constructor(commands, modules, interrupt) {
        this.commands = commands;
        this.modules = modules;
        this.interrupt = interrupt;
        this.doingInstruction = false;
    }
    
    /**
     * Gets the requested command and executes the associated instruction
     * @param {string} commandName The name of the command to querry from commands
     */
    async getCommand(commandName) {
        const command = this.commands[commandName];
        if (!command || typeof command !== "object")
            throw "Invalid Command Name";
        
        await this.parseInstruction(command);
    }
    
    /**
     * Parses the command into an instruction and executes it
     * @param {object} contents The contents of the command, refer to command-example.json
     */
    async parseInstruction(contents) {
        // Verify valid contents
        if (typeof contents !== "object" || contents === null) throw "Invalid contents";
    
        // Get module name
        const moduleName = contents["module"];
        if (typeof moduleName !== "string") throw "Invalid Module Name";
    
        // Get module
        const module = this.modules[moduleName];
        if (!module) throw "Invalid Module";
    
        // Get instruction name
        const instructionName = contents["instruction"];
        if (typeof instructionName !== "string") throw "Invalid Instruction Name";
    
        // Get instruction
        const instruction = module[instructionName];
        if (!instruction) throw "Invalid Instruction";
    
        // Do instruction
        if (!this.doingInstruction) {
            await this.doInstruction(module, instructionName, contents["args"], contents["options"]);
        }
        else {
            // Interrupt instruction before doing instruction
            await this.interrupt.interruptInstruction();
            await this.doInstruction(module, instructionName, contents["args"], contents["options"]);
        }
    }

    /**
     * Executes the instruction
     * Interrupts the current instruction
     * @param {object} module The object to call the instruction on, like miner.js or health.js
     * @param {string} instructionName The name of the instruction
     * @param {object} args The args associated with the instruction
     * @param {object} options The options associated with the instruction
     */
    async doInstruction(module, instructionName, args, options) {
        this.doingInstruction = true;
    
        var instructionError = null, instructionThrewError = false;
    
        try {
            await module[instructionName](args, options, this.interrupt);
        }
        catch (e) {
            instructionError = e;
            instructionThrewError = true;
        }
        finally {
            // Check for interrupt
            if (this.interrupt.hasInterrupt) {
                this.interrupt.resolve(); // Resolve interrupt for the next instruction
            }
            else {
                this.doingInstruction = false; // Otherwise we are not doing an instruction
            }
    
            if (instructionThrewError)
                throw instructionError;
        }
    }
}

module.exports = Instruction;
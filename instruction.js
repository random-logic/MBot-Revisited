class Instruction {
    constructor(bot, commands, modules, interrupt) {
        this.bot = bot;
        this.commands = commands;
        this.modules = modules;
        this.interrupt = interrupt;
        this.doingInstruction = false;
    }
    
    async getCommand(commandName) {
        const command = this.commands[commandName];
        if (!command || typeof command !== "object")
            throw "Invalid Command Name";
        
        await this.parseInstruction(command);
    }
    
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
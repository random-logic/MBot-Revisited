/**
 * @class
 * This class allows other instructions to interrupt the current instruction in {@link InstructionManager}.
 */
class Interrupt {
    constructor() {
        /**
         * @property {bool} hasInterrupt True if an instruction is trying to interrupt another instruction. This field should only be read from.
         */
        this.hasInterrupt = false;

        /**
         * @callback OnInterrupt
         */

        /**
         * @property {OnInterrupt} onInterrupt Callback when an interrupt occurs.
         */
        this.onInterrupt = null;
        
        this.resolveCallee = null;
    }
    
    /**
     * Interrupts the instruction
     * @returns {Promise} A promise that resolves when the interrupt is resolved
     */
    interruptInstruction() {
        return new Promise(resolve => {
            this.resolveCallee = resolve;
            this.hasInterrupt = true;
            if (this.onInterrupt)
                this.onInterrupt();
        });
    }

    /**
     * Resolves the interrupt
     */
    resolve() {
        this.hasInterrupt = false;
        this.resolveCallee();
    }
};

module.exports = Interrupt;
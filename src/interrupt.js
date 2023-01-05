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
         * @summary A callback function.
         */

        /**
         * @property {OnInterrupt} onInterrupt Callback when an interrupt occurs.
         */
        this.onInterrupt = null;
        
        this.resolveCallee = null;
    }

    /**
     * Sets onInterrupt.
     * @param {OnInterrupt} func The callback.
     */
    setOnInterrupt(func) {
        this.onInterrupt = func;
    }

    /**
     * Clears onInterrupt.
     */
    clearOnInterrupt() {
        this.onInterrupt = null;
    }
    
    /**
     * Throws an error if hasInterrupt is true.
     * @param {string} name The name of the function that got interrupted.
     */
    throwErrorIfHasInterrupt(name) {
        if (this.hasInterrupt)
            throw new Error(`${name} Interrupted`);
    }
    
    /**
     * Interrupts the instruction.
     * @returns {Promise} A promise that resolves when the interrupt is resolved.
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
     * Resolves the interrupt.
     */
    resolve() {
        this.hasInterrupt = false;
        this.resolveCallee();
    }
};

module.exports = Interrupt;
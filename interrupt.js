class Interrupt {
    constructor() {
        this.hasInterrupt = false; // This field should only be read from and not modified
        this.onInterrupt = null; // Callback when an interrupt occurs
        this.resolveCallee = null; // This shouldn't be touched, tells the callee that the interrupt has been resolved
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
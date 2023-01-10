const Module = require("./module");
const Utility = require("./utility");

class ConcreteMixer extends Module {
    constructor() {
        super("concreteMixer", ["mover"]);
    }

    /**
     * @typedef MixConcretePowderArgs
     * @summary The object that represents the args for an instruction.
     * @property {Vector3} referenceBlockPosition The position of the reference block.
     * @property {Vector3} referenceFace The face of the reference block where the concrete powder is placed.
     */

    /**
     * Instruction to mix concrete powder with water. An adjacent water source is assumed to be present.
     * @param {MixConcretePowderArgs} args The args for this instruction.
     * @param {Interrupt} interrupt The interrupt instance for this bot. 
     */
    async mixConcretePowder(args, interrupt) { // ??
        if (!args || typeof args["referenceBlockPosition"] !== "object")
            throw new Error("Invalid MixConcretePowderArgs referenceBlockPosition");
        if (typeof args["referenceFace"] !== "object")
        throw new Error("Invalid MixConcretePowderArgs referenceFace");

        await this.mbot.bot.lookAt(args["referenceBlockPosition"]);

        var concrete = this.mbot.bot.inventory.items().find(item => item.name.includes('concrete_powder'));

        while (concrete) {
            await this.mbot.bot.equip(concrete, "hand");

            await Utility.waitForMilliseconds(100);

            const pickaxe = bot.inventory.items().find(item => item.name.includes('pickaxe'))
            if (!pickaxe) throw new Error("No pickaxe found");

            await this.mbot.bot.equip(pickaxe, "hand");

            await Utility.waitForMilliseconds(100);

            concrete = this.mbot.bot.inventory.items().find(item => item.name.includes('concrete_powder'));
        }

    }
}

module.exports = ConcreteMixer;
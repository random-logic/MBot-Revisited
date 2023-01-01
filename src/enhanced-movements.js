/**
 * @typedef Movements
 * @summary See [Movements]{@link https://github.com/PrismarineJS/mineflayer-pathfinder#movements-class-default-properties}.
 */
const { Movements } = require("mineflayer-pathfinder");

/**
 * @typedef MovementsSettings
 * @summary An object.
 * @property {Movements} [set = null] These movements will override the default {@link Movements}.
 * @property {Movements} [add = null] These movements will add onto the default {@link Movements}. This only supports properties of {@link Movements} that are of type Array or sets.
 */

/**
 * @class
 * Enhanced version allows you to add {@link Movements} with just one function. Diagonal movements can also be disabled.
 * @extends Movements
 */
class EnhancedMovements extends Movements {
    /**
     * @param {Bot} bot The current instance of Mineflayer bot.
     */
    constructor(bot) {
        super(bot);

        /**
         * @property {bool} [canMoveDiagonally = false] Specifies whether the bot can move diagonally or not.
         */
        this.canMoveDiagonally = false;
    }

    /**
     * Adds to a property of this instance. This function only supports properties that are of type {@link Array} or {@link Set}.
     * @param {string} propertyName The name of the property to add to.
     * @param {Array | Set} valuesToAdd The values to add to the property.
     */
    addMovements(propertyName, valuesToAdd) {
        var property = this[propertyName];

        for (const value of valuesToAdd) {
            if (Array.isArray(property)) {
                property.push(value);
            }
            else { // We are assuming it is a set
                property.add(value);
            }
        }

        this[propertyName] = property;
    }

    /**
     * Modifies this instance using the settings provided
     * @param {MovementsSettings} modifications Specifies what to modify.
     */
    modifyMovements(modifications) {
        if (!modifications) return;

        if (modifications["set"]) {
            for (const [key, value] of Object.entries(modifications["set"])) {
                this[key] = value;
            }
        }

        if (modifications["add"]) {
            for (const [key, value] of Object.entries(modifications["set"])) {
                addMovements(key, value);
            }
        }
    }

    getNeighbors (node) {
        const neighbors = [];
    
        // Simple moves in 4 cardinal points
        for (const i in cardinalDirections) {
          const dir = cardinalDirections[i];
          this.getMoveForward(node, dir, neighbors);
          this.getMoveJumpUp(node, dir, neighbors);
          this.getMoveDropDown(node, dir, neighbors);
          if (this.allowParkour) {
            this.getMoveParkourForward(node, dir, neighbors);
          }
        }
    
        if (this.canMoveDiagonally) {
            for (const i in diagonalDirections) {
                const dir = diagonalDirections[i]
                this.getMoveDiagonal(node, dir, neighbors)
            }
        }
    
        this.getMoveDown(node, neighbors);
        this.getMoveUp(node, neighbors);
    
        return neighbors;
    }
}

module.exports = EnhancedMovements;
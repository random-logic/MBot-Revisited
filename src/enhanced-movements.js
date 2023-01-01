/**
 * @typedef Movements
 * @summary See [Movements]{@link https://github.com/PrismarineJS/mineflayer-pathfinder#movements-class-default-properties}.
 */
const { Movements } = require("mineflayer-pathfinder");

/**
 * @typedef MovementsSettings
 * @summary An object that represents the settings for {@link EnhancedMovements}.
 * @property {Movements} [set = null] These movements will override the default {@link Movements}.
 * @property {Movements} [add = null] These movements will add onto the default {@link Movements}. This only supports properties of {@link Movements} that are of type Array or sets.
 */

/**
 * @typedef Vector2
 * @summary An object that represents a Vector2 that is perpendicular to the y-axis in the minecraft world.
 * @property {number} x The x coordinate
 * @property {number} z The z coordinate
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
         * @property {bool} [canMoveDiagonally = true] Specifies whether the bot can move diagonally or not.
         */
        this.canMoveDiagonally = true;
        
        /**
         * @property {Array} cardinalDirections An array that contains instances of {@link Vector2} which represents the directions of the bot in the minecraft world.
         */
        this.cardinalDirections = [
            { x: -1, z: 0 }, // West
            { x: 1, z: 0 }, // East
            { x: 0, z: -1 }, // North
            { x: 0, z: 1 } // South
        ];

        /**
         * @property {Array} diagonalDirections An Array that contains instances of {@link Vector2} which represent the diagonal directions of the bot in the minecraft world
         */
        this.diagonalDirections = [
            { x: -1, z: -1 },
            { x: -1, z: 1 },
            { x: 1, z: -1 },
            { x: 1, z: 1 }
        ];
    }

    /**
     * Sets a property of this instance. See members of this instance. Block names are converted to block ids.
     * @param {string} key The name of the property to set.
     * @param {object} value The new value. If the property is a {@link Set} and this is an {@link Array}, then this will be converted to a set.
     */
    setMovements(key, value) {
        if (Array.isArray(value) && this[key] instanceof Set) {
            this[key] = new Set(value);
        }
        else {
            this[key] = value;
        }
    }

    /**
     * Adds to a property of this instance. See members of this instance. Block names are converted to block ids. This function only supports properties that are of type {@link Array} or {@link Set}.
     * @param {string} propertyName The name of the property to add to.
     * @param {Array | Set} valuesToAdd The values to add to the property.
     */
    addMovements(propertyName, valuesToAdd) {
        var property = this[propertyName];

        for (const value of valuesToAdd) {
            if (Array.isArray(property)) {
                property.push(value);
            }
            else { // if (property instanceof Set)
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
                this.setMovements(key, value);
            }
        }

        if (modifications["add"]) {
            for (const [key, value] of Object.entries(modifications["add"])) {
                this.addMovements(key, value);
            }
        }
    }

    getNeighbors (node) {
        const neighbors = [];
    
        // Simple moves in 4 cardinal points
        for (const i in this.cardinalDirections) {
          const dir = this.cardinalDirections[i];
          this.getMoveForward(node, dir, neighbors);
          this.getMoveJumpUp(node, dir, neighbors);
          this.getMoveDropDown(node, dir, neighbors);
          if (this.allowParkour) {
            this.getMoveParkourForward(node, dir, neighbors);
          }
        }
    
        if (this.canMoveDiagonally) {
            for (const i in this.diagonalDirections) {
                const dir = this.diagonalDirections[i]
                this.getMoveDiagonal(node, dir, neighbors)
            }
        }
    
        this.getMoveDown(node, neighbors);
        this.getMoveUp(node, neighbors);
    
        return neighbors;
    }
}

module.exports = EnhancedMovements;
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
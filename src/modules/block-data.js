const Vector3 = require("vec3").Vec3;

/**
 * @typedef Block
 * @summary See [block]{@link https://github.com/PrismarineJS/prismarine-block#prismarine-block}.
 */

/**
 * @typedef BlockSpace
 * @summary A 3D {@link Array} that stores instances of {@link BlockData}.
 * Useful when the bot has to remember which blocks are placed in a given 3D space in a 3D world.
 * To access one of the instances of {@link BlockData}, use {@link BlockSpace}[y-coordinate][x-coordinate][z-coordinate].
 */

/**
 * @typedef ReferenceBlock
 * @summary An object that stores the reference block and the face. Useful when getting a reference block for placing a block.
 * @property {Block} block The actual reference block.
 * @property {Vector3} face The face to use.
 */

/**
 * @class
 * An object that stores data in a {@link BlockSpace}.
 * @property {string} name Alias for {@link Block} name.
 * @property {object} properties Alias for {@link Block} properties.
 * @property {Vector3} position Alias for {@link Block} position.
 * @property {bool} isPlaced Set to true if the block is already placed in a build.
 */
class BlockData {
    /**
     * Creates a new instance of {@link BlockData}.
     * @param {string} name Alias for {@link Block} name.
     * @param {object} properties Alias for {@link Block} properties.
     * @param {Vector3} position Alias for {@link Block} position.
     * @param {bool} isPlaced Set to true if the block is already placed in a build.
     */
    constructor(name, properties, position, isPlaced) {
        /**
         * @property {string} name Alias for {@link Block} name.
         */
        this.name = name;
        /**
         * @property {object} properties Alias for {@link Block} properties.
         */
        this.properties = properties;
        /**
         * @property {Vector3} position Alias for {@link Block} position.
         */
        this.position = position;
        /**
         * @property {bool} isPlaced Set to true if the block is already placed in a build.
         */
        this.isPlaced = isPlaced;
    }

    /**
     * Makes a hard copy of this object.
     * @returns {BlockData} A new instance that represents a clone of this object.
     */
    clone() {
        var properties = {};

        // Hard copy the properties
        for (const key of Object.keys(this.properties)) {
            properties[key] = this.properties[key];
        }

        var position = this.position.clone();

        return new BlockData(this.name, properties, position, this.isPlaced);
    }

    /**
     * Makes a hard copy of a {@link BlockData} object.
     * @param {BlockData} other The other object.
     * @returns {BlockData} A new instance that represents a clone of this object.
     */
    static clone(other) {
        if (other == null) return null;

        var properties = {};

        // Hard copy the properties
        for (const key of Object.keys(other.properties)) {
            properties[key] = other.properties[key];
        }

        const position = new Vector3(other.position.x, other.position.y, other.position.z);

        return new BlockData(other.name, properties, position, other.isPlaced);
    }

    /**
     * Gets the distance from the mbot
     */

    /**
     * Gets the reference block of this block data.
     * @param {Mbot} mbot The instance of Mbot to querry the surrounding blocks.
     * @returns {ReferenceBlock} The reference block or null if none is found.
     */
    getReferenceBlock(mbot) {
        var blockFaces = [
            new Vector3 (0, 0, -1),
            new Vector3 (0, 0, 1),
            new Vector3 (1, 0, 0),
            new Vector3 (-1, 0, 0),
            new Vector3 (0, 1, 0),
            new Vector3 (0, -1, 0)
        ];

        var referenceBlock = null;

        for (const blockFace of blockFaces) {
            const block = mbot.bot.blockAt(this.position.clone().add(blockFace));
            if (block && block.boundingBox == "block") {
                referenceBlock = {
                    "block" : block,
                    "face" : blockFace
                };
                break;
            }
        }

        return referenceBlock;
    }
}

module.exports = BlockData;
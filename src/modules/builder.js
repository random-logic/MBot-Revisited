const Vector3 = require("vec3").Vec3;

const Module = require("./module");
const Utility = require("./utility");

const BlockData = require("./block-data");

const goals = require('mineflayer-pathfinder').goals
const GoalNear = goals.GoalNear
const GoalCompositeAll = goals.GoalCompositeAll
const GoalCompositeAny = goals.GoalCompositeAny
const GoalInvert = goals.GoalInvert
const GoalBlock = goals.GoalBlock
const GoalY = goals.GoalY

/**
 * @class
 * Handles construction.
 */
class Builder extends Module {
    constructor() {
        super("builder", ["mover"]);

        /**
         * @property {object} directionRightOf Keys represent starting direction and values (of type string) represent the result.
         */
        this.directionRightOf = {
            "east": "south",
            "south": "west",
            "west": "north",
            "north": "east"
        };

        /**
         * @property {object} directionLeftOf Keys represent starting direction and values (of type string) represent the result.
         */
        this.directionLeftOf = {
            "east": "north",
            "north": "west",
            "west": "south",
            "south": "east"
        };

        /**
         * @property {object} directionOppositeOf Keys represent starting direction and values (of type string) represent the result.
         */
        this.directionOppositeOf = {
            "east": "west",
            "south": "north",
            "west": "east",
            "north": "south"
        };

        /**
         * @property {object} directionFlipXOf Keys represent starting direction and values (of type string) represent the result.
         */
        this.directionFlipXOf = {
            "east": "east",
            "south": "north",
            "west": "west",
            "north": "south"
        };

        /**
         * @property {object} directionFlipZOf Keys represent starting direction and values (of type string) represent the result.
         */
        this.directionFlipZOf = {
            "east": "west",
            "south": "south",
            "west": "east",
            "north": "north"
        };

        /**
         * @property {object} templateData An object that stores {@link BlockSpace} instances of build designs but not yet planned to be built.
         */
        this.templateData = null;
        
        /**
         * @property {string} templateDataPath The path where the template data is fetched from.
         */
        this.templateDataPath = null;

        /**
         * @property {object} buildData An object that stores {@link BlockSpace} instances of actual builds that are planned to be built.
         */
        this.buildData = null;

        /**
         * @property {string} buildDataPath The path where the build data is fetched from.
         */
        this.buildDataPath = null;
    }

    /**
     * Counts the materials from a {@link BlockSpace}.
     * @param {BlockSpace} blocks The provided BlockSpace.
     * @returns {object} Object with {@link Block} names as keys and {@link number} that represent the count as values.
     */
    countMaterials(blocks) {
        const materials = {};
        
        for (const y of blocks)
          for (const x of y)
            for (const blockData of x) {
                if (!blockData) continue;

                const blockName = blockData["name"];
    
                if (materials[blockName])
                    materials[blockName] += 1;
                else
                    materials[blockName] = 1;
            }
    
        return materials;
    }

    /**
     * Instruction that counts the materials from a {@link BlockSpace} and notifies the user.
     * @param {string | BlockSpace} args The provided BlockSpace. If this is string, it will querry from the buildData.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction. 
     */
    printMaterialCount(args, interrupt = null) {
        if (typeof args === "string")
            args = this.buildData[args];

        if (!args || typeof args !== "object")
            throw new Error("Invalid PrintMaterialCountArgs");

        this.mbot.ui.notify(JSON.stringify(this.countMaterials(args), null, "\t"));
    }

    /**
     * Instruction to load template data.
     * @param {string} args The path to the file.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     * @returns {Promise} Promise that resolves when read file finishes.
     */
    async loadTemplateData(args, interrupt = null) {
        this.templateData = await Utility.readJsonFile(args);
        this.templateDataPath = args;

        // Convert everything to the appropriate class
        for (const key of Object.keys(this.templateData)) {
            for (var y = 0; y < this.templateData[key].length; ++y)
                for (var x = 0; x < this.templateData[key][y].length; ++x)
                    for (var z = 0; z < this.templateData[key][y][x].length; ++z)
                        this.templateData[key][y][x][z] = BlockData.clone(this.templateData[key][y][x][z]);
        }
    }

    /**
     * Instruction to store template data.
     * @param {string} [args = null] The path to the file, only use this if you want to store to a different file.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     * @returns {Promise} Promise that resolves when write file finishes.
     */
    async storeTemplateData(args = null, interrupt = null) {
        if (!args)
            args = this.templateDataPath;

        await Utility.writeJsonFile(args, this.templateData);
    }

    /**
     * Instruction to load build data.
     * @param {string} args The path to the file.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     * @returns {Promise} Promise that resolves when read file finishes.
     */
    async loadBuildData(args, interrupt = null) {
        this.buildData = await Utility.readJsonFile(args);
        this.buildDataPath = args;

        // Convert everything to the appropriate class
        for (const key of Object.keys(this.buildData)) {
            for (var y = 0; y < this.buildData[key].length; ++y)
                for (var x = 0; x < this.buildData[key][y].length; ++x)
                    for (var z = 0; z < this.buildData[key][y][x].length; ++z)
                        this.buildData[key][y][x][z] = BlockData.clone(this.buildData[key][y][x][z]);
        }
    }

    /**
     * Instruction to store build data.
     * @param {string} [args = null] The path to the file, only use this if you want to store to a different file.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     * @returns {Promise} Promise that resolves when write file finishes.
     */
    async storeBuildData(args = null, interrupt = null) {
        if (!args)
            args = this.buildDataPath;

        await Utility.writeJsonFile(args, this.buildData);
    }

    /**
     * @typedef SaveTemplateArgs
     * @summary Object that represents the args for an instruction.
     * @property {string} name The name of the new template.
     * @property {string | Vector3} position1 Acts as a boundary. If string, it will querry the position data in {@link Mover} module.
     * @property {string | Vector3} position2 Acts as a boundary. If string, it will querry the position data in {@link Mover} module.
     * @property {bool} [autoSave = false] Autosaves to file if true.
     */

    /**
     * Instruction to save all blocks in a Minecraft world within the given boundaries as a template.
     * If template name in template data already exists, it will be overwritten.
     * Replaces air blocks with null.
     * @param {SaveTemplateArgs} args The args associated with this instruction.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     */
    async saveTemplate(args, interrupt = null) {
        if (!args || typeof args["name"] !== "string")
            throw new Error("Invalid saveTemplateArgs name");

        if (typeof args["position1"] === "string")
            args["position1"] = this.mbot.modules["mover"].positionData[args["position1"]];
        if (typeof args["position1"] !== "object")
            throw new Error("Invalid SaveTemplateArgs position1");

        if (typeof args["position2"] === "string")
            args["position2"] = this.mbot.modules["mover"].positionData[args["position2"]];
        if (typeof args["position2"] !== "object")
            throw new Error("Invalid SaveTemplateArgs position2");

        var lowerX = Math.min(args["position1"].x, args["position2"].x);
        var lowerY = Math.min(args["position1"].y, args["position2"].y);
        var lowerZ = Math.min(args["position1"].z, args["position2"].z);

        var upperX = Math.max(args["position1"].x, args["position2"].x);
        var upperY = Math.max(args["position1"].y, args["position2"].y);
        var upperZ = Math.max(args["position1"].z, args["position2"].z);

        var newTemplate = [];

        for (var y = lowerY; y <= upperY; ++y) {
            var newTemplateSecondDimension = []; // Allocate second dimension

            for (var x = lowerX; x <= upperX; ++x) {
                var newTemplateThirdDimension = []; // Allocate third dimension

                for (var z = lowerZ; z <= upperZ; ++z) {
                    const position = new Vector3(x, y, z).floor();
                    const block = this.mbot.bot.blockAt(position);

                    if (block.name == "air")
                        newTemplateThirdDimension.push(null);
                    else 
                        newTemplateThirdDimension.push(new BlockData(block.name, block.getProperties(), position, false));
                }

                newTemplateSecondDimension.push(newTemplateThirdDimension);
            }

            newTemplate.push(newTemplateSecondDimension);
        }

        this.templateData[args["name"]] = newTemplate;

        if (args["autoSave"])
            this.storeTemplateData();
    }

    /**
     * @typedef ConvertTemplateToBuildArgs
     * @summary Object that represents the args for an instruction.
     * @property {string} templateName The name of the template.
     * @property {string} buildName The name of the build.
     * @property {string | Vector3} position The position to place the build. If string, it will querry the position data in {@link Mover} module.
     * @property {bool} [autoSave = false] Autosaves to file if true.
     */

    /**
     * Instruction that converts a template to a build. If build exists under buildName in buildData, it will be overwritten.
     * @param {ConvertTemplateToBuildArgs} args The args for this instruction.
     * @param {Interrupt} interrupt Has no effect for this instruction.
     */
    convertTemplateToBuild (args, interrupt) {
        if (!args || typeof args["templateName"] !== "string")
            throw new Error("Invalid ConvertTemplateToBuildArgs templateName");

        if (typeof args["buildName"] !== "string")
            throw new Error("Invalid ConvertTemplateToBuildArgs buildName");

        if (typeof args["position"] === "string")
            args["position"] = this.mbot.modules["mover"].positionData[args["position"]];
        if (typeof args["position"] !== "object")
            throw new Error("Invalid ConvertTemplateToBuildArgs position");

        const template = this.templateData[args["templateName"]];
        if (!template) throw new Error("Template not found");
        
        const position = args["position"];

        // Hard copy template data into the build
        var newBuild = [];

        for (var y = 0; y < template.length; ++y) {
            var newBuildSecondDimension = []; // Allocate second dimension

            for (var x = 0; x < template[y].length; ++x) {
                var newBuildThirdDimension = []; // Allocate third dimension
                
                for (var z = 0; z < template[y][x].length; ++z) {
                    const blockData = BlockData.clone(template[y][x][z]);
                    if (blockData) blockData.position = new Vector3(position.x + x, position.y + y, position.z + z).floored();
                    newBuildThirdDimension.push(blockData);
                }

                newBuildSecondDimension.push(newBuildThirdDimension);
            }

            newBuild.push(newBuildSecondDimension);
        }

        this.buildData[args["buildName"]] = newBuild;

        if (args["autoSave"])
            this.storeBuildData();
    }

    /**
     * @typedef GetClosestBlockData
     * @summary The return object from a method.
     * @property {BlockData} blockData The associated block data with this.
     * @property {number} distance The distance from the {@link bot}.
     * @property {ReferenceBlock} reference The reference block.
     */

    /**
     * Gets the closest block at a y level.
     * @param {BlockSpace} blockSpace The block space to search.
     * @param {number} yLevelConstraint Only search at this y level.
     * @returns {GetClosestBlockData} The {@link BlockData} found, or null if none is found.
     */
    getClosestBlock(blockSpace, yLevelConstraint) {
        var blockArea = blockSpace[yLevelConstraint];

        const botPosition = this.mbot.bot.entity.position;

        var closestBlock = null, blockAtOwnPosition = null;

        for (var x = 0; x < blockArea.length; ++x) {
            for (var z = 0; z < blockArea[x].length; ++z) {
                // Get blockData
                var blockData = blockArea[x][z];

                // We do not want to build a block that is already built
                if (!blockData || blockData.isPlaced)
                    continue;

                // Get additional data
                const blockPosition = blockData.position;
                const distance = botPosition.distanceTo(blockPosition);
                const reference = blockData.getReferenceBlock(this.mbot);

                // We only update the closest block if this block is a solution and if it beats the previous closest block.
                if (!reference || distance >= (closestBlock?.distance ?? Infinity))
                    continue;

                // We prefer the block to not be at the bots position
                const isAtOwnPosition = botPosition.equals(blockPosition);
                if (!isAtOwnPosition) {
                    // If not at own position, then update this to be the closest block
                    closestBlock = {
                        "blockData" : blockData,
                        "distance" : distance,
                        "reference" : reference
                    }
                }
                else {
                    // This is the block at the bots position. We will use this if there is no other solution.
                    blockAtOwnPosition = {
                        "blockData" : blockData,
                        "distance" : distance,
                        "reference" : reference
                    };
                }
            }
        }

        if (!closestBlock && blockAtOwnPosition) {
            closestBlock = blockAtOwnPosition;
        }

        return closestBlock;
    }

    /**
     * @typedef ConstructBlockDataArgs
     * @summary Object that represents the args for a method.
     * @property {BlockData} blockData The given {@link BlockData} to construct.
     * @property {number} distance The distance from the {@link bot}.
     * @property {ReferenceBlock} reference The reference block.
     * @property {bool} [autoSave = false] Autosave buildData after placing the block if true.
     */

    /**
     * Constructs a given {@link BlockData}.
     * @param {ConstructBlockDataArgs} args The args for this method.
     * @param {Interrupt} [interrupt = null] Useful when used with instructions.
     * @returns {Promise} Promise that resolves when complete.
     */
    async constructBlockData(args, interrupt) {        
        // Get blockData
        const blockData = args["blockData"];
        const referenceBlock = args["reference"]["block"];
        const distance = args["distance"];

        // Go to goal
        const heightGoal = new GoalCompositeAny()
        heightGoal.push(new GoalY(blockData.position.y))
        heightGoal.push(new GoalY(blockData.position.y + 1))

        const goals = new GoalCompositeAll()
        //Should not stand in the block where the block has to be placed
        goals.push(new GoalInvert(new GoalBlock(blockData.position.x, blockData.position.y, blockData.position.z)))
        //Stand at block placing level or one block above it
        goals.push(heightGoal)

        //Come really close to the block placing postition if the bot is really far
        if (distance > 4)
            goals.push(new GoalNear(blockData.position.x, blockData.position.y, blockData.position.z, 2))
        //If the bot is closer to the block placing position, then it is within reach
        else //if 0 <= distance <= 4
            goals.push(new GoalNear(blockData.position.x, blockData.position.y, blockData.position.z, 5))

        await this.mbot.modules["mover"].goto(goals, interrupt);

        interrupt?.throwErrorIfHasInterrupt("constructBlockData");

        const equipItem = this.mbot.bot.inventory.items().find(item => item.name == blockData.name)
        if (!equipItem) throw new Error('Could not equip ' + blockData.name)

        await this.mbot.bot.equip(equipItem, "hand");

        interrupt?.throwErrorIfHasInterrupt("constructBlockData");

        await this.mbot.bot.lookAt(referenceBlock.position);

        //interrupt?.throwErrorIfHasInterrupt("constructBlockData");

        // ?? await this.mbot.modules["utility"].waitForPhysicsTicks(2); // Make sure it equips before placing

        interrupt?.throwErrorIfHasInterrupt("constructBlockData");

        await this.mbot.bot.placeBlock(referenceBlock, blockData.position.clone().minus(referenceBlock.position));

        blockData.isPlaced = true;

        if (args["autoSave"])
            await this.storeBuildData();

        interrupt?.throwErrorIfHasInterrupt("constructBlockData");
    }

    /**
     * @typedef ConstructBuildAtYLevelArgs
     * @summary Object that represents the args for an instruction.
     * @property {string | BlockSpace} blockSpace Either the name of the {@link BlockSpace} in buildData or the actual {@link BlockSpace}.
     * @property {number} y The y level to construct.
     * @property {bool} [resetAndApplyMovements = false] Resets and applies movements if true.
     * @property {MovementSettings} [movements = null] Sets the {@link Movements} that the builder should use when moving. It is recommended to disallow the builder to place or break blocks while moving.
     * @property {bool} [autoSave = false] Autosaves if set to true and the blockSpace is of type string.
     */

    /**
     * Instruction that legit constructs a build at a y level.
     * @param {ConstructBuildAtYLevelArgs} args The args for this instruction.
     * @param {Interrupt} interrupt The interrupt instance of this bot.
     * @returns {Promise} Promise that resolves when complete.
     */
    async constructBuildAtYLevel(args, interrupt) {
        if (!args)
            throw new Error("Invalid ConstructBuildAtYLevelArgs");

        if (typeof args["blockSpace"] === "string")
            args["blockSpace"] = buildData[args["blockSpace"]];

        // Either no name alias with buildData or arg passed in is invalid
        if (!args["blockSpace"] || typeof args["blockSpace"] !== "object")
            throw new Error("Invalid ConstructBuildAtYLevelArgs blockSpace");
        
        if (typeof args["y"] !== "number")
            throw new Error("Invalid ConstructBuildAtYLevelArgs y");

        // Reset and apply movements if wanted
        if (args["resetAndApplyMovements"])
            this.mbot.modules["mover"].resetAndApplyMovements(args["movements"]);

        var closestBlock = this.getClosestBlock(args["blockSpace"], args["y"]);

        while (closestBlock) {
            await this.constructBlockData({
                "blockData" : closestBlock["blockData"],
                "distance" : closestBlock["distance"],
                "reference" : closestBlock["reference"],
                "autoSave" : args["autoSave"]
            }, interrupt).catch(e => {
                if (e.toString() != "Error: must be holding an item to place")
                    throw e;
                else
                    this.mbot.ui.log("must be holding an item to place, reattempting");
            });
            closestBlock = this.getClosestBlock(args["blockSpace"], args["y"]);
        }
    }

    /**
     * @typedef ConstructBuildArgs
     * @summary Object that represents the args for an instruction.
     * @property {string | BlockSpace} blockSpace Either the name of the {@link BlockSpace} in buildData or the actual {@link BlockSpace}.
     * @property {bool} [resetAndApplyMovements = false] Resets and applies movements if true.
     * @property {MovementSettings} [movements = null] Sets the {@link Movements} that the builder should use when moving. It is recommended to disallow the builder to place or break blocks while moving.
     * @property {bool} [autoSave = false] Autosaves if set to true and the blockSpace is of type string.
     */

    /**
     * Instruction that legit constructs a build from the bottom y level to the top y level.
     * @param {ConstructBuildArgs} args Either the name of the {@link BlockSpace} in buildData or the actual {@link BlockSpace}.
     * @param {Interrupt} interrupt The interrupt instance of this bot.
     * @returns {Promise} Promise that resolves when complete.
     */
    async constructBuild(args, interrupt) {
        if (!args)
            throw new Error("Invalid ConstructBuildArgs");

        if (typeof args["blockSpace"] === "string")
            args["blockSpace"] = this.buildData[args["blockSpace"]];

        // Either no name alias with buildData or arg passed in is invalid
        if (!args["blockSpace"] || typeof args["blockSpace"] !== "object")
            throw new Error("Invalid ConstructBuildArgs blockSpace");

        // Reset and apply movements if wanted
        if (args["resetAndApplyMovements"])
            this.mbot.modules["mover"].resetAndApplyMovements(args["movements"]);

        for (var y = 0; y < args["blockSpace"].length; ++y) {
            await this.constructBuildAtYLevel({
                "blockSpace" : args["blockSpace"],
                "y" : y,
                "autoSave" : args["autoSave"]
            }, interrupt);
        }
    }

    /**
     * @typedef ConstructBuildsUsingCommandsArgs
     * @summary Object that represents the args for an instruction.
     * @property {string | BlockSpace} blockSpace Either the name of the {@link BlockSpace} in buildData or the actual {@link BlockSpace}.
     * @property {number} [timeout = 10] The timeout between commands in milliseconds.
     * @property {bool} [autoSave = false] Autosaves if set to true and the blockSpace is of type string.
     */

    /**
     * Instruction that constructs a build using vanilla game commands.
     * @param {ConstructBuildsUsingCommandsArgs} args Either the name of the {@link BlockSpace} in buildData or the actual {@link BlockSpace}.
     * @param {Interrupt} interrupt The interrupt instance of this bot.
     * @returns {Promise} Promise that resolves when complete.
     */
    async constructBuildUsingCommands(args, interrupt) {
        if (!args)
            throw new Error("Invalid ConstructBuildsUsingCommandsArgs");

        if (typeof args["blockSpace"] === "string")
            args["blockSpace"] = this.buildData[args["blockSpace"]];

        // Either no name alias with buildData or arg passed in is invalid
        if (!args["blockSpace"] || typeof args["blockSpace"] !== "object")
            throw new Error("Invalid ConstructBuildsUsingCommandsArgs blockSpace");

            // ?? construct build and construct build using commands?
    }

    /**
     * @typedef RotateTemplateRightArgs
     * @property {string | BlockSpace} blockSpace The provided BlockSpace. If this is string, it will querry from the templateData.
     * @property {bool} [autoSave = false] If true, autosaves the templateData after updating it.
     */

    /**
     * Instruction that rotates the given template right.
     * @param {RotateTemplateRightArgs} args The provided BlockSpace. If this is string, it will querry from the templateData.
     * @param {Interrupt} [interrupt = null] Has no effect for this instruction.
     */
    rotateTemplateRight(args, interrupt) {
        var name = null, blockSpace;
        
        if (!args)
            throw new Error("Invalid RotateTemplateRightArgs");
        
        if (typeof args["blockSpace"] === "string") {
            name = args["blockSpace"];
            blockSpace = this.templateData[name];
        }
        else {
            blockSpace = args["blockSpace"];
        }

        if (typeof blockSpace !== "object")
            throw new Error("Invalid RotateTemplateRightArgs blockSpace");

        var newTemplate = [];

        for (var y = 0; y < blockSpace.length; ++y) {
            var oldTemplateArea = blockSpace[y];

            const oldXLen = oldTemplateArea.length;
            const oldZLen = oldTemplateArea[0].length;
            //const newXLen = oldZLen;
            //const newZLen = oldXLen;

            var newTemplateArea = [];

            for (var /*newX = 0,*/ oldZ = 0; /*newX < newXLen &&*/ oldZ < oldZLen; /*++newX,*/ ++oldZ) {
                var newTemplateAreaSecondDimension = [];
                
                for (var /*newZ = 0,*/ oldX = oldXLen - 1; /*newZ < newZLen &&*/ oldX >= 0; /*++newZ,*/ --oldX) {
                    newTemplateAreaSecondDimension.push(oldTemplateArea[oldX][oldZ]);
                }

                newTemplateArea.push(newTemplateAreaSecondDimension);
            }

            newTemplate.push(newTemplateArea);
        }

        if (name) {
            this.templateData[name] = newTemplate;
        }
        else {
            args["blockSpace"] = newTemplate;
        }

        if (name && args["autoSave"])
            this.storeTemplateData();
    }
}

module.exports = Builder;
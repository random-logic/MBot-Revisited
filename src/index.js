/**
 * @typedef Array
 * @summary See [Array]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array}.
 */
/**
 * @typedef Promise
 * @summary See [Promise]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}.
 */
/**
 * @typedef Set
 * @summary See [Set]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set}.
 */
/**
 * @typedef Settings
 * @summary The settings used in the default index.js to instantiate {@link UI} and {@link Mbot}
 * @property {CreateBotArgs} createBot
 * @property {DiscordUISettings} discordUI
 */

const DiscordUI = require("./discord-ui.js");
const Mbot = require("./mbot");

// Custom modules
const Mover = require("./mover");
const Utility = require("./utility");
const Miner = require("./miner");
const Health = require("./health");


var settings, commands, mbot, ui;

async function init() {
    // Load JSON files
    settings = await Utility.readJsonFile("./settings.json");
    commands = await Utility.readJsonFile("./commands.json");

    // Use Discord UI
    ui = new DiscordUI(settings["discordUI"]);

    // Use Minecraft Chat UI
    // ??

    // Create Mbot
    mbot = new Mbot({
        "mover" : new Mover(),
        "utility" : new Utility(),
        "miner" : new Miner(),
        "health" : new Health()
    }, commands, ui);
    mbot.createBot(settings["createBot"]);
}

init().catch(e => console.log(e));
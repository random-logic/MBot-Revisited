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
 * @property {CreateBotArgs} createBot This property will be applied to mineflayer bot.
 * @property {DiscordUISettings} discordUI Use this property only if you are using {@link DiscordUI}.
 */

const DiscordUI = require("./src/ui/discord-ui.js");
const Mbot = require("./src/mbot");

// Custom modules
const Mover = require("./src/modules/mover");
const Utility = require("./src/modules/utility");
const Miner = require("./src/modules/miner");
const Health = require("./src/modules/health");

/**
 * @property {Settings} settings The settings to run Mbot and UI with.
 */
var settings;

var commands, mbot, ui;

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
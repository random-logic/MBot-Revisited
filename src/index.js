const Utility = require("./utility.js");
const Mbot = require("./mbot");

var settings, commands, mbot;

async function init() {
    // Load JSON files
    settings = await Utility.readJsonFile("./login.json");
    commands = await Utility.readJsonFile("./commands.json");
    mbot = new Mbot(settings, commands);
    mbot.createBot({"createInventoryView": true});
}

init().catch(e => console.log(e));
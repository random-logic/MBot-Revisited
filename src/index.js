const Utility = require("./utility.js");
const Mbot = require("./mbot");

var settings, commands, mbot;

async function init() {
    // Load JSON files
    settings = await Utility.readJsonFile("./settings.json");
    commands = await Utility.readJsonFile("./commands.json");
    mbot = new Mbot(settings, commands);
    mbot.createBot({"createInventoryView": true, "inventoryViewOptions": {"port": 3000, "startOnLoad": true}});
}

init().catch(e => console.log(e));
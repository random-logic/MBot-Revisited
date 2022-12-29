// Doesn't work for some reason lol
// Create your bot
const mineflayer = require("mineflayer")
const bot = mineflayer.createBot({
    "host": "localhost",
    "port": "54505",
    "username": "MBot",
    "password": ""
})
let mcData

// Load collect block
bot.loadPlugin(require('mineflayer-collectblock').plugin)

async function collect() {
  // Find a nearby block
  const block = bot.findBlock({
    matching: 749, // id for ancient_debris
    maxDistance: 64
  })

  if (block) {
    // If we found one, collect it.
    try {
      await bot.collectBlock.collect(block)
      collect() // Collect another block
    } catch (err) {
      console.log(err) // Handle errors, if any
    }
  }
}

// On spawn, start collecting all nearby block
bot.once('spawn', () => {
  mcData = require('minecraft-data')(bot.version)
  collect()
})
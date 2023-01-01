/**
 * A quick and easy implementation of the collect block plugin. (Requires mineflayer-pathfinder and mineflayer-collectblock)
 */
const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const collectBlock = require('mineflayer-collectblock').plugin

const bot = mineflayer.createBot({
    "host": "localhost",
    "port": "50795",
    "username": "MBot"
})

// Load pathfinder and collect block plugins
bot.loadPlugin(pathfinder)
bot.loadPlugin(collectBlock)

// Listen for when a player says "collect [something]" in chat
bot.on('chat', (username, message) => {
  const args = message.split(' ')
  if (args[0] !== 'collect') return

  // Get the correct block type
  const blockType = bot.registry.blocksByName[args[1]]
  if (!blockType) {
    bot.chat("I don't know any blocks with that name.")
    return
  }

  bot.chat('Collecting the nearest ' + blockType.name)

  // Try and find that block type in the world
  const block = bot.findBlock({
    matching: blockType.id,
    maxDistance: 64
  })

  if (!block) {
    bot.chat("I don't see that block nearby.")
    return
  }

  // Collect the block if we found one
  bot.collectBlock.collect(block, err => {
    if (err) console.error(err)
  })
})
const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 63217,
  username: 'bot',
  version: '1.18.1' // Its important to set this to the server's minecraft version. Otherwise it might not load data/textures correctly
})

inventoryViewer(bot)
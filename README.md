# MBot-Revisited
- Minecraft bot that uses Mineflayer
- Written in Javascript, most HTML is from auto generated docs

## Install
1. Get Nodejs version 18.12.1 and npm version 8.19.2
2. Clone this repository
3. Go to the repository
4. npm install
5. node index.js

## Functionality in Survival mode
- Mine precious ores
- Build custom buildings or structures
- Move around

## Create Documentation
jsdoc src

## View Documentation
out/index.html

## To do
1. Implement a function to get the bot unstuck when digging block. This can be as simple as giving the bot an expected time to mine and if it fails then have an unstuck function be called.
2. Implement skip function for miner or unstuck function for mover since bot can get stuck when navigating through nether
3. Checkpoints for mover so that pathfinder does not time out if distance is large
4. Implement a better UI using Electron

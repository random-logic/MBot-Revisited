# MBot-Revisited
## Install
1. Get Nodejs version 18.12.1 and npm version 8.19.2
2. Clone this repository
3. Go to the repository
4. npm install

## To do
1. Pass Mbot by reference to all modules (needed since reference to bot changes when creating and deleting bot)
2. Create mover.js
- Have this store the default Movement class that will apply to pathfinder
3. Create health.js
4. Implement skip function for miner
- Also have an array of block positions that already returned timed out so bot doesn't try to go to these again
- We really need this feature because the bot can randomly get stuck
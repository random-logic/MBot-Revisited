# MBot-Revisited
## Install
1. Get Nodejs version 18.12.1 and npm version 8.19.2
2. Clone this repository
3. Go to the repository
4. npm install

## Create Documentation
jsdoc src

## View Documentation
out/index.html

## To do
1. Implement a function to get the bot unstuck when digging block.
2. Allow interrupts while digging
3. Create health.js
4. Refactor methods and let bot collect all items of "ancient_debris" before mining again
5. Implement skip function for miner
- Also have an array of block positions that already returned timed out so bot doesn't try to go to these again
- We really need this feature because the bot can randomly get stuck
6. Miner backtrack function.
7. Sometimes times out, maybe we can increase checkTimeoutInterval (directly on mineflayer bot)?
8. Work on modulating the different modules into different functions.
9. Checkpoints for mover.
# MBot-Revisited
## Install
1. Get Nodejs version 18.12.1 and npm version 8.19.2
2. Clone this repository
3. Go to the repository
4. npm install

## To do
1. Pass Mbot by reference to all modules (needed since reference to bot changes when creating and deleting bot)
2. Bot.dig seems to have problems, sometimes it thinks it's digging the right block when it doesn't
 - Result: Tries to pick up item entity and throws took too long to decide path to goal (which is the item entity), but what's weird is that it also logs "finished command mine"
Log:
 - Moving to mine block at position (-99, 23, -204)
 - Equipping harvesting tool
 - Digging block
 - Finished digging block
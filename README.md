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
1. Implement a function to get the bot unstuck when digging block. This can be as simple as giving the bot an expected time to mine and if it fails then have an unstuck function be called.
2. Implement skip function for miner or unstuck function for mover since bot can get stuck when navigating through nether
3. Checkpoints for mover so that pathfinder does not time out if distance is large
4. https://www.electronjs.org/ = maybe, not sure
- Idea: Have a list of commands in a json file, then have a select menu (dropdown), and then autofill json into a text area. Then add a button to execute the command.
- User can also load preferences at any given time.
- https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_search_menu Drop down menu.
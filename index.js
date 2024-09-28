// Require the necessary modules
const fs = require('node:fs'); // reads the files
const path = require('node:path'); // joins the paths in the file system
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js'); // obvious
const { token } = require('./config.json'); // the token and other sensitive data

// create a new Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// create a new Collection to store the commands
client.commands = new Collection();

// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// ================== Command Handler ==================
// This is the command handler that will load all the commands from the commands folder

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// ================== End Command Handler ==================

// ================== Event Handler ==================
// This is the event handler that will load all the events from the events folder
// This loads the initial events for the bot in "ready.js" and creates a listener for the "interactionCreate" events

// grab the files from the events folder
const eventsPath = path.join(__dirname, "events");
// filter the files to only include .js files
const eventsFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventsFiles) {
    // join the path of the events folder with the file
    const filePath = path.join(eventsPath, file);
    // and require (import) the file
    const event = require(filePath);
    // if the event is triggered only once, use client.once, otherwise use client.on
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// ================== End Event Handler ==================

// login to Discord with the app's token
client.login(token);
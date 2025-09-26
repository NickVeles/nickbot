import { Client, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(process.env.CLIENT_TOKEN!);
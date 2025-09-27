import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// Command imports
import pingCommand from "./commands/utility/ping.js";
import { deployCommands } from "./deploy-commands.js";
import { commands } from "./commands/index.js";

// Load environment variables from .env file
dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag} 🤖`);
});

// Deploy commands
client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

// Execute command on interaction
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

// Login
client.login(process.env.CLIENT_TOKEN!);

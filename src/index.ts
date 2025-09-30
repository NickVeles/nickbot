import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// Command imports
import { deployCommands } from "./deploy-commands.js";
import { commands } from "./commands/index.js";

// Load environment variables from .env file
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag} 🤖`);
  console.log(`Available commands: ${Object.keys(commands).join(", ")}`);

  // Re-sync commands for every guild the bot is already in
  for (const [guildId] of client.guilds.cache) {
    await deployCommands({ guildId });
  }
});

// Guild Create
client.on(Events.GuildCreate, async (guild) => {
  await deployCommands({ guildId: guild.id });
});

// Execute command on interaction
client.on(Events.InteractionCreate, async (interaction) => {
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

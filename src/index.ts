import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// Command imports
import { deployCommands } from "./deploy-commands.js";
import { commands } from "./commands/index.js";

import { registerRolePickerHandler } from "./commands/utility/rolepicker.js";
import {
  addUserXP,
  getRandomXP,
  isOnCooldown,
  setCooldown,
} from "./utils/leveling.js";

// Load environment variables from .env file
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag} 🤖`);
  console.log(`Available commands: ${Object.keys(commands).join(", ")}`);

  // Re-sync commands for every guild the bot is already in
  for (const [guildId] of client.guilds.cache) {
    await deployCommands({ guildId });
  }

  // Register persistent interaction handlers
  registerRolePickerHandler(client);
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

// Message XP handler
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages and DMs
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  // Check cooldown
  if (isOnCooldown(userId, guildId)) return;

  // Award XP
  const xpGained = getRandomXP();
  const result = addUserXP(userId, guildId, xpGained);

  // Set cooldown
  setCooldown(userId, guildId);

  // Send level up message if leveled up
  if (result.leveledUp) {
    try {
      await message.reply({
        content: `Congratulations ${message.author}! You've reached level **${result.newLevel}**!`,
        allowedMentions: { users: [] },
        flags: [4096], // Ephemeral flag
      });
    } catch (error) {
      // Silent fail if we can't send the message
      console.error("Failed to send level up message:", error);
    }
  }
});

// Login
client.login(process.env.CLIENT_TOKEN!);

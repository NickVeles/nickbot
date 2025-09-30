import { SlashCommandBuilder, CommandInteraction } from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

// Execute
export const execute = async (interaction: CommandInteraction) => {
  await interaction.reply("Pong!");
};

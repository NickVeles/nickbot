import { SlashCommandBuilder, CommandInteraction } from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

// Execute
export async function execute(interaction: CommandInteraction) {
  await interaction.reply("Pong!");
}

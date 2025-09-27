import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import Command from "../../types/command";

// Command
const command = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

// Execute
const execute = async (interaction: CommandInteraction) => {
  await interaction.reply("Pong!");
};

export default { data: command, execute } as Command;

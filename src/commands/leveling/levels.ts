import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import { LEVELS } from "../../utils/leveling.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("levels")
  .setDescription(
    "Shows all available levels and the total XP required for each"
  );

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  // Create embed
  const embed = new EmbedBuilder()
    .setTitle("Level Requirements")
    .setDescription(
      "Here are all the levels and the total XP required to reach them:"
    )
    .setColor(0x5865f2);

  // Add level information
  let description = "";
  for (const levelData of LEVELS) {
    description += `**Level ${
      levelData.level
    }:** ${levelData.totalXP.toLocaleString()} XP\n`;
  }

  embed.setDescription(description);

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

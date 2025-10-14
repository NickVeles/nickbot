import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import { getTopUsers } from "../../utils/leveling.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Shows the top 10 members with the highest levels")
  .addBooleanOption((option) =>
    option
      .setName("public")
      .setDescription("Whether to make the leaderboard public for everyone to see (default: false)")
      .setRequired(false));

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: "This command can only be used in a server!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const isPublic = interaction.options.getBoolean("public") ?? false;
  const topUsers = getTopUsers(interaction.guild.id, 10);

  if (topUsers.length === 0) {
    await interaction.reply({
      content: "No one has earned any XP yet!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`${interaction.guild.name} Leaderboard`)
    .setDescription("Top 10 members by level and XP")
    .setColor(0x5865f2);

  // Add leaderboard entries
  let description = "";
  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const rank = i + 1;
    const medal =
      rank === 1
        ? "🥇"
        : rank === 2
        ? "🥈"
        : rank === 3
        ? "🥉"
        : `**${rank}.**`;

    description += `${medal} <@${user.userId}> - Level **${
      user.level
    }** (${user.xp.toLocaleString()} XP)\n`;
  }

  embed.setDescription(description);

  await interaction.reply({
    embeds: [embed],
    flags: isPublic ? undefined : MessageFlags.Ephemeral,
  });
}

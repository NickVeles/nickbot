import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import {
  getUserXP,
  getLevelFromXP,
  getXPForNextLevel,
} from "../../utils/leveling.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("level")
  .setDescription("Check your level or another user's level")
  .addUserOption((option) =>
    option
      .setName("member")
      .setDescription("The member to check (leave empty for yourself)")
      .setRequired(false)
  );

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: "This command can only be used in a server!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const targetUser = interaction.options.getUser("member") ?? interaction.user;
  const currentXP = getUserXP(targetUser.id, interaction.guild.id);
  const currentLevel = getLevelFromXP(currentXP);
  const nextLevelInfo = getXPForNextLevel(currentXP);

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`${targetUser.username}'s Level`)
    .setThumbnail(targetUser.displayAvatarURL())
    .setColor(0x5865f2)
    .addFields(
      { name: "Current Level", value: `${currentLevel}`, inline: true },
      { name: "Total XP", value: `${currentXP.toLocaleString()}`, inline: true }
    );

  if (nextLevelInfo) {
    embed.addFields(
      { name: "Next Level", value: `${nextLevelInfo.nextLevel}`, inline: true },
      {
        name: "XP Needed for Next Level",
        value: `${nextLevelInfo.xpNeeded.toLocaleString()} XP (${nextLevelInfo.xpForNext.toLocaleString()} total)`,
        inline: false,
      }
    );

    // Calculate progress percentage
    const xpIntoLevel =
      currentXP -
      (nextLevelInfo.xpForNext - nextLevelInfo.xpNeeded - currentXP);
    const xpForLevel =
      nextLevelInfo.xpForNext -
      (nextLevelInfo.xpForNext - nextLevelInfo.xpNeeded);
    const progressPercent = Math.floor(
      (currentXP / nextLevelInfo.xpForNext) * 100
    );

    // Create a simple progress bar
    const progressBarLength = 20;
    const filledLength = Math.floor(
      (progressPercent / 100) * progressBarLength
    );
    const progressBar =
      "█".repeat(filledLength) + "░".repeat(progressBarLength - filledLength);

    embed.addFields({
      name: "Progress to Next Level",
      value: `${progressBar} ${progressPercent}%`,
      inline: false,
    });
  } else {
    embed.addFields({
      name: "Status",
      value: "**MAX LEVEL REACHED!**",
      inline: false,
    });
  }

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("banner")
  .setDescription("Displays the banner of a user")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user whose banner to display")
      .setRequired(false)
  );

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  // Get the target user (provided user or command author)
  const targetUser = interaction.options.getUser("user") || interaction.user;

  // Fetch the full user data to access banner information
  const fetchedUser = await targetUser.fetch();

  // Check if user has a banner
  if (!fetchedUser.banner) {
    await interaction.reply({
      content: `${targetUser.username} does not have a custom banner.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Get banner URL with high quality
  const bannerURL = fetchedUser.bannerURL({ size: 4096, extension: "png" });

  // Create an embed to display the banner
  const embed = new EmbedBuilder()
    .setTitle(`${targetUser.username}'s Banner`)
    .setImage(bannerURL!)
    .setColor(fetchedUser.accentColor || 0x5865f2)
    .setFooter({ text: `User ID: ${targetUser.id}` });

  // Reply with the embed
  await interaction.reply({ embeds: [embed] });
}

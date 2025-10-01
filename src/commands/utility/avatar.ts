import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("Displays the avatar of a user")
  .addUserOption(option =>
    option
      .setName("user")
      .setDescription("The user whose avatar to display")
      .setRequired(false)
  );

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  // Get the target user (provided user or command author)
  const targetUser = interaction.options.getUser("user") || interaction.user;
  
  // Get avatar URL with different sizes
  const avatarURL = targetUser.displayAvatarURL({ size: 4096, extension: "png" });
  
  // Create an embed to display the avatar
  const embed = new EmbedBuilder()
    .setTitle(`${targetUser.username}'s Avatar`)
    .setImage(avatarURL)
    .setColor(0x5865F2)
    .setFooter({ text: `User ID: ${targetUser.id}` });
  
  // Reply with the embed
  await interaction.reply({ embeds: [embed] });
}
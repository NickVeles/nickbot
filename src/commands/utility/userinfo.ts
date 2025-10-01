import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("Displays information about a user")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to get information about")
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers); // mod required

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  // Get the target user (defaults to command caller if not specified)
  const targetUser = interaction.options.getUser("user") || interaction.user;

  // Get the member object if in a guild
  const member = interaction.guild?.members.cache.get(targetUser.id);

  // Create embed with user information
  const embed = new EmbedBuilder()
    .setColor(member?.displayHexColor || "#5865F2")
    .setTitle(`User Information - ${targetUser.tag}`)
    .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: "👤 Username",
        value: targetUser.username,
        inline: true,
      },
      {
        name: "🏷️ Display Name",
        value: targetUser.displayName,
        inline: true,
      },
      {
        name: "🆔 User ID",
        value: targetUser.id,
        inline: true,
      },
      {
        name: "🤖 Bot",
        value: targetUser.bot ? "Yes" : "No",
        inline: true,
      },
      {
        name: "📅 Account Created",
        value: `<t:${Math.floor(
          targetUser.createdTimestamp / 1000
        )}:F>\n(<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`,
        inline: false,
      }
    );

  // Add server-specific information if in a guild
  if (member) {
    const roles = member.roles.cache
      .filter((role) => role.id !== interaction.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map((role) => role.toString())
      .slice(0, 20);

    embed.addFields(
      {
        name: "📥 Joined Server",
        value: member.joinedAt
          ? `<t:${Math.floor(
              member.joinedTimestamp! / 1000
            )}:F>\n(<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>)`
          : "Unknown",
        inline: false,
      },
      {
        name: "🎨 Nickname",
        value: member.nickname || "None",
        inline: true,
      },
      {
        name: `🎭 Roles [${roles.length}]`,
        value: roles.length > 0 ? roles.join(", ") : "None",
        inline: false,
      }
    );

    // Add boost information if applicable
    if (member.premiumSince) {
      embed.addFields({
        name: "💎 Boosting Since",
        value: `<t:${Math.floor(
          member.premiumSinceTimestamp! / 1000
        )}:F>\n(<t:${Math.floor(member.premiumSinceTimestamp! / 1000)}:R>)`,
        inline: false,
      });
    }

    // Add timeout information if applicable
    if (member.communicationDisabledUntil) {
      embed.addFields({
        name: "⏰ Timed Out Until",
        value: `<t:${Math.floor(
          member.communicationDisabledUntilTimestamp! / 1000
        )}:F>`,
        inline: false,
      });
    }
  }

  // Add avatar URL
  embed.addFields({
    name: "🖼️ Avatar",
    value: `[Click here](${targetUser.displayAvatarURL({ size: 4096 })})`,
    inline: true,
  });

  // Set footer
  embed.setFooter({
    text: `Requested by ${interaction.user.tag}`,
    iconURL: interaction.user.displayAvatarURL(),
  });

  embed.setTimestamp();

  // Send the embed
  await interaction.reply({ embeds: [embed] });
}

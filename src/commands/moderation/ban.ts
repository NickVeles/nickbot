import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  Colors,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a user from the server")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to ban").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Reason for banning (optional)")
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName("purge")
      .setDescription("Delete all messages from this user (default: false)")
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", false) || undefined;
  const purge = interaction.options.getBoolean("purge", false) ?? false;

  // Check if user is trying to ban themselves
  if (user.id === interaction.user.id) {
    await interaction.reply({
      content: "You cannot ban yourself.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check if user is trying to ban the bot
  if (user.id === interaction.client.user!.id) {
    await interaction.reply({
      content: "I cannot ban myself.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check bot permissions
  if (
    !interaction.guild?.members.me?.permissions.has(
      PermissionFlagsBits.BanMembers
    )
  ) {
    await interaction.reply({
      content: "I don't have permission to ban members in this server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Send DM to user with embed
    try {
      const dmChannel = await user.createDM();
      const banEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(
          `# ⛔ You have been banned!\nYou have been banned from **${
            interaction.guild!.name
          }**`
        )
        .addFields(
          {
            name: "❓ Reason",
            value: reason ? `- ${reason}` : "- No reason provided",
            inline: false,
          },
          {
            name: "🔥 Messages Purged",
            value: purge ? "- Yes (last 7 days)" : "- No",
            inline: false,
          }
        )
        .setFooter({
          text: `If you believe this is a mistake, please contact the server administrators \~ owner: <@${
            interaction.guild!.ownerId
          }>`,
        })
        .setTimestamp();

      await dmChannel.send({ embeds: [banEmbed] });
    } catch (err) {
      console.warn(`Could not send DM to <@${user.id}>:`, err);
      // Continue with ban even if DM fails
    }

    // Delete user's messages if purge is enabled
    if (purge) {
      const banOptions: { deleteMessageSeconds?: number } = {};
      banOptions.deleteMessageSeconds = 604800; // 7 days

      await interaction.guild!.members.ban(user, {
        reason: reason || "No reason provided",
        deleteMessageSeconds: banOptions.deleteMessageSeconds,
      });
    } else {
      await interaction.guild!.members.ban(user, {
        reason: reason || "No reason provided",
      });
    }

    const responseMessage = `Successfully banned <@${user.id}>${
      reason ? ` for: ${reason}` : ""
    }${purge ? " (messages purged)" : ""}`;

    await interaction.editReply({
      content: responseMessage,
    });
  } catch (err) {
    console.error("Error banning user:", err);
    await interaction.editReply({
      content: "An error occurred while trying to ban the user.",
    });
  }
}

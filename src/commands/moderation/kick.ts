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
  .setName("kick")
  .setDescription("Kick a user from the server")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to kick").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Reason for kicking (optional)")
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", false) || undefined;

  // Check if user is trying to kick themselves
  if (user.id === interaction.user.id) {
    await interaction.reply({
      content: "You cannot kick yourself.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check if user is trying to kick the bot
  if (user.id === interaction.client.user!.id) {
    await interaction.reply({
      content: "I cannot kick myself.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Get the member object
  const member = await interaction
    .guild!.members.fetch(user.id)
    .catch(() => null);

  if (!member) {
    await interaction.reply({
      content: "That user is not a member of this server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check bot permissions
  if (
    !interaction.guild?.members.me?.permissions.has(
      PermissionFlagsBits.KickMembers
    )
  ) {
    await interaction.reply({
      content: "I don't have permission to kick members from this server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Send DM to user with embed
    try {
      const dmChannel = await user.createDM();
      const kickEmbed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setDescription(
          `# ⚠️ You have been kicked!\nYou have been kicked from **${
            interaction.guild!.name
          }**`
        )
        .addFields({
          name: "❓ Reason",
          value: reason ? `- ${reason}` : "- No reason provided",
          inline: false,
        })
        .setFooter({
          text: `You can rejoin the server if it is public. If you believe this is a mistake, please contact the server administrators \~ owner: <@${
            interaction.guild!.ownerId
          }>`,
        })
        .setTimestamp();

      await dmChannel.send({ embeds: [kickEmbed] });
    } catch (err) {
      console.warn(`Could not send DM to <@${user.id}>:`, err);
      // Continue with kick even if DM fails
    }

    // Kick the user
    await member.kick(reason || "No reason provided");

    const responseMessage = `Successfully kicked <@${user.id}>${
      reason ? ` for: ${reason}` : ""
    }`;

    await interaction.editReply({
      content: responseMessage,
    });
  } catch (err) {
    console.error("Error kicking user:", err);
    await interaction.editReply({
      content: "An error occurred while trying to kick the user.",
    });
  }
}

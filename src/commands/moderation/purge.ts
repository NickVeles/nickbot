import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  TextChannel,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription("Delete a specified number of messages")
  .addIntegerOption((option) =>
    option
      .setName("number")
      .setDescription("Number of messages to delete (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const amount = interaction.options.getInteger("number", true);
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: "This command can only be used in text channels.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check bot permissions
  if (
    !channel
      .permissionsFor(interaction.client.user!)
      ?.has(PermissionFlagsBits.ManageMessages)
  ) {
    await interaction.reply({
      content: "I don't have permission to manage messages in this channel.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Fetch and delete messages
    const messages = await channel.messages.fetch({ limit: amount });
    const deleted = await channel.bulkDelete(messages, true);

    await interaction.editReply({
      content: `Successfully deleted ${deleted.size} message(s).`,
    });

    // Auto-delete confirmation after 5 seconds
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (err) {
        // Reply might already be deleted
      }
    }, 5000);
  } catch (err) {
    console.error("Error purging messages:", err);
    await interaction.editReply({
      content:
        "An error occurred while trying to delete messages. Messages older than 14 days cannot be bulk deleted.",
    });
  }
}

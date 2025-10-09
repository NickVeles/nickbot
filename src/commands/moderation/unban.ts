import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("unban")
  .setDescription("Unban a user from the server")
  .addStringOption((option) =>
    option
      .setName("user")
      .setDescription("The user ID or username of the banned user")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const userInput = interaction.options.getString("user", true);

  // Check bot permissions
  if (
    !interaction.guild?.members.me?.permissions.has(
      PermissionFlagsBits.BanMembers
    )
  ) {
    await interaction.reply({
      content: "I don't have permission to manage bans in this server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Fetch the ban list
    const bans = await interaction.guild!.bans.fetch();

    // Try to find the user in the ban list
    const bannedUser = bans.find((ban) => {
      const normalizedInput = userInput.toLowerCase();
      const mention = `<@${ban.user.id}>`;
      const id = ban.user.id;
      const username = ban.user.username.toLowerCase();
      const tag = ban.user.tag.toLowerCase();

      return (
        userInput === mention ||
        userInput === id ||
        normalizedInput === username ||
        normalizedInput === tag
      );
    });

    // If user not found in ban list
    if (!bannedUser) {
      await interaction.editReply({
        content: `Could not find a ban for **${userInput}**. Make sure the user is actually banned.`,
      });
      return;
    }

    // Unban the user
    await interaction.guild!.bans.remove(
      bannedUser.user.id,
      `Unbanned by ${interaction.user.tag}`
    );

    await interaction.editReply({
      content: `Successfully unbanned <@${bannedUser.user.id}>.`,
    });
  } catch (err) {
    console.error("Error unbanning user:", err);
    await interaction.editReply({
      content: "An error occurred while trying to unban the user.",
    });
  }
}

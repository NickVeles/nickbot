import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  Role,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("rolecount")
  .setDescription("Check the count of server members with a given role")
  .addRoleOption((option) =>
    option
      .setName("role")
      .setDescription("The role to count members for")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const role = interaction.options.getRole("role") as Role;

    if (!role) {
      await interaction.reply({
        content: "❌ Invalid role provided.",
        ephemeral: true,
      });
      return;
    }

    // Defer reply in case fetching members takes time
    await interaction.deferReply();

    // Fetch all guild members to ensure we have up-to-date data
    await interaction.guild?.members.fetch();

    // Count members with the role
    const memberCount = role.members.size;

    // Create response embed
    const response = {
      embeds: [
        {
          color: role.colors.primaryColor || 0x5865f2,
          title: "📊 Role Member Count",
          fields: [
            {
              name: "Role",
              value: `${role}`,
              inline: true,
            },
            {
              name: "Member Count",
              value: `**${memberCount}** member${memberCount !== 1 ? "s" : ""}`,
              inline: true,
            },
          ],
          footer: {
            text: `Role ID: ${role.id}`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await interaction.editReply(response);
  } catch (error) {
    console.error("Error executing rolecount command:", error);

    const errorMessage = {
      content: "❌ An error occurred while counting role members.",
      ephemeral: true,
    };

    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

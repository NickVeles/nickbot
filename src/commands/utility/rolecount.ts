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
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers); // mod required

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const role = interaction.options.getRole("role") as Role | null;

    // Defer reply in case fetching members takes time
    await interaction.deferReply();

    // Fetch all guild members to ensure we have up-to-date data
    await interaction.guild?.members.fetch();

    const totalMembers = interaction.guild?.memberCount || 0;

    // If no role specified, list all roles
    if (!role) {
      const roles = interaction.guild?.roles.cache
        .filter((r) => r.id !== interaction.guild?.id) // Exclude @everyone role
        .sort((a, b) => b.position - a.position) // Sort by position
        .map((r) => ({
          role: r,
          count: r.members.size,
        }));

      if (!roles || roles.length === 0) {
        await interaction.editReply({
          content: "❌ No roles found in this server.",
        });
        return;
      }

      // Create fields for roles (max 25 fields per embed)
      const roleFields = roles.slice(0, 25).map((r) => ({
        name: r.role.name,
        value: `${r.count} member${r.count !== 1 ? "s" : ""}`,
        inline: true,
      }));

      const response = {
        embeds: [
          {
            color: 0x5865f2,
            title: "📊 Server Role Count",
            description: `**Total Members:** ${totalMembers}`,
            fields: roleFields,
            footer: {
              text: `Showing ${roleFields.length} of ${roles.length} roles`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await interaction.editReply(response);
      return;
    }

    // Count members with the specified role
    const memberCount = role.members.size;

    // Create response embed for specific role
    const response = {
      embeds: [
        {
          color: role.colors.primaryColor || 0x5865f2,
          title: "📊 Role Member Count",
          description: `**Total Server Members:** ${totalMembers}`,
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
            {
              name: "Percentage",
              value: `**${((memberCount / totalMembers) * 100).toFixed(1)}%**`,
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
    };

    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply({ ...errorMessage, ephemeral: true });
    }
  }
}

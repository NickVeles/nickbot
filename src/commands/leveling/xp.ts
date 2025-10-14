import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from "discord.js";
import {
  addUserXP,
  removeUserXP,
  resetUserXP,
  resetGuildXP,
} from "../../utils/leveling.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("xp")
  .setDescription("Manage user XP")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add XP to a user")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("The member to add XP to")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("The amount of XP to add")
          .setRequired(true)
          .setMinValue(1)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Remove XP from a user")
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("The member to remove XP from")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("The amount of XP to remove")
          .setRequired(true)
          .setMinValue(1)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset")
      .setDescription("Reset XP for a user or entire server")
      .addStringOption((option) =>
        option
          .setName("target")
          .setDescription("What to reset (user or server)")
          .setRequired(true)
          .addChoices(
            { name: "User", value: "user" },
            { name: "Server", value: "server" }
          )
      )
      .addUserOption((option) =>
        option
          .setName("member")
          .setDescription("The member to reset (required if target is 'user')")
          .setRequired(false)
      )
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

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "add") {
    const member = interaction.options.getUser("member", true);
    const amount = interaction.options.getInteger("amount", true);

    const result = addUserXP(member.id, interaction.guild.id, amount);

    await interaction.reply({
      content: `Added **${amount} XP** to ${member}. They now have **${result.newXP} XP** (Level ${result.newLevel}).`,
      flags: MessageFlags.Ephemeral,
    });
  } else if (subcommand === "remove") {
    const member = interaction.options.getUser("member", true);
    const amount = interaction.options.getInteger("amount", true);

    const newXP = removeUserXP(member.id, interaction.guild.id, amount);

    await interaction.reply({
      content: `Removed **${amount} XP** from ${member}. They now have **${newXP} XP**.`,
      flags: MessageFlags.Ephemeral,
    });
  } else if (subcommand === "reset") {
    const target = interaction.options.getString("target", true);

    if (target === "user") {
      const member = interaction.options.getUser("member");

      if (!member) {
        await interaction.reply({
          content: "You must specify a member when resetting user XP!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      resetUserXP(member.id, interaction.guild.id);

      await interaction.reply({
        content: `Reset XP for ${member} to 0.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (target === "server") {
      // Create confirmation button
      const confirmButton = new ButtonBuilder()
        .setCustomId("confirm_reset_xp")
        .setLabel("Confirm Reset")
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId("cancel_reset_xp")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        confirmButton,
        cancelButton
      );

      const response = await interaction.reply({
        content:
          "Are you sure you want to reset XP for **all users** in this server? This action cannot be undone!",
        components: [row],
        flags: MessageFlags.Ephemeral,
      });

      // Wait for button interaction
      try {
        const confirmation = await response.awaitMessageComponent({
          filter: (i) => i.user.id === interaction.user.id,
          componentType: ComponentType.Button,
          time: 30000, // 30 seconds
        });

        if (confirmation.customId === "confirm_reset_xp") {
          const deletedCount = resetGuildXP(interaction.guild.id);

          await confirmation.update({
            content: `Successfully reset XP for all users in this server. (${deletedCount} records deleted)`,
            components: [],
          });
        } else {
          await confirmation.update({
            content: "Server XP reset cancelled.",
            components: [],
          });
        }
      } catch (error) {
        // Timeout
        await interaction.editReply({
          content: "Confirmation timed out. Server XP reset cancelled.",
          components: [],
        });
      }
    }
  }
}

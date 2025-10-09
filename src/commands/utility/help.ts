import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Lists all available commands");

// Execute
export async function execute(interaction: CommandInteraction) {
  try {
    // Fetch commands from Discord API
    const commands = interaction.guild
      ? await interaction.guild.commands.fetch()
      : await interaction.client.application?.commands.fetch();

    if (!commands || commands.size === 0) {
      await interaction.reply({
        content: "No commands are currently available.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Create an embed to display all commands
    const embed = new EmbedBuilder()
      .setTitle("Bot Commands")
      .setDescription("Here are all available commands:")
      .setColor(0x5865f2)
      .setTimestamp();

    // Add each command as a field
    commands
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((cmd) => {
        embed.addFields({
          name: `\`/${cmd.name}\``,
          value: cmd.description || "No description provided",
          inline: false,
        });
      });

    // Reply with the embed
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error("Error fetching commands:", error);
    await interaction.reply({
      content: "An error occurred while fetching commands.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

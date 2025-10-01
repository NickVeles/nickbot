import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

function rollDice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getColor(result: number, min: number, max: number): number {
  const percentage = (result - min) / (max - min);

  if (percentage <= 0.25) return 0xff0000; // Red - low roll
  if (percentage <= 0.5) return 0xff8800; // Orange - below average
  if (percentage <= 0.75) return 0xffff00; // Yellow - above average
  return 0x00ff00; // Green - high roll
}

// Command
export const data = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Roll a dice")
  .addIntegerOption((option) =>
    option
      .setName("max")
      .setDescription("Maximum number to roll (default: 6)")
      .setRequired(false)
      .setMinValue(2)
      .setMaxValue(1000000)
  )
  .addIntegerOption((option) =>
    option
      .setName("min")
      .setDescription("Minimum number to roll (default: 1)")
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(999999)
  );

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const maxNumber = interaction.options.getInteger("max") ?? 6;
  const minNumber = interaction.options.getInteger("min") ?? 1;

  // Validate that min is less than max
  if (minNumber >= maxNumber) {
    await interaction.reply({
      content: "❌ Minimum must be less than maximum!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const result = rollDice(minNumber, maxNumber);
  const color = getColor(result, minNumber, maxNumber);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🎲 Dice Roll`)
    .setDescription(`<@${interaction.user.id}> rolls...\n# ${result}`)
    .setFooter({ text: `Values ${minNumber}-${maxNumber}` });

  await interaction.reply({ embeds: [embed] });
}

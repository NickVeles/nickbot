import {
  SlashCommandBuilder,
  CommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong! and latency info")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers); // mod required

// Execute
export async function execute(interaction: CommandInteraction) {
  // Send initial reply
  await interaction.reply({
    content: "Pinging...",
    flags: MessageFlags.Ephemeral,
  });

  // Fetch the reply message
  const sent = await interaction.fetchReply();

  // Calculate latencies
  const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);

  // Edit reply with latency information
  await interaction.editReply(
    `🏓 Pong!\n` +
      `Bot Latency: ${botLatency}ms\n` +
      `API Latency: ${apiLatency}ms`
  );
}

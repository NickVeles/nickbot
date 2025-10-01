import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  TextChannel,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("welcome")
  .setDescription("Send a welcome message to the server")
  .addChannelOption((option) =>
    option
      .setName("channel1")
      .setDescription("First recommended text channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addChannelOption((option) =>
    option
      .setName("channel2")
      .setDescription("Second recommended text channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addChannelOption((option) =>
    option
      .setName("channel3")
      .setDescription("Third recommended text channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addChannelOption((option) =>
    option
      .setName("channel4")
      .setDescription("Fourth recommended text channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addChannelOption((option) =>
    option
      .setName("channel5")
      .setDescription("Fifth recommended text channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator); // admmin required

export async function execute(interaction: ChatInputCommandInteraction) {
  // Collect all provided channels with type checking
  const channels: TextChannel[] = [];
  for (let i = 1; i <= 5; i++) {
    const channel = interaction.options.getChannel(`channel${i}`);

    if (channel) {
      // Validate that the channel is a text channel
      if (
        channel.type !== ChannelType.GuildText ||
        !(channel instanceof TextChannel)
      ) {
        await interaction.reply({
          content: `❌ The channel ${channel} is not a text channel. Please select a valid text channel.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      channels.push(channel as TextChannel);
    }
  }

  // Create the embed
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setDescription(
      `# 🎉 Welcome to ${interaction.guild?.name ?? "the server"}!\n` +
      `Hey there! We're so glad you're here! 👋\n\n` +
        `Feel free to explore, chat with everyone, and have a great time!`
    )
    .setTimestamp();

  // Add channel recommendations if any channels were provided
  if (channels.length > 0) {
    const channelMentions = channels
      .map((ch) => `- <#${ch.id}>${ch.topic ? ` - ${ch.topic}` : ""}`)
      .join("\n");
    embed.addFields({
      name: "\nYou might wanna visit some of these channels at first!",
      value: channelMentions,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

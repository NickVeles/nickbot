import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  GuildVerificationLevel,
  GuildExplicitContentFilter,
  GuildNSFWLevel,
  PermissionFlagsBits,
} from "discord.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("serverinfo")
  .setDescription("Displays information about the current server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers); // mod required

// Execute
export async function execute(interaction: CommandInteraction) {
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({
      content: "This command can only be used in a server!",
      ephemeral: true,
    });
    return;
  }

  // Fetch complete guild data
  await guild.fetch();

  // Get verification level name
  const verificationLevels = {
    [GuildVerificationLevel.None]: "None",
    [GuildVerificationLevel.Low]: "Low",
    [GuildVerificationLevel.Medium]: "Medium",
    [GuildVerificationLevel.High]: "High",
    [GuildVerificationLevel.VeryHigh]: "Very High",
  };

  // Get content filter level
  const contentFilterLevels = {
    [GuildExplicitContentFilter.Disabled]: "Disabled",
    [GuildExplicitContentFilter.MembersWithoutRoles]: "Members without roles",
    [GuildExplicitContentFilter.AllMembers]: "All members",
  };

  // Get NSFW level
  const nsfwLevels = {
    [GuildNSFWLevel.Default]: "Default",
    [GuildNSFWLevel.Explicit]: "Explicit",
    [GuildNSFWLevel.Safe]: "Safe",
    [GuildNSFWLevel.AgeRestricted]: "Age Restricted",
  };

  // Count channels by type
  const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
  const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;
  const categories = guild.channels.cache.filter((c) => c.type === 4).size;

  // Get member statistics
  const members = guild.members.cache;
  const botCount = members.filter((m) => m.user.bot).size;
  const humanCount = guild.memberCount - botCount;

  // Get boost information
  const boostTier = guild.premiumTier;
  const boostCount = guild.premiumSubscriptionCount || 0;

  // Create embed
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle(`${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .addFields(
      {
        name: "🆔 Server ID",
        value: guild.id,
        inline: true,
      },
      {
        name: "👑 Owner",
        value: `<@${guild.ownerId}>`,
        inline: true,
      },
      {
        name: "📅 Created",
        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`,
        inline: false,
      },
      {
        name: `👥 Members [${guild.memberCount}]`,
        value: `👤 Humans: ${humanCount}\n🤖 Bots: ${botCount}`,
        inline: true,
      },
      {
        name: `📁 Channels [${guild.channels.cache.size}]`,
        value: `💬 Text: ${textChannels}\n🔊 Voice: ${voiceChannels}\n📂 Categories: ${categories}`,
        inline: true,
      },
      {
        name: `🎭 Roles`,
        value: `${guild.roles.cache.size}`,
        inline: true,
      },
      {
        name: `😊 Emojis`,
        value: `${guild.emojis.cache.size}`,
        inline: true,
      },
      {
        name: `🎨 Stickers`,
        value: `${guild.stickers.cache.size}`,
        inline: true,
      },
      {
        name: "💎 Boost Status",
        value: `Level: ${boostTier}\nBoosts: ${boostCount}`,
        inline: true,
      },
      {
        name: "🛡️ Verification Level",
        value: verificationLevels[guild.verificationLevel],
        inline: true,
      },
      {
        name: "🔞 Content Filter",
        value: contentFilterLevels[guild.explicitContentFilter],
        inline: true,
      },
      {
        name: "📊 NSFW Level",
        value: nsfwLevels[guild.nsfwLevel],
        inline: true,
      }
    );

  // Add server banner if exists
  if (guild.bannerURL()) {
    embed.addFields({
      name: "🖼️ Banner",
      value: `[Click here](${guild.bannerURL({ size: 4096 })})`,
      inline: true,
    });
    embed.setImage(guild.bannerURL({ size: 1024 })!);
  }

  // Add server icon link
  if (guild.iconURL()) {
    embed.addFields({
      name: "🎨 Server Icon",
      value: `[Click here](${guild.iconURL({ size: 4096 })})`,
      inline: true,
    });
  }

  // Add description if exists
  if (guild.description) {
    embed.setDescription(guild.description);
  }

  // Add features if any
  if (guild.features.length > 0) {
    const features = guild.features
      .map((f) => f.replace(/_/g, " ").toLowerCase())
      .map((f) => f.charAt(0).toUpperCase() + f.slice(1))
      .join(", ");
    
    embed.addFields({
      name: "✨ Server Features",
      value: features,
      inline: false,
    });
  }

  embed.setFooter({
    text: `Requested by ${interaction.user.tag}`,
    iconURL: interaction.user.displayAvatarURL(),
  });

  embed.setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
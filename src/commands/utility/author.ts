import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

const authorConfig = {
  name: "Nick Veles",
  avatar: "https://github.com/nickveles.png",
  website: "https://nickveles.com",
  form: "https://nickveles.com/contact",
  github: "https://github.com/nickveles",
  botGithub: "https://github.com/NickVeles/nickbot",
  instagram: "https://instagram.com/nick.veles",
  twitter: "https://twitter.com/nickveles",
  discord: "nickveles",
  dcserver: "https://discord.gg/93nJghSMxS",
  coffee: "https://buymeacoffee.com/nickveles",
  description:
    "Hi! I'm a passionate full-stack developer and machine learning specialist. Thanks for checking out my work! If you want to learn more about me or get in touch, feel free to reach out through any of the links below.",
};

// Command
export const data = new SlashCommandBuilder()
  .setName("author")
  .setDescription("Learn about the bot's creator")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator); // admin required

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x8c5cff)
    .setDescription(`# ✨ ${authorConfig.name}\n` + authorConfig.description)
    .setThumbnail(authorConfig.avatar)
    .addFields(
      {
        name: "\u200B\n🔗 Links",
        value: [
          `- 🌐 - [nickveles.com](${authorConfig.website})`,
          `- 👨‍💻 - [GitHub](${authorConfig.github})`,
          `- 📸 - [Instagram](${authorConfig.instagram})`,
          `- 🐦 - [Twitter](${authorConfig.twitter})`,
          `- ☕ - [Coffee](${authorConfig.twitter})`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "\u200B\n💬 Contact",
        value: [
          `- Form: [Contact](${authorConfig.form})`,
          `- Discord: \`${authorConfig.discord}\``,
          `- Server: [Nick & Friends](${authorConfig.dcserver})`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: false,
      },
      {
        name: "💙 Thank You!",
        value: [
          `Thanks for using my discord bot - [Nickbot](${authorConfig.botGithub})!`,
          `I'm planning to add more features in the future, so stay tuned!`,
        ].join("\n"),
        inline: false,
      }
    )
    .setFooter({
      text: `Created with ❤️ by ${authorConfig.name}`,
      iconURL: authorConfig.avatar,
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export default { data, execute };

// src/commands/8ball.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

function randomIPv4() {
  return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
}

const responses = [
  // Affirmative responses
  { text: "It is certain", color: 0x00ff00 },
  { text: "It is decidedly so", color: 0x00ff00 },
  { text: "Without a doubt", color: 0x00ff00 },
  { text: "Yes, definitely", color: 0x00ff00 },
  { text: "You may rely on it", color: 0x00ff00 },
  { text: "As I see it, yes", color: 0x00ff00 },
  { text: "Most likely", color: 0x00ff00 },
  { text: "Outlook good", color: 0x00ff00 },
  { text: "Yes", color: 0x00ff00 },
  { text: "Signs point to yes", color: 0x00ff00 },
  { text: "Duh", color: 0x00ff00 },
  { text: "👍", color: 0x00ff00 },

  // Non-committal responses
  { text: "Ask again later", color: 0xffff00 },
  { text: "Better not tell you now", color: 0xffff00 },
  { text: "Cannot predict now", color: 0xffff00 },
  { text: "Concentrate and ask again", color: 0xffff00 },
  { text: "Go ask ChatGPT", color: 0xffff00 },
  { text: "idunno", color: 0xffff00 },
  { text: "Bro I'm just a ball, not a therapist", color: 0xffff00 },

  // Negative responses
  { text: "Don't count on it", color: 0xff0000 },
  { text: "My reply is no", color: 0xff0000 },
  { text: "My sources say no", color: 0xff0000 },
  { text: "Outlook not so good", color: 0xff0000 },
  { text: "Very doubtful", color: 0xff0000 },
  { text: "Of course not, you dumbass", color: 0xff0000 },
  { text: "Lmao no", color: 0xff0000 },
  { text: "Yeah, that's gonna be a no from me, chief", color: 0xff0000 },
  { text: "Yes, definitely /s", color: 0xff0000 },
  { text: randomIPv4(), color: 0xff0000 },
];

function getRandomResponse() {
  return responses[Math.floor(Math.random() * responses.length)];
}

// Command
export const data = new SlashCommandBuilder()
  .setName("8ball")
  .setDescription("Ask the magic 8-ball a question")
  .addStringOption((option) =>
    option
      .setName("question")
      .setDescription("Your question for the magic 8-ball")
      .setRequired(true)
  );

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const question = interaction.options.getString("question", true);
  const response = getRandomResponse();

  const embed = new EmbedBuilder()
    .setColor(response.color)
    .setTitle("🎱 Magic 8-Ball")
    .setDescription(`<@${interaction.user.id}>: "${question}"\n## ${response.text}`)

  await interaction.reply({ embeds: [embed] });
}

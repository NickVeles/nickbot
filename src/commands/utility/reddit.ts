import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import db from "../../database/index.js";

// Command
export const data = new SlashCommandBuilder()
  .setName("reddit")
  .setDescription("Posts content from the top posts of the week from a subreddit")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("image")
      .setDescription("Posts a random image from the top posts of the week")
      .addStringOption((option) =>
        option
          .setName("subreddit")
          .setDescription("The subreddit to fetch posts from")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("video")
      .setDescription("Posts a random video from the top posts of the week")
      .addStringOption((option) =>
        option
          .setName("subreddit")
          .setDescription("The subreddit to fetch posts from")
          .setRequired(true)
      )
  );

interface RedditPost {
  data: {
    url: string;
    permalink: string;
    title: string;
    author: string;
    subreddit: string;
    post_hint?: string;
    is_video?: boolean;
    ups: number;
    downs: number;
    score: number;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

// Helper function to check if URL is an image
function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.endsWith(ext)) ||
         lowerUrl.includes('i.redd.it') ||
         lowerUrl.includes('i.imgur.com');
}

// Helper function to check if URL is a video
function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.endsWith(ext)) ||
         lowerUrl.includes('v.redd.it');
}

// Helper function to check if post is already in database
function isPostInDatabase(subreddit: string, restOfUrl: string): boolean {
  const stmt = db.prepare('SELECT postUrl FROM reddit_posts WHERE postUrl = ?');
  const postUrl = `${subreddit}/${restOfUrl}`;
  const result = stmt.get(postUrl);
  return result !== undefined;
}

// Helper function to save post to database
function savePostToDatabase(subreddit: string, restOfUrl: string): void {
  const stmt = db.prepare('INSERT INTO reddit_posts (postUrl, subreddit, postedAt) VALUES (?, ?, ?)');
  const postUrl = `${subreddit}/${restOfUrl}`;
  stmt.run(postUrl, subreddit, Date.now());
}

// Helper function to extract rest of URL from permalink
function extractRestOfUrl(permalink: string): string {
  // Remove leading /r/subreddit/ from permalink
  const parts = permalink.split('/');
  // permalink format: /r/subreddit/comments/id/title/
  if (parts.length >= 5 && parts[1] === 'r' && parts[3] === 'comments') {
    return parts.slice(4).join('/');
  }
  return permalink;
}

// Helper function to format vote count
function formatVotes(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  } else if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}

// Execute
export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const subreddit = interaction.options.getString("subreddit", true);

  // Defer reply since fetching from Reddit might take time
  await interaction.deferReply();

  try {
    // Fetch top posts of the week from Reddit
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=100`,
      {
        headers: {
          'User-Agent': 'Discord Bot (NickBot/1.0)',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        await interaction.editReply({
          content: `Subreddit r/${subreddit} not found.`,
        });
        return;
      }
      throw new Error(`Reddit API returned status ${response.status}`);
    }

    const data: RedditResponse = await response.json();

    if (!data.data.children || data.data.children.length === 0) {
      await interaction.editReply({
        content: `No posts found in r/${subreddit} for the top of the week.`,
      });
      return;
    }

    // Filter posts based on subcommand type
    const filteredPosts = data.data.children.filter((post) => {
      let isCorrectType = false;

      if (subcommand === 'image') {
        isCorrectType = post.data.post_hint === 'image' ||
                       (!post.data.is_video && isImageUrl(post.data.url));
      } else if (subcommand === 'video') {
        isCorrectType = post.data.is_video ||
                       post.data.post_hint === 'hosted:video' ||
                       isVideoUrl(post.data.url);
      }

      if (!isCorrectType) return false;

      const restOfUrl = extractRestOfUrl(post.data.permalink);
      const alreadyPosted = isPostInDatabase(post.data.subreddit, restOfUrl);
      return !alreadyPosted;
    });

    if (filteredPosts.length === 0) {
      await interaction.editReply({
        content: `No new ${subcommand} posts found in r/${subreddit} for the top of the week.`,
      });
      return;
    }

    // Select a random post from the filtered list
    const randomPost = filteredPosts[Math.floor(Math.random() * filteredPosts.length)];
    const postData = randomPost.data;
    const restOfUrl = extractRestOfUrl(postData.permalink);

    // Save to database
    savePostToDatabase(postData.subreddit, restOfUrl);

    // Create embed with vote information
    const embed = new EmbedBuilder()
      .setTitle(postData.title)
      .setURL(`https://www.reddit.com${postData.permalink}`)
      .setColor(0xFF4500) // Reddit orange
      .setFooter({ text: `Posted by u/${postData.author} in r/${postData.subreddit}` })
      .addFields({
        name: 'Score',
        value: `⬆️ ${formatVotes(postData.score)} upvotes`,
        inline: true
      });

    if (subcommand === 'image') {
      embed.setImage(postData.url);
    }

    // Send the post
    const reply: any = { embeds: [embed] };

    // For videos, include the URL in the content so Discord can display it
    if (subcommand === 'video') {
      reply.content = postData.url;
    }

    await interaction.editReply(reply);

  } catch (error) {
    console.error('Error fetching from Reddit:', error);
    await interaction.editReply({
      content: `Failed to fetch posts from r/${subreddit}. Please try again later.`,
    });
  }
}

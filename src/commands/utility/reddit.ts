import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
import db from "../../database/index.js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execPromise = promisify(exec);

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
    media?: {
      reddit_video?: {
        fallback_url: string;
        dash_url: string;
        hls_url: string;
        is_gif: boolean;
        has_audio: boolean;
      };
    };
    secure_media?: {
      reddit_video?: {
        fallback_url: string;
        dash_url: string;
        hls_url: string;
        is_gif: boolean;
        has_audio: boolean;
      };
    };
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

// Helper function to extract video URL from Reddit post
function getVideoUrl(post: RedditPost): { videoUrl: string; hasAudio: boolean } | null {
  const postData = post.data;

  // Check for reddit video in media or secure_media
  const redditVideo = postData.media?.reddit_video || postData.secure_media?.reddit_video;

  if (redditVideo) {
    return {
      videoUrl: redditVideo.fallback_url,
      hasAudio: redditVideo.has_audio
    };
  }

  // Check if URL is a direct video link
  if (isVideoUrl(postData.url)) {
    return {
      videoUrl: postData.url,
      hasAudio: true // Assume true for external videos
    };
  }

  return null;
}

// Helper function to download and compress video using ffmpeg
async function downloadAndCompressVideo(url: string, postId: string, hasAudio: boolean): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `reddit_${postId}_compressed.mp4`);

  try {
    // Discord's file size limit is 25MB for most servers
    const maxFileSizeMB = 24; // Leave some margin

    // Get audio URL for v.redd.it videos
    let audioUrl: string | null = null;
    if (url.includes('v.redd.it') && hasAudio) {
      // Audio is at the same base URL but with /DASH_audio.mp4 or /DASH_AUDIO_128.mp4
      const baseUrl = url.substring(0, url.lastIndexOf('/'));
      audioUrl = `${baseUrl}/DASH_AUDIO_128.mp4`;
    }

    let ffmpegCommand: string;

    if (audioUrl) {
      // Try to merge video and audio for v.redd.it
      ffmpegCommand = `ffmpeg -i "${url}" -i "${audioUrl}" -c:v libx264 -preset fast -crf 28 -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" -c:a aac -b:a 96k -movflags +faststart -y "${outputPath}"`;

      try {
        const { stderr } = await execPromise(ffmpegCommand, { timeout: 120000 });
        console.log('FFmpeg with audio stderr:', stderr);
      } catch (error: any) {
        console.log('Audio merge failed, trying video-only:', error.message);
        // If audio merge fails, try video-only
        ffmpegCommand = `ffmpeg -i "${url}" -c:v libx264 -preset fast -crf 28 -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" -an -movflags +faststart -y "${outputPath}"`;
        const { stderr } = await execPromise(ffmpegCommand, { timeout: 120000 });
        console.log('FFmpeg video-only stderr:', stderr);
      }
    } else {
      // For other videos or videos without audio
      const audioFlag = hasAudio ? '-c:a aac -b:a 96k' : '-an';
      ffmpegCommand = `ffmpeg -i "${url}" -c:v libx264 -preset fast -crf 28 -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" ${audioFlag} -movflags +faststart -y "${outputPath}"`;
      const { stderr } = await execPromise(ffmpegCommand, { timeout: 120000 });
      console.log('FFmpeg stderr:', stderr);
    }

    // Check if file was created and is within size limits
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      console.log(`Video file size: ${fileSizeMB.toFixed(2)}MB`);

      if (fileSizeMB > 25) {
        // File is still too large, clean up and return error
        fs.unlinkSync(outputPath);
        return { success: false, error: `Video too large (${fileSizeMB.toFixed(1)}MB > 25MB)` };
      }

      if (fileSizeMB < 0.01) {
        // File is suspiciously small, probably failed
        fs.unlinkSync(outputPath);
        return { success: false, error: 'Output file is too small, likely failed' };
      }

      return { success: true, filePath: outputPath };
    } else {
      return { success: false, error: 'FFmpeg failed to create output file' };
    }

  } catch (error: any) {
    console.error('FFmpeg error:', error);
    // Clean up any partial files
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    return {
      success: false,
      error: error.message || 'Unknown error during video processing'
    };
  }
}

// Helper function to clean up temporary video file
function cleanupVideoFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up video file:', error);
  }
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
        name: '',
        value: `⬆️ ${formatVotes(postData.score)} upvotes`,
        inline: true
      });

    if (subcommand === 'image') {
      embed.setImage(postData.url);
      // Send the image post
      await interaction.editReply({ embeds: [embed] });
    } else if (subcommand === 'video') {
      // Get the proper video URL from the post
      const videoInfo = getVideoUrl(randomPost);

      if (!videoInfo) {
        await interaction.editReply({
          content: `Failed to extract video URL from the post.`,
        });
        return;
      }

      // Try to download and compress video using ffmpeg
      const postId = restOfUrl.replace(/[^a-zA-Z0-9]/g, '_');
      let videoFilePath: string | undefined;

      console.log('Processing video:', videoInfo.videoUrl, 'hasAudio:', videoInfo.hasAudio);

      try {
        const videoResult = await downloadAndCompressVideo(videoInfo.videoUrl, postId, videoInfo.hasAudio);

        if (videoResult.success && videoResult.filePath) {
          // Successfully downloaded and compressed video
          videoFilePath = videoResult.filePath;
          const attachment = new AttachmentBuilder(videoFilePath, {
            name: `reddit_video_${postId}.mp4`
          });

          await interaction.editReply({
            embeds: [embed],
            files: [attachment]
          });

          // Clean up the temporary file after sending
          setTimeout(() => cleanupVideoFile(videoFilePath!), 5000);
        } else {
          // FFmpeg failed, fallback to URL
          // Add warning to embed description instead of content to avoid length issues
          embed.setDescription(`⚠️ Video processing failed: ${videoResult.error}\n\n[Click here to view video](${videoInfo.videoUrl})`);

          await interaction.editReply({
            embeds: [embed]
          });
        }
      } catch (error: any) {
        // If anything goes wrong, clean up and fallback to URL
        if (videoFilePath) {
          cleanupVideoFile(videoFilePath);
        }

        // Add warning to embed description instead of content to avoid length issues
        embed.setDescription(`⚠️ Video processing failed: ${error.message}\n\n[Click here to view video](${videoInfo.videoUrl})`);

        await interaction.editReply({
          embeds: [embed]
        });
      }
    }

  } catch (error) {
    console.error('Error fetching from Reddit:', error);
    await interaction.editReply({
      content: `Failed to fetch posts from r/${subreddit}. Please try again later.`,
    });
  }
}

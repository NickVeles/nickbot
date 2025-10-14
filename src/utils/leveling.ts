import db from "../database/index.js";

// Level configuration - 20 levels with exponential growth
export const LEVELS = [
  { level: 1, totalXP: 0 },
  { level: 2, totalXP: 100 },
  { level: 3, totalXP: 250 },
  { level: 4, totalXP: 500 },
  { level: 5, totalXP: 850 },
  { level: 6, totalXP: 1300 },
  { level: 7, totalXP: 1900 },
  { level: 8, totalXP: 2650 },
  { level: 9, totalXP: 3600 },
  { level: 10, totalXP: 4800 },
  { level: 11, totalXP: 6300 },
  { level: 12, totalXP: 8150 },
  { level: 13, totalXP: 10400 },
  { level: 14, totalXP: 13100 },
  { level: 15, totalXP: 16300 },
  { level: 16, totalXP: 20050 },
  { level: 17, totalXP: 24400 },
  { level: 18, totalXP: 29400 },
  { level: 19, totalXP: 35100 },
  { level: 20, totalXP: 41550 },
];

// XP gain per message (random between 15-25)
export const MIN_XP_PER_MESSAGE = 15;
export const MAX_XP_PER_MESSAGE = 25;

// Cooldown between XP gains (in milliseconds) - 1 minute
export const XP_COOLDOWN = 60000;

// Track last XP gain time for each user in each guild
const xpCooldowns = new Map<string, number>();

// Get user's current level based on XP
export function getLevelFromXP(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].totalXP) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

// Get XP required for next level
export function getXPForNextLevel(
  currentXP: number
): {
  currentLevel: number;
  nextLevel: number;
  xpNeeded: number;
  xpForNext: number;
} | null {
  const currentLevel = getLevelFromXP(currentXP);

  if (currentLevel >= 20) {
    return null; // Max level reached
  }

  const nextLevelData = LEVELS.find((l) => l.level === currentLevel + 1);
  if (!nextLevelData) return null;

  return {
    currentLevel,
    nextLevel: nextLevelData.level,
    xpNeeded: nextLevelData.totalXP - currentXP,
    xpForNext: nextLevelData.totalXP,
  };
}

// Get user XP from database
export function getUserXP(userId: string, guildId: string): number {
  const stmt = db.prepare(
    "SELECT xp FROM user_xp WHERE userId = ? AND guildId = ?"
  );
  const result = stmt.get(userId, guildId) as { xp: number } | undefined;
  return result?.xp ?? 0;
}

// Add XP to user
export function addUserXP(
  userId: string,
  guildId: string,
  amount: number
): { newXP: number; oldLevel: number; newLevel: number; leveledUp: boolean } {
  const oldXP = getUserXP(userId, guildId);
  const newXP = oldXP + amount;

  const stmt = db.prepare(`
    INSERT INTO user_xp (userId, guildId, xp)
    VALUES (?, ?, ?)
    ON CONFLICT(userId, guildId) DO UPDATE SET xp = xp + ?
  `);
  stmt.run(userId, guildId, amount, amount);

  const oldLevel = getLevelFromXP(oldXP);
  const newLevel = getLevelFromXP(newXP);

  return {
    newXP,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
  };
}

// Remove XP from user (won't go below 0)
export function removeUserXP(
  userId: string,
  guildId: string,
  amount: number
): number {
  const oldXP = getUserXP(userId, guildId);
  const newXP = Math.max(0, oldXP - amount);

  const stmt = db.prepare(`
    UPDATE user_xp SET xp = ?
    WHERE userId = ? AND guildId = ?
  `);
  stmt.run(newXP, userId, guildId);

  return newXP;
}

// Reset user XP
export function resetUserXP(userId: string, guildId: string): void {
  const stmt = db.prepare(`
    INSERT INTO user_xp (userId, guildId, xp)
    VALUES (?, ?, 0)
    ON CONFLICT(userId, guildId) DO UPDATE SET xp = 0
  `);
  stmt.run(userId, guildId);
}

// Reset all XP in a guild
export function resetGuildXP(guildId: string): number {
  const stmt = db.prepare("DELETE FROM user_xp WHERE guildId = ?");
  const result = stmt.run(guildId);
  return result.changes;
}

// Check if user is on cooldown
export function isOnCooldown(userId: string, guildId: string): boolean {
  const key = `${userId}-${guildId}`;
  const lastGain = xpCooldowns.get(key);

  if (!lastGain) return false;

  return Date.now() - lastGain < XP_COOLDOWN;
}

// Set cooldown for user
export function setCooldown(userId: string, guildId: string): void {
  const key = `${userId}-${guildId}`;
  xpCooldowns.set(key, Date.now());
}

// Get random XP amount for message
export function getRandomXP(): number {
  return (
    Math.floor(Math.random() * (MAX_XP_PER_MESSAGE - MIN_XP_PER_MESSAGE + 1)) +
    MIN_XP_PER_MESSAGE
  );
}

// Get top users in a guild
export function getTopUsers(
  guildId: string,
  limit: number = 10
): Array<{ userId: string; xp: number; level: number }> {
  const stmt = db.prepare(
    "SELECT userId, xp FROM user_xp WHERE guildId = ? ORDER BY xp DESC LIMIT ?"
  );
  const results = stmt.all(guildId, limit) as Array<{
    userId: string;
    xp: number;
  }>;

  return results.map((r) => ({
    userId: r.userId,
    xp: r.xp,
    level: getLevelFromXP(r.xp),
  }));
}

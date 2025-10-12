import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure database directory exists
const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const db: Database.Database = new Database(path.join(dbDir, 'nickbot.db'));

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize all tables
function initializeTables() {
  // Role picker table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pickers (
      id TEXT PRIMARY KEY,
      guildId TEXT NOT NULL,
      roleIds TEXT NOT NULL,
      multiple INTEGER NOT NULL
    )
  `);
}

// Initialize tables on module load
initializeTables();

export default db;

import Database from 'better-sqlite3'
import { Logger } from '../utils/logger.js'
import path from 'path'
import fs from 'fs'

export class DatabaseClient {
  private static instance: DatabaseClient
  private db: Database.Database

  private constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'bot.db')

    // Create data directory if it doesn't exist
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL') // Better performance
    this.db.pragma('foreign_keys = ON') // Enable foreign keys

    Logger.info(`Database connected at: ${dbPath}`)
    this.initialize()
  }

  static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient()
    }
    return DatabaseClient.instance
  }

  private initialize(): void {
    try {
      // Run migrations
      this.runMigrations()
      Logger.info('Database initialized successfully')
    } catch (error) {
      Logger.error(`Database initialization error: ${error}`)
      throw error
    }
  }

  private runMigrations(): void {
    // Create tables if they don't exist
    this.db.exec(`
      -- Contacts table
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT UNIQUE NOT NULL,
        name TEXT,
        is_whatsapp BOOLEAN DEFAULT 0,
        is_blocked BOOLEAN DEFAULT 0,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Private messages table
      CREATE TABLE IF NOT EXISTS private_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_number TEXT NOT NULL,
        to_number TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        delivered_at DATETIME,
        read_at DATETIME,
        error_message TEXT
      );

      -- Scheduled messages table
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_number TEXT NOT NULL,
        message TEXT NOT NULL,
        scheduled_for DATETIME NOT NULL,
        cron_expression TEXT,
        status TEXT DEFAULT 'pending',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        executed_at DATETIME,
        error_message TEXT
      );

      -- Message templates table
      CREATE TABLE IF NOT EXISTS message_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        content TEXT NOT NULL,
        variables TEXT, -- JSON array
        usage_count INTEGER DEFAULT 0,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Broadcast lists table
      CREATE TABLE IF NOT EXISTS broadcast_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        contacts TEXT NOT NULL, -- JSON array of numbers
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Broadcast messages table
      CREATE TABLE IF NOT EXISTS broadcast_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        broadcast_list_id INTEGER,
        message TEXT NOT NULL,
        total_recipients INTEGER,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (broadcast_list_id) REFERENCES broadcast_lists(id)
      );

      -- Chat history table
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT,
        media_url TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_contacts_number ON contacts(number);
      CREATE INDEX IF NOT EXISTS idx_private_messages_to ON private_messages(to_number);
      CREATE INDEX IF NOT EXISTS idx_private_messages_from ON private_messages(from_number);
      CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_messages_time ON scheduled_messages(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_chat_history_chat ON chat_history(chat_id);
      CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);
    `)
  }

  getDatabase(): Database.Database {
    return this.db
  }

  // Utility methods
  prepare(sql: string): Database.Statement {
    return this.db.prepare(sql)
  }

  transaction<T>(fn: () => T): T {
    const trx = this.db.transaction(fn)
    return trx()
  }

  close(): void {
    this.db.close()
    Logger.info('Database connection closed')
  }
}

// Export singleton instance
export const db = DatabaseClient.getInstance()

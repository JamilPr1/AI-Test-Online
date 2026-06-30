import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'screening.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS test_sessions (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      linkedin TEXT,
      years_experience TEXT,
      current_role TEXT,
      status TEXT DEFAULT 'in_progress',
      score INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      percentage REAL DEFAULT 0,
      tab_switches INTEGER DEFAULT 0,
      focus_losses INTEGER DEFAULT 0,
      copy_events INTEGER DEFAULT 0,
      paste_events INTEGER DEFAULT 0,
      right_clicks INTEGER DEFAULT 0,
      fullscreen_exits INTEGER DEFAULT 0,
      started_at TEXT NOT NULL,
      submitted_at TEXT,
      time_taken_seconds INTEGER,
      answers_json TEXT,
      behavior_log_json TEXT,
      links_opened_json TEXT,
      integrity_flags_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_email ON test_sessions(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_submitted ON test_sessions(submitted_at);
  `);
}

export interface TestSession {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  years_experience: string | null;
  current_role: string | null;
  status: string;
  score: number;
  total_points: number;
  percentage: number;
  tab_switches: number;
  focus_losses: number;
  copy_events: number;
  paste_events: number;
  right_clicks: number;
  fullscreen_exits: number;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  answers_json: string | null;
  behavior_log_json: string | null;
  links_opened_json: string | null;
  integrity_flags_json: string | null;
}

export interface BehaviorEvent {
  type: string;
  timestamp: string;
  detail?: string;
  url?: string;
}

export interface LinkOpened {
  url: string;
  timestamp: string;
  context: string;
}

import { put, list, get } from '@vercel/blob';
import { createClient, type Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

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

const BLOB_PREFIX = 'sessions/';
const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN;

function useBlob(): boolean {
  return Boolean(process.env.VERCEL === '1' && blobToken());
}

function sessionPath(id: string) {
  return `${BLOB_PREFIX}${id}.json`;
}

function defaultSession(
  partial: Pick<TestSession, 'id' | 'full_name' | 'email' | 'started_at'> &
    Partial<TestSession>
): TestSession {
  return {
    phone: null,
    linkedin: null,
    years_experience: null,
    current_role: null,
    status: 'in_progress',
    score: 0,
    total_points: 0,
    percentage: 0,
    tab_switches: 0,
    focus_losses: 0,
    copy_events: 0,
    paste_events: 0,
    right_clicks: 0,
    fullscreen_exits: 0,
    submitted_at: null,
    time_taken_seconds: null,
    answers_json: null,
    behavior_log_json: '[]',
    links_opened_json: '[]',
    integrity_flags_json: '[]',
    ...partial,
  };
}

// ─── Vercel Blob (persistent on Vercel) ───────────────────────────────────

async function blobSave(session: TestSession): Promise<void> {
  await put(sessionPath(session.id), JSON.stringify(session), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: blobToken(),
  });
}

async function blobGet(id: string): Promise<TestSession | null> {
  try {
    const pathname = sessionPath(id);
    const result = await get(pathname, {
      access: 'private',
      token: blobToken(),
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text = await new Response(result.stream).text();
    return JSON.parse(text) as TestSession;
  } catch (error) {
    const name = error instanceof Error ? error.constructor.name : '';
    if (name === 'BlobNotFoundError') return null;
    console.error(`blobGet failed for ${id}:`, error);
    return null;
  }
}

async function blobList(): Promise<TestSession[]> {
  const { blobs } = await list({
    prefix: BLOB_PREFIX,
    token: blobToken(),
  });

  const sessions = await Promise.all(
    blobs
      .filter((b) => b.pathname.endsWith('.json'))
      .map(async (blob) => {
        const id = blob.pathname
          .slice(BLOB_PREFIX.length)
          .replace(/\.json$/, '');
        return blobGet(id);
      })
  );

  return sessions.filter((s): s is TestSession => s !== null);
}

// ─── libSQL / Turso / local file (dev fallback) ─────────────────────────────

let sqlClient: Client | null = null;
let schemaReady: Promise<void> | null = null;

function resolveDatabaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, 'screening.db')}`;
}

function getSqlClient(): Client {
  if (!sqlClient) {
    sqlClient = createClient({
      url: resolveDatabaseUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return sqlClient;
}

async function initSqlSchema(database: Client) {
  await database.execute(`
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
    )
  `);
}

async function ensureSql(): Promise<Client> {
  const database = getSqlClient();
  if (!schemaReady) {
    schemaReady = initSqlSchema(database);
  }
  await schemaReady;
  return database;
}

function rowToSession(row: Record<string, unknown>): TestSession {
  return row as unknown as TestSession;
}

async function sqlGet(id: string): Promise<TestSession | null> {
  const db = await ensureSql();
  const result = await db.execute({
    sql: 'SELECT * FROM test_sessions WHERE id = ?',
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToSession(row as Record<string, unknown>) : null;
}

async function sqlList(): Promise<TestSession[]> {
  const db = await ensureSql();
  const result = await db.execute(`
    SELECT * FROM test_sessions
    ORDER BY CASE WHEN submitted_at IS NULL THEN 1 ELSE 0 END, submitted_at DESC, started_at DESC
  `);
  return result.rows.map((r) => rowToSession(r as Record<string, unknown>));
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function createSession(
  data: Pick<TestSession, 'id' | 'full_name' | 'email' | 'started_at'> &
    Partial<
      Pick<
        TestSession,
        'phone' | 'linkedin' | 'years_experience' | 'current_role'
      >
    >
): Promise<TestSession> {
  const session = defaultSession(data);

  if (useBlob()) {
    await blobSave(session);
    const verified = await blobGet(session.id);
    if (!verified) {
      throw new Error('Failed to persist session to blob storage.');
    }
    return session;
  }

  const db = await ensureSql();
  await db.execute({
    sql: `INSERT INTO test_sessions (
      id, full_name, email, phone, linkedin, years_experience, current_role,
      status, started_at, behavior_log_json, links_opened_json, integrity_flags_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, '[]', '[]', '[]')`,
    args: [
      session.id,
      session.full_name,
      session.email,
      session.phone,
      session.linkedin,
      session.years_experience,
      session.current_role,
      session.started_at,
    ],
  });
  return session;
}

export async function getSession(id: string): Promise<TestSession | null> {
  if (useBlob()) {
    const fromBlob = await blobGet(id);
    if (fromBlob) return fromBlob;
  }
  if (process.env.TURSO_DATABASE_URL) {
    try {
      return await sqlGet(id);
    } catch (error) {
      console.error(`sqlGet failed for ${id}:`, error);
    }
  }
  if (!useBlob()) {
    return sqlGet(id);
  }
  return null;
}

export async function updateSession(
  id: string,
  updates: Partial<TestSession>
): Promise<TestSession | null> {
  if (useBlob()) {
    const existing = await blobGet(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await blobSave(merged);
    return merged;
  }

  const existing = await sqlGet(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates };

  const db = await ensureSql();
  await db.execute({
    sql: `UPDATE test_sessions SET
      full_name = ?, email = ?, phone = ?, linkedin = ?, years_experience = ?,
      current_role = ?, status = ?, score = ?, total_points = ?, percentage = ?,
      tab_switches = ?, focus_losses = ?, copy_events = ?, paste_events = ?,
      right_clicks = ?, fullscreen_exits = ?, started_at = ?, submitted_at = ?,
      time_taken_seconds = ?, answers_json = ?, behavior_log_json = ?,
      links_opened_json = ?, integrity_flags_json = ?
    WHERE id = ?`,
    args: [
      merged.full_name,
      merged.email,
      merged.phone,
      merged.linkedin,
      merged.years_experience,
      merged.current_role,
      merged.status,
      merged.score,
      merged.total_points,
      merged.percentage,
      merged.tab_switches,
      merged.focus_losses,
      merged.copy_events,
      merged.paste_events,
      merged.right_clicks,
      merged.fullscreen_exits,
      merged.started_at,
      merged.submitted_at,
      merged.time_taken_seconds,
      merged.answers_json,
      merged.behavior_log_json,
      merged.links_opened_json,
      merged.integrity_flags_json,
      id,
    ],
  });
  return merged;
}

export async function listSessions(): Promise<TestSession[]> {
  if (useBlob()) {
    const sessions = await blobList();
    return sessions.sort((a, b) => {
      const aTime = a.submitted_at || a.started_at;
      const bTime = b.submitted_at || b.started_at;
      return bTime.localeCompare(aTime);
    });
  }
  return sqlList();
}

/** @deprecated Use storage functions directly */
export async function ensureDb(): Promise<void> {
  if (useBlob()) return;
  await ensureSql();
}

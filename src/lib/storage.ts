import { put, list, get, del } from '@vercel/blob';
import { createClient, type Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

export interface TestSession {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  headshot_data: string | null;
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
  last_activity_at: string;
  question_shuffle_json: string | null;
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
    headshot_data: null,
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
    last_activity_at: partial.started_at,
    question_shuffle_json: null,
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

async function blobDelete(id: string): Promise<void> {
  await del(sessionPath(id), { token: blobToken() });
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
      integrity_flags_json TEXT,
      last_activity_at TEXT,
      question_shuffle_json TEXT,
      headshot_data TEXT
    )
  `);

  try {
    await database.execute('ALTER TABLE test_sessions ADD COLUMN headshot_data TEXT');
  } catch {
    // column already exists
  }
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

function isSubmissionComplete(session: TestSession): boolean {
  if (session.status === 'submitted') return true;
  if (session.submitted_at) return true;
  if (!session.answers_json) return false;
  try {
    const parsed = JSON.parse(session.answers_json) as { answers?: Record<string, unknown> };
    return Boolean(parsed.answers && Object.keys(parsed.answers).length > 0);
  } catch {
    return false;
  }
}

/** Prevent stale behavior pings from reverting a completed submission */
function mergeSessionUpdate(
  existing: TestSession,
  updates: Partial<TestSession>
): TestSession {
  const merged: TestSession = {
    ...existing,
    ...updates,
    last_activity_at: updates.last_activity_at ?? new Date().toISOString(),
  };

  if (isSubmissionComplete(existing)) {
    merged.status = 'submitted';
    merged.submitted_at = existing.submitted_at ?? merged.submitted_at;
    merged.score = existing.score;
    merged.total_points = existing.total_points;
    merged.percentage = existing.percentage;
    merged.answers_json = existing.answers_json;
    merged.time_taken_seconds = existing.time_taken_seconds;
    merged.integrity_flags_json =
      existing.integrity_flags_json ?? merged.integrity_flags_json;
  }

  if (isSubmissionComplete(merged) && merged.status !== 'submitted') {
    merged.status = 'submitted';
    merged.submitted_at = merged.submitted_at ?? new Date().toISOString();
  }

  return merged;
}

async function persistSession(session: TestSession): Promise<TestSession> {
  if (useBlob()) {
    await blobSave(session);
    const verified = await blobGet(session.id);
    if (!verified) {
      throw new Error('Failed to persist session to blob storage.');
    }
    return verified;
  }

  const db = await ensureSql();
  await db.execute({
    sql: `UPDATE test_sessions SET
      full_name = ?, email = ?, phone = ?, linkedin = ?, years_experience = ?,
      current_role = ?, status = ?, score = ?, total_points = ?, percentage = ?,
      tab_switches = ?, focus_losses = ?, copy_events = ?, paste_events = ?,
      right_clicks = ?, fullscreen_exits = ?, started_at = ?, submitted_at = ?,
      time_taken_seconds = ?, answers_json = ?, behavior_log_json = ?,
      links_opened_json = ?, integrity_flags_json = ?,
      last_activity_at = ?, question_shuffle_json = ?, headshot_data = ?
    WHERE id = ?`,
    args: [
      session.full_name,
      session.email,
      session.phone,
      session.linkedin,
      session.years_experience,
      session.current_role,
      session.status,
      session.score,
      session.total_points,
      session.percentage,
      session.tab_switches,
      session.focus_losses,
      session.copy_events,
      session.paste_events,
      session.right_clicks,
      session.fullscreen_exits,
      session.started_at,
      session.submitted_at,
      session.time_taken_seconds,
      session.answers_json,
      session.behavior_log_json,
      session.links_opened_json,
      session.integrity_flags_json,
      session.last_activity_at,
      session.question_shuffle_json,
      session.headshot_data,
      session.id,
    ],
  });
  return session;
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
        | 'phone'
        | 'linkedin'
        | 'years_experience'
        | 'current_role'
        | 'last_activity_at'
        | 'question_shuffle_json'
        | 'headshot_data'
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
      status, started_at, last_activity_at, question_shuffle_json, headshot_data,
      behavior_log_json, links_opened_json, integrity_flags_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?, ?, '[]', '[]', '[]')`,
    args: [
      session.id,
      session.full_name,
      session.email,
      session.phone,
      session.linkedin,
      session.years_experience,
      session.current_role,
      session.started_at,
      session.last_activity_at,
      session.question_shuffle_json,
      session.headshot_data,
    ],
  });
  return session;
}

export async function getSession(id: string): Promise<TestSession | null> {
  return getSessionRaw(id);
}

async function getSessionRaw(id: string): Promise<TestSession | null> {
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
  const existing = await getSessionRaw(id);
  if (!existing) return null;

  const merged = mergeSessionUpdate(existing, updates);

  try {
    return await persistSession(merged);
  } catch (error) {
    console.error(`updateSession failed for ${id}:`, error);
    return null;
  }
}

async function repairAndNormalizeSessions(
  sessions: TestSession[]
): Promise<TestSession[]> {
  const normalized: TestSession[] = [];

  for (const session of sessions) {
    let current = session;
    if (isSubmissionComplete(session) && session.status !== 'submitted') {
      current = mergeSessionUpdate(session, { status: 'submitted' });
      try {
        current = await persistSession(current);
      } catch (error) {
        console.error(`Failed to repair session ${session.id}:`, error);
        current = { ...session, status: 'submitted' };
      }
    }
    normalized.push(current);
  }

  return normalized;
}

async function listSessionsRaw(): Promise<TestSession[]> {
  let sessions: TestSession[];
  if (useBlob()) {
    sessions = await blobList();
    sessions.sort((a, b) => {
      const aTime = a.submitted_at || a.started_at;
      const bTime = b.submitted_at || b.started_at;
      return bTime.localeCompare(aTime);
    });
  } else {
    sessions = await sqlList();
  }
  return repairAndNormalizeSessions(sessions);
}

export async function deleteSession(id: string): Promise<void> {
  if (useBlob()) {
    try {
      await blobDelete(id);
    } catch {
      // already removed
    }
    return;
  }
  const db = await ensureSql();
  await db.execute({ sql: 'DELETE FROM test_sessions WHERE id = ?', args: [id] });
}

export async function listSessions(): Promise<TestSession[]> {
  return listSessionsRaw();
}

/** Omit large headshot payload from list responses */
export function sessionForList(session: TestSession) {
  const { headshot_data, ...rest } = session;
  return { ...rest, has_headshot: Boolean(headshot_data) };
}

/** @deprecated Use storage functions directly */
export async function ensureDb(): Promise<void> {
  if (useBlob()) return;
  await ensureSql();
}

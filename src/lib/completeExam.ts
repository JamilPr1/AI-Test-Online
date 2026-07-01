import type { TestSession } from './storage';
import { gradeAnswers, getIntegrityRisk, questions } from './questions';
import type { AnswerValue } from './questions';
import type { ShuffleMap } from './shuffle';

export interface DraftPayload {
  draft: true;
  answers: Record<string, AnswerValue>;
  currentIndex: number;
  savedAt: string;
}

export interface FinalPayload {
  answers: Record<string, AnswerValue>;
  breakdown: Record<string, unknown>;
  codingDetails: Record<string, unknown>;
  autoFinalized?: boolean;
}

export function parseAnswersPayload(
  answersJson: string | null
): DraftPayload | FinalPayload | null {
  if (!answersJson) return null;
  try {
    return JSON.parse(answersJson) as DraftPayload | FinalPayload;
  } catch {
    return null;
  }
}

export function isDraftPayload(
  payload: DraftPayload | FinalPayload | null
): payload is DraftPayload {
  return Boolean(payload && 'draft' in payload && payload.draft === true);
}

export function getDraftFromSession(session: TestSession): DraftPayload | null {
  const payload = parseAnswersPayload(session.answers_json);
  return isDraftPayload(payload) ? payload : null;
}

export interface ProctorSnapshot {
  tabSwitches?: number;
  focusLosses?: number;
  copyEvents?: number;
  pasteEvents?: number;
  rightClicks?: number;
  fullscreenExits?: number;
  behaviorLog?: unknown[];
  linksOpened?: unknown[];
}

export interface CompleteExamResult {
  score: number;
  totalPoints: number;
  percentage: number;
  integrity: { level: 'low' | 'medium' | 'high'; flags: string[] };
  answersJson: string;
  behaviorLogJson: string;
  linksOpenedJson: string;
  integrityFlagsJson: string;
  submittedAt: string;
  timeTakenSeconds: number;
  tab_switches: number;
  focus_losses: number;
  copy_events: number;
  paste_events: number;
  right_clicks: number;
  fullscreen_exits: number;
}

export function buildCompleteExamResult(
  session: TestSession,
  answers: Record<string, AnswerValue>,
  options?: {
    proctor?: ProctorSnapshot;
    startedAt?: string;
    autoFinalized?: boolean;
  }
): CompleteExamResult {
  const examMeta = session.question_shuffle_json
    ? (JSON.parse(session.question_shuffle_json) as {
        shuffleMap: ShuffleMap;
        questionIds: string[];
      })
    : undefined;

  const { score, totalPoints, breakdown, codingDetails } = gradeAnswers(
    answers,
    examMeta
      ? { shuffleMap: examMeta.shuffleMap, questionIds: examMeta.questionIds }
      : undefined
  );

  const percentage =
    totalPoints > 0 ? Math.round((score / totalPoints) * 1000) / 10 : 0;
  const submittedAt = new Date().toISOString();

  const testStart =
    options?.startedAt ||
    session.test_started_at ||
    session.started_at;
  const timeTakenSeconds = Math.floor(
    (Date.now() - new Date(testStart).getTime()) / 1000
  );

  const existingBehavior = JSON.parse(session.behavior_log_json || '[]');
  const existingLinks = JSON.parse(session.links_opened_json || '[]');
  const mergedBehavior = [
    ...existingBehavior,
    ...(options?.proctor?.behaviorLog || []),
  ];
  const mergedLinks = [...existingLinks, ...(options?.proctor?.linksOpened || [])];

  const tab_switches = options?.proctor?.tabSwitches ?? session.tab_switches;
  const focus_losses = options?.proctor?.focusLosses ?? session.focus_losses;
  const copy_events = options?.proctor?.copyEvents ?? session.copy_events;
  const paste_events = options?.proctor?.pasteEvents ?? session.paste_events;
  const right_clicks = options?.proctor?.rightClicks ?? session.right_clicks;
  const fullscreen_exits =
    options?.proctor?.fullscreenExits ?? session.fullscreen_exits;

  const integrity = getIntegrityRisk({
    tab_switches,
    focus_losses,
    copy_events,
    paste_events,
    links_opened_json: JSON.stringify(mergedLinks),
    fullscreen_exits,
  });

  return {
    score,
    totalPoints,
    percentage,
    integrity,
    answersJson: JSON.stringify({
      answers,
      breakdown,
      codingDetails,
      ...(options?.autoFinalized ? { autoFinalized: true } : {}),
    }),
    behaviorLogJson: JSON.stringify(mergedBehavior),
    linksOpenedJson: JSON.stringify(mergedLinks),
    integrityFlagsJson: JSON.stringify(integrity),
    submittedAt,
    timeTakenSeconds,
    tab_switches,
    focus_losses,
    copy_events,
    paste_events,
    right_clicks,
    fullscreen_exits,
  };
}

export function questionCountForSession(session: TestSession): number {
  if (!session.question_shuffle_json) return questions.length;
  try {
    const meta = JSON.parse(session.question_shuffle_json) as {
      questionIds: string[];
    };
    return meta.questionIds.length;
  } catch {
    return questions.length;
  }
}

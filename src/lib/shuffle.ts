import type { McqQuestion, CodingQuestion } from './questions';

export interface McqShuffleEntry {
  /** Maps display index → original option index */
  optionOrder: number[];
  correctDisplayIndex: number;
}

export type ShuffleMap = Record<string, McqShuffleEntry>;

export interface ClientMcqQuestion {
  id: string;
  category: string;
  type: 'mcq';
  question: string;
  options: string[];
  points: number;
}

export type ClientQuestion = ClientMcqQuestion | CodingQuestion;

/** Deterministic hash for per-session randomness */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = items.slice();
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildExamPaper(
  sessionId: string,
  mcqPool: McqQuestion[],
  coding: CodingQuestion[],
  mcqCount = 15
): { examPaper: ClientQuestion[]; shuffleMap: ShuffleMap } {
  const baseSeed = hashString(sessionId);
  const orderedIds = seededShuffle(
    mcqPool.map((q) => q.id),
    baseSeed
  );
  const selectedIds = orderedIds.slice(0, Math.min(mcqCount, mcqPool.length));
  const selected = selectedIds
    .map((id) => mcqPool.find((q) => q.id === id)!)
    .filter(Boolean);

  const shuffleMap: ShuffleMap = {};
  const examMcqs: ClientMcqQuestion[] = selected.map((q, idx) => {
    const indices = q.options.map((_, i) => i);
    const optionOrder = seededShuffle(indices, baseSeed + idx * 997 + hashString(q.id));
    const shuffledOptions = optionOrder.map((i) => q.options[i]);
    const correctDisplayIndex = optionOrder.indexOf(q.correctAnswer);

    shuffleMap[q.id] = { optionOrder, correctDisplayIndex };

    return {
      id: q.id,
      category: q.category,
      type: 'mcq' as const,
      question: q.question,
      options: shuffledOptions,
      points: q.points,
    };
  });

  return {
    examPaper: [...examMcqs, ...coding],
    shuffleMap,
  };
}

export function restoreExamPaper(
  questionIds: string[],
  shuffleMap: ShuffleMap,
  mcqPool: McqQuestion[],
  coding: CodingQuestion[]
): ClientQuestion[] {
  const paper: ClientQuestion[] = [];

  for (const id of questionIds) {
    const mcq = mcqPool.find((q) => q.id === id);
    if (mcq) {
      const shuffle = shuffleMap[id];
      const options = shuffle
        ? shuffle.optionOrder.map((i) => mcq.options[i])
        : mcq.options;
      paper.push({
        id: mcq.id,
        category: mcq.category,
        type: 'mcq',
        question: mcq.question,
        options,
        points: mcq.points,
      });
      continue;
    }
    const code = coding.find((q) => q.id === id);
    if (code) paper.push(code);
  }

  return paper;
}

export function gradeMcqWithShuffle(
  questionId: string,
  userDisplayIndex: number | null | undefined,
  shuffleMap: ShuffleMap
): boolean {
  if (userDisplayIndex === null || userDisplayIndex === undefined) return false;
  const entry = shuffleMap[questionId];
  if (!entry) return false;
  return userDisplayIndex === entry.correctDisplayIndex;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  questions,
  TEST_DURATION_MINUTES,
  isQuestionAnswered,
  type Question,
  type AnswerValue,
} from '@/lib/questions';

type Answers = Record<string, AnswerValue>;

interface TestSession {
  sessionId: string;
  startedAt: string;
}

interface TestInterfaceProps {
  session: TestSession;
  onSubmit: (answers: Answers) => Promise<void>;
  submitting: boolean;
  proctorWarnings: number;
}

export default function TestInterface({
  session,
  onSubmit,
  submitting,
  proctorWarnings,
}: TestInterfaceProps) {
  const [answers, setAnswers] = useState<Answers>(() => {
    const initial: Answers = {};
    for (const q of questions) {
      if (q.type === 'coding') {
        initial[q.id] = q.starterCode;
      }
    }
    return initial;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_MINUTES * 60);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    const endTime =
      new Date(session.startedAt).getTime() + TEST_DURATION_MINUTES * 60 * 1000;
    let submitted = false;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !submitted) {
        submitted = true;
        onSubmit(answersRef.current);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt, onSubmit]);

  const current = questions[currentIndex];
  const answeredCount = questions.filter((q) =>
    isQuestionAnswered(q, answers[q.id])
  ).length;

  const setMcqAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const setCodeAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const mcqCount = questions.filter((q) => q.type === 'mcq').length;
  const codingCount = questions.filter((q) => q.type === 'coding').length;

  return (
    <div className="space-y-6">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <p className="text-sm text-slate-500">AI Developer Screening</p>
          <p className="font-semibold text-slate-900">
            Question {currentIndex + 1} of {questions.length}
            <span className="text-slate-400 font-normal text-sm ml-2">
              ({mcqCount} MCQ · {codingCount} coding)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {proctorWarnings > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              {proctorWarnings} integrity event{proctorWarnings !== 1 ? 's' : ''}
            </span>
          )}
          <div
            className={`text-lg font-mono font-bold ${
              timeLeft < 300 ? 'text-red-600' : 'text-brand-700'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-slate-500">
            {answeredCount}/{questions.length} answered
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-brand-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const answered = isQuestionAnswered(q, answers[q.id]);
          const isCoding = q.type === 'coding';
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              title={isCoding ? 'Coding exercise' : 'MCQ'}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                i === currentIndex
                  ? 'bg-brand-600 text-white'
                  : answered
                    ? isCoding
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
              }`}
            >
              {isCoding ? `C${i - mcqCount + 1}` : i + 1}
            </button>
          );
        })}
      </div>

      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
              current.type === 'coding'
                ? 'bg-purple-50 text-purple-700'
                : 'bg-brand-50 text-brand-700'
            }`}
          >
            {current.category}
          </span>
          <span className="text-xs text-slate-400">{current.points} pts</span>
          {current.type === 'coding' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {current.language}
            </span>
          )}
        </div>

        <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 leading-relaxed">
          {current.type === 'coding' ? current.question : current.question}
        </h2>

        {current.type === 'coding' ? (
          <CodingEditor
            question={current}
            code={(answers[current.id] as string) || current.starterCode}
            onChange={(code) => setCodeAnswer(current.id, code)}
          />
        ) : (
          <McqOptions
            question={current}
            answer={answers[current.id] as number | null | undefined}
            onSelect={setMcqAnswer}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          className="btn-secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          Previous
        </button>

        <div className="flex gap-3">
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Next Question
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
            >
              Submit Test
            </button>
          )}
        </div>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Submit your test?</h3>
            <p className="text-slate-600 text-sm mb-4">
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length &&
                ' Unanswered questions will receive reduced or zero points.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
              >
                Review Answers
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => onSubmit(answers)}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function McqOptions({
  question,
  answer,
  onSelect,
}: {
  question: Question & { type: 'mcq' };
  answer: number | null | undefined;
  onSelect: (id: string, value: number) => void;
}) {
  return (
    <div className="space-y-3">
      {question.options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
            answer === i
              ? 'border-brand-500 bg-brand-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            type="radio"
            name={question.id}
            checked={answer === i}
            onChange={() => onSelect(question.id, i)}
            className="h-4 w-4 text-brand-600"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function CodingEditor({
  question,
  code,
  onChange,
}: {
  question: Question & { type: 'coding' };
  code: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
        {question.instructions}
      </div>

      <div>
        <label className="label" htmlFor={`editor-${question.id}`}>
          Your Solution
        </label>
        <textarea
          id={`editor-${question.id}`}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-80 px-4 py-3 rounded-lg border border-slate-300 bg-slate-900 text-green-400
            font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
        />
        <p className="text-xs text-slate-400 mt-2">
          {code.split('\n').length} lines · Type your solution directly (paste is monitored)
        </p>
      </div>
    </div>
  );
}

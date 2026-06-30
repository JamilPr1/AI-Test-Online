import type { ShuffleMap } from './shuffle';
import { gradeMcqWithShuffle } from './shuffle';

export type QuestionType = 'mcq' | 'coding';

export interface McqQuestion {
  id: string;
  category: string;
  type: 'mcq';
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
}

export interface CodingCriterion {
  id: string;
  label: string;
  points: number;
  patterns: string[];
}

export interface CodingQuestion {
  id: string;
  category: string;
  type: 'coding';
  question: string;
  instructions: string;
  language: string;
  starterCode: string;
  points: number;
  criteria: CodingCriterion[];
  sampleSolution?: string;
}

export type Question = McqQuestion | CodingQuestion;

export type AnswerValue = number | string | null;

export const TEST_DURATION_MINUTES = 60;

export const PASSING_PERCENTAGE = 60;

export const MCQ_PER_EXAM = 15;

/** Pool of MCQs — each exam draws 15 with shuffled answer order per candidate */
export const mcqQuestionPool: McqQuestion[] = [
  {
    id: 'q1',
    category: 'Machine Learning',
    type: 'mcq',
    question:
      'Which TensorFlow API is most commonly used for building and training deep neural networks with high-level abstractions?',
    options: ['Keras (tf.keras)', 'TensorFlow Lite', 'XLA Compiler', 'TensorFlow Serving'],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q2',
    category: 'Unsupervised Learning',
    type: 'mcq',
    question:
      'A retail dataset has no labels. Which method best discovers natural customer segments for targeted marketing?',
    options: ['Logistic Regression', 'Random Forest', 'K-Means Clustering', 'Linear Regression'],
    correctAnswer: 2,
    points: 2,
  },
  {
    id: 'q3',
    category: 'Big Data',
    type: 'mcq',
    question:
      'In Hadoop, which component provides fault-tolerant distributed storage for petabyte-scale datasets?',
    options: ['YARN', 'Hive', 'MapReduce', 'HDFS'],
    correctAnswer: 3,
    points: 2,
  },
  {
    id: 'q4',
    category: 'Spark',
    type: 'mcq',
    question:
      'Why does Spark outperform MapReduce for iterative ML algorithms such as gradient descent?',
    options: [
      'In-memory RDD/DataFrame caching reduces repeated disk reads between iterations',
      'Spark eliminates the need for serialization',
      'MapReduce cannot run on commodity hardware',
      'Spark only supports batch processing',
    ],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q5',
    category: 'NLP',
    type: 'mcq',
    question:
      'For semantic similarity between documents, which representation is generally most effective?',
    options: ['Regex tokenization', 'SQL full-text search', 'TF-IDF alone', 'Contextual embeddings (e.g., BERT)'],
    correctAnswer: 3,
    points: 2,
  },
  {
    id: 'q6',
    category: 'AWS & Deployment',
    type: 'mcq',
    question:
      'You need autoscaling real-time inference for a PyTorch model with minimal ops overhead. Best choice?',
    options: ['Amazon RDS', 'Amazon S3', 'Amazon SageMaker Endpoints', 'AWS CloudFront'],
    correctAnswer: 2,
    points: 2,
  },
  {
    id: 'q7',
    category: 'Python & ML',
    type: 'mcq',
    question:
      'What is the main statistical reason to hold out a validation set during model development?',
    options: [
      'To estimate generalization on unseen data and tune hyperparameters without leaking test labels',
      'To increase training set size',
      'To guarantee the model converges',
      'To remove class imbalance automatically',
    ],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q8',
    category: 'API Security',
    type: 'mcq',
    question:
      'A valid JWT is presented but the user role lacks access to DELETE /admin/users. Which status code?',
    options: ['404 Not Found', '403 Forbidden', '401 Unauthorized', '200 OK'],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q9',
    category: 'Security',
    type: 'mcq',
    question:
      'Which mitigation most directly prevents SQL injection in application code?',
    options: [
      'Parameterized queries with bound user input',
      'Base64-encoding user input',
      'Using HTTPS only',
      'Storing passwords in plaintext',
    ],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q10',
    category: 'API Design',
    type: 'mcq',
    question:
      'Which combination is essential for production ML inference APIs handling sensitive data?',
    options: [
      'Public endpoints with obscured URLs',
      'HTTP with API keys in query strings',
      'Verbose error messages with stack traces',
      'TLS, authentication, authorization, and rate limiting',
    ],
    correctAnswer: 3,
    points: 2,
  },
  {
    id: 'q11',
    category: 'MLOps',
    type: 'mcq',
    question:
      'Production model accuracy drops because input feature distributions shifted since training. This is called:',
    options: ['Underfitting', 'Gradient explosion', 'Data drift / concept drift', 'Over-regularization'],
    correctAnswer: 2,
    points: 2,
  },
  {
    id: 'q12',
    category: 'Deep Learning',
    type: 'mcq',
    question:
      'In transformer architectures, which mechanism allows each token to weigh relevance of all other tokens?',
    options: ['Dropout', 'Batch normalization', 'Max pooling', 'Self-attention'],
    correctAnswer: 3,
    points: 2,
  },
  {
    id: 'q13',
    category: 'API Security',
    type: 'mcq',
    question:
      'Which OAuth 2.0 flow is recommended for server-side web apps that can securely store a client secret?',
    options: ['Authorization Code flow', 'Implicit flow in SPA without PKCE', 'Password grant for all users', 'Client credentials for end-user login'],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q14',
    category: 'Spark',
    type: 'mcq',
    question:
      'A Spark job is slow due to excessive shuffle across the cluster. What is the most likely root cause?',
    options: [
      'Using Parquet instead of CSV',
      'Wide dependencies (e.g., groupBy/join) causing data redistribution',
      'Too few partitions only on the driver',
      'Collecting small files to the driver',
    ],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q15',
    category: 'Statistics',
    type: 'mcq',
    question:
      'k-fold cross-validation primarily helps you:',
    options: [
      'Deploy models faster',
      'Guarantee 100% accuracy',
      'Obtain a more reliable estimate of model performance with limited data',
      'Eliminate the need for a test set entirely',
    ],
    correctAnswer: 2,
    points: 2,
  },
  {
    id: 'q16',
    category: 'Security',
    type: 'mcq',
    question:
      'Where should short-lived access tokens be stored in a browser-based SPA calling your API?',
    options: [
      'localStorage indefinitely',
      'Hard-coded in source',
      'Public GitHub repository',
      'Memory (or secure httpOnly cookie via backend) — never in localStorage long-term',
    ],
    correctAnswer: 3,
    points: 2,
  },
  {
    id: 'q17',
    category: 'Feature Engineering',
    type: 'mcq',
    question:
      'Why is feature scaling (e.g., StandardScaler) important before distance-based algorithms like k-NN?',
    options: [
      'Features on larger scales would dominate distance calculations',
      'It removes all outliers automatically',
      'It is only needed for neural networks',
      'It replaces missing value imputation',
    ],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q18',
    category: 'API Design',
    type: 'mcq',
    question:
      'Which algorithm is commonly used in API gateways to enforce rate limits per client over time windows?',
    options: ['K-Means', 'Apriori', 'Token bucket or sliding window', 'PageRank'],
    correctAnswer: 2,
    points: 2,
  },
  {
    id: 'q19',
    category: 'Deep Learning',
    type: 'mcq',
    question:
      'During training, vanishing gradients in very deep networks are most commonly mitigated by:',
    options: [
      'Removing all activation functions',
      'Increasing learning rate by 100×',
      'Residual connections and ReLU-family activations',
      'Using only batch size of 1',
    ],
    correctAnswer: 2,
    points: 2,
  },
  {
    id: 'q20',
    category: 'MLOps',
    type: 'mcq',
    question:
      'You must roll back a bad model deployment with zero downtime. Which pattern fits best?',
    options: [
      'Blue-green or canary deployment with traffic shifting',
      'Deleting the production database',
      'Hard-coding model weights in the client',
      'Disabling authentication temporarily',
    ],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q21',
    category: 'Security',
    type: 'mcq',
    question:
      'An API returns detailed stack traces and internal SQL to clients on 500 errors. Primary risk?',
    options: [
      'Improved debugging for attackers and information disclosure',
      'Faster response times',
      'Better SEO rankings',
      'Automatic GDPR compliance',
    ],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q22',
    category: 'NLP',
    type: 'mcq',
    question:
      'BLEU score is commonly used to evaluate which task?',
    options: [
      'Image classification accuracy',
      'Machine translation or text generation quality against references',
      'Clustering silhouette score',
      'Time-series forecasting MAPE',
    ],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q23',
    category: 'Big Data',
    type: 'mcq',
    question:
      'In Spark, what does a "narrow transformation" (e.g., map, filter) imply?',
    options: [
      'Each partition can be computed without shuffling data across the cluster',
      'It always triggers a full cluster restart',
      'It requires writing to HDFS first',
      'It cannot be pipelined with other stages',
    ],
    correctAnswer: 0,
    points: 2,
  },
  {
    id: 'q24',
    category: 'API Security',
    type: 'mcq',
    question:
      'Which header helps browsers block MIME-type sniffing attacks on API responses?',
    options: ['X-Content-Type-Options: nosniff', 'X-Powered-By: Express', 'Cache-Control: public', 'Access-Control-Allow-Origin: *'],
    correctAnswer: 0,
    points: 2,
  },
];

/** @deprecated Use mcqQuestionPool */
export const mcqQuestions = mcqQuestionPool;

export const codingQuestions: CodingQuestion[] = [
  {
    id: 'code1',
    category: 'Security',
    type: 'coding',
    language: 'Python',
    question: 'Fix SQL Injection Vulnerability',
    instructions: `The function below is vulnerable to SQL injection. Rewrite it to safely fetch a user by username using parameterized queries.

Requirements:
- Use parameterized queries (placeholders like ? or %s with a separate params tuple/list)
- Do NOT use f-strings, .format(), or string concatenation to build the SQL query
- Keep the function name and return behavior the same`,
    starterCode: `import sqlite3

def get_user_by_username(db_connection, username):
    """Fetch a single user row by username. FIX THE SECURITY ISSUE."""
    query = f"SELECT id, username, email FROM users WHERE username = '{username}'"
    cursor = db_connection.cursor()
    cursor.execute(query)
    return cursor.fetchone()
`,
    points: 5,
    criteria: [
      {
        id: 'c1a',
        label: 'Uses parameterized placeholder (? or %s)',
        points: 2,
        patterns: ['\\?|%s'],
      },
      {
        id: 'c1b',
        label: 'Passes parameters separately to execute()',
        points: 2,
        patterns: ['execute\\s*\\([^)]+,\\s*[^)]+\\)'],
      },
      {
        id: 'c1c',
        label: 'No string interpolation in SQL (no f-string/format concat)',
        points: 1,
        patterns: ['SELECT'],
      },
    ],
    sampleSolution: `def get_user_by_username(db_connection, username):
    query = "SELECT id, username, email FROM users WHERE username = ?"
    cursor = db_connection.cursor()
    cursor.execute(query, (username,))
    return cursor.fetchone()`,
  },
  {
    id: 'code2',
    category: 'API Security',
    type: 'coding',
    language: 'Python (Flask-style)',
    question: 'Implement a Secure API Endpoint',
    instructions: `Complete the Flask route handler below for GET /api/predictions/<prediction_id>.

Requirements:
- Validate the X-API-Key header; return 401 JSON error if missing or invalid
- Validate prediction_id is a positive integer; return 400 if invalid
- Return 404 JSON if prediction not found in the mock store
- Return 200 JSON with the prediction data on success
- Use jsonify() for all JSON responses`,
    starterCode: `from flask import Flask, request, jsonify

app = Flask(__name__)
VALID_API_KEYS = {"sk-live-abc123", "sk-test-xyz789"}
PREDICTIONS = {
    1: {"id": 1, "model": "fraud-detector", "score": 0.87},
    2: {"id": 2, "model": "churn-predictor", "score": 0.42},
}

@app.route("/api/predictions/<prediction_id>", methods=["GET"])
def get_prediction(prediction_id):
    """Implement secure access to ML prediction results."""
    # YOUR CODE HERE
    pass
`,
    points: 5,
    criteria: [
      {
        id: 'c2a',
        label: 'Validates X-API-Key header',
        points: 1,
        patterns: ['X-API-Key|x-api-key|api.key|api_key', 'headers'],
      },
      {
        id: 'c2b',
        label: 'Returns 401 for auth failure',
        points: 1,
        patterns: ['401'],
      },
      {
        id: 'c2c',
        label: 'Validates prediction_id as integer',
        points: 1,
        patterns: ['int\\(|isdigit|isnumeric|ValueError|try'],
      },
      {
        id: 'c2d',
        label: 'Returns 400 for bad input',
        points: 1,
        patterns: ['400'],
      },
      {
        id: 'c2e',
        label: 'Returns 404 when not found and 200 on success',
        points: 1,
        patterns: ['404', '200|jsonify'],
      },
    ],
    sampleSolution: `@app.route("/api/predictions/<prediction_id>", methods=["GET"])
def get_prediction(prediction_id):
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key not in VALID_API_KEYS:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        pid = int(prediction_id)
        if pid <= 0:
            raise ValueError()
    except ValueError:
        return jsonify({"error": "Invalid prediction ID"}), 400
    if pid not in PREDICTIONS:
        return jsonify({"error": "Not found"}), 404
    return jsonify(PREDICTIONS[pid]), 200`,
  },
];

export const questions: Question[] = [...mcqQuestionPool, ...codingQuestions];

export interface ExamMeta {
  shuffleMap: ShuffleMap;
  questionIds: string[];
}

export function getExamTotalPoints(questionIds: string[]): number {
  let total = 0;
  for (const id of questionIds) {
    const mcq = mcqQuestionPool.find((q) => q.id === id);
    if (mcq) {
      total += mcq.points;
      continue;
    }
    const code = codingQuestions.find((q) => q.id === id);
    if (code) total += code.points;
  }
  return total;
}

export function getTotalPoints(): number {
  return getExamTotalPoints([
    ...mcqQuestionPool.slice(0, MCQ_PER_EXAM).map((q) => q.id),
    ...codingQuestions.map((q) => q.id),
  ]);
}

function matchesCriterion(code: string, criterion: CodingCriterion): boolean {
  const normalized = code.replace(/\s+/g, ' ');
  const hasBadSqlInterpolation =
    /f["'`]\s*SELECT|SELECT[^"']*['"]\s*\+|\.format\s*\(\s*[^)]*SELECT/i.test(code);
  if (criterion.id === 'c1c' && hasBadSqlInterpolation) return false;
  return criterion.patterns.every((p) => new RegExp(p, 'i').test(normalized));
}

export function gradeCodingAnswer(
  code: string,
  question: CodingQuestion
): { earned: number; max: number; criteriaResults: Record<string, boolean> } {
  const criteriaResults: Record<string, boolean> = {};
  let earned = 0;

  for (const c of question.criteria) {
    const passed = code.trim().length > 20 && matchesCriterion(code, c);
    criteriaResults[c.id] = passed;
    if (passed) earned += c.points;
  }

  return { earned, max: question.points, criteriaResults };
}

export function gradeAnswers(
  answers: Record<string, AnswerValue>,
  exam?: ExamMeta
): GradeResult {
  const breakdown: GradeResult['breakdown'] = {};
  const codingDetails: GradeResult['codingDetails'] = {};
  let score = 0;

  const questionIds =
    exam?.questionIds ??
    [...mcqQuestionPool.map((q) => q.id), ...codingQuestions.map((q) => q.id)];
  const shuffleMap = exam?.shuffleMap ?? {};

  for (const id of questionIds) {
    const mcq = mcqQuestionPool.find((q) => q.id === id);
    if (mcq) {
      const userAnswer = answers[id];
      const correct = gradeMcqWithShuffle(
        id,
        typeof userAnswer === 'number' ? userAnswer : null,
        shuffleMap
      );
      breakdown[id] = correct;
      if (correct) score += mcq.points;
      continue;
    }

    const coding = codingQuestions.find((q) => q.id === id);
    if (coding) {
      const userAnswer = answers[id];
      const code = typeof userAnswer === 'string' ? userAnswer : '';
      const result = gradeCodingAnswer(code, coding);
      breakdown[id] = result;
      codingDetails[id] = { ...result, code };
      score += result.earned;
    }
  }

  const totalPoints = getExamTotalPoints(questionIds);
  return { score, totalPoints, breakdown, codingDetails };
}

export function getIntegrityRisk(session: {
  tab_switches: number;
  focus_losses: number;
  copy_events: number;
  paste_events: number;
  links_opened_json: string | null;
  fullscreen_exits: number;
}): { level: 'low' | 'medium' | 'high'; flags: string[] } {
  const flags: string[] = [];
  const links = session.links_opened_json
    ? (JSON.parse(session.links_opened_json) as unknown[]).length
    : 0;

  if (session.tab_switches > 3) flags.push(`Excessive tab switches (${session.tab_switches})`);
  if (session.focus_losses > 5) flags.push(`Frequent focus loss (${session.focus_losses})`);
  if (session.copy_events > 2) flags.push(`Copy events detected (${session.copy_events})`);
  if (session.paste_events > 0) flags.push(`Paste events detected (${session.paste_events})`);
  if (links > 0) flags.push(`External links opened (${links})`);
  if (session.fullscreen_exits > 2) flags.push(`Fullscreen exits (${session.fullscreen_exits})`);

  let level: 'low' | 'medium' | 'high' = 'low';
  if (flags.length >= 3 || session.tab_switches > 8 || links > 2) level = 'high';
  else if (flags.length >= 1) level = 'medium';

  return { level, flags };
}

export interface GradeResult {
  score: number;
  totalPoints: number;
  breakdown: Record<string, boolean | { earned: number; max: number; criteriaResults: Record<string, boolean> }>;
  codingDetails: Record<string, { earned: number; max: number; criteriaResults: Record<string, boolean>; code: string }>;
}

export function isQuestionAnswered(
  q: { type: string; id: string },
  answer: AnswerValue,
  starterCode?: string
): boolean {
  if (answer === null || answer === undefined) return false;
  if (q.type === 'coding') {
    return typeof answer === 'string' && answer.trim().length > 30 && answer !== starterCode;
  }
  return true;
}

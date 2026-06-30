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

export const mcqQuestions: McqQuestion[] = [
  {
    id: 'q1',
    category: 'Machine Learning',
    type: 'mcq',
    question:
      'Which TensorFlow API is most commonly used for building and training deep neural networks with high-level abstractions?',
    options: ['TensorFlow Lite', 'Keras (tf.keras)', 'TensorFlow Serving', 'XLA Compiler'],
    correctAnswer: 1,
    points: 2,
    explanation: 'tf.keras provides a high-level API for building and training models in TensorFlow.',
  },
  {
    id: 'q2',
    category: 'Unsupervised Learning',
    type: 'mcq',
    question:
      'Which unsupervised learning algorithm is best suited for grouping customers into segments based on purchasing behavior without labeled data?',
    options: ['Linear Regression', 'K-Means Clustering', 'Logistic Regression', 'Random Forest Classifier'],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q3',
    category: 'Big Data',
    type: 'mcq',
    question:
      'In a Hadoop ecosystem, which component is primarily responsible for distributed storage of large datasets?',
    options: ['MapReduce', 'HDFS', 'YARN', 'Hive'],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q4',
    category: 'Spark',
    type: 'mcq',
    question:
      'What is the primary advantage of Apache Spark over traditional MapReduce for iterative machine learning workloads?',
    options: [
      'Spark only works on structured data',
      'In-memory computation reduces disk I/O between iterations',
      'Spark cannot run on Hadoop clusters',
      'MapReduce is always faster for ML',
    ],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q5',
    category: 'NLP',
    type: 'mcq',
    question:
      'Which NLP technique converts text into numerical vectors that capture semantic meaning, commonly used for similarity search and classification?',
    options: ['TF-IDF only', 'Word Embeddings (e.g., Word2Vec, BERT)', 'Regex parsing', 'SQL joins'],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q6',
    category: 'AWS & Deployment',
    type: 'mcq',
    question:
      'Which AWS service is most appropriate for deploying a trained ML model as a scalable REST API endpoint?',
    options: ['Amazon S3', 'Amazon SageMaker Endpoints', 'Amazon RDS', 'AWS Lambda only (no ML support)'],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q7',
    category: 'Python & ML',
    type: 'mcq',
    question:
      'In scikit-learn, what is the purpose of a train_test_split?',
    options: [
      'To deploy models to AWS',
      'To evaluate model performance on unseen data and prevent overfitting',
      'To perform ETL extraction',
      'To cluster unlabeled data',
    ],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q8',
    category: 'API Security',
    type: 'mcq',
    question:
      'Which HTTP status code should a REST API return when a client presents valid credentials but lacks permission for the requested resource?',
    options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '500 Internal Server Error'],
    correctAnswer: 1,
    points: 2,
    explanation: '403 indicates authenticated but not authorized; 401 means authentication failed or is missing.',
  },
  {
    id: 'q9',
    category: 'Security',
    type: 'mcq',
    question:
      'What is the primary purpose of using parameterized queries (prepared statements) in database access code?',
    options: [
      'Improve query performance only',
      'Prevent SQL injection by separating query structure from user input',
      'Encrypt data at rest',
      'Enable cross-origin requests',
    ],
    correctAnswer: 1,
    points: 2,
  },
  {
    id: 'q10',
    category: 'API Design',
    type: 'mcq',
    question:
      'Which practice is considered a security best practice for REST APIs that expose sensitive ML inference endpoints?',
    options: [
      'Embedding API keys in client-side JavaScript',
      'Using HTTPS, authentication, and rate limiting on all endpoints',
      'Returning full stack traces in error responses',
      'Disabling CORS entirely without alternative access controls',
    ],
    correctAnswer: 1,
    points: 2,
  },
];

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

export const questions: Question[] = [...mcqQuestions, ...codingQuestions];

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

export function getTotalPoints(): number {
  return questions.reduce((sum, q) => sum + q.points, 0);
}

export interface GradeResult {
  score: number;
  totalPoints: number;
  breakdown: Record<string, boolean | { earned: number; max: number; criteriaResults: Record<string, boolean> }>;
  codingDetails: Record<string, { earned: number; max: number; criteriaResults: Record<string, boolean>; code: string }>;
}

export function gradeAnswers(
  answers: Record<string, AnswerValue>
): GradeResult {
  const breakdown: GradeResult['breakdown'] = {};
  const codingDetails: GradeResult['codingDetails'] = {};
  let score = 0;

  for (const q of questions) {
    const userAnswer = answers[q.id];

    if (q.type === 'mcq') {
      if (userAnswer === null || userAnswer === undefined) {
        breakdown[q.id] = false;
        continue;
      }
      const correct = userAnswer === q.correctAnswer;
      breakdown[q.id] = correct;
      if (correct) score += q.points;
    } else if (q.type === 'coding') {
      const code = typeof userAnswer === 'string' ? userAnswer : '';
      const result = gradeCodingAnswer(code, q);
      breakdown[q.id] = result;
      codingDetails[q.id] = { ...result, code };
      score += result.earned;
    }
  }

  return { score, totalPoints: getTotalPoints(), breakdown, codingDetails };
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

export function isQuestionAnswered(q: Question, answer: AnswerValue): boolean {
  if (answer === null || answer === undefined) return false;
  if (q.type === 'coding') return typeof answer === 'string' && answer.trim().length > 30;
  return true;
}

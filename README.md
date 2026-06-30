# AI Developer Technical Screening Platform

A professional online assessment system for hiring AI Developer candidates. Candidates register, complete a timed technical test, and results appear in an admin dashboard with anti-cheating behavior monitoring.

## Features

### Candidate Portal (`/`)
- Professional registration form (name, email, phone, LinkedIn, experience, role)
- Test integrity policy acknowledgment
- 45-minute timed assessment with 20 AI/ML questions
- Auto-grading with instant score calculation

### Technical Test (`/test`)
- 20 questions covering job-relevant topics:
  - TensorFlow, ML frameworks, model optimization
  - Unsupervised learning, NLP, data mining
  - Hadoop, Spark, ETL pipelines
  - AWS deployment, database design, analytics
- Question types: multiple choice, multi-select, true/false
- Question navigator and progress tracking
- Countdown timer with auto-submit on expiry

### Anti-Cheating / Proctoring
- **Tab switch detection** — logs when candidate leaves the test tab
- **Window focus tracking** — records blur/focus events
- **Copy/paste blocking** — prevents clipboard actions
- **Right-click disabled** — blocks context menu
- **External link blocking** — logs any external URLs clicked
- **Keyboard shortcut blocking** — Ctrl+C/V/A, DevTools shortcuts
- **Fullscreen mode** — recommended on test start
- **Periodic sync** — behavior logs sent to server every 15 seconds
- **Integrity risk scoring** — low / medium / high flags in admin

### Admin Dashboard (`/admin`)
- Password-protected access
- Overview stats: total attempts, pass rate, average score
- Filterable results table (all, submitted, passed, flagged)
- Search by candidate name or email
- Detailed per-candidate view with:
  - Full answer breakdown (correct/incorrect per question)
  - Behavior event timeline
  - External links attempted
  - Integrity risk report

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and set admin password
copy .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the candidate portal.

Admin dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

**Default admin password:** `admin123` (change via `ADMIN_PASSWORD` in `.env`)

## Production

```bash
npm run build
npm start
```

Set `ADMIN_PASSWORD` to a strong password in production.

## Persistent database (required for Vercel)

On Vercel, the filesystem is **ephemeral** — local SQLite files are wiped on every redeploy. This app uses **[Turso](https://turso.tech)** (hosted libSQL) so candidate results persist permanently.

### Setup Turso (free tier)

1. Sign up at [turso.tech](https://turso.tech)
2. Install CLI: `curl -sSfL https://get.tur.so/install.sh | bash` (or see Turso docs for Windows)
3. Create a database:
   ```bash
   turso auth login
   turso db create ai-test-online
   turso db show ai-test-online --url
   turso db tokens create ai-test-online
   ```
4. Add to **Vercel** → Project → Settings → Environment Variables:
   - `TURSO_DATABASE_URL` = `libsql://...` (from step 3)
   - `TURSO_AUTH_TOKEN` = token from step 3
5. Redeploy the project

**Local development** uses `data/screening.db` automatically when Turso env vars are not set.

Data is stored in Turso's cloud — survives redeployments, scaling, and cold starts.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Candidate registration
│   ├── test/page.tsx         # Timed test with proctoring
│   ├── complete/page.tsx     # Submission confirmation
│   ├── admin/page.tsx        # Admin dashboard
│   ├── admin/[id]/page.tsx   # Candidate detail view
│   └── api/                  # REST API routes
├── components/
│   ├── CandidateForm.tsx
│   └── TestInterface.tsx
├── hooks/
│   └── useProctor.ts         # Anti-cheat behavior tracking
└── lib/
    ├── db.ts                 # SQLite database
    ├── questions.ts          # Test questions & grading
    └── utils.ts
```

## Scoring

- **Total points:** 35
- **Passing threshold:** 60% (21+ points)
- Multi-select questions require all correct options selected
- Unanswered questions score 0

## Customization

- Edit questions in `src/lib/questions.ts`
- Adjust duration via `TEST_DURATION_MINUTES`
- Change passing score via `PASSING_PERCENTAGE`
- Modify integrity thresholds in `getIntegrityRisk()` in `questions.ts`

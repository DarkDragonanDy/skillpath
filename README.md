# SkillPath

AI-powered personalized learning platform. Enter any skill — the multi-agent backend assesses your level, plans a curriculum, generates lesson content, finds resources, and reviews quality before delivering the final course.

> Built collaboratively by Andrej and Claude (Anthropic).

---

## Features

- **Multi-agent pipeline** — 4 specialized AI agents collaborate to produce each learning plan
- **Level assessment** — adaptive quiz determines beginner / intermediate / advanced
- **Student profile** — Assessor agent analyzes your answers for personalized output
- **Parallel generation** — content and resources generated concurrently per lesson
- **Quality review** — Reviewer agent flags weak lessons for automatic retry
- **Quiz per lesson** — test your understanding, track scores
- **Save & resume** — courses stored in Firestore, continue anytime
- **Demo mode** — test the full UI without any AI calls

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| State | Zustand |
| Backend | Firebase Cloud Functions (TypeScript) |
| AI | Anthropic Claude Haiku (via `@anthropic-ai/sdk`) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google) |

---

## Agent Architecture

```
User answers quiz
       │
       ▼
  [Assessor]  →  student profile (level, goals, gaps)
       │
       ▼
  [Curriculum Planner]  →  6 lesson outlines (no content yet)
       │
       ├──────────────────────────┐
       ▼                          ▼
  [Content Generator]      [Resource Finder]
  (batches of 2, parallel) (batches of 2, parallel)
       │                          │
       └──────────┬───────────────┘
                  ▼
           [Quality Reviewer]  →  approved or retry weak lessons
                  │
                  ▼
           Final learning plan
```

All agents use Claude Haiku. Content and Resource agents run in **batches of 2** to stay within concurrent connection limits.

---

## Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore + Authentication enabled
- An Anthropic API key

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd skillpath
npm install
cd functions && npm install && cd ..
```

### 2. Configure Firebase

```bash
firebase login
firebase use --add   # select your project
```

### 3. Set the Anthropic secret

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# paste your key when prompted
```

### 4. Frontend environment

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Running Locally

### Frontend only

```bash
npm run dev
```

Opens at `http://localhost:5173`. The app will call the **deployed** Cloud Functions (URLs in `src/services/ai.ts`).

### Cloud Functions emulator

```bash
firebase emulators:start --only functions
```

Then update `src/services/ai.ts` URLs to `http://127.0.0.1:5001/<project-id>/us-central1/<functionName>`.

---

## Testing

### Demo mode (zero AI calls)

Click **"Try Demo (no AI)"** on the home page. Loads a hardcoded JavaScript course instantly — useful for testing UI, navigation, quiz flow, and Firestore saves without consuming tokens.

### Backend health check

```bash
curl https://us-central1-<project-id>.cloudfunctions.net/ping
# → {"status":"ok","timestamp":"...","version":"2.0.0-multi-agent"}
```

### TypeScript type check

```bash
# Frontend
npx tsc --noEmit

# Cloud Functions
cd functions && npm run build
```

---

## Deploying

### Deploy everything

```bash
firebase deploy
```

### Deploy functions only

```bash
firebase deploy --only functions
```

### Deploy hosting only

```bash
npm run build
firebase deploy --only hosting
```

> After first deploy, copy the printed function URLs into `src/services/ai.ts` constants.

---

## Project Structure

```
skillpath/
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx       # skill input + saved courses + demo button
│   │   ├── AssessPage.tsx     # adaptive quiz → Assessor agent
│   │   └── LearningPage.tsx   # lesson viewer + quiz + progress
│   ├── services/
│   │   └── ai.ts              # Cloud Functions client + demo plan
│   ├── store/
│   │   └── skillStore.ts      # Zustand global state
│   └── types/
│       └── skill.ts           # shared TypeScript interfaces
├── functions/
│   └── src/
│       └── index.ts           # all Cloud Functions + agent logic
└── firebase.json
```

---

## Common Issues

| Problem | Fix |
|---|---|
| `rate_limit_error` on concurrent connections | Already handled — agents run in batches of 2 |
| Empty resource URLs | Already handled — falls back to YouTube search |
| Function timeout | `generatePlanAgentic` has `timeoutSeconds: 120` |
| CORS error | All functions set `Access-Control-Allow-Origin: *` |

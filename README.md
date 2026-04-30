# SkillPath

AI-powered personalized learning platform. Enter any skill — the multi-agent backend assesses your level, plans a curriculum, generates lesson content, finds resources, and reviews quality before delivering the final course.

> Built collaboratively by Andrej and Claude (Anthropic).

---

## Try it live

**https://skill-path-0001.web.app**

No installation required. Open the link, sign in with Google, and start learning.

---

## Testing guide (for reviewers)

### Recommended flow

1. Open **https://skill-path-0001.web.app**
2. Sign in with any Google account
3. Type a skill in the input field — e.g. `Python`, `CSS`, `Machine Learning`, `Guitar`
4. Click **Start →** and answer 4–5 assessment questions
5. After the last answer, wait **30–40 seconds** — the multi-agent pipeline is running:
   - Assessor analyzes your answers
   - Curriculum Planner builds the lesson structure
   - Content Generator and Resource Finder work in parallel
   - Quality Reviewer validates and may trigger a retry
6. Browse the generated lessons in the sidebar
7. Click **📝 Take Quiz to Complete Lesson** at the bottom of any lesson
8. After completing a lesson, progress is saved — you can close the tab and resume later

### Demo mode (instant, no AI)

If you want to test the UI without waiting for generation, click **Try Demo (no AI)** on the home page. It loads a pre-built JavaScript course immediately — no API calls, no delay.

### What to verify

- [ ] Assessment questions are relevant to the entered skill
- [ ] Generated lessons progress logically from basic to advanced
- [ ] Each lesson has working resource links (YouTube or documentation)
- [ ] Quiz questions test understanding of the lesson content
- [ ] Progress is saved when you navigate between lessons
- [ ] Resuming a course from the home page restores the correct lesson

---

## Features

- **Multi-agent pipeline** — 4 specialized AI agents collaborate to produce each learning plan
- **Level assessment** — adaptive quiz determines beginner / intermediate / advanced
- **Student profile** — Assessor agent analyzes answers for personalized output
- **Parallel generation** — content and resources generated concurrently per lesson
- **Quality review** — Reviewer agent flags weak lessons for automatic retry
- **Quiz per lesson** — test understanding, track scores
- **Save & resume** — courses stored in Firestore, continue anytime
- **Demo mode** — test the full UI without any AI calls

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
           Final learning plan (~30–40 seconds total)
```

All agents use Claude Haiku. Content and Resource agents run in **batches of 2** to stay within concurrent connection rate limits.

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
| Hosting | Firebase Hosting |

---

## Local development setup

> This section is for developers who want to run the project locally. To simply test the app, use the live link above.

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore + Authentication enabled
- An Anthropic API key

### Install

```bash
git clone https://github.com/DarkDragonanDy/skillpath
cd skillpath
npm install
cd functions && npm install && cd ..
```

### Configure Firebase

```bash
firebase login
firebase use --add
```

### Set the Anthropic API key

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
```

### Frontend environment

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Run

```bash
npm run dev
```

The app calls the deployed Cloud Functions by default. To run functions locally, start the emulator and update the URLs in `src/services/ai.ts`.

### Deploy

```bash
npm run build && firebase deploy
```

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

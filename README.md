# LearnMate AI — Your Personal AI Learning Tutor

> **"Your Personal AI Tutor. Your Pace. Your Potential."**
> A modern, adaptive full-stack educational web application that delivers personalized learning paths, interactive Socratic and conceptual tutoring, document-grounded RAG retrieval, SM-2 active recall flashcards, and explainable topic mastery analytics.

---

## 🌟 Key Architecture & Capabilities

1. **Intelligent AI Tutor (6 Specialized Pedagogical Modes)**
   - **Beginner Mode:** Everyday analogies with zero unnecessary jargon.
   - **Conceptual Mode:** Deep-dive mechanisms breaking down fundamental "how" and "why".
   - **Exam Prep Mode:** High-yield summaries, marking criteria, and trick trap avoidance.
   - **Socratic Mode:** Guided inquiry providing progressive hints without revealing answers.
   - **Practical Mode:** Worked code examples, step-by-step algorithms, and hands-on exercises.
   - **Revision Mode:** Rapid recall summaries and active weakness identification.

2. **Retrieval-Augmented Generation (RAG) Grounding**
   - Server-side document text extraction (`.pdf`, `.txt`, `.md`).
   - Semantic chunking with context overlap.
   - Embeddings and vector cosine similarity search.
   - Grounded Q&A with explicit section/page citations and hallucination guardrails.

3. **Adaptive Learning Engine**
   - Transparent, explainable topic mastery score (0–100) based on accuracy, difficulty weighting, and recency trends.
   - Heuristic difficulty tiers: Foundational Review (<50%), Guided Practice (50–69%), Intermediate Application (70–84%), Advanced Mastery (85%+).
   - Evidence-based personalized recommendations with pedagogical rationale.

4. **Curriculum Roadmap & Lesson Generator**
   - AI-generated modular learning paths based on available study hours per week and target dates.
   - Structured lessons containing Overview, Verifiable Objectives, Core Explanations, Worked Examples, Key Terminology, Misconceptions, and Interactive Practice Checks.

5. **Anti-Cheat Practice Quizzes**
   - Multiple choice, True/False, Short Answer, and Fill-in-the-blank assessments.
   - Anti-cheat protection: Answer keys and explanations are strictly withheld from client responses during testing.
   - Deterministic server-side grading updating database mastery scores in real time.

6. **Active Recall Flashcards (SM-2 Algorithm)**
   - 3D interactive flip card experience with Easy, Medium, and Hard recall feedback.
   - SuperMemo SM-2 spaced repetition calculation adjusting ease factors and review intervals.

7. **Weekly Study Planner & Timetable**
   - Schedule sessions, track planned vs. actual minutes, mark completion, and reschedule.

8. **Progress Analytics (Recharts)**
   - Real metrics aggregated from database records: streaks, total study hours, lesson completion count, and quiz accuracy curves.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v7, React Markdown (remark-gfm), canvas-confetti.
- **Backend:** Node.js, Express, TypeScript, Official OpenAI SDK (`openai`), Multer, `pdf-parse`, `uuid`, `zod`.
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security RLS) + Resilient persistent storage engine for local zero-downtime operation.
- **Testing:** Jest, Supertest, ts-jest (19 automated unit & integration tests covering security, anti-cheat, grading, and algorithms).

---

## 📁 Project Structure

```
learnmate-ai/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # UI & Layout components (AppLayout, Navbar, Footer, Modal, Button)
│   │   ├── context/            # AuthContext (Supabase Auth + Instant Demo Student Account)
│   │   ├── pages/              # 20 Complete Application Pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TutorPage.tsx
│   │   │   ├── ConversationHistoryPage.tsx
│   │   │   ├── LearningPathsPage.tsx
│   │   │   ├── LearningPathDetailPage.tsx
│   │   │   ├── LessonReaderPage.tsx
│   │   │   ├── QuizSetupPage.tsx
│   │   │   ├── QuizTakerPage.tsx
│   │   │   ├── QuizResultsPage.tsx
│   │   │   ├── StudyMaterialsPage.tsx
│   │   │   ├── FlashcardsPage.tsx
│   │   │   ├── StudyPlannerPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── PrivacyPolicyPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── services/           # api.ts (fetch client + SSE streaming), supabase.ts
│   │   └── types/              # TypeScript interfaces matching backend models
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── middleware/         # auth.ts (Supabase JWT verify), rateLimiter.ts, errorHandler.ts
│   │   ├── prompts/            # tutorPrompts.ts (System instructions for 6 tutor modes)
│   │   ├── routes/             # REST API routes (auth, tutor, paths, lessons, quizzes, docs, flashcards, planner, analytics)
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── services/           # ai.ts (OpenAI SDK), db.ts (Supabase/local store), rag.ts, mastery.ts, spacedRepetition.ts
│   │   ├── types/              # Server-side TypeScript interfaces
│   │   ├── __tests__/          # Automated Jest + Supertest integration tests
│   │   └── app.ts              # Express application configuration & health check
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # 15 PostgreSQL tables, indexes, triggers, and RLS policies
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v24+ tested)
- **npm**: v9.0.0 or higher

### 2. Install Dependencies
From the root directory:
```bash
npm run install:all
```
*(Or navigate into `client` and `server` individually and run `npm install`).*

### 3. Environment Configuration
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

Default `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# OpenAI API Key (Optional for live inference; includes high-quality fallback engine)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Supabase (Optional for local dev; includes resilient local persistent store)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 4. Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend API Server on port 5000):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend Client on port 5173):**
```bash
npm run dev:client
```

Open your browser at: **`http://localhost:5173`**

> **💡 Quick Evaluator Test Drive:**
> Click **"Instant Demo Student Tour"** on the landing page or login page to explore pre-configured roadmaps, quizzes, flashcards, and mastery analytics with zero setup!

---

## 🧪 Automated Testing

Run the full automated test suite (19 test cases):
```bash
npm test
```

Tests verify:
- Health check and route 404 handling.
- Authentication requirements (401 on missing token).
- Profile update validation via Zod schemas.
- Student data isolation (Student B cannot read or delete Student A's records).
- AI Tutor conversation streaming and persistence.
- Learning path curriculum generation and lesson completion.
- Quiz anti-cheat protection (client answer-key stripping).
- Deterministic server-side quiz grading and mastery updates.
- SuperMemo SM-2 spaced repetition interval calculations.
- Adaptive mastery difficulty tier categorization.
- Real database-computed progress analytics.

---

## 🗄️ Database Setup & Supabase Migration

When deploying to a live Supabase project:
1. Create a project at [https://supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and execute the contents of:
   `supabase/migrations/001_initial_schema.sql`
4. This creates all 15 tables (`profiles`, `conversations`, `messages`, `learning_paths`, `modules`, `lessons`, `lesson_progress`, `quizzes`, `quiz_attempts`, `topic_mastery`, `study_sessions`, `study_documents`, `document_chunks`, `flashcards`) with automatic `updated_at` triggers and strict **Row Level Security (RLS)** policies.
5. Copy your **Project URL** and **Service Role Key / Anon Key** into `server/.env`.

---

## 🌐 Production Deployment Guide

### Deploy Backend (Render / Railway / Fly.io)
1. Set the root directory or point build to `server`.
2. Build command: `npm run build`
3. Start command: `npm start`
4. Environment variables to set on host:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `CLIENT_URL=https://your-frontend-app.vercel.app`
   - `OPENAI_API_KEY=sk-...`
   - `SUPABASE_URL=https://...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`

### Deploy Frontend (Vercel)
1. Point root to `client`.
2. Framework Preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variables:
   - `VITE_API_BASE_URL=https://your-backend-api.onrender.com/api`
   - `VITE_SUPABASE_URL=https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=...`

---

## 🛡️ Security & Privacy Architecture

- **PostgreSQL Row Level Security (RLS):** Every row is tied to the authenticated user ID (`auth.uid() = user_id`).
- **No Client User Spoofing:** User identity is strictly derived from verified tokens on the backend.
- **Anti-Cheat Quiz Protection:** Question answer keys and explanations are omitted on client retrieval and evaluated deterministically on the server.
- **Input Validation:** Every payload is validated against strict Zod schemas.
- **Rate Limiting:** AI endpoints are protected with sliding-window rate limiters.
- **Secret Hygiene:** Secrets and API keys are restricted to environment variables and never exposed to browser bundles.

---

## 📄 License
MIT © LearnMate AI Team.

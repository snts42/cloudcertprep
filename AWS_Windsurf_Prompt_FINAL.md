# AWS CLF-C02 "4-in-1" Study App — Windsurf Master Prompt

---

## IMPORTANT INSTRUCTIONS FOR WINDSURF

- Work through this **one phase at a time**
- **Stop and confirm** with me after each phase before continuing
- **Do not install unnecessary packages** — use only what is listed
- If anything is unclear or you need credentials, **ask before writing code**
- After each phase, tell me: what you built, what commands I need to run, and what to check

---

## ROLE & MISSION

You are a Senior Full-Stack Engineer. We are building a **"Driving Theory 4-in-1" style web application** for the **AWS Certified Cloud Practitioner (CLF-C02)** exam called **CloudPass**.

This is a desktop-first web app that replicates the real exam experience — not a flashcard app. The UX should feel clean, focused, dark-themed, and professional — similar to UK Driving Theory Test 4-in-1 apps.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS (desktop-first, responsive) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Database | Supabase (Postgres + Row Level Security) |
| Hosting | Netlify (auto-deploy from GitHub) |
| Charts | Recharts |
| Routing | React Router v6 |

**Do not add any other libraries unless absolutely necessary.**

---

## PROJECT CONTEXT

- The `/practice-exam` folder in the project root contains **23 Markdown (.md) files** — these are MIT-licensed AWS CLF-C02 practice questions from the open source repo: https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes
- Each file contains roughly 30 questions in a consistent Markdown format
- These need to be parsed into a single JSON file that powers the entire app
- The user already has: Supabase project created, Netlify account ready, GitHub repo ready

---

## PHASE 1 — PROJECT SETUP

### Step 1: Initialise the project
```bash
npm create vite@latest cloudpass -- --template react-ts
cd cloudpass
npm install
```

### Step 2: Install all dependencies in one go
```bash
npm install @supabase/supabase-js react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind
Update `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'aws-orange': '#FF9900',
        'bg-dark': '#0F1923',
        'bg-card': '#1A2332',
        'bg-card-hover': '#1E2A3A',
        'success': '#22C55E',
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'text-primary': '#F8FAFC',
        'text-muted': '#94A3B8',
      },
    },
  },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0F1923;
  color: #F8FAFC;
  font-family: system-ui, -apple-system, sans-serif;
}
```

### Step 4: Environment variables
Create `.env` in the project root:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Create `.gitignore`:
```
node_modules
dist
.env
```

### Step 5: Supabase client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 6: TypeScript types
Create `src/types/index.ts` with all shared types:
```typescript
export interface Question {
  id: string
  domainId: 1 | 2 | 3 | 4
  domainName: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  source: string
  isMultiAnswer?: boolean // flag "Choose TWO" questions — skip them for now
}

export interface ExamAttempt {
  id: string
  user_id: string
  attempted_at: string
  score_percent: number
  scaled_score: number
  passed: boolean
  time_taken_seconds: number
  total_questions: number
  correct_answers: number
  domain_1_score: number
  domain_2_score: number
  domain_3_score: number
  domain_4_score: number
}

export interface AttemptQuestion {
  id: string
  attempt_id: string
  question_id: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
  was_flagged: boolean
  domain_id: number
}

export interface DomainProgress {
  domain_id: number
  domain_name: string
  questions_attempted: number
  questions_correct: number
  mastery_percent: number
}

export interface WeakSpot {
  question_id: string
  incorrect_count: number
  correct_streak: number
  is_cleared: boolean
}

export const DOMAINS = {
  1: 'Cloud Concepts',
  2: 'Security & Compliance',
  3: 'Cloud Technology & Services',
  4: 'Billing, Pricing & Support',
} as const

export const DOMAIN_COLORS = {
  1: '#3B82F6',
  2: '#EF4444',
  3: '#22C55E',
  4: '#F59E0B',
} as const
```

### Step 7: Folder structure
Create all folders:
```
src/
  components/
  pages/
  hooks/
  lib/
  types/
  data/
```

### Step 8: Basic routing
Set up `src/App.tsx` with React Router. Routes needed:
- `/` → Dashboard (protected)
- `/login` → Login page
- `/mock-exam` → Mock Exam (protected)
- `/domain-practice` → Domain Practice (protected)
- `/weak-spot` → Weak Spot Trainer (protected)
- `/scenarios` → Scenario Practice (protected)
- `/history` → Attempt History (protected)
- `/credits` → Credits page (public)

Protected routes: if user is not logged in via Supabase Auth, redirect to `/login`.

Create a `ProtectedRoute` component that checks `supabase.auth.getSession()`.

### Phase 1 complete when:
- `npm run dev` runs without errors
- Browser shows a basic page at localhost:5173
- Tailwind dark background (`#0F1923`) is visible
- No TypeScript errors

---

## PHASE 2 — QUESTION PARSER

Write a Node.js script at `scripts/parseQuestions.mjs` that:

1. Reads all `.md` files from the `/practice-exam` folder in the project root
2. Parses each question using this pattern:
   - Question number and text
   - Options A, B, C, D
   - Correct answer line (format: `Correct answer: B` or `Correct answer: B, E` for multi-answer)
3. **Skips any question with multiple correct answers** (where answer contains a comma — e.g. "B, E") — flag these as `isMultiAnswer: true` and exclude them from the main array
4. Assigns each question a unique ID: `q001`, `q002`, etc.
5. Categorises each question into a domain by keyword matching on the question text:

   **Domain 1 — Cloud Concepts** (keywords): cloud computing, elasticity, scalability, CapEx, OpEx, IaaS, PaaS, SaaS, high availability, fault tolerance, agility, shared responsibility model, global infrastructure, region, availability zone, edge location, disaster recovery, on-premises

   **Domain 2 — Security & Compliance** (keywords): IAM, MFA, encryption, KMS, Shield, WAF, compliance, GuardDuty, security group, NACL, root user, least privilege, penetration, artifact, Macie, Inspector, Detective, firewall, identity, access, policy, role, permission, certificate, secrets manager

   **Domain 3 — Cloud Technology & Services** (keywords): EC2, S3, RDS, Lambda, VPC, CloudFront, Route 53, ELB, auto scaling, SQS, SNS, DynamoDB, ECS, EKS, CloudWatch, CloudTrail, Elastic Beanstalk, Fargate, API Gateway, CloudFormation, Elastic, storage, compute, database, serverless, container, load balancer, CDN

   **Domain 4 — Billing, Pricing & Support** (keywords): pricing, billing, cost, budget, savings plan, reserved instance, support plan, organisation, consolidated billing, TCO, free tier, calculator, invoice, expenditure, pay-as-you-go, on-demand

6. Deduplicates questions by comparing question text (case-insensitive, trimmed)
7. Outputs `src/data/master_questions.json`
8. Logs to console:
   ```
   Total questions parsed: X
   Multi-answer questions skipped: X
   Duplicates removed: X
   Final question count: X
   Domain 1 (Cloud Concepts): X questions
   Domain 2 (Security & Compliance): X questions
   Domain 3 (Cloud Technology & Services): X questions
   Domain 4 (Billing, Pricing & Support): X questions
   ```

Run with: `node scripts/parseQuestions.mjs`

### Phase 2 complete when:
- Script runs without errors
- `src/data/master_questions.json` exists with 400+ questions
- All four domains have questions assigned
- No question has a multi-letter answer

---

## PHASE 3 — SUPABASE DATABASE

Output the following SQL as a single copyable block. **I will run this manually in the Supabase SQL editor.** Do not attempt to run it programmatically.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User progress per domain
CREATE TABLE domain_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id integer NOT NULL CHECK (domain_id BETWEEN 1 AND 4),
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  mastery_percent numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, domain_id)
);

-- Mock exam attempts
CREATE TABLE exam_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at timestamptz DEFAULT now(),
  score_percent numeric NOT NULL,
  scaled_score integer NOT NULL,
  passed boolean NOT NULL,
  time_taken_seconds integer NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  domain_1_score numeric DEFAULT 0,
  domain_2_score numeric DEFAULT 0,
  domain_3_score numeric DEFAULT 0,
  domain_4_score numeric DEFAULT 0
);

-- Per-question results per attempt
CREATE TABLE attempt_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id uuid REFERENCES exam_attempts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  user_answer text,
  correct_answer text NOT NULL,
  is_correct boolean NOT NULL,
  was_flagged boolean DEFAULT false,
  domain_id integer NOT NULL
);

-- Weak spot tracking
CREATE TABLE weak_spots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  incorrect_count integer DEFAULT 0,
  correct_streak integer DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  is_cleared boolean DEFAULT false,
  UNIQUE(user_id, question_id)
);

-- Row Level Security
ALTER TABLE domain_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weak_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own domain_progress" ON domain_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own exam_attempts" ON exam_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own attempt_questions" ON attempt_questions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own weak_spots" ON weak_spots
  FOR ALL USING (auth.uid() = user_id);
```

After I confirm the SQL has been run successfully, proceed to Phase 4.

---

## PHASE 4 — AUTHENTICATION

### Login page (`src/pages/Login.tsx`)
- Dark themed, centred card layout
- CloudPass logo/title at top in AWS orange (`#FF9900`)
- Tagline: "Master the AWS Cloud Practitioner exam"
- Email input + Password input + "Sign In" button
- "Don't have an account? Sign Up" toggle — same form, adds confirm password field
- Google OAuth button: "Continue with Google" (uses Supabase `signInWithOAuth`)
- Error messages displayed in red below the form
- On successful login: redirect to `/`
- Form is clean, no clutter, generous spacing

### Auth hook (`src/hooks/useAuth.ts`)
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signOut }
}
```

### Phase 4 complete when:
- Login page renders correctly at `/login`
- Can sign up with email/password
- Can sign in with email/password
- Redirects to dashboard after login
- Unauthenticated users redirected to `/login`

---

## PHASE 5 — SCORING LOGIC

Create `src/lib/scoring.ts`:

```typescript
import { Question } from '../types'

export function calculateScaledScore(correct: number, total: number): number {
  const rawPercent = correct / total
  const scaled = Math.round(100 + rawPercent * 900)
  return Math.min(1000, Math.max(100, scaled))
}

export function isPassed(scaledScore: number): boolean {
  return scaledScore >= 700
}

export function getDomainScore(
  results: { domainId: number; isCorrect: boolean }[],
  domainId: number
): number {
  const domainQs = results.filter(q => q.domainId === domainId)
  if (domainQs.length === 0) return 0
  const correct = domainQs.filter(q => q.isCorrect).length
  return Math.round((correct / domainQs.length) * 100)
}

export function selectExamQuestions(allQuestions: Question[]): Question[] {
  const targets: Record<number, number> = {
    1: Math.round(65 * 0.24), // 16
    2: Math.round(65 * 0.30), // 20
    3: Math.round(65 * 0.34), // 22
    4: Math.round(65 * 0.12), // 8
  }

  const selected: Question[] = []

  for (const [domainId, count] of Object.entries(targets)) {
    const domainQs = allQuestions
      .filter(q => q.domainId === Number(domainId))
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
    selected.push(...domainQs)
  }

  return selected.sort(() => Math.random() - 0.5)
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
```

---

## PHASE 6 — SHARED UI COMPONENTS

Build these reusable components in `src/components/`. All use Tailwind classes only.

### `Navbar.tsx`
- Left sidebar, fixed height, full screen height
- CloudPass logo at top in `#FF9900`
- Nav links: Dashboard, Mock Exam, Domain Practice, Weak Spot, Scenarios, History
- Active link highlighted in orange
- User email at bottom with Logout button
- On mobile: collapses to top bar

### `AnswerButton.tsx`
Props: `label`, `text`, `state` ('default' | 'selected' | 'correct' | 'wrong' | 'disabled')
- Full width button, min 60px height
- Letter badge (A/B/C/D) on left
- Default: dark card border
- Selected: orange border + subtle orange background
- Correct: green border + green background
- Wrong: red border + red background
- Smooth 200ms transition on all state changes

### `ProgressBar.tsx`
Props: `percent`, `color?`
- Thin rounded bar
- Colour coded: red <40%, amber <70%, green >=70%
- Animated fill

### `MasteryRing.tsx`
Props: `percent`, `size?`
- SVG circular progress ring
- Shows percentage in centre
- Colour coded same as ProgressBar

### `Modal.tsx`
Props: `isOpen`, `title`, `children`, `onClose`
- Dark overlay
- Centred card
- Close on overlay click or X button

### `PassFailBanner.tsx`
Props: `passed`, `scaledScore`, `percent`
- Full width banner
- PASS: green background, white text, tick icon
- FAIL: red background, white text, X icon
- Large score display

### `LoadingSpinner.tsx`
- Simple centred spinner in orange
- Used while fetching from Supabase

---

## PHASE 7 — THE FOUR MODES

### MODE 1: MOCK EXAM (`src/pages/MockExam.tsx`)

This is the most important feature. It must feel like the real Pearson VUE exam.

**Start screen:**
- "Mock Exam" heading
- "65 questions — 90 minutes — No answer feedback during exam"
- Domain breakdown shown: "16 Cloud Concepts, 20 Security, 22 Technology, 8 Billing"
- Large "Start Exam" button in orange
- Warning: "Once started, the timer cannot be paused"

**During exam — full focus mode:**
- Hide the Navbar completely
- Fixed header: CloudPass logo left, Timer centre, "End Exam" button right
- Timer (`useTimer` hook, counts down from 90:00):
  - White text normally
  - Amber when under 20:00
  - Red + pulse animation when under 10:00
  - Auto-submits when reaches 00:00
- Question area (centre, max-width 800px, horizontally centred):
  - Domain badge top left (e.g. "Domain 2 — Security")
  - Question number: "Question 14 of 65"
  - Question text at 20px
  - Four `AnswerButton` components — selected state only, no correct/wrong feedback
  - "Flag for Review" toggle button — bookmark icon, turns orange when active
- Navigation panel (right sidebar, 200px wide):
  - Grid of 65 numbered squares
  - Empty = unanswered (dark border)
  - Filled orange = answered
  - Flag icon overlay = flagged
  - Click any square to jump to that question
- Previous / Next buttons at bottom

**End exam:**
- "End Exam" button opens Modal:
  - "You have answered X of 65 questions"
  - "X questions are flagged for review"
  - "Go Back" and "Submit Exam" buttons
- On submit (or timer 00:00): save to Supabase then show Results screen

**Results screen:**
- `PassFailBanner` component
- Scaled score and percentage
- "Pass mark: 700/1000"
- Time taken
- Domain breakdown table:

| Domain | Score | Questions |
|---|---|---|
| Cloud Concepts | 75% | 12/16 |
| Security & Compliance | 60% | 12/20 |
| Cloud Technology | 68% | 15/22 |
| Billing & Support | 87% | 7/8 |

- "Review Answers" button — shows all 65 questions with:
  - User's answer (red if wrong)
  - Correct answer (green)
  - Explanation text
- "Back to Dashboard" button

**Supabase saving:**
After submission, save to `exam_attempts` and `attempt_questions` tables. Also upsert `weak_spots` — for each incorrect answer, increment `incorrect_count` and reset `correct_streak`.

### MODE 2: DOMAIN PRACTICE (`src/pages/DomainPractice.tsx`)

**Selection screen:**
- Four domain cards showing name, description, question count, and current mastery %
- Click a card to start that domain

**Practice session:**
- One question at a time
- Progress bar: "Question 8 of 47"
- Four `AnswerButton` components
- On answer selection — immediately show feedback:
  - Correct: selected button goes green, show explanation below
  - Wrong: selected button goes red, correct button goes green, show explanation below
- "Next Question" button appears after answering
- Cannot go back

**End screen:**
- Score for that session
- Mastery % change (e.g. "↑ 12% improvement")
- "Retry Domain" and "Back to Dashboard" buttons

**Supabase:** upsert `domain_progress` after each session.

### MODE 3: WEAK SPOT TRAINER (`src/pages/WeakSpot.tsx`)

**On load:**
- Query `weak_spots` for `incorrect_count >= 2` and `is_cleared = false`
- If none found: show "No weak spots yet — complete some practice sessions first" + button to go to Domain Practice
- If found: show count — "You have X weak spots to work on"
- "Start Training" button

**Training session:**
- Same UX as Domain Practice (immediate feedback)
- 20 questions max per session, sorted by highest `incorrect_count` first
- After correct answer: update `correct_streak` in Supabase — if streak = 3, set `is_cleared = true`
- After wrong answer: increment `incorrect_count`, reset `correct_streak`

**End screen:**
- "X weak spots cleared this session"
- "X remaining weak spots"

### MODE 4: SCENARIO PRACTICE (`src/pages/Scenarios.tsx`)

**Filter logic:**
From `master_questions.json`, filter questions where the question text contains any of: "A company", "An organisation", "An organization", "which service", "which AWS service", "most cost-effective", "a solutions architect", "recommended solution", "best option"

- Same UX as Domain Practice (immediate feedback)
- 20 random scenario questions per session

---

## PHASE 8 — DASHBOARD (`src/pages/Dashboard.tsx`)

Layout: two-column grid on desktop (left: stats + mastery, right: mode cards + last attempt)

**Left column:**
- "Welcome back, [user email]" heading
- `MasteryRing` — average mastery across all 4 domains from `domain_progress`
- Four `ProgressBar` components — one per domain with domain name and %
- Quick stats row:
  - Total questions answered (sum from `domain_progress`)
  - Total mock exams taken (count from `exam_attempts`)
  - Best mock score (max `scaled_score` from `exam_attempts`)

**Right column:**
- Four mode cards (Mock Exam, Domain Practice, Weak Spot, Scenarios) — icon, title, description, "Start" button
- Last mock exam card:
  - Date, score, PASS/FAIL badge
  - "View Details" links to History page
  - "Retake" button starts new mock exam
  - Shows "No attempts yet — take your first mock exam!" if none

**Bottom:** pass mark banner — "CLF-C02 Pass Mark: 700/1000 (approximately 72%)"

**All data fetched from Supabase on mount.** Show `LoadingSpinner` while loading.

---

## PHASE 9 — HISTORY PAGE (`src/pages/History.tsx`)

**Score trend chart (Recharts `LineChart`):**
- X axis: attempt date
- Y axis: scaled score (0–1000)
- Dashed horizontal line at 700 (pass mark) in green
- Data points coloured green (pass) or red (fail)

**Filter buttons:** All | Passed | Failed

**Attempt list:**
- Cards sorted most recent first
- Each card: date, scaled score, PASS/FAIL badge, time taken, domain scores as small coloured bars
- "Expand" button — shows full question-by-question review for that attempt
  - Question text, user's answer, correct answer, explanation
  - Green tick or red cross per question

**All data from Supabase.**

---

## PHASE 10 — DEPLOYMENT

### Netlify setup
1. Create `public/_redirects`:
```
/*    /index.html    200
```

2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables to add in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Supabase OAuth (for Google login in production)
In Supabase dashboard → Authentication → URL Configuration:
- Add your Netlify URL to "Redirect URLs": `https://your-app.netlify.app/**`

### Credits page (`src/pages/Credits.tsx`)
- Lists the source repo: kananinirav/AWS-Certified-Cloud-Practitioner-Notes
- MIT license notice
- Link to original GitHub repo

### Footer (on every page)
```
This app is not affiliated with, endorsed by, or associated with Amazon Web Services (AWS) or 
Amazon.com, Inc. AWS and related service names are trademarks of Amazon.com, Inc. 
Practice questions sourced from MIT-licensed open source materials.
```

---

## FINAL CHECKLIST

Before marking complete, verify every item:

- [ ] `npm run dev` runs with no errors or TypeScript warnings
- [ ] Login page renders and email/password sign up works
- [ ] Login page Google OAuth works
- [ ] Unauthenticated users redirected to `/login`
- [ ] Parser script generates `master_questions.json` with 400+ questions
- [ ] All four domains have questions
- [ ] Mock exam loads 65 questions with correct domain proportions
- [ ] Timer counts down, changes colour at 20 and 10 minutes
- [ ] Timer auto-submits at 00:00
- [ ] Flag for review works
- [ ] Navigation panel squares update correctly
- [ ] No answer feedback shown during mock exam
- [ ] Results screen shows after submission with correct score
- [ ] Attempt saved to Supabase `exam_attempts` and `attempt_questions`
- [ ] Domain practice immediate feedback works
- [ ] `domain_progress` updates in Supabase after domain practice
- [ ] Weak spot trainer loads from `weak_spots` table
- [ ] Weak spots clear after 3 correct answers in a row
- [ ] Scenario mode filters correctly
- [ ] Dashboard shows real data from Supabase
- [ ] History page shows all attempts
- [ ] Score trend chart renders with pass mark line
- [ ] Expand attempt works and shows question review
- [ ] Credits page exists and is accessible
- [ ] Disclaimer footer visible on all pages
- [ ] `public/_redirects` file exists
- [ ] App builds with `npm run build` and no errors
- [ ] Deploys to Netlify and live URL works
- [ ] Page refresh on any route does not 404

---

## START

Before writing any code, confirm:
1. You can see the `/practice-exam` folder with `.md` files in the project root
2. The `.env` file exists with placeholder values
3. Then begin **Phase 1 only** and stop for my confirmation before Phase 2

# CloudCertPrep

Free AWS certification practice exams — [cloudcertprep.io](https://www.cloudcertprep.io)

985 practice questions · Timed mock exams · Spaced repetition · Progress tracking

---

## System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Netlify CDN                                │
│                    (static hosting, global edge)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   index.html ──► React SPA (code-split per route)                  │
│                                                                     │
│   ┌──────────┐  ┌──────────────┐  ┌───────────────┐               │
│   │ vendor-  │  │  vendor-     │  │   App routes   │               │
│   │ react    │  │  supabase    │  │  (lazy-loaded) │               │
│   │ 16 KB gz │  │  45 KB gz    │  │  1-6 KB each   │               │
│   └──────────┘  └──────────────┘  └───────────────┘               │
│                                                                     │
│   Question Data (static JSON → JS chunks, per domain)              │
│   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐               │
│   │ D1      │ │ D2      │ │ D3       │ │ D4      │               │
│   │ 53 KB gz│ │ 74 KB gz│ │ 107 KB gz│ │ 68 KB gz│               │
│   │ 180 Qs  │ │ 231 Qs  │ │ 350 Qs   │ │ 224 Qs  │               │
│   └─────────┘ └─────────┘ └──────────┘ └─────────┘               │
│                                                                     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS (auth + data persistence)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase (BaaS)                             │
│                                                                     │
│   ┌──────────────┐  ┌────────────────────────────────────────┐     │
│   │  Auth         │  │  PostgreSQL                            │     │
│   │  Email/pass   │  │                                        │     │
│   │  JWT tokens   │  │  exam_attempts ◄── attempt_questions   │     │
│   │  RLS policies │  │  domain_progress   platform_stats      │     │
│   └──────────────┘  │  question_mastery (view)                │     │
│                      │                                        │     │
│   ┌──────────────┐  │  Triggers: auto-increment stats         │     │
│   │  RPC          │  │  RLS: auth.uid() = user_id             │     │
│   │  get_public_  │  │  Indexes: user_id, attempt_id,         │     │
│   │  exam_stats() │  │           cert_code, attempted_at      │     │
│   └──────────────┘  └────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Data flow:** Questions are static assets served from CDN (zero DB cost). Only authentication, progress tracking, and exam history hit Supabase — keeping free tier usage minimal.

---

## Features

| Feature | Details |
|---------|---------|
| **Mock Exams** | Timed simulation matching real AWS format (65 Qs, 90 min, 700/1000 pass) |
| **Domain Practice** | Per-domain sessions with instant answer feedback |
| **Spaced Repetition** | Weighted question selection based on past performance |
| **Answer Randomization** | Options shuffled per question; correct mapping preserved for scoring |
| **Progress Tracking** | Domain mastery %, exam history with question-by-question review |
| **Community Stats** | Public page with pass rates, avg scores, domain difficulty rankings |
| **Multi-Cert Architecture** | CLF-C02 active, SAA-C03 ready to plug in |
| **Guest + Auth Modes** | Full functionality without login; sign in to persist data |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS 3.4 |
| Auth / DB | Supabase (PostgreSQL, RLS, JWT) |
| Hosting | Netlify (CDN, auto-deploy from `main`) |
| Analytics | GA4 (deferred, consent-gated) |

---

## Performance

| Metric | Value |
|--------|-------|
| Initial load (gzipped) | **130 KB** |
| Time to interactive | < 1.5s on 3G |
| Route code splitting | Yes (React.lazy) |
| Question data | Chunked by domain, loaded on demand |
| Vendor splitting | React + Supabase in separate cacheable chunks |

---

## Project Structure

```
src/
├── pages/          # Route components (MockExam, DomainPractice, History, etc.)
├── components/     # Shared UI (AnswerButton, QuestionReviewCard, Modal, etc.)
├── hooks/          # useAuth, useCert, useTheme, useTimer, useSpacedRepetition
├── lib/            # scoring, utils, analytics, supabase client, constants
├── data/           # Certification config + question JSON per cert/domain
└── types/          # TypeScript interfaces (Question, ExamAttempt, etc.)
```

---

## Adding a Certification

1. Add config in `src/data/certifications.ts`
2. Create `src/data/<cert-code>/domain1.json` through `domain4.json`
3. Register loaders in `src/data/questions.ts`

Question format:
```json
{
  "id": "q001",
  "question": "Which AWS service provides managed relational databases?",
  "options": { "A": "Amazon S3", "B": "Amazon RDS", "C": "AWS Lambda", "D": "Amazon SQS" },
  "answer": "B",
  "explanation": "Amazon RDS is a managed relational database service...",
  "isMultiAnswer": false
}
```

`domainId` is injected automatically at load time based on the file.

---

## Development

```bash
npm install
npm run dev
```

Requires `.env`:
```
VITE_SUPABASE_URL=<project_url>
VITE_SUPABASE_ANON_KEY=<anon_key>
```

`VITE_GA_MEASUREMENT_ID` is set in Netlify environment variables for production. Not needed locally (analytics gracefully no-op if undefined).

---

## Contributing

Open an issue or PR on [GitHub](https://github.com/snts42/cloudcertprep). Question contributions welcome — follow the JSON format above.

## License

MIT

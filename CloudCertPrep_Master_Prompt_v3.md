# CloudCertPrep Master Prompt v3.0 - Production Edition

---

## IMPORTANT INSTRUCTIONS

- Work through this **one phase at a time**
- **Stop and confirm** with me after each phase before continuing
- **Do not install unnecessary packages** — use only what is listed
- If anything is unclear or you need credentials, **ask before writing code**
- After each phase, tell me: what you built, what commands I need to run, and what to check

---

## PROJECT OVERVIEW

**CloudCertPrep** is a web-based AWS Certified Cloud Practitioner (CLF-C02) exam preparation platform with a clean, focused approach to learning. Built with React, TypeScript, Tailwind CSS, and Supabase.

**Live App:** https://cloudcertprep.netlify.app  
**GitHub:** https://github.com/snts42/cloudcertprep

**Design Philosophy:**
- Clean, dark-themed, professional UI
- Desktop-first with full mobile responsiveness
- Focused on exam preparation, not flashcards
- Real exam experience simulation

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Database | Supabase (PostgreSQL with RLS) |
| Hosting | Netlify (auto-deploy from GitHub) |
| Charts | Recharts |
| Routing | React Router v6 |

**Do not add any other libraries unless absolutely necessary.**

---

## CURRENT IMPLEMENTATION STATUS

### ✅ **COMPLETED - Core Infrastructure (Phases 1-6)**

**Phase 1: Project Setup**
- ✅ React 19 + Vite + TypeScript initialized
- ✅ Tailwind CSS configured with AWS color palette
- ✅ All dependencies installed

**Phase 2: Question Parser**
- ✅ 588 AWS CLF-C02 questions parsed from 23 MD files
- ✅ `master_questions.json` created with all questions
- ✅ Questions organized by 4 domains

**Phase 3: Supabase Database**
- ✅ Database tables created:
  - `domain_progress` - Per-domain mastery tracking
  - `exam_attempts` - Mock exam results
  - `attempt_questions` - Question-level results
  - `weak_spots` - (exists but not actively used)
- ✅ Row Level Security (RLS) policies configured

**Phase 4: Authentication**
- ✅ Login/Sign Up page with email/password
- ✅ Google OAuth integration
- ✅ `useAuth` hook for auth state management
- ✅ Guest mode support (no account required)

**Phase 5: Scoring Logic**
- ✅ AWS scaled scoring (100-1000 scale)
- ✅ Pass/fail logic (700+ = pass)
- ✅ Domain score calculations
- ✅ Exam question selection algorithm

**Phase 6: Shared UI Components**
- ✅ Header with navigation
- ✅ Footer with AWS disclaimer
- ✅ AnswerButton with multiple states
- ✅ PassFailBanner for exam results
- ✅ LoadingSpinner
- ✅ Modal dialogs
- ✅ ProgressBar for domain mastery

---

### ✅ **COMPLETED - Core Features (Phases 7-10)**

**Phase 7: Practice Modes**
- ✅ **Mock Exam** - Full 65-question timed exam (90 minutes)
  - Timer with pause/resume
  - Flag questions for review
  - Navigation panel
  - AWS scaled scoring (100-1000)
  - Pass/fail determination (700+)
  - Domain breakdown
  - Results saved to database
- ✅ **Domain Practice** - Practice by specific domain
  - Select domain (1-4)
  - Choose question count (5-50)
  - Immediate answer feedback
  - Question history tracking (localStorage)
  - Prioritizes least-seen questions
  - Results update domain progress

**Phase 8: Dashboard**
- ✅ Welcome message with user email
- ✅ Domain progress tracking (4 domains)
  - Progress bars with mastery percentage
  - Questions attempted count
  - Correct answers count
- ✅ Practice mode cards (Mock Exam, Domain Practice)
- ✅ Last mock exam summary
- ✅ Guest mode warning banner

**Phase 9: History Page**
- ✅ Exam statistics summary
  - Total attempts
  - Pass rate
  - Best score
  - Average score
- ✅ Attempt list with cards (most recent first)
- ✅ Each card shows: date, score, pass/fail, time, domain scores
- ✅ Expandable question-by-question review

**Phase 10: Deployment**
- ✅ Netlify configuration
- ✅ `_redirects` file for SPA routing
- ✅ Environment variables configured
- ✅ Auto-deploy from GitHub main branch
- ✅ Live at https://cloudcertprep.netlify.app

---

### ✅ **COMPLETED - v2.0 Improvements**

**Simplified Practice Modes:**
- ✅ Removed Weak Spot Trainer mode
- ✅ Removed Scenario Practice mode
- ✅ Updated navigation to show only: Dashboard, History
- ✅ Mode selection on Dashboard (Mock Exam, Domain Practice)

**Fixed Domain Mastery Tracking:**
- ✅ Domain progress updates from Mock Exam (all 4 domains)
- ✅ Domain progress updates from Domain Practice (selected domain)
- ✅ Accumulates questions attempted and correct answers
- ✅ Mastery calculation: `(questions_correct / total_domain_questions) × 100`
- ✅ Created `domainStats.ts` with domain question counts

**Dashboard Redesign:**
- ✅ Removed overall mastery ring
- ✅ Removed "Total questions answered" stat
- ✅ Removed "Best mock score" stat
- ✅ Shows questions attempted/correct per domain
- ✅ Changed "Quick Access" to "Practice Modes"

**Domain Practice Results Screen:**
- ✅ Question-by-question review with all questions
- ✅ Red/green highlighting for correct/incorrect answers
- ✅ Visual indicators (✓ ✗) for each question
- ✅ Clear labels: "Your answer - Correct!", "Your answer - Incorrect"
- ✅ Explanation placeholder (ready for Phase 11)
- ✅ Changed header to "Practice session complete!"

**Bug Fixes:**
- ✅ Fixed TypeScript error in MockExam domain score indexing
- ✅ Fixed domain progress database updates
- ✅ Cleaned up console logging

---

## PHASE 11 — DASHBOARD DOMAIN MASTERY IMPROVEMENTS

**Goal:** Show total available questions per domain in the domain mastery section.

**Current Display:**
```
Domain 1: Cloud Concepts
45% | 45 attempted | 32 ✓
```

**New Display:**
```
Domain 1: Cloud Concepts
45% | 45/99 attempted | 32 ✓
```

**Implementation:**
- Import `DOMAIN_QUESTION_COUNTS` from `src/lib/domainStats.ts`
- Update domain progress display to show: `{attempted}/{total} attempted`
- Apply to all 4 domains

**Acceptance Criteria:**
- [ ] All 4 domains show total questions (99, 66, 356, 67)
- [ ] Format: `X/Y attempted` where X = attempted, Y = total
- [ ] Mobile-friendly display
- [ ] No layout breaking on small screens

---

## PHASE 12 — HISTORY PAGE IMPROVEMENTS

**Goal:** Improve clarity and information density on the History page.

### Changes Required:

**1. Rename Header:**
- Change "Exam History" to "Mock Exam History"
- Makes it clear this tracks mock exams only, not domain practice

**2. Improve Stats Display:**

**Current Stats (4 separate cards):**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total       │ │ Pass Rate   │ │ Best Score  │ │ Avg Score   │
│ Attempts    │ │             │ │             │ │             │
│ 12          │ │ 67%         │ │ 825         │ │ 742         │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

**New Stats (3 cards with better grouping):**
```
┌─────────────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total Attempts      │ │ Best Score  │ │ Avg Score   │
│ 12 (8 passed)       │ │             │ │             │
│ Pass Rate: 67%      │ │ 825         │ │ 742         │
└─────────────────────┘ └─────────────┘ └─────────────┘
```

**Implementation:**
- Combine "Total Attempts" and "Pass Rate" into one card
- Show passed count: `12 (8 passed)`
- Show pass rate below: `Pass Rate: 67%`
- Keep Best Score and Average Score as separate cards
- Maintain mobile responsiveness (grid adjusts to 1-2 columns)

**Acceptance Criteria:**
- [ ] Header changed to "Mock Exam History"
- [ ] Stats reduced from 4 cards to 3 cards
- [ ] First card shows: Total attempts, passed count, pass rate
- [ ] Second card shows: Best score
- [ ] Third card shows: Average score
- [ ] Mobile-friendly (cards stack or grid 2×2 on small screens)
- [ ] Filter tabs already exist (no changes needed)

---

## PHASE 13 — FAVICON & SOCIAL MEDIA META TAGS

**Goal:** Add cloud icon favicon and improve social media sharing preview.

### Priority 1: Favicon

**Requirements:**
- Use a cloud icon (☁️ or AWS cloud-style icon)
- Create favicon in multiple formats:
  - `favicon.ico` (16×16, 32×32, 48×48)
  - `favicon.svg` (scalable vector)
  - `apple-touch-icon.png` (180×180 for iOS)
- Use AWS orange (#FF9900) as primary color
- Simple, recognizable cloud shape

**Implementation:**
- Create favicon files in `public/` folder
- Update `index.html` with favicon links:
  ```html
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  ```

**Acceptance Criteria:**
- [ ] Cloud icon favicon visible in browser tab
- [ ] Favicon works in Chrome, Firefox, Safari
- [ ] Apple touch icon works on iOS devices
- [ ] Icon is clear and recognizable at small sizes

---

### Priority 2: Social Media Meta Tags

**Goal:** Improve how the site looks when shared on social media (Twitter, Facebook, LinkedIn, etc.)

**Requirements:**
- Create Open Graph image (1200×630px)
- Add comprehensive meta tags for social sharing
- Preview shows: CloudCertPrep branding, tagline, visual appeal

**Open Graph Image Design:**
- Size: 1200×630px
- Background: Dark (#0F1923)
- CloudCertPrep logo/title in AWS orange
- Tagline: "Master the AWS Cloud Practitioner Exam"
- Cloud icon or AWS-themed graphics
- "588 Practice Questions | Mock Exams | Free"

**Meta Tags to Add in `index.html`:**
```html
<!-- Primary Meta Tags -->
<title>CloudCertPrep - AWS Cloud Practitioner Exam Prep</title>
<meta name="title" content="CloudCertPrep - AWS Cloud Practitioner Exam Prep">
<meta name="description" content="Master the AWS Certified Cloud Practitioner exam with 588 practice questions, full mock exams, and domain-specific practice. Free online study platform.">
<meta name="keywords" content="AWS, Cloud Practitioner, CLF-C02, exam prep, practice questions, AWS certification">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://cloudcertprep.netlify.app/">
<meta property="og:title" content="CloudCertPrep - AWS Cloud Practitioner Exam Prep">
<meta property="og:description" content="Master the AWS Certified Cloud Practitioner exam with 588 practice questions, full mock exams, and domain-specific practice. Free online study platform.">
<meta property="og:image" content="https://cloudcertprep.netlify.app/og-image.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://cloudcertprep.netlify.app/">
<meta property="twitter:title" content="CloudCertPrep - AWS Cloud Practitioner Exam Prep">
<meta property="twitter:description" content="Master the AWS Certified Cloud Practitioner exam with 588 practice questions, full mock exams, and domain-specific practice.">
<meta property="twitter:image" content="https://cloudcertprep.netlify.app/og-image.png">

<!-- Theme color for mobile browsers -->
<meta name="theme-color" content="#FF9900">
```

**Files to Create:**
- `public/og-image.png` (1200×630px) - Open Graph preview image
- Update existing meta tags in `cloudpass/index.html`

**Acceptance Criteria:**
- [ ] Open Graph image created (1200×630px)
- [ ] All meta tags added to index.html
- [ ] Preview looks good on Twitter Card Validator
- [ ] Preview looks good on Facebook Sharing Debugger
- [ ] Preview looks good on LinkedIn Post Inspector
- [ ] Image loads correctly from Netlify URL
- [ ] Title, description, and image display correctly

---

## PHASE 14 — MOBILE RESPONSIVENESS AUDIT

**Goal:** Ensure all pages are fully responsive and mobile-friendly.

### Testing Checklist

**Test at these breakpoints:**
- Mobile: 375px (iPhone SE)
- Mobile: 414px (iPhone Pro Max)
- Tablet: 768px (iPad)
- Desktop: 1024px
- Desktop: 1440px

**Pages to Test:**

**1. Login Page**
- [ ] Form centered and readable
- [ ] Buttons minimum 44px height
- [ ] Google OAuth button full width on mobile
- [ ] No horizontal scroll

**2. Dashboard**
- [ ] Guest mode banner visible and readable
- [ ] Domain progress cards stack vertically on mobile
- [ ] Practice mode cards stack vertically on mobile
- [ ] Last exam card full width on mobile
- [ ] All text readable (minimum 16px)
- [ ] Touch targets adequate (44px minimum)

**3. Mock Exam**
- [ ] Question text readable
- [ ] Answer buttons minimum 60px height
- [ ] Timer visible and not overlapping
- [ ] Navigation panel becomes modal/drawer on mobile
- [ ] Flag button accessible
- [ ] Progress bar visible
- [ ] No horizontal scroll

**4. Domain Practice**
- [ ] Domain selection cards stack on mobile
- [ ] Question count slider usable on touch
- [ ] Question text readable
- [ ] Answer buttons minimum 60px height
- [ ] Feedback clear and readable
- [ ] Results screen scrollable

**5. History Page**
- [ ] Stats grid 2×2 on mobile, 4×1 on desktop
- [ ] Filter tabs accessible on mobile
- [ ] Chart readable on small screens
- [ ] Attempt cards stack vertically
- [ ] Expandable review works on mobile
- [ ] No horizontal scroll

**6. Header/Navigation**
- [ ] Logo visible
- [ ] Navigation links accessible
- [ ] Sign out button visible
- [ ] Responsive on all breakpoints

**7. Footer**
- [ ] AWS disclaimer readable
- [ ] Links accessible
- [ ] Responsive on all breakpoints

### Implementation Tasks

**If issues found:**
- [ ] Fix layout issues (flexbox, grid)
- [ ] Adjust font sizes for mobile
- [ ] Increase touch target sizes
- [ ] Add horizontal scrolling where needed (charts, tables)
- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] Verify no horizontal scroll on any page

---

## PHASE 13 — QUESTION EXPLANATIONS (FUTURE)

**Goal:** Add AI-generated explanations for all 588 questions.

**Deferred until Phases 11-12 are complete.**

### Implementation Plan

**Step 1: Generate Explanations**
- Use existing `scripts/generateExplanations.mjs`
- OpenAI GPT-4o-mini API
- Process in batches to avoid rate limits
- Update `master_questions.json` with explanations

**Step 2: Display Explanations**
- Domain Practice results screen (replace placeholder)
- Domain Practice immediate feedback (after answering)
- Mock Exam review mode (future enhancement)

**Explanation Format:**
- Clear, concise (2-3 sentences)
- Focus on AWS concepts and services
- Educational tone
- Based on AWS official documentation

**Acceptance Criteria:**
- [ ] All 588 questions have explanations
- [ ] Explanations display in Domain Practice results
- [ ] Explanations display in immediate feedback
- [ ] Explanations are accurate and helpful
- [ ] Mobile-friendly display

---

## DATABASE SCHEMA

**Tables:**

```sql
-- domain_progress
user_id uuid (FK to auth.users)
domain_id integer (1-4)
questions_attempted integer
questions_correct integer
mastery_percent numeric
updated_at timestamptz

-- exam_attempts
user_id uuid (FK to auth.users)
attempted_at timestamptz
score_percent numeric
scaled_score integer (100-1000)
passed boolean
time_taken_seconds integer
total_questions integer
correct_answers integer
domain_1_score numeric
domain_2_score numeric
domain_3_score numeric
domain_4_score numeric

-- attempt_questions
attempt_id uuid (FK to exam_attempts)
user_id uuid (FK to auth.users)
question_id text
user_answer text
correct_answer text
is_correct boolean
was_flagged boolean
domain_id integer

-- weak_spots (exists but not actively used)
user_id uuid (FK to auth.users)
question_id text
incorrect_count integer
correct_streak integer
last_seen timestamptz
is_cleared boolean
```

**Row Level Security (RLS):**
- All tables have RLS enabled
- Users can only access their own data
- Policy: `auth.uid() = user_id`

---

## COLOR PALETTE

```js
{
  'aws-orange': '#FF9900',
  'bg-dark': '#0F1923',
  'bg-card': '#1A2332',
  'bg-card-hover': '#1E2A3A',
  'success': '#22C55E',
  'danger': '#EF4444',
  'warning': '#F59E0B',
  'text-primary': '#F8FAFC',
  'text-muted': '#94A3B8',
}
```

**Domain Colors:**
- Domain 1 (Cloud Concepts): `#3B82F6` (Blue)
- Domain 2 (Security & Compliance): `#EF4444` (Red)
- Domain 3 (Cloud Technology & Services): `#22C55E` (Green)
- Domain 4 (Billing, Pricing & Support): `#F59E0B` (Amber)

---

## DOMAIN QUESTION COUNTS

From `master_questions.json`:
- Domain 1 (Cloud Concepts): 99 questions
- Domain 2 (Security & Compliance): 66 questions
- Domain 3 (Cloud Technology & Services): 356 questions
- Domain 4 (Billing, Pricing & Support): 67 questions
- **Total: 588 questions**

---

## GIT WORKFLOW

**Commit Message Format:**
```
<type>: <description>

Examples:
feat: add filter buttons to history page
fix: correct chart responsiveness on mobile
refactor: optimize domain progress calculation
style: improve mobile layout for dashboard
perf: lazy load routes for faster initial load
docs: update README with deployment instructions
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `style:` - UI/UX improvements
- `perf:` - Performance improvements
- `docs:` - Documentation updates
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**When to Commit:**
- **After completing each phase** (one commit per phase)
- After fixing a bug
- Before starting a new major feature
- After successful testing

**Phase Implementation Workflow:**
1. Read the phase requirements
2. Implement all changes for that phase
3. Test locally (`npm run dev`)
4. Verify all acceptance criteria are met
5. **Commit with phase number in message** (e.g., `feat: add total questions to domain mastery (Phase 11)`)
6. Push to GitHub (triggers Netlify deploy)
7. Verify deployment successful
8. Move to next phase

**Important:**
- One commit per phase (don't commit partial work)
- Always test before committing
- Include phase number in commit message for traceability
- Wait for user confirmation before moving to next phase

---

## TESTING STRATEGY

**Test After Each Phase:**

1. **Local Development** (`npm run dev`)
   - Test the specific feature implemented
   - Check desktop and mobile views (DevTools)
   - Test guest mode and authenticated mode
   - Verify no console errors

2. **Build Test** (`npm run build`)
   - Ensure build completes without errors
   - Check bundle size
   - Preview build locally (`npm run preview`)

3. **Cross-Browser Testing:**
   - Chrome (primary)
   - Firefox
   - Safari (if on Mac)
   - Mobile browsers (Chrome Mobile, Safari iOS)

**Testing Checklist:**
- [ ] Feature works as expected
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] Mobile responsive (test at 375px, 768px, 1024px, 1440px)
- [ ] Guest mode works correctly
- [ ] Authenticated mode works correctly
- [ ] Data saves to Supabase (if applicable)
- [ ] Loading states display correctly
- [ ] Error states handled gracefully

---

## DEPLOYMENT

**Netlify Configuration:**
- Base directory: `cloudpass`
- Build command: `npm run build`
- Publish directory: `cloudpass/dist`
- Auto-deploy from GitHub `main` branch

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**SPA Routing:**
- `public/_redirects` file: `/*    /index.html    200`

**When to Deploy:**
- After completing each phase
- After fixing critical bugs
- After thorough local testing
- Never deploy broken code

---

## SUCCESS CRITERIA

The app is considered complete when:

1. ✅ Users can take full mock exams with accurate scoring
2. ✅ Users can practice by domain with immediate feedback
3. ✅ Domain mastery accurately reflects performance from both modes
4. ✅ Dashboard clearly shows progress per domain
5. ✅ History page tracks all exam attempts with stats
6. ✅ History page has filter buttons (All | Passed | Failed)
7. ⏳ Dashboard shows total questions per domain (e.g., "45/99 attempted")
8. ⏳ History page renamed to "Mock Exam History" with improved stats
9. ⏳ Cloud icon favicon and social media meta tags added
10. ⏳ App is fully responsive on mobile, tablet, and desktop
11. ✅ Deployment works correctly on Netlify
12. ⏳ All questions have detailed explanations (Phase 15 - Future)

---

## CURRENT STATUS

**Completed:** Phases 1-10 + v2.0 improvements  
**Next:** Phase 11 - Dashboard Domain Mastery Improvements  
**Then:** Phase 12 - History Page Improvements  
**Then:** Phase 13 - Favicon & Social Media Meta Tags  
**Then:** Phase 14 - Mobile Responsiveness Audit  
**Future:** Phase 15 - Question Explanations

---

## NOTES

**Guest Mode:**
- Intentional feature allowing users to try the app without signing up
- Progress is not saved for guests
- Clear warnings displayed throughout the app

**AWS Disclaimer:**
- Footer must include: "This site is not affiliated with, endorsed by, or sponsored by Amazon Web Services (AWS) or Amazon.com, Inc."

**Credits:**
- Questions sourced from: https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes
- MIT License

---

**Ready to begin Phase 11!**

# CloudCertPrep Master Prompt v2.0 - Simplified Edition

---

## PROJECT OVERVIEW

**CloudCertPrep** is a web-based AWS Certified Cloud Practitioner (CLF-C02) exam preparation platform with a clean, focused approach to learning. Built with React, TypeScript, Tailwind CSS, and Supabase.

**Live App:** https://cloudcertprep.netlify.app  
**GitHub:** https://github.com/snts42/cloudcertprep

---

## CURRENT IMPLEMENTATION STATUS

### ✅ Completed Features

**Core Infrastructure:**
- React 19 + Vite + TypeScript
- Tailwind CSS with custom AWS-themed color palette
- Supabase authentication (Email/Password + Google OAuth)
- Supabase database with Row Level Security
- Guest mode support (users can practice without account, but progress isn't saved)
- Mobile-responsive design
- 588 AWS CLF-C02 practice questions across 4 domains

**Practice Modes:**
1. **Mock Exam** - Full 65-question timed exam (90 minutes) with AWS scaled scoring (100-1000)
2. **Domain Practice** - Practice specific domains with immediate feedback

**Pages:**
- Login/Sign Up with Google OAuth
- Dashboard with domain progress tracking
- Mock Exam with timer, flag for review, navigation panel
- Domain Practice with immediate answer feedback
- History page with exam attempt tracking
- Credits page

**Components:**
- Header with navigation
- Footer with AWS disclaimer
- AnswerButton with multiple states
- PassFailBanner for exam results
- LoadingSpinner
- Modal dialogs
- ProgressBar for domain mastery
- MasteryRing (circular progress)

---

## REQUIRED CHANGES & IMPROVEMENTS

### 1. SIMPLIFY PRACTICE MODES

**Remove:**
- Weak Spot Trainer mode (remove from navigation, dashboard, and routes)
- Scenario Practice mode (remove from navigation, dashboard, and routes)

**Keep:**
- Mock Exam
- Domain Practice

**Update Navigation:**
- Header/Navbar should only show: Dashboard, Mock Exam, Domain Practice, History
- Remove weak spot and scenario links from all components

---

### 2. FIX DOMAIN MASTERY TRACKING

**Current Issue:** Domain stats are buggy and don't update correctly from both modes.

**New Behavior:**

**Domain Progress Tracking:**
- Track questions attempted and correct answers **per domain**
- Update `domain_progress` table after:
  - Mock Exam completion (update all 4 domains based on exam results)
  - Domain Practice session (update only the practiced domain)
- Calculate mastery as: `(questions_correct / questions_attempted) * 100`

**Database Updates:**
```sql
-- After Mock Exam:
For each domain (1-4):
  - Count questions from that domain in the exam
  - Count correct answers for that domain
  - UPSERT domain_progress:
    - INCREMENT questions_attempted by domain question count
    - INCREMENT questions_correct by correct answer count
    - RECALCULATE mastery_percent

-- After Domain Practice:
For the selected domain:
  - Count total questions in session
  - Count correct answers
  - UPSERT domain_progress:
    - INCREMENT questions_attempted
    - INCREMENT questions_correct
    - RECALCULATE mastery_percent
```

**Guest Mode:**
- Don't save to database
- Show warning that progress won't be tracked

---

### 3. DASHBOARD REDESIGN

**Remove:**
- Overall mastery ring (the circular progress showing average across all domains)
- "Total questions answered" stat
- "Best mock score" stat
- Mode cards for Weak Spot and Scenarios

**Keep & Improve:**
- Welcome message with user email
- 4 domain progress bars with:
  - Domain name
  - Mastery percentage
  - **NEW:** Questions attempted (e.g., "45/150 questions")
  - **NEW:** Correct answers (e.g., "32 correct")
- Mode cards for Mock Exam and Domain Practice only
- Last mock exam card with date, score, PASS/FAIL badge

**New Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Welcome back, user@email.com                        │
├─────────────────────────────────────────────────────┤
│ DOMAIN PROGRESS                                     │
│                                                     │
│ Domain 1: Cloud Concepts                           │
│ ████████░░░░░░░░░░ 45% | 45/150 attempted | 32 ✓  │
│                                                     │
│ Domain 2: Security & Compliance                    │
│ ██████░░░░░░░░░░░░ 38% | 28/120 attempted | 18 ✓  │
│                                                     │
│ Domain 3: Cloud Technology & Services              │
│ ███████████░░░░░░░ 62% | 89/180 attempted | 55 ✓  │
│                                                     │
│ Domain 4: Billing, Pricing & Support               │
│ ████░░░░░░░░░░░░░░ 25% | 12/60 attempted | 8 ✓    │
├─────────────────────────────────────────────────────┤
│ PRACTICE MODES                                      │
│                                                     │
│ ┌──────────────┐  ┌──────────────┐                │
│ │ Mock Exam    │  │ Domain       │                │
│ │ 65 questions │  │ Practice     │                │
│ │ 90 minutes   │  │ By domain    │                │
│ └──────────────┘  └──────────────┘                │
├─────────────────────────────────────────────────────┤
│ LAST MOCK EXAM                                      │
│ Feb 21, 2026 | 785/1000 | PASS ✓                   │
│ [View Details] [Retake]                            │
└─────────────────────────────────────────────────────┘
```

**Guest Mode Banner:**
- Show warning at top: "⚠️ Guest Mode - Sign in to save your progress"

---

### 4. HISTORY PAGE IMPROVEMENTS

**Add Stats Section at Top:**
```
┌─────────────────────────────────────────────────────┐
│ EXAM STATISTICS                                     │
│                                                     │
│ Total Attempts: 12                                  │
│ Pass Rate: 67% (8 passed, 4 failed)                │
│ Best Score: 825/1000                                │
│ Average Score: 742/1000                             │
└─────────────────────────────────────────────────────┘
```

**Keep:**
- Attempt list with cards (most recent first)
- Each card shows: date, scaled score, PASS/FAIL badge, time taken, domain scores
- Expand button to show question-by-question review

**Add (Future - Phase 2):**
- Score trend chart using Recharts (LineChart with pass mark line at 700)
- Filter buttons: All | Passed | Failed

---

### 5. MOBILE-FRIENDLY REQUIREMENTS

**All pages must be fully responsive:**

**Mobile (< 768px):**
- Header: Compact with hamburger menu or simplified nav
- Dashboard: Single column layout, cards stack vertically
- Mock Exam: Full-screen mode, navigation panel becomes modal/drawer
- Domain Practice: Full-width cards, larger touch targets
- History: Cards stack, stats in grid (2 columns)

**Tablet (768px - 1024px):**
- Two-column layouts where appropriate
- Comfortable spacing and touch targets

**Desktop (> 1024px):**
- Current layout (multi-column, sidebar navigation)
- Max-width containers for readability

**Touch Targets:**
- All buttons minimum 44px height
- Answer buttons minimum 60px height
- Adequate spacing between interactive elements

**Typography:**
- Readable font sizes on mobile (minimum 16px for body text)
- Proper line height for readability

---

### 6. DEPLOYMENT REQUIREMENTS

**Critical Missing Item:**

Create `public/_redirects` file for Netlify SPA routing:
```
/*    /index.html    200
```

**Environment Variables (Netlify):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Build Settings:**
- Base directory: `cloudpass`
- Build command: `npm run build`
- Publish directory: `cloudpass/dist`

---

## PHASE 2: DOMAIN PRACTICE RESULTS & EXPLANATIONS

### Priority 1: Improve Domain Practice Results Screen

**Current Issue:** Results screen shows "0% mastery" which is confusing.

**New Design:**

**Remove:**
- "0% mastery" text (confusing terminology)
- Generic stats display

**Add:**
- **Question-by-question review** showing all questions from the session
- Each question shows:
  - Question text
  - User's selected answer (highlighted in RED if wrong, GREEN if correct)
  - Correct answer (highlighted in GREEN)
  - Explanation text (empty for now, will be added in Priority 2)
  - Visual indicators: ✓ for correct, ✗ for wrong

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Session Complete!                                   │
│ You got 5/10 correct (50%)                         │
├─────────────────────────────────────────────────────┤
│ Question 1 of 10                              ✓     │
│ What is Amazon S3 used for?                        │
│                                                     │
│ A. Compute                                         │
│ B. Storage ✓ (Your answer - Correct!)             │
│ C. Database                                        │
│ D. Networking                                      │
│                                                     │
│ Explanation: [Will be added in Phase 2]           │
├─────────────────────────────────────────────────────┤
│ Question 2 of 10                              ✗     │
│ Which service provides DNS?                        │
│                                                     │
│ A. CloudFront ✗ (Your answer - Incorrect)         │
│ B. Route 53 ✓ (Correct answer)                    │
│ C. VPC                                             │
│ D. S3                                              │
│                                                     │
│ Explanation: [Will be added in Phase 2]           │
├─────────────────────────────────────────────────────┤
│ [Continue for all 10 questions...]                │
│                                                     │
│ [Back to Dashboard] [Practice Again]              │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- Store question results (question, user answer, correct answer, isCorrect) in state
- Display all questions on results screen with visual feedback
- Color coding: Green for correct, Red for incorrect
- Show placeholder text for explanations

---

### Priority 2: Add Question Explanations

**Goal:** Generate and display detailed explanations for all 588 questions.

**Implementation:**
1. Use AI (OpenAI API) to generate explanations for all questions
2. Script: `scripts/generateExplanations.mjs` (already exists)
3. Update `master_questions.json` with explanations
4. Display explanations in:
   - Domain Practice results screen (for each question)
   - Domain Practice immediate feedback (after answering)
   - Mock Exam review mode (after completion)

**Explanation Format:**
- Clear, concise explanation of why the answer is correct
- 2-3 sentences maximum
- Focus on AWS concepts and services
- Educational tone

---

### Additional Future Enhancements

**Performance:**
- Code splitting for faster initial load
- Lazy load routes
- Optimize question bank loading

**Features:**
- Bookmarking questions for later review
- Custom practice sessions (select multiple domains)
- Print/export exam results as PDF
- Dark/light mode toggle
- Keyboard shortcuts for navigation

**Analytics:**
- Track time spent per question
- Identify commonly missed questions
- Study time tracking
- Progress over time visualization

**Content:**
- Add more practice questions
- Update questions for latest AWS services
- Add video explanations for complex topics

**UX Polish:**
- Animations and transitions
- Confetti on exam pass
- Sound effects (optional, toggle-able)
- Better loading states
- Toast notifications for actions

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify |
| Charts | Recharts (for future score trends) |
| Routing | React Router v6 |

---

## DATABASE SCHEMA

**Tables:**
- `domain_progress` - Per-domain mastery tracking
- `exam_attempts` - Mock exam results
- `attempt_questions` - Question-level results per attempt
- `weak_spots` - (Keep for future use, but not actively used now)

**Key Fields in domain_progress:**
```sql
user_id uuid
domain_id integer (1-4)
questions_attempted integer
questions_correct integer
mastery_percent numeric (calculated)
updated_at timestamptz
```

---

## DEVELOPMENT BEST PRACTICES

### Git Workflow & Commit Strategy

**When to Commit:**
- After completing each checklist item
- After fixing a bug or issue
- Before starting a new major feature
- After successful testing of a feature

**Commit Message Format:**
```
<type>: <description>

Examples:
feat: add domain mastery tracking to mock exam
fix: correct domain progress calculation in domain practice
refactor: remove weak spot and scenario practice modes
style: improve mobile responsiveness on dashboard
docs: update README with deployment instructions
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring without changing functionality
- `style:` - UI/UX improvements, CSS changes
- `perf:` - Performance improvements
- `docs:` - Documentation updates
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, build config)

**Branch Strategy:**
- `main` - Production-ready code
- `dev` - Development branch for testing
- Feature branches: `feature/domain-tracking`, `fix/mobile-nav`, etc.

---

### Testing Strategy

**Test After Each Change:**
1. **Local Development** (`npm run dev`)
   - Test the specific feature you just implemented
   - Check both desktop and mobile views (use browser DevTools)
   - Test guest mode and authenticated mode
   - Verify no console errors

2. **Build Test** (`npm run build`)
   - Ensure build completes without errors
   - Check bundle size (should be reasonable)
   - Preview build locally (`npm run preview`)

3. **Cross-Browser Testing:**
   - Chrome (primary)
   - Firefox
   - Safari (if on Mac)
   - Mobile browsers (Chrome Mobile, Safari iOS)

**Testing Checklist for Each Feature:**
- [ ] Feature works as expected
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] Mobile responsive (test at 375px, 768px, 1024px, 1440px)
- [ ] Guest mode works correctly
- [ ] Authenticated mode works correctly
- [ ] Data saves to Supabase (if applicable)
- [ ] Loading states display correctly
- [ ] Error states handled gracefully

**When to Deploy to Netlify:**
- After completing a full checklist section
- After fixing critical bugs
- After thorough local testing
- Never deploy broken code

---

### Code Cleanup & Optimization

**Regular Cleanup Tasks:**

1. **Remove Unused Components:**
   ```bash
   # Check for unused imports
   # Look for components not referenced in any files
   # Remove commented-out code
   ```

2. **Identify Dead Code:**
   - Components not imported anywhere
   - Functions not called
   - Unused CSS classes
   - Unused types/interfaces

3. **Optimize Imports:**
   - Remove unused imports
   - Use named imports instead of default when possible
   - Group imports: React → Third-party → Local

4. **File Organization:**
   ```
   src/
   ├── components/     # Reusable UI components
   ├── pages/          # Route pages
   ├── hooks/          # Custom React hooks
   ├── lib/            # Utilities and helpers
   ├── types/          # TypeScript types
   └── data/           # Static data (questions)
   ```

**Code Quality Checks:**
- Run ESLint: `npm run lint`
- Check for TypeScript errors: `tsc --noEmit`
- Remove console.logs before committing
- Ensure consistent code formatting

---

### SEO Optimization

**Meta Tags (in `index.html`):**
```html
<head>
  <!-- Primary Meta Tags -->
  <title>CloudCertPrep - AWS Cloud Practitioner Exam Prep</title>
  <meta name="title" content="CloudCertPrep - AWS Cloud Practitioner Exam Prep">
  <meta name="description" content="Master the AWS Certified Cloud Practitioner exam with 588 practice questions, full mock exams, and domain-specific practice. Free online study platform.">
  <meta name="keywords" content="AWS, Cloud Practitioner, CLF-C02, exam prep, practice questions, AWS certification">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://cloudcertprep.netlify.app/">
  <meta property="og:title" content="CloudCertPrep - AWS Cloud Practitioner Exam Prep">
  <meta property="og:description" content="Master the AWS Certified Cloud Practitioner exam with 588 practice questions, full mock exams, and domain-specific practice.">
  <meta property="og:image" content="https://cloudcertprep.netlify.app/og-image.png">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://cloudcertprep.netlify.app/">
  <meta property="twitter:title" content="CloudCertPrep - AWS Cloud Practitioner Exam Prep">
  <meta property="twitter:description" content="Master the AWS Certified Cloud Practitioner exam with 588 practice questions, full mock exams, and domain-specific practice.">
  <meta property="twitter:image" content="https://cloudcertprep.netlify.app/twitter-image.png">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  
  <!-- Viewport for mobile -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Theme color -->
  <meta name="theme-color" content="#FF9900">
</head>
```

**robots.txt (in `public/`):**
```
User-agent: *
Allow: /
Sitemap: https://cloudcertprep.netlify.app/sitemap.xml
```

**Semantic HTML:**
- Use proper heading hierarchy (h1 → h2 → h3)
- Use semantic tags: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
- Add `alt` text to all images
- Use `<button>` for clickable actions, `<a>` for navigation

**Performance Optimization:**
- Lazy load routes with React.lazy()
- Optimize images (WebP format, proper sizing)
- Minimize bundle size (code splitting)
- Use production build for deployment
- Enable Netlify compression

**Accessibility:**
- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Sufficient color contrast (WCAG AA)
- Focus indicators on interactive elements
- Screen reader friendly

---

### Performance Optimization (Vite + React)

**Vite Configuration:**
```js
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
```

**Code Splitting:**
```tsx
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MockExam = lazy(() => import('./pages/MockExam'))
const DomainPractice = lazy(() => import('./pages/DomainPractice'))
```

**React Optimization:**
- Use `useMemo` for expensive calculations
- Use `useCallback` for function props
- Avoid unnecessary re-renders
- Use React DevTools Profiler to identify bottlenecks

**Bundle Analysis:**
```bash
# Analyze bundle size
npm run build
# Check dist/ folder size
```

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

## IMPLEMENTATION CHECKLIST

### Immediate Tasks:
- [ ] Remove Weak Spot and Scenario routes from `App.tsx`
- [ ] Remove Weak Spot and Scenario links from Header/Navbar
- [ ] Remove Weak Spot and Scenario mode cards from Dashboard
- [ ] Fix domain mastery tracking in Mock Exam
- [ ] Fix domain mastery tracking in Domain Practice
- [ ] Update Dashboard to show questions attempted/correct per domain
- [ ] Remove overall mastery ring from Dashboard
- [ ] Add stats section to History page (total attempts, pass rate, best score, average)
- [ ] Create `public/_redirects` file
- [ ] Test all features on mobile devices
- [ ] Verify responsive design on tablet and desktop

### Phase 2 (Domain Practice Results & Explanations):
- [ ] Update Domain Practice results screen to show question-by-question review
- [ ] Remove "0% mastery" confusing text
- [ ] Show all questions with user answers (red/green highlighting)
- [ ] Show correct answers with green highlighting
- [ ] Add visual indicators (✓ ✗) for each question
- [ ] Add placeholder for explanations
- [ ] Generate AI explanations for all 588 questions
- [ ] Update `master_questions.json` with explanations
- [ ] Display explanations in Domain Practice results screen
- [ ] Display explanations in Domain Practice immediate feedback
- [ ] Display explanations in Mock Exam review mode

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

## SUCCESS CRITERIA

The app is considered complete when:
1. ✅ Users can take full mock exams with accurate scoring
2. ✅ Users can practice by domain with immediate feedback
3. ✅ Domain mastery accurately reflects performance from both modes
4. ✅ Dashboard clearly shows progress per domain
5. ✅ History page tracks all exam attempts with stats
6. ✅ App is fully responsive on mobile, tablet, and desktop
7. ✅ Deployment works correctly on Netlify
8. ⏳ All questions have detailed explanations (Phase 2)

---

**Current Status:** Core implementation complete. Ready for refinements and explanation generation.

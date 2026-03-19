-- ============================================================
-- CloudCertPrep — Performance Indexes
-- Run in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS)
-- ============================================================

-- Speed up history page queries (user's exam attempts + questions)
CREATE INDEX IF NOT EXISTS attempt_questions_user_created_idx
  ON attempt_questions (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Speed up dashboard domain progress loads
CREATE INDEX IF NOT EXISTS domain_progress_user_cert_idx
  ON domain_progress (user_id, cert_code);

-- Speed up exam history queries
CREATE INDEX IF NOT EXISTS exam_attempts_user_cert_date_idx
  ON exam_attempts (user_id, cert_code, attempted_at DESC);

-- ============================================================
-- Optional: Clean up old practice questions (1 year retention)
-- Uncomment if you want to enable automatic cleanup
-- ============================================================

-- Enable pg_cron extension first:
-- Database → Extensions → pg_cron → Enable

-- Then run this to schedule cleanup:
/*
SELECT cron.schedule(
  'cleanup-old-practice-questions',
  '0 3 * * 0',  -- Weekly on Sunday at 3 AM UTC
  $$
    DELETE FROM public.attempt_questions
    WHERE attempt_id IS NULL
      AND created_at < now() - INTERVAL '1 year';
  $$
);
*/

-- To manually delete old practice questions now:
-- DELETE FROM attempt_questions
-- WHERE attempt_id IS NULL AND created_at < now() - INTERVAL '1 year';

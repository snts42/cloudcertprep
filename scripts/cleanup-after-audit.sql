-- Run this in Supabase SQL Editor AFTER deploying the audit changes.
-- It fixes the domain_id on existing attempt_questions records for moved questions,
-- removes records for the deleted Q690, and recalculates domain_progress.

-- 1. Update domain_id for questions moved to domain 3
UPDATE attempt_questions
SET domain_id = 3
WHERE question_id IN (
  'q1005','q1008','q168','q185','q188','q202','q224','q238','q239','q249',
  'q251','q278','q282','q287','q297','q365','q383','q404','q407','q426',
  'q431','q441','q461','q466','q471','q486','q521','q527','q548','q588',
  'q625','q650','q653','q658','q682','q712','q769','q774','q784','q794',
  'q814','q826','q865','q881','q888','q909','q918','q921','q968'
) AND domain_id = 1;

-- 2. Update domain_id for questions moved to domain 4
UPDATE attempt_questions
SET domain_id = 4
WHERE question_id IN (
  'q328','q423','q593','q787','q810','q949','q950'
) AND domain_id = 1;

-- 3. Update domain_id for q793 moved to domain 2
UPDATE attempt_questions
SET domain_id = 2
WHERE question_id = 'q793' AND domain_id = 1;

-- 4. Delete attempt records for removed Q690
DELETE FROM attempt_questions
WHERE question_id = 'q690';

-- 5. Delete all domain_progress rows for your user so they recalculate fresh
-- Replace YOUR_USER_ID with your actual user ID from Supabase auth.users
-- You can find it with: SELECT id FROM auth.users WHERE email = 'alex@santonastaso.com';
DELETE FROM domain_progress
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'alex@santonastaso.com')
  AND cert_code = 'clf-c02';

-- 6. Verify: check attempt_questions counts per domain match new question counts
SELECT domain_id, COUNT(DISTINCT question_id) AS unique_questions
FROM attempt_questions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'alex@santonastaso.com')
GROUP BY domain_id
ORDER BY domain_id;

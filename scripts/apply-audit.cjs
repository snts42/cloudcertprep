/**
 * One-time migration script to apply CLF-C02 domain 1 audit changes.
 * - Removes Q690 (choose-3 question)
 * - Moves questions to correct domains (2, 3, or 4)
 * - Updates explanations for all audited questions
 * - Handles question/answer rewrites for deprecated services
 *
 * Run: node scripts/apply-audit.cjs
 */
const fs = require('fs')
const path = require('path')

// ─── CSV Parser (handles multi-line quoted fields) ──────────────────────────
function parseCSV(text) {
  const rows = []
  let currentRow = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        currentField += char
        i++
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
      } else if (char === ',') {
        currentRow.push(currentField)
        currentField = ''
        i++
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField)
        if (currentRow.length > 1 && currentRow[0].trim()) {
          rows.push(currentRow)
        }
        currentRow = []
        currentField = ''
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i += 2
        } else {
          i++
        }
      } else {
        currentField += char
        i++
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField)
    if (currentRow.length > 1) rows.push(currentRow)
  }

  return rows
}

// ─── Read CSV ───────────────────────────────────────────────────────────────
const csvPath = path.join(__dirname, '..', '.prompts', 'clf_c02_audit.csv')
const csvText = fs.readFileSync(csvPath, 'utf8')
const rows = parseCSV(csvText)

// Row 0 = title, Row 1 = headers, Row 2+ = data
const dataRows = rows.slice(2)

// ─── Build changes map ──────────────────────────────────────────────────────
// Columns: 0=QID, 1=Domain, 2=Multi?, 3=AnswerOK?, 4=DomainTagOK?,
//          5=NewCorrectAnswer, 6=NewDomain, 7=ExplanationNotes, 8=NewExplanation
const changes = new Map()
let parsed = 0

for (const row of dataRows) {
  let qId = row[0]?.trim()
  if (!qId) continue
  // Normalise: lowercase, remove trailing spaces
  const qIdLower = qId.toLowerCase().replace(/\s+/g, '')
  if (!qIdLower.startsWith('q')) continue

  const newExplanation = (row[8] || '').trim()
  const newDomain = row[6]?.trim() ? parseInt(row[6].trim()) : null
  const answerOk = (row[3] || '').trim().toLowerCase()
  const newCorrectAnswer = (row[5] || '').trim()
  const explanationNotes = (row[7] || '').trim()

  changes.set(qIdLower, {
    answerOk,
    newDomain,
    newCorrectAnswer,
    explanationNotes,
    newExplanation,
  })
  parsed++
}

console.log(`Parsed ${parsed} audit rows from CSV\n`)

// ─── Hardcoded question/answer rewrites (deprecated services + typos) ───────
// These are carefully extracted from the CSV "New Correct Answer" column.
const questionRewrites = {
  // q282 — AWS Personal Health Dashboard renamed to AWS Health Dashboard
  q282: {
    question: 'Which AWS service provides the current status of all AWS services in all AWS Regions?',
    options: {
      A: 'AWS Service Health Dashboard',
      B: 'AWS Management Console',
      C: 'Amazon CloudWatch',
      D: 'AWS Health Dashboard',
    },
    answer: 'A',
    isMultiAnswer: false,
  },
  // q328 — AWS TCO Calculator deprecated → AWS Migration Evaluator
  q328: {
    question: 'TYMO Cloud Corp is looking forward to migrating their entire on-premises data center to AWS. What tool can they use to perform a cost-benefit analysis of moving to the AWS Cloud?',
    options: {
      A: 'AWS Cost Explorer',
      B: 'AWS Migration Evaluator',
      C: 'AWS Budgets',
      D: 'AWS Pricing Calculator',
    },
    answer: 'B',
    isMultiAnswer: false,
  },
  // q404 — AWS Server Migration Service deprecated → AWS Application Migration Service (MGN)
  q404: {
    question: 'You need to migrate a large number of on-premises workloads to AWS. Which AWS service is the most appropriate?',
    options: {
      A: 'AWS File Transfer Acceleration',
      B: 'AWS Application Migration Service',
      C: 'AWS Database Migration Service',
      D: 'AWS Application Discovery Service',
    },
    answer: 'B',
    isMultiAnswer: false,
  },
  // q407 — CloudEndure Disaster Recovery deprecated → AWS Elastic Disaster Recovery
  q407: {
    question: 'A company is hosting business critical workloads in an AWS Region. To protect against data loss and ensure business continuity, a mirror image of the current AWS environment should be created in another AWS Region. Company policy requires that the standby environment must be available in minutes in case of an outage in the primary AWS Region. Which AWS service can be used to meet these requirements?',
    options: {
      A: 'AWS Elastic Disaster Recovery',
      B: 'CloudEndure Migration',
      C: 'AWS Backup',
      D: 'AWS Glue',
    },
    answer: 'A',
    isMultiAnswer: false,
  },
  // q423 — AWS TCO Calculator deprecated → AWS Migration Evaluator
  q423: {
    question: 'Which tool can a non-AWS customer use to compare the cost of on-premises environment resources to AWS?',
    options: {
      A: 'AWS Cost Explorer',
      B: 'AWS Pricing Calculator',
      C: 'AWS Budgets',
      D: 'AWS Migration Evaluator',
    },
    answer: 'D',
    isMultiAnswer: false,
  },
  // q441 — AWS Import/Export deprecated → Snow Family
  q441: {
    question: 'You want to transfer 200 Terabytes of data from on-premises locations to the AWS Cloud. Which of the following can do the job in a cost-effective way?',
    options: {
      A: 'AWS Snowmobile',
      B: 'AWS Direct Connect',
      C: 'AWS DMS',
      D: 'AWS Snowball',
    },
    answer: 'D',
    isMultiAnswer: false,
  },
  // q784 — Updated question and options
  q784: {
    question: 'When designing a typical three-tier web application, which AWS services and/or features improve availability and reduce the impact of failures? (Choose two.)',
    options: {
      A: 'AWS Auto Scaling for Amazon EC2 instances',
      B: 'Amazon VPC subnet ACLs to check the health of a service',
      C: 'Distributed resources across multiple Availability Zones',
      D: 'Amazon CloudWatch alarms to notify when an EC2 instance enters an unhealthy state',
      E: 'Distributed resources across multiple AWS points of presence',
    },
    answer: ['A', 'C'],
    isMultiAnswer: true,
  },
  // q950 — AWS Simple Monthly Calculator retired → AWS Pricing Calculator
  q950: {
    question: 'An architecture design includes Amazon EC2, an Elastic Load Balancer, and Amazon RDS. What is the BEST way to get a monthly cost estimation for this architecture?',
    options: {
      A: 'Open an AWS Support case, provide the architecture proposal, and ask for a monthly cost estimation.',
      B: 'Collect the published prices of the AWS services and calculate the monthly estimate.',
      C: 'Use the AWS Pricing Calculator to estimate the monthly cost.',
      D: 'Use the AWS Total Cost of Ownership (TCO) Calculator to estimate the monthly cost.',
    },
    answer: 'C',
    isMultiAnswer: false,
  },
  // q168 — Updated question text (added "Select TWO")
  q168: {
    question: 'A company wants to migrate its applications to a VPC on AWS. These applications will need to access on-premises resources. What combination of actions will enable the company to accomplish this goal? (Select TWO)',
    // options and answer unchanged — keep existing
  },
}

// Typo fixes: applied directly to the question text in domain1.json
const typoFixes = {
  // q767 — option B: "that is using used" → "that is being used"
  q767: { fixType: 'option', optionKey: 'B', find: 'that is using used', replace: 'that is being used' },
  // q935 — question: "scale up and down the meet" → "scale up and down to meet"
  q935: { fixType: 'question', find: 'scale up and down the meet', replace: 'scale up and down to meet' },
}

// ─── Read domain JSON files ─────────────────────────────────────────────────
const dataDir = path.join(__dirname, '..', 'src', 'data', 'clf-c02')
const domain1 = JSON.parse(fs.readFileSync(path.join(dataDir, 'domain1.json'), 'utf8'))
const domain2 = JSON.parse(fs.readFileSync(path.join(dataDir, 'domain2.json'), 'utf8'))
const domain3 = JSON.parse(fs.readFileSync(path.join(dataDir, 'domain3.json'), 'utf8'))
const domain4 = JSON.parse(fs.readFileSync(path.join(dataDir, 'domain4.json'), 'utf8'))

const origCounts = {
  d1: domain1.length,
  d2: domain2.length,
  d3: domain3.length,
  d4: domain4.length,
}

// ─── Process domain 1 questions ─────────────────────────────────────────────
const newDomain1 = []
const movedTo = { 2: [], 3: [], 4: [] }
let removed = 0
let explanationsUpdated = 0
let questionsRewritten = 0
let typosFixed = 0

for (const q of domain1) {
  const qId = q.id.toLowerCase()

  // Remove Q690 (choose-3)
  if (qId === 'q690') {
    console.log(`REMOVED: ${q.id} (choose-3 question)`)
    removed++
    continue
  }

  const change = changes.get(qId)

  // Apply question/answer rewrites
  const rewrite = questionRewrites[qId]
  if (rewrite) {
    if (rewrite.question) q.question = rewrite.question
    if (rewrite.options) q.options = rewrite.options
    if (rewrite.answer !== undefined) q.answer = rewrite.answer
    if (rewrite.isMultiAnswer !== undefined) q.isMultiAnswer = rewrite.isMultiAnswer
    questionsRewritten++
    console.log(`REWRITTEN: ${q.id}`)
  }

  // Apply typo fixes
  const typo = typoFixes[qId]
  if (typo) {
    if (typo.fixType === 'question') {
      q.question = q.question.replace(typo.find, typo.replace)
    } else if (typo.fixType === 'option') {
      if (q.options[typo.optionKey]) {
        q.options[typo.optionKey] = q.options[typo.optionKey].replace(typo.find, typo.replace)
      }
    }
    typosFixed++
    console.log(`TYPO FIXED: ${q.id}`)
  }

  // Update explanation
  if (change && change.newExplanation) {
    // Clean up: collapse multiple newlines, trim
    q.explanation = change.newExplanation
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    explanationsUpdated++
  }

  // Move to new domain
  if (change && change.newDomain && change.newDomain !== 1) {
    q.domainId = change.newDomain
    movedTo[change.newDomain].push(q)
    console.log(`MOVED: ${q.id} → domain ${change.newDomain}`)
    continue
  }

  newDomain1.push(q)
}

// ─── Add moved questions to target domains ──────────────────────────────────
domain2.push(...movedTo[2])
domain3.push(...movedTo[3])
domain4.push(...movedTo[4])

// ─── Write all domain files ─────────────────────────────────────────────────
fs.writeFileSync(path.join(dataDir, 'domain1.json'), JSON.stringify(newDomain1, null, 2) + '\n')
fs.writeFileSync(path.join(dataDir, 'domain2.json'), JSON.stringify(domain2, null, 2) + '\n')
fs.writeFileSync(path.join(dataDir, 'domain3.json'), JSON.stringify(domain3, null, 2) + '\n')
fs.writeFileSync(path.join(dataDir, 'domain4.json'), JSON.stringify(domain4, null, 2) + '\n')

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════')
console.log('           MIGRATION SUMMARY')
console.log('══════════════════════════════════════')
console.log(`Questions removed:      ${removed}`)
console.log(`Questions rewritten:    ${questionsRewritten}`)
console.log(`Typos fixed:            ${typosFixed}`)
console.log(`Explanations updated:   ${explanationsUpdated}`)
console.log(`Moved to domain 2:      ${movedTo[2].length}`)
console.log(`Moved to domain 3:      ${movedTo[3].length}`)
console.log(`Moved to domain 4:      ${movedTo[4].length}`)
console.log('')
console.log(`Domain 1: ${origCounts.d1} → ${newDomain1.length}`)
console.log(`Domain 2: ${origCounts.d2} → ${domain2.length}`)
console.log(`Domain 3: ${origCounts.d3} → ${domain3.length}`)
console.log(`Domain 4: ${origCounts.d4} → ${domain4.length}`)
console.log(`Total:    ${origCounts.d1 + origCounts.d2 + origCounts.d3 + origCounts.d4} → ${newDomain1.length + domain2.length + domain3.length + domain4.length}`)
console.log('══════════════════════════════════════')

// Verify expected counts
const expectedD1 = 139
const expectedTotal = origCounts.d1 + origCounts.d2 + origCounts.d3 + origCounts.d4 - removed
if (newDomain1.length !== expectedD1) {
  console.warn(`\n⚠️  Domain 1 count ${newDomain1.length} differs from expected ${expectedD1}`)
}
if (newDomain1.length + domain2.length + domain3.length + domain4.length !== expectedTotal) {
  console.warn(`\n⚠️  Total count mismatch! Expected ${expectedTotal}`)
}

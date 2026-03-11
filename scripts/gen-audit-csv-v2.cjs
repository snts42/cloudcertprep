/**
 * Generate a CSV of all duplicate pairs for manual audit.
 * v2: Also catches reworded questions (same options/answer, different question text)
 * Run: node scripts/gen-audit-csv-v2.cjs
 * Output: scripts/duplicates-audit.csv
 */
const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '..', 'src', 'data', 'clf-c02')

// Load all domains
const allQuestions = []
for (let d = 1; d <= 4; d++) {
  const questions = JSON.parse(fs.readFileSync(path.join(dataDir, `domain${d}.json`), 'utf8'))
  for (const q of questions) {
    allQuestions.push({ ...q, file: `domain${d}.json` })
  }
}

// Similarity functions
function normalise(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function jaccard(a, b) {
  const setA = new Set(a.split(' '))
  const setB = new Set(b.split(' '))
  const intersection = [...setA].filter(w => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

function charSimilarity(a, b) {
  if (Math.abs(a.length - b.length) / Math.max(a.length, b.length, 1) > 0.3) return 0
  const la = a.length, lb = b.length
  if (la > 500 || lb > 500) return jaccard(a, b)
  let prev = Array.from({ length: lb + 1 }, (_, i) => i)
  let curr = new Array(lb + 1)
  for (let i = 1; i <= la; i++) {
    curr[0] = i
    for (let j = 1; j <= lb; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
    }
    ;[prev, curr] = [curr, prev]
  }
  return 1 - prev[lb] / Math.max(la, lb)
}

// Escape CSV field
function esc(val) {
  const s = String(val).replace(/"/g, '""')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
}

// Find ALL pairs above different thresholds
const matches = []
const total = allQuestions.length
let checked = 0
const totalPairs = (total * (total - 1)) / 2

for (let i = 0; i < total; i++) {
  for (let j = i + 1; j < total; j++) {
    const q1 = allQuestions[i], q2 = allQuestions[j]
    
    const normQ1 = normalise(q1.question)
    const normQ2 = normalise(q2.question)
    const qJac = jaccard(normQ1, normQ2)
    const qChar = charSimilarity(normQ1, normQ2)
    
    const opts1 = normalise(Object.values(q1.options).join(' '))
    const opts2 = normalise(Object.values(q2.options).join(' '))
    const optJac = jaccard(opts1, opts2)
    
    const combined = qJac * 0.35 + qChar * 0.35 + optJac * 0.30
    
    const sameAnswer = JSON.stringify(q1.answer) === JSON.stringify(q2.answer)

    // TIER 1: Combined ≥70% (original duplicates)
    // TIER 2: Options ≥70% AND question ≥40% (reworded questions with same options)
    // TIER 3: Same answer + options ≥80% but question 30-70% (same concept, different wording)
    
    let tier = null
    if (combined >= 0.70) {
      tier = 'DUPLICATE'
    } else if (optJac >= 0.70 && qJac >= 0.40) {
      tier = 'REWORDED'
    } else if (sameAnswer && optJac >= 0.80 && qJac >= 0.30 && qJac < 0.70) {
      tier = 'SAME-CONCEPT'
    }
    
    if (tier) {
      matches.push({ q1, q2, qJac, qChar, optJac, combined, sameAnswer, tier })
    }
    
    checked++
  }
  if (i % 100 === 0 && i > 0) {
    process.stdout.write(`\r${checked.toLocaleString()} / ${totalPairs.toLocaleString()} pairs...`)
  }
}

process.stdout.write(`\r${totalPairs.toLocaleString()} pairs checked.                    \n`)

// Sort: DUPLICATE first, then REWORDED, then SAME-CONCEPT; within each tier sort by combined desc
const tierOrder = { 'DUPLICATE': 0, 'REWORDED': 1, 'SAME-CONCEPT': 2 }
matches.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || b.combined - a.combined)

// De-duplicate: if a pair appears in multiple tiers, keep only the highest tier
const seen = new Set()
const unique = []
for (const m of matches) {
  const key = [m.q1.id, m.q2.id].sort().join('|')
  if (!seen.has(key)) {
    seen.add(key)
    unique.push(m)
  }
}

// Generate CSV
const header = [
  'Tier', 'Q1 ID', 'Q1 Domain', 'Q1 File',
  'Q2 ID', 'Q2 Domain', 'Q2 File',
  'Combined %', 'Question Sim %', 'Options Sim %',
  'Same Answer?',
  'Q1 Answer', 'Q2 Answer',
  'Q1 Question Text', 'Q2 Question Text',
  'Q1 Options (A/B/C/D)', 'Q2 Options (A/B/C/D)',
  'Notes', 'Action (KEEP Q1 / KEEP Q2 / KEEP BOTH / REVIEW)', 'Audited'
]

const rows = [header.join(',')]

for (const m of unique) {
  const sameDomain = m.q1.domainId === m.q2.domainId

  const notes = []
  if (!m.sameAnswer) notes.push('DIFFERENT ANSWERS')
  if (!sameDomain) notes.push(`Cross-domain: D${m.q1.domainId} vs D${m.q2.domainId}`)
  if (m.tier === 'DUPLICATE' && m.combined >= 0.98) notes.push('Exact duplicate')
  if (m.tier === 'REWORDED') notes.push('Same options, reworded question')
  if (m.tier === 'SAME-CONCEPT') notes.push('Same concept, different wording')
  
  if (m.q1.question.includes('tower latency')) notes.push('Q1 typo: "tower"->"lower"')
  if (m.q2.question.includes('tower latency')) notes.push('Q2 typo: "tower"->"lower"')
  if (m.q1.question.includes('When AWS tool')) notes.push('Q1 typo: "When"->"Which"')
  if (m.q2.question.includes('When AWS tool')) notes.push('Q2 typo: "When"->"Which"')

  const fmtOpts = (q) => `A: ${q.options.A} | B: ${q.options.B} | C: ${q.options.C} | D: ${q.options.D}${q.options.E ? ' | E: ' + q.options.E : ''}`

  const row = [
    m.tier,
    m.q1.id, m.q1.domainId, m.q1.file,
    m.q2.id, m.q2.domainId, m.q2.file,
    (m.combined * 100).toFixed(1),
    (m.qJac * 100).toFixed(0),
    (m.optJac * 100).toFixed(0),
    m.sameAnswer ? 'YES' : 'NO',
    Array.isArray(m.q1.answer) ? m.q1.answer.join(', ') : m.q1.answer,
    Array.isArray(m.q2.answer) ? m.q2.answer.join(', ') : m.q2.answer,
    m.q1.question,
    m.q2.question,
    fmtOpts(m.q1),
    fmtOpts(m.q2),
    notes.join('; ') || '',
    '', ''
  ]

  rows.push(row.map(esc).join(','))
}

const outPath = path.join(__dirname, 'duplicates-audit.csv')
fs.writeFileSync(outPath, '\ufeff' + rows.join('\n'), 'utf8')

// Summary
const dupes = unique.filter(m => m.tier === 'DUPLICATE').length
const reworded = unique.filter(m => m.tier === 'REWORDED').length
const sameConcept = unique.filter(m => m.tier === 'SAME-CONCEPT').length
console.log(`\nWritten ${unique.length} pairs to ${outPath}`)
console.log(`  DUPLICATE:    ${dupes} pairs (≥70% combined similarity)`)
console.log(`  REWORDED:     ${reworded} pairs (same options, different question wording)`)
console.log(`  SAME-CONCEPT: ${sameConcept} pairs (same answer + similar options, different question)`)

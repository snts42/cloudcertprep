/**
 * Generate a CSV of all duplicate pairs for manual audit.
 * Run: node scripts/gen-audit-csv.cjs
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

function questionSimilarity(q1, q2) {
  const normQ1 = normalise(q1.question)
  const normQ2 = normalise(q2.question)
  const jSim = jaccard(normQ1, normQ2)
  const cSim = charSimilarity(normQ1, normQ2)
  const opts1 = normalise(Object.values(q1.options).join(' '))
  const opts2 = normalise(Object.values(q2.options).join(' '))
  const optJSim = jaccard(opts1, opts2)
  return { jSim, cSim, optJSim, combined: jSim * 0.35 + cSim * 0.35 + optJSim * 0.30 }
}

// Find duplicates
const THRESHOLD = 0.70
const matches = []
const total = allQuestions.length

for (let i = 0; i < total; i++) {
  for (let j = i + 1; j < total; j++) {
    const sim = questionSimilarity(allQuestions[i], allQuestions[j])
    if (sim.combined >= THRESHOLD) {
      matches.push({ q1: allQuestions[i], q2: allQuestions[j], ...sim })
    }
  }
}

matches.sort((a, b) => b.combined - a.combined)

// Escape CSV field
function esc(val) {
  const s = String(val).replace(/"/g, '""')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
}

// Generate CSV
const header = [
  'Q1 ID', 'Q1 Domain', 'Q1 File',
  'Q2 ID', 'Q2 Domain', 'Q2 File',
  'Similarity %', 'Same Answer?', 'Same Domain?',
  'Q1 Answer', 'Q2 Answer',
  'Q1 Question Text', 'Q2 Question Text',
  'Notes', 'Action (KEEP Q1 / KEEP Q2 / REVIEW)', 'Audited'
]

const rows = [header.join(',')]

for (const m of matches) {
  const sameAnswer = JSON.stringify(m.q1.answer) === JSON.stringify(m.q2.answer)
  const sameDomain = m.q1.domainId === m.q2.domainId
  
  // Auto-detect notes
  const notes = []
  if (!sameAnswer) notes.push('DIFFERENT ANSWERS - needs review')
  if (!sameDomain) notes.push(`Cross-domain: D${m.q1.domainId} vs D${m.q2.domainId}`)
  if (m.combined >= 0.98) notes.push('Exact duplicate')
  
  // Check for typos by comparing raw text
  const q1raw = m.q1.question
  const q2raw = m.q2.question
  if (q1raw.includes('tower latency')) notes.push('Q1 typo: "tower" should be "lower"')
  if (q2raw.includes('tower latency')) notes.push('Q2 typo: "tower" should be "lower"')
  if (q1raw.includes('When AWS tool')) notes.push('Q1 typo: "When" should be "Which"')
  if (q2raw.includes('When AWS tool')) notes.push('Q2 typo: "When" should be "Which"')

  const row = [
    m.q1.id, m.q1.domainId, m.q1.file,
    m.q2.id, m.q2.domainId, m.q2.file,
    (m.combined * 100).toFixed(1),
    sameAnswer ? 'YES' : 'NO',
    sameDomain ? 'YES' : 'NO',
    Array.isArray(m.q1.answer) ? m.q1.answer.join(', ') : m.q1.answer,
    Array.isArray(m.q2.answer) ? m.q2.answer.join(', ') : m.q2.answer,
    m.q1.question,
    m.q2.question,
    notes.join('; ') || '',
    '', ''
  ]

  rows.push(row.map(esc).join(','))
}

const outPath = path.join(__dirname, 'duplicates-audit.csv')
// Write with BOM for Excel compatibility
fs.writeFileSync(outPath, '\ufeff' + rows.join('\n'), 'utf8')
console.log(`Written ${matches.length} duplicate pairs to ${outPath}`)

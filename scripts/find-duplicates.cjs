/**
 * Find duplicate and near-duplicate questions across all domain JSON files.
 * Uses word-level Jaccard similarity + character-level similarity ratio.
 *
 * Run: node scripts/find-duplicates.cjs
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

console.log(`Loaded ${allQuestions.length} total questions across 4 domains\n`)

// ─── Normalise text ─────────────────────────────────────────────────────────
function normalise(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Word-level Jaccard similarity ──────────────────────────────────────────
function jaccard(a, b) {
  const setA = new Set(a.split(' '))
  const setB = new Set(b.split(' '))
  const intersection = [...setA].filter(w => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

// ─── Character-level similarity (longest common subsequence ratio) ──────────
function charSimilarity(a, b) {
  // Quick length check
  if (Math.abs(a.length - b.length) / Math.max(a.length, b.length, 1) > 0.3) return 0

  // Simple edit distance ratio for strings under 500 chars
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1

  // Use two-row Levenshtein for memory efficiency
  const la = a.length, lb = b.length
  if (la > 500 || lb > 500) {
    // Fall back to Jaccard only for very long strings
    return jaccard(a, b)
  }

  let prev = Array.from({ length: lb + 1 }, (_, i) => i)
  let curr = new Array(lb + 1)

  for (let i = 1; i <= la; i++) {
    curr[0] = i
    for (let j = 1; j <= lb; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1]
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
      }
    }
    ;[prev, curr] = [curr, prev]
  }

  const editDist = prev[lb]
  return 1 - editDist / maxLen
}

// ─── Compare questions on text ──────────────────────────────────────────────
function questionSimilarity(q1, q2) {
  const normQ1 = normalise(q1.question)
  const normQ2 = normalise(q2.question)

  const jSim = jaccard(normQ1, normQ2)
  const cSim = charSimilarity(normQ1, normQ2)

  // Also compare options (concatenated)
  const opts1 = normalise(Object.values(q1.options).join(' '))
  const opts2 = normalise(Object.values(q2.options).join(' '))
  const optJSim = jaccard(opts1, opts2)

  // Combined score: weighted average
  const combined = jSim * 0.35 + cSim * 0.35 + optJSim * 0.30

  return { jSim, cSim, optJSim, combined }
}

// ─── Find duplicates ────────────────────────────────────────────────────────
const THRESHOLD = 0.70  // Flag pairs above 70% combined similarity
const matches = []

const total = allQuestions.length
const totalPairs = (total * (total - 1)) / 2
let checked = 0

for (let i = 0; i < total; i++) {
  for (let j = i + 1; j < total; j++) {
    const sim = questionSimilarity(allQuestions[i], allQuestions[j])
    checked++

    if (sim.combined >= THRESHOLD) {
      matches.push({
        q1: allQuestions[i],
        q2: allQuestions[j],
        ...sim,
      })
    }
  }

  // Progress every 100 questions
  if (i % 100 === 0 && i > 0) {
    process.stdout.write(`\rChecked ${checked.toLocaleString()} / ${totalPairs.toLocaleString()} pairs...`)
  }
}

process.stdout.write(`\rChecked ${totalPairs.toLocaleString()} pairs total.                    \n\n`)

// Sort by combined similarity descending
matches.sort((a, b) => b.combined - a.combined)

// ─── Output ─────────────────────────────────────────────────────────────────
if (matches.length === 0) {
  console.log('No duplicates or near-duplicates found above threshold.')
} else {
  console.log(`Found ${matches.length} potential duplicate pairs (threshold: ${(THRESHOLD * 100).toFixed(0)}%)\n`)
  console.log('═'.repeat(100))

  for (const m of matches) {
    const sameAnswer = JSON.stringify(m.q1.answer) === JSON.stringify(m.q2.answer)
    const sameDomain = m.q1.domainId === m.q2.domainId

    console.log(`\n  ${m.q1.id} (${m.q1.file}, D${m.q1.domainId}) vs ${m.q2.id} (${m.q2.file}, D${m.q2.domainId})`)
    console.log(`  Combined: ${(m.combined * 100).toFixed(1)}%  |  Question: ${(m.jSim * 100).toFixed(0)}%J/${(m.cSim * 100).toFixed(0)}%C  |  Options: ${(m.optJSim * 100).toFixed(0)}%J`)
    console.log(`  Same answer: ${sameAnswer ? 'YES' : 'NO'}  |  Same domain: ${sameDomain ? 'YES' : 'NO'}`)
    console.log(`  Q1: ${m.q1.question.substring(0, 120)}${m.q1.question.length > 120 ? '...' : ''}`)
    console.log(`  Q2: ${m.q2.question.substring(0, 120)}${m.q2.question.length > 120 ? '...' : ''}`)
    console.log('─'.repeat(100))
  }

  console.log(`\n═══ SUMMARY ═══`)
  console.log(`Total questions: ${total}`)
  console.log(`Pairs above ${(THRESHOLD * 100).toFixed(0)}%: ${matches.length}`)
  console.log(`  - Same domain: ${matches.filter(m => m.q1.domainId === m.q2.domainId).length}`)
  console.log(`  - Cross domain: ${matches.filter(m => m.q1.domainId !== m.q2.domainId).length}`)
  console.log(`  - ≥90% (likely exact): ${matches.filter(m => m.combined >= 0.90).length}`)
  console.log(`  - 80-90% (near-duplicate): ${matches.filter(m => m.combined >= 0.80 && m.combined < 0.90).length}`)
  console.log(`  - 70-80% (similar): ${matches.filter(m => m.combined < 0.80).length}`)
}

/**
 * Migration script to apply CLF-C02 v2 audit changes.
 * Reads clf_c02_audit_v2.csv and applies:
 * - Duplicate removals
 * - Question/option/answer rewrites (deprecated services, typos, formatting)
 * - Service rename instructions (e.g. Glacier → S3 Glacier)
 * - Domain moves
 * - Explanation updates
 *
 * Run: node scripts/apply-audit-v2.cjs
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

// ─── Parse "New Correct Answer" field ───────────────────────────────────────
function parseNewAnswer(text) {
  text = text.trim()
  if (!text) return null

  // DUPLICATE (including typo "DUPICATE")
  const dupMatch = text.match(/^DUP(?:L)?ICATE\s+OF\s+(Q\d+)/i)
  if (dupMatch) return { type: 'duplicate', duplicateOf: dupMatch[1].toLowerCase() }

  // Typo-only notes
  if (text.match(/^There is (a|also a) (minor )?typo/i)) {
    return { type: 'typo_note', note: text }
  }

  // Rename instructions (e.g. "REWRITE GLACIER TO S3 GLACIER")
  const renameMatch = text.match(/^REWRITE\s+(.+?)\s+TO\s+(.+)$/i)
  if (renameMatch) {
    return { type: 'rename', find: renameMatch[1].trim(), replace: renameMatch[2].trim() }
  }

  // Full question/options/answer rewrite
  const result = { type: 'rewrite' }

  // Strip "Question:" prefix
  text = text.replace(/^Question:\s*/i, '')

  // Extract correct answer(s) from end
  const answerMatch = text.match(/(?:Correct answers?|Answers?):\s*([A-E](?:\s*(?:,\s*|and\s+)[A-E])*)\s*$/im)
  if (answerMatch) {
    const answers = answerMatch[1].replace(/\s*and\s*/g, ',').split(/\s*,\s*/).map(a => a.trim())
    result.answer = answers.length === 1 ? answers[0] : answers
    result.isMultiAnswer = answers.length > 1
    text = text.substring(0, answerMatch.index).trim()
  }

  // Extract options - try multiple patterns
  let optionsIdx = text.search(/Options\s*:?\s*\n?\s*A[\.:]/i)

  // Bare options after newline: "?\nA. text"
  if (optionsIdx < 0) {
    const bareMatch = text.match(/[.?)\n]\s*\n\s*A[\.:]\s/m)
    if (bareMatch) optionsIdx = bareMatch.index + 1
  }

  // Inline options: "question? A. opt1 B. opt2"
  if (optionsIdx < 0) {
    const inlineMatch = text.match(/[.?)]\s+A[\.:]\s/)
    if (inlineMatch) optionsIdx = inlineMatch.index + 1
  }

  if (optionsIdx >= 0) {
    result.question = text.substring(0, optionsIdx).trim()
    let optionsText = text.substring(optionsIdx).replace(/^Options\s*:?\s*/i, '').trim()

    const opts = {}
    const parts = optionsText.split(/\s*([A-E])[\.:]\s*/)
    for (let i = 1; i < parts.length; i += 2) {
      const letter = parts[i]
      let value = (parts[i + 1] || '').trim().replace(/\.\s*$/, '').trim()
      if (letter && value) opts[letter] = value
    }
    if (Object.keys(opts).length > 0) result.options = opts
  } else {
    result.question = text
  }

  return result
}

// ─── Read CSV ───────────────────────────────────────────────────────────────
const csvPath = path.join(__dirname, '..', '.prompts', 'clf_c02_audit_v2.csv')
let csvText = fs.readFileSync(csvPath, 'utf8')
if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1)
const rows = parseCSV(csvText)
const dataRows = rows.slice(2) // Skip title + header

// ─── Build structured changes from CSV ──────────────────────────────────────
// Columns: 0=QID, 1=Domain, 2=Multi?, 3=AnswerOK?, 4=DomainTagOK?,
//          5=NewCorrectAnswer, 6=NewDomain, 7=ExplanationNotes, 8=NewExplanation
const duplicates = new Set()
const rewrites = new Map()   // qId → parsed rewrite from "New Correct Answer"
const renames = []           // rename instructions (e.g. GLACIER → S3 GLACIER)
const explanations = new Map()
const moves = new Map()
let parsed = 0

for (const row of dataRows) {
  let qId = (row[0] || '').trim().toLowerCase().replace(/\s+/g, '')
  if (!qId.startsWith('q')) continue

  const newAnswerField = (row[5] || '').trim()
  const newExplanation = (row[8] || '').trim()
  const newDomain = (row[6] || '').trim()

  // Parse the "New Correct Answer" column
  if (newAnswerField) {
    const parsedAnswer = parseNewAnswer(newAnswerField)
    if (parsedAnswer) {
      if (parsedAnswer.type === 'duplicate') {
        duplicates.add(qId)
        moves.delete(qId)
        parsed++
        continue
      } else if (parsedAnswer.type === 'rename') {
        renames.push({ qId, find: parsedAnswer.find, replace: parsedAnswer.replace })
      } else if (parsedAnswer.type === 'rewrite') {
        rewrites.set(qId, parsedAnswer)
      }
      // typo_note: handled inline below via the explanation notes
    }
  }

  if (duplicates.has(qId)) { parsed++; continue }

  // Explanation updates
  if (newExplanation) {
    explanations.set(qId, newExplanation.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim())
  }

  // Domain moves
  if (newDomain && !isNaN(parseInt(newDomain))) {
    moves.set(qId, parseInt(newDomain))
  }

  parsed++
}

console.log(`Parsed ${parsed} audit rows from CSV`)
console.log(`  Duplicates to remove: ${duplicates.size}`)
console.log(`  Rewrites from CSV:    ${rewrites.size}`)
console.log(`  Rename instructions:  ${renames.length}`)
console.log(`  Domain moves:         ${moves.size}`)
console.log(`  Explanation updates:  ${explanations.size}`)

// ─── Hardcoded typo fixes (from "Explanation Notes" column) ─────────────────
// These are small typo/formatting fixes identified in the audit CSV notes
const typoFixes = {
  q122: { fixType: 'question', find: 'stopped Of terminated', replace: 'stopped or terminated' },
  q585: { fixType: 'question', find: 'that an AWS customers', replace: 'that an AWS customer' },
  q767: { fixType: 'option', optionKey: 'B', find: 'that is using used', replace: 'that is being used' },
  q935: { fixType: 'question', find: 'scale up and down the meet', replace: 'scale up and down to meet' },
}

// ─── Read domain JSON files ─────────────────────────────────────────────────
const dataDir = path.join(__dirname, '..', 'src', 'data', 'clf-c02')
const domains = {}
for (let d = 1; d <= 4; d++) {
  domains[d] = JSON.parse(fs.readFileSync(path.join(dataDir, `domain${d}.json`), 'utf8'))
}

const origCounts = {}
for (let d = 1; d <= 4; d++) origCounts[d] = domains[d].length

// Build lookup: qId → {domain, index, question}
function findQuestion(qId) {
  for (let d = 1; d <= 4; d++) {
    const idx = domains[d].findIndex(q => q.id.toLowerCase() === qId)
    if (idx >= 0) return { domain: d, index: idx, question: domains[d][idx] }
  }
  return null
}

// ─── Apply changes ──────────────────────────────────────────────────────────
let removedCount = 0
let movedCount = 0
let explUpdated = 0
let rewrittenCount = 0
let renamedCount = 0
let typosFixed = 0
const notFound = []

// 1. Remove duplicates
console.log('\n=== REMOVING DUPLICATES ===')
for (const qId of duplicates) {
  const entry = findQuestion(qId)
  if (!entry) {
    notFound.push(`${qId} (remove)`)
    continue
  }
  domains[entry.domain].splice(entry.index, 1)
  console.log(`  Removed ${qId} from domain ${entry.domain}`)
  removedCount++
}

// 2. Apply domain moves
console.log('\n=== MOVING QUESTIONS ===')
for (const [qId, targetDomain] of moves) {
  if (duplicates.has(qId)) continue
  const entry = findQuestion(qId)
  if (!entry) { notFound.push(`${qId} (move→D${targetDomain})`); continue }
  if (entry.domain === targetDomain) continue
  const [question] = domains[entry.domain].splice(entry.index, 1)
  question.domainId = targetDomain
  domains[targetDomain].push(question)
  console.log(`  Moved ${qId}: D${entry.domain} → D${targetDomain}`)
  movedCount++
}

// 3. Apply question/option/answer rewrites from CSV
console.log('\n=== APPLYING REWRITES ===')
for (const [qId, rewrite] of rewrites) {
  if (duplicates.has(qId)) continue
  const entry = findQuestion(qId)
  if (!entry) { notFound.push(`${qId} (rewrite)`); continue }
  const q = entry.question
  if (rewrite.question) q.question = rewrite.question
  if (rewrite.options) q.options = rewrite.options
  if (rewrite.answer !== undefined) {
    q.answer = rewrite.answer
    q.isMultiAnswer = rewrite.isMultiAnswer || false
  }
  rewrittenCount++
  console.log(`  Rewrote ${qId}`)
}

// 4. Apply rename instructions (e.g. GLACIER → S3 GLACIER in question/options)
console.log('\n=== APPLYING RENAMES ===')
for (const { qId, find, replace } of renames) {
  if (duplicates.has(qId)) continue
  const entry = findQuestion(qId)
  if (!entry) { notFound.push(`${qId} (rename)`); continue }
  const q = entry.question
  const findRegex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  if (q.question) q.question = q.question.replace(findRegex, replace)
  if (q.options) {
    for (const key of Object.keys(q.options)) {
      q.options[key] = q.options[key].replace(findRegex, replace)
    }
  }
  renamedCount++
  console.log(`  Renamed "${find}" → "${replace}" in ${qId}`)
}

// 5. Apply typo fixes
console.log('\n=== FIXING TYPOS ===')
for (const [qId, typo] of Object.entries(typoFixes)) {
  if (duplicates.has(qId)) continue
  const entry = findQuestion(qId)
  if (!entry) { notFound.push(`${qId} (typo)`); continue }
  const q = entry.question
  if (typo.fixType === 'question') {
    q.question = q.question.replace(typo.find, typo.replace)
  } else if (typo.fixType === 'option' && q.options[typo.optionKey]) {
    q.options[typo.optionKey] = q.options[typo.optionKey].replace(typo.find, typo.replace)
  }
  typosFixed++
  console.log(`  Fixed typo in ${qId}`)
}

// 6. Update explanations
console.log('\n=== UPDATING EXPLANATIONS ===')
for (const [qId, newExplanation] of explanations) {
  if (duplicates.has(qId)) continue
  const entry = findQuestion(qId)
  if (!entry) { notFound.push(`${qId} (explanation)`); continue }
  entry.question.explanation = newExplanation
  explUpdated++
}
console.log(`  Updated ${explUpdated} explanations`)

// ─── Write all domain files ─────────────────────────────────────────────────
for (let d = 1; d <= 4; d++) {
  fs.writeFileSync(path.join(dataDir, `domain${d}.json`), JSON.stringify(domains[d], null, 2) + '\n')
}

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════')
console.log('           MIGRATION SUMMARY')
console.log('══════════════════════════════════════')
console.log(`Questions removed:      ${removedCount}`)
console.log(`Questions moved:        ${movedCount}`)
console.log(`Questions rewritten:    ${rewrittenCount}`)
console.log(`Renames applied:        ${renamedCount}`)
console.log(`Typos fixed:            ${typosFixed}`)
console.log(`Explanations updated:   ${explUpdated}`)
console.log('')
for (let d = 1; d <= 4; d++) {
  console.log(`Domain ${d}: ${origCounts[d]} → ${domains[d].length}`)
}
const origTotal = Object.values(origCounts).reduce((s, c) => s + c, 0)
const newTotal = Object.values(domains).reduce((s, d) => s + d.length, 0)
console.log(`Total:    ${origTotal} → ${newTotal}`)
console.log('══════════════════════════════════════')

if (notFound.length) {
  console.log(`\n⚠️  NOT FOUND (${notFound.length}):`)
  for (const id of notFound) console.log(`    - ${id}`)
}

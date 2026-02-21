import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// IMPORTANT: You need to set your OpenAI API key as an environment variable
// Run: $env:OPENAI_API_KEY="your-key-here" (PowerShell)
// Or add it to a .env file in the scripts folder

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable not set')
  console.log('\nTo set it, run:')
  console.log('PowerShell: $env:OPENAI_API_KEY="your-key-here"')
  console.log('Then run this script again.')
  process.exit(1)
}

const QUESTIONS_PATH = path.join(__dirname, '../src/data/master_questions.json')
const BATCH_SIZE = 10 // Process 10 questions at a time to avoid rate limits
const DELAY_MS = 1000 // 1 second delay between batches

// Domain names for context
const DOMAINS = {
  1: 'Cloud Concepts',
  2: 'Security and Compliance',
  3: 'Cloud Technology and Services',
  4: 'Billing, Pricing and Support'
}

async function generateExplanation(question, answer, options, domainId) {
  const domainName = DOMAINS[domainId]
  const correctAnswerText = Array.isArray(answer) 
    ? answer.map(a => `${a}: ${options[a]}`).join('; ')
    : `${answer}: ${options[answer]}`

  const prompt = `You are an AWS Cloud Practitioner certification expert. Generate a clear, concise explanation for why the following answer is correct.

Domain: ${domainName}

Question: ${question}

Correct Answer: ${correctAnswerText}

Requirements:
1. Explain WHY this answer is correct using AWS official concepts
2. Reference specific AWS services, features, or best practices
3. Keep it under 100 words
4. Be educational and help the student understand the concept
5. Do NOT just restate the question or answer
6. Focus on the AWS knowledge being tested

Explanation:`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using mini for cost efficiency
        messages: [
          {
            role: 'system',
            content: 'You are an AWS certification expert who writes clear, accurate explanations based on AWS official documentation and best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        max_tokens: 200
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error(`Error generating explanation: ${error.message}`)
    return null
  }
}

async function processQuestions(dryRun = false, sampleSize = null) {
  console.log('🚀 Starting explanation generation...\n')

  // Read questions
  const questionsData = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'))
  let questions = questionsData

  // If sample size specified, only process that many
  if (sampleSize) {
    questions = questions.slice(0, sampleSize)
    console.log(`📝 Processing sample of ${sampleSize} questions\n`)
  } else {
    console.log(`📝 Processing all ${questions.length} questions\n`)
  }

  let processed = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  // Process in batches
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, Math.min(i + BATCH_SIZE, questions.length))
    
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)}`)
    
    for (const question of batch) {
      processed++
      
      // Skip if explanation already exists and is substantial
      if (question.explanation && question.explanation.length > 50) {
        skipped++
        console.log(`⏭️  [${processed}/${questions.length}] Skipping (has explanation): ${question.id}`)
        continue
      }

      console.log(`🔄 [${processed}/${questions.length}] Generating: ${question.id}`)
      
      const explanation = await generateExplanation(
        question.question,
        question.answer,
        question.options,
        question.domainId
      )

      if (explanation) {
        question.explanation = explanation
        updated++
        console.log(`✅ Generated (${explanation.length} chars)`)
      } else {
        failed++
        console.log(`❌ Failed to generate`)
      }

      // Small delay between individual requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Delay between batches
    if (i + BATCH_SIZE < questions.length) {
      console.log(`⏸️  Waiting ${DELAY_MS}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  // Save results
  if (!dryRun) {
    // Create backup
    const backupPath = QUESTIONS_PATH.replace('.json', '_backup.json')
    fs.copyFileSync(QUESTIONS_PATH, backupPath)
    console.log(`\n💾 Backup created: ${backupPath}`)

    // Save updated questions
    fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2))
    console.log(`✅ Updated questions saved to: ${QUESTIONS_PATH}`)
  } else {
    console.log('\n🔍 DRY RUN - No files were modified')
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total processed: ${processed}`)
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped (had explanations): ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('='.repeat(50))
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sampleArg = args.find(arg => arg.startsWith('--sample='))
const sampleSize = sampleArg ? parseInt(sampleArg.split('=')[1]) : null

console.log('🤖 AWS Question Explanation Generator')
console.log('=====================================\n')

if (dryRun) {
  console.log('⚠️  DRY RUN MODE - No files will be modified\n')
}

// Run the process
processQuestions(dryRun, sampleSize).catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

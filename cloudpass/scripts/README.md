# AWS Question Explanation Generator

This script uses OpenAI's GPT-4 to automatically generate educational explanations for all practice questions based on AWS official concepts and best practices.

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key
   - Get one at: https://platform.openai.com/api-keys
   - Cost: ~$0.50-1.00 for all 588 questions (using gpt-4o-mini)

## Setup

1. Set your OpenAI API key as an environment variable:

**PowerShell:**
```powershell
$env:OPENAI_API_KEY="sk-your-key-here"
```

**Command Prompt:**
```cmd
set OPENAI_API_KEY=sk-your-key-here
```

**Linux/Mac:**
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

## Usage

### Test with Sample (Recommended First Step)
Test on 5 questions first to verify quality:
```bash
node scripts/generateExplanations.mjs --sample=5
```

### Dry Run (No File Changes)
See what would happen without modifying files:
```bash
node scripts/generateExplanations.mjs --dry-run --sample=10
```

### Generate All Explanations
Process all 588 questions (takes ~30-60 minutes):
```bash
node scripts/generateExplanations.mjs
```

## Features

✅ **Smart Processing**
- Skips questions that already have explanations (>50 chars)
- Processes in batches to avoid rate limits
- Creates automatic backup before modifying files

✅ **Quality Controls**
- Uses GPT-4o-mini for cost-effective, accurate responses
- Low temperature (0.3) for consistent, factual answers
- Validates explanations are educational and AWS-focused
- Under 100 words per explanation

✅ **Progress Tracking**
- Real-time progress updates
- Batch processing with delays
- Summary statistics at the end

## Output

The script will:
1. Create a backup: `master_questions_backup.json`
2. Update `master_questions.json` with explanations
3. Show summary of processed/updated/skipped/failed questions

## Cost Estimate

Using gpt-4o-mini:
- ~$0.0001 per question
- Total for 588 questions: ~$0.06-0.10
- Very affordable!

## Safety

- Always creates a backup before modifying files
- Can run in dry-run mode to preview changes
- Skips questions with existing explanations
- Validates API responses before saving

## Troubleshooting

**"OPENAI_API_KEY environment variable not set"**
- Make sure you set the environment variable in the same terminal session
- Verify with: `echo $env:OPENAI_API_KEY` (PowerShell)

**Rate limit errors**
- The script has built-in delays, but you can increase `DELAY_MS` in the code
- Default: 1 second between batches, 0.5 seconds between questions

**API errors**
- Check your API key is valid and has credits
- Verify you have access to gpt-4o-mini model

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRACTICE_EXAM_DIR = path.join(__dirname, '..', '..', 'practice-exam');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'master_questions.json');

const DOMAIN_KEYWORDS = {
  1: ['cloud computing', 'elasticity', 'scalability', 'capex', 'opex', 'iaas', 'paas', 'saas', 
      'high availability', 'fault tolerance', 'agility', 'shared responsibility', 'global infrastructure', 
      'region', 'availability zone', 'edge location', 'disaster recovery', 'on-premises', 'on-premise',
      'horizontal scaling', 'vertical scaling'],
  2: ['iam', 'mfa', 'encryption', 'kms', 'shield', 'waf', 'compliance', 'guardduty', 
      'security group', 'nacl', 'root user', 'least privilege', 'penetration', 'artifact', 
      'macie', 'inspector', 'detective', 'firewall', 'identity', 'access', 'policy', 
      'role', 'permission', 'certificate', 'secrets manager', 'cloudtrail'],
  3: ['ec2', 's3', 'rds', 'lambda', 'vpc', 'cloudfront', 'route 53', 'elb', 'auto scaling', 
      'autoscaling', 'sqs', 'sns', 'dynamodb', 'ecs', 'eks', 'cloudwatch', 'elastic beanstalk', 
      'fargate', 'api gateway', 'cloudformation', 'elastic', 'storage', 'compute', 'database', 
      'serverless', 'container', 'load balancer', 'cdn', 'snowball', 'glacier', 'ebs', 'efs'],
  4: ['pricing', 'billing', 'cost', 'budget', 'savings plan', 'reserved instance', 'support plan', 
      'organization', 'consolidated billing', 'tco', 'free tier', 'calculator', 'invoice', 
      'expenditure', 'pay-as-you-go', 'on-demand', 'cost explorer', 'trusted advisor']
};

const DOMAIN_NAMES = {
  1: 'Cloud Concepts',
  2: 'Security & Compliance',
  3: 'Cloud Technology & Services',
  4: 'Billing, Pricing & Support'
};

function categorizeDomain(questionText) {
  const lowerText = questionText.toLowerCase();
  const scores = { 1: 0, 2: 0, 3: 0, 4: 0 };
  
  for (const [domainId, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[domainId]++;
      }
    }
  }
  
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 3;
  
  const domainId = Object.keys(scores).find(key => scores[key] === maxScore);
  return parseInt(domainId);
}

function parseMarkdownFile(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const questions = [];
  
  const answerRegex = /Correct answer:\s*([A-E](?:,\s*[A-E])*)/i;
  
  const lines = content.split('\n');
  let currentQuestion = null;
  let currentOptions = {};
  let inQuestion = false;
  let questionText = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      if (currentQuestion && Object.keys(currentOptions).length >= 4) {
        questions.push({ question: currentQuestion, options: currentOptions });
      }
      currentQuestion = questionMatch[2];
      currentOptions = {};
      inQuestion = true;
      continue;
    }
    
    if (inQuestion && currentQuestion && !line.startsWith('<details')) {
      const optionMatch = line.match(/^-\s+([A-E])\.\s+(.+)/);
      if (optionMatch) {
        currentOptions[optionMatch[1]] = optionMatch[2];
      } else if (line && !line.startsWith('-') && !line.includes('Correct answer') && Object.keys(currentOptions).length < 5) {
        currentQuestion += ' ' + line;
      }
    }
    
    if (line.includes('Correct answer:')) {
      const answerMatch = line.match(answerRegex);
      if (answerMatch && currentQuestion) {
        const answer = answerMatch[1].trim();
        
        if (answer.includes(',')) {
          const answers = answer.split(',').map(a => a.trim());
          questions.push({ 
            question: currentQuestion, 
            options: currentOptions, 
            answer: answers,
            isMultiAnswer: true 
          });
        } else {
          questions.push({ 
            question: currentQuestion, 
            options: currentOptions, 
            answer: answer,
            isMultiAnswer: false
          });
        }
        
        currentQuestion = null;
        currentOptions = {};
        inQuestion = false;
      }
    }
  }
  
  return questions;
}

function main() {
  console.log('Starting question parser...\n');
  
  const files = fs.readdirSync(PRACTICE_EXAM_DIR)
    .filter(file => file.startsWith('practice-exam-') && file.endsWith('.md'))
    .sort();
  
  console.log(`Found ${files.length} practice exam files\n`);
  
  let allQuestions = [];
  let questionCounter = 1;
  
  for (const file of files) {
    const filePath = path.join(PRACTICE_EXAM_DIR, file);
    const parsedQuestions = parseMarkdownFile(filePath, file);
    
    for (const q of parsedQuestions) {
      if (q.options && Object.keys(q.options).length >= 4 && q.answer) {
        allQuestions.push({
          id: `q${String(questionCounter).padStart(3, '0')}`,
          question: q.question,
          options: q.options,
          answer: q.answer,
          isMultiAnswer: q.isMultiAnswer,
          source: file
        });
        questionCounter++;
      }
    }
  }
  
  console.log(`Total questions parsed: ${allQuestions.length}`);
  
  const multiAnswerQuestions = allQuestions.filter(q => q.isMultiAnswer);
  console.log(`Multi-answer questions: ${multiAnswerQuestions.length}`);
  
  const singleAnswerQuestions = allQuestions.filter(q => !q.isMultiAnswer);
  console.log(`Single-answer questions: ${singleAnswerQuestions.length}`);
  
  const questionMap = new Map();
  let duplicatesRemoved = 0;
  
  for (const q of allQuestions) {
    const normalizedQuestion = q.question.toLowerCase().trim();
    if (!questionMap.has(normalizedQuestion)) {
      questionMap.set(normalizedQuestion, q);
    } else {
      duplicatesRemoved++;
    }
  }
  
  console.log(`Duplicates removed: ${duplicatesRemoved}`);
  
  const uniqueQuestions = Array.from(questionMap.values());
  
  const finalQuestions = uniqueQuestions.map(q => {
    const domainId = categorizeDomain(q.question);
    return {
      id: q.id,
      domainId: domainId,
      domainName: DOMAIN_NAMES[domainId],
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: '',
      source: q.source,
      isMultiAnswer: q.isMultiAnswer
    };
  });
  
  console.log(`Final question count: ${finalQuestions.length}\n`);
  
  const domainCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const q of finalQuestions) {
    domainCounts[q.domainId]++;
  }
  
  console.log(`Domain 1 (Cloud Concepts): ${domainCounts[1]} questions`);
  console.log(`Domain 2 (Security & Compliance): ${domainCounts[2]} questions`);
  console.log(`Domain 3 (Cloud Technology & Services): ${domainCounts[3]} questions`);
  console.log(`Domain 4 (Billing, Pricing & Support): ${domainCounts[4]} questions`);
  
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalQuestions, null, 2));
  console.log(`\n✓ Questions saved to ${OUTPUT_FILE}`);
}

main();

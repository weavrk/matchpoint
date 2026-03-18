import * as readline from 'readline';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { loadWorkers, loadRetailer } from './data';
import { matchWorkers } from './matching';
import { JobSpec, RetailerProfile } from './types';

dotenv.config();

const SYSTEM_PROMPT = `You are a friendly hiring assistant for Reflex, a retail labor marketplace. You're helping a retailer create a job posting for a permanent hire.

Your goal is to have a natural conversation to understand what they're looking for, then output a structured job spec when ready.

Information to gather (conversationally, not as a checklist):
- What type of retail role? (footwear, apparel, electronics, beauty, grocery, sporting goods, home, general retail)
- What market/location?
- Full-time, part-time, or open to both?
- Any specific brand experience preferred?
- Key skills or qualities needed?
- Basic job details (title, pay range if known, schedule)

Keep responses short and conversational. Ask one or two questions at a time. Be encouraging but not overly enthusiastic.

When you have enough information to create a job spec, respond with EXACTLY this format (the system will parse it):

---JOB_SPEC_START---
{
  "title": "...",
  "market": "...",
  "experienceTypes": ["..."],
  "brands": ["..."],
  "preference": "FT" | "PT" | "Both",
  "requirements": ["..."],
  "description": "...",
  "payRange": "..." or null,
  "schedule": "..." or null
}
---JOB_SPEC_END---

After outputting the spec, ask if they'd like to adjust anything before publishing.`;

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const retailer = loadRetailer();
  const workers = loadWorkers();

  console.log('\n===========================================');
  console.log('  REFLEX PERMANENT HIRING - Job Creator');
  console.log('===========================================\n');
  console.log(`Welcome back, ${retailer.name}!`);
  console.log(`Your store rating: ${retailer.starRating}/5 | ${retailer.wouldWorkAgainPct}% would work again\n`);
  console.log('Let\'s create a job posting together.\n');

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood. I\'ll help create a job posting through natural conversation.' }] },
    ],
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Initial prompt from AI
  const initial = await chat.sendMessage(
    `The retailer "${retailer.name}" in ${retailer.market} is starting to create a job posting. They specialize in ${retailer.storeType.join(', ')}. Start the conversation.`
  );
  console.log(`Assistant: ${initial.response.text()}\n`);

  const prompt = (): void => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
        console.log('\nGoodbye!\n');
        rl.close();
        return;
      }

      try {
        const response = await chat.sendMessage(trimmed);
        const text = response.response.text();

        // Check if AI returned a job spec
        const specMatch = text.match(/---JOB_SPEC_START---\s*([\s\S]*?)\s*---JOB_SPEC_END---/);

        if (specMatch) {
          try {
            const spec: JobSpec = JSON.parse(specMatch[1]);
            spec.retailerName = retailer.name;

            console.log('\n-------------------------------------------');
            console.log('JOB SPEC GENERATED:');
            console.log('-------------------------------------------');
            console.log(JSON.stringify(spec, null, 2));
            console.log('-------------------------------------------\n');

            // Run matching
            const matches = matchWorkers(workers, spec);
            const topMatches = matches.slice(0, 10);

            console.log(`\nFOUND ${matches.length} MATCHING WORKERS (showing top ${topMatches.length}):\n`);

            for (const m of topMatches) {
              const badge = m.shiftVerified ? ' [SHIFT VERIFIED]' : '';
              console.log(`  ${m.name}${badge}`);
              console.log(`    Score: ${m.matchScore} | ${m.market} | ${m.preference}`);
              console.log(`    ${m.matchReasons.join(' • ')}`);
              if (m.shiftsOnReflex > 0) {
                const ratings = [
                  m.onTimeRating ? `On-time: ${m.onTimeRating}` : null,
                  m.commitmentScore ? `Commitment: ${m.commitmentScore}` : null,
                ].filter(Boolean).join(' | ');
                console.log(`    ${m.shiftsOnReflex} shifts${ratings ? ' | ' + ratings : ''}`);
              }
              console.log();
            }

            // Print the rest of the AI message (after the spec block)
            const afterSpec = text.split('---JOB_SPEC_END---')[1]?.trim();
            if (afterSpec) {
              console.log(`Assistant: ${afterSpec}\n`);
            }
          } catch (parseErr) {
            console.log(`Assistant: ${text}\n`);
          }
        } else {
          console.log(`Assistant: ${text}\n`);
        }
      } catch (err) {
        console.error('Error:', err);
      }

      prompt();
    });
  };

  prompt();
}

main();

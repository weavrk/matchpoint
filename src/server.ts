import express from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadWorkers, loadRetailer } from './data';
import { matchWorkers } from './matching';
import { JobSpec } from './types';
import { scrapeGlassdoor, filterJobsByRetailers as filterGlassdoorByRetailers, filterJobsByLocation as filterGlassdoorByLocation } from './scrapers/glassdoor';
import { scrapeIndeed, filterJobsByRetailers as filterIndeedByRetailers, filterJobsByLocation as filterIndeedByLocation } from './scrapers/indeed';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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

// In-memory chat session store (single retailer session for prototype)
let chatSession: any = null;
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// GET /api/retailer
app.get('/api/retailer', (_req, res) => {
  try {
    const retailer = loadRetailer();
    res.json(retailer);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/workers
app.get('/api/workers', (_req, res) => {
  try {
    const workers = loadWorkers();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/chat/init — start a new chat session
app.post('/api/chat/init', async (_req, res) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const retailer = loadRetailer();

    chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I\'ll help create a job posting through natural conversation.' }] },
      ],
    });

    const initial = await chatSession.sendMessage(
      `The retailer "${retailer.name}" in ${retailer.market} is starting to create a job posting. They specialize in ${(retailer.storeType as string[]).join(', ')}. Start the conversation naturally.`
    );

    res.json({ message: initial.response.text() });
  } catch (err: any) {
    const msg = err?.message?.split('\n')[0] || 'Failed to connect to Gemini. Check your API key and quota.';
    res.status(500).json({ error: msg });
  }
});

// POST /api/chat/message — send a message
app.post('/api/chat/message', async (req, res) => {
  try {
    if (!chatSession) {
      return res.status(400).json({ error: 'No active chat session. Call /api/chat/init first.' });
    }

    const { message } = req.body as { message: string };
    if (!message) return res.status(400).json({ error: 'message is required' });

    const response = await chatSession.sendMessage(message);
    const text = response.response.text();

    // Check for job spec
    const specMatch = text.match(/---JOB_SPEC_START---\s*([\s\S]*?)\s*---JOB_SPEC_END---/);

    if (specMatch) {
      const spec: JobSpec = JSON.parse(specMatch[1]);
      const retailer = loadRetailer();
      spec.retailerName = retailer.name;

      const workers = loadWorkers();
      const matches = matchWorkers(workers, spec);

      const afterSpec = text.split('---JOB_SPEC_END---')[1]?.trim() || '';

      return res.json({
        message: afterSpec,
        jobSpec: spec,
        matches: matches,
      });
    }

    return res.json({ message: text });
  } catch (err: any) {
    const msg = err?.message?.split('\n')[0] || 'Something went wrong. Please try again.';
    res.status(500).json({ error: msg });
  }
});

// POST /api/match — match workers to a job spec
app.post('/api/match', (req, res) => {
  try {
    const spec: JobSpec = req.body;
    const workers = loadWorkers();
    const matches = matchWorkers(workers, spec);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Fuzzy match a job title to our roles
function matchJobToRole(jobTitle: string, roles: { id: string; title: string }[]): { roleId: string; roleTitle: string } | null {
  const normalizedTitle = jobTitle.toLowerCase().trim();

  for (const role of roles) {
    const roleWords = role.title.toLowerCase().split(/[\s\/]+/);
    // Check if any significant word from the role appears in the job title
    const matches = roleWords.filter(word =>
      word.length > 3 && normalizedTitle.includes(word)
    );
    // If at least one significant word matches, consider it a match
    if (matches.length > 0) {
      return { roleId: role.id, roleTitle: role.title };
    }
  }
  return null;
}

// POST /api/scrape - Run job scraper with filters
app.post('/api/scrape', async (req, res) => {
  try {
    const {
      jobSites,
      markets,
      roles,
      retailers,
    } = req.body as {
      jobSites: string[];
      markets: { id: string; name: string; state: string }[];
      roles: { id: string; title: string }[];
      retailers: { name: string; classification: string }[];
    };

    console.log(`Starting scrape for ${markets.length} markets on ${jobSites.join(', ')}`);
    console.log(`Will filter by ${retailers.length} retailers`);
    console.log(`Will match against ${roles.length} roles`);

    // Track all scraped jobs
    const matchedJobs: any[] = [];
    const unmatchedRoles: { title: string; company: string; count: number }[] = [];
    const unmatchedRolesMap = new Map<string, { company: string; count: number }>();

    // Loop through each selected job site
    for (const jobSite of jobSites) {
      const jobSiteLower = jobSite.toLowerCase();
      const scraper = jobSiteLower === 'indeed' ? scrapeIndeed : scrapeGlassdoor;
      const filterByRetailers = jobSiteLower === 'indeed' ? filterIndeedByRetailers : filterGlassdoorByRetailers;
      const filterByLocation = jobSiteLower === 'indeed' ? filterIndeedByLocation : filterGlassdoorByLocation;

      // Scrape each market with generic "Retail" search
      for (const market of markets) {
        const location = `${market.name.toLowerCase().replace(/\s+/g, '-')}-${market.state.toLowerCase()}`;
        const keyword = 'Retail';

        console.log(`Scraping ${jobSiteLower}: ${keyword} jobs in ${market.name}, ${market.state}`);

        try {
          const jobs = await scraper({
            location,
            keyword,
            maxPages: 5,
          });

          console.log(`Found ${jobs.length} total jobs in ${market.name}`);

          // Filter to only jobs in the target location
          const locationFilteredJobs = filterByLocation(jobs, market.name, market.state);
          console.log(`${locationFilteredJobs.length} jobs actually in ${market.name}, ${market.state}`);

          // Filter to only jobs from our retailers
          const filteredJobs = filterByRetailers(locationFilteredJobs, retailers);

          console.log(`${filteredJobs.length} jobs from tracked retailers`);

          // Match each job to a role
          for (const job of filteredJobs) {
            const roleMatch = matchJobToRole(job.title, roles);

            if (roleMatch) {
              matchedJobs.push({
                ...job,
                market: `${market.name}, ${market.state}`,
                marketId: market.id,
                role: roleMatch.roleTitle,
                roleId: roleMatch.roleId,
                source: jobSiteLower,
              });
            } else {
              // Track unmatched role
              const key = job.title.toLowerCase().trim();
              if (unmatchedRolesMap.has(key)) {
                unmatchedRolesMap.get(key)!.count++;
              } else {
                unmatchedRolesMap.set(key, { company: job.company, count: 1 });
              }
            }
          }

        } catch (err) {
          console.error(`Error scraping ${market.name}, ${market.state} on ${jobSiteLower}:`, err);
        }
      }
    }

    // Convert unmatched roles map to array
    for (const [title, data] of unmatchedRolesMap) {
      unmatchedRoles.push({ title, company: data.company, count: data.count });
    }

    // Sort unmatched by count (most common first)
    unmatchedRoles.sort((a, b) => b.count - a.count);

    console.log(`Total matched jobs: ${matchedJobs.length}`);
    console.log(`Unmatched role titles: ${unmatchedRoles.length}`);

    res.json({
      success: true,
      jobCount: matchedJobs.length,
      jobs: matchedJobs,
      unmatchedRoles: unmatchedRoles.slice(0, 50), // Top 50 unmatched
    });

  } catch (err: any) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: err.message || 'Scrape failed' });
  }
});

// Fallback: serve index.html for any non-API route
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\nMatchpoint API running at http://localhost:${PORT}\n`);
});

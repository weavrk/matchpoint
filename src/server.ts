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

// Match a job title to our roles - stricter matching to avoid false positives
// Uses sequential logic for specific roles, then falls back to general matching
function matchJobToRole(jobTitle: string, roles: { id: string; title: string; match_keywords?: string[] }[]): { roleId: string; roleTitle: string } | null {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  // Remove common suffixes like (Part-Time), (Full-Time), etc. for matching
  const cleanedTitle = normalizedTitle
    .replace(/\s*\(.*?\)\s*/g, ' ')  // Remove parenthetical content
    .replace(/\s*-\s*(part|full)[\s-]?time\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Helper to find a role by title pattern
  const findRole = (pattern: string) => {
    return roles.find(r => r.title.toLowerCase().includes(pattern.toLowerCase()));
  };

  // ============================================
  // SEQUENTIAL LOGIC FOR SPECIFIC ROLES
  // Handle these FIRST before general matching
  // ============================================

  // STORE MANAGER logic:
  // If job title contains "store manager", check if it also has "assistant"
  if (/\bstore\s*manager\b/i.test(cleanedTitle)) {
    if (/\bassistant\b/i.test(cleanedTitle)) {
      // Has "assistant" -> use Assistant Store Manager
      const role = findRole('assistant store manager');
      if (role) return { roleId: role.id, roleTitle: role.title };
    } else {
      // No "assistant" -> use Store Manager
      const role = findRole('store manager');
      // Make sure we get the non-assistant one
      const storeManagerRole = roles.find(r =>
        r.title.toLowerCase().includes('store manager') &&
        !r.title.toLowerCase().includes('assistant')
      );
      if (storeManagerRole) return { roleId: storeManagerRole.id, roleTitle: storeManagerRole.title };
    }
  }

  // ============================================
  // GENERAL MATCHING LOGIC
  // ============================================

  // Collect all potential matches with their scores
  const matches: { roleId: string; roleTitle: string; score: number }[] = [];

  // High-priority keyword mappings
  const priorityKeywords: { pattern: RegExp; mustMatchRole: string }[] = [
    { pattern: /\bstock(?:ing|er)?\b/i, mustMatchRole: 'stock' },
    { pattern: /\bvisual\s*merchand/i, mustMatchRole: 'visual' },
    { pattern: /\bbeauty|cosmetic/i, mustMatchRole: 'beauty' },
    { pattern: /\bfitting\s*room/i, mustMatchRole: 'fitting' },
    { pattern: /\bcashier\b/i, mustMatchRole: 'cashier' },
  ];

  for (const role of roles) {
    const roleLower = role.title.toLowerCase();

    // Skip store manager roles here - already handled above
    if (roleLower.includes('store manager')) continue;

    // First check match_keywords if available - these are explicit matches (high priority)
    if (role.match_keywords && role.match_keywords.length > 0) {
      for (const keyword of role.match_keywords) {
        const keywordLower = keyword.toLowerCase();
        const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (keywordRegex.test(cleanedTitle)) {
          matches.push({ roleId: role.id, roleTitle: role.title, score: 100 });
        }
      }
    }

    // Check priority keywords
    let priorityBoost = 0;
    for (const pk of priorityKeywords) {
      if (pk.pattern.test(cleanedTitle) && roleLower.includes(pk.mustMatchRole)) {
        priorityBoost = 50;
        break;
      }
    }

    // Split into individual role options (e.g., "Stock Associate / Stocker" -> ["Stock Associate", "Stocker"])
    const roleOptions = roleLower.split(/\s*\/\s*/).map(s => s.trim());

    for (const roleOption of roleOptions) {
      const genericWords = ['associate', 'assistant', 'manager', 'supervisor', 'lead', 'worker', 'attendant', 'advisor', 'specialist', 'retail'];
      const roleWords = roleOption.split(/\s+/).filter(w => w.length > 2);
      const distinguishingWords = roleWords.filter(w => !genericWords.includes(w));

      if (distinguishingWords.length > 0) {
        const allDistinguishingMatch = distinguishingWords.every(word => {
          const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
          return wordRegex.test(cleanedTitle);
        });

        if (allDistinguishingMatch) {
          const genericWordsInRole = roleWords.filter(w => genericWords.includes(w));
          if (genericWordsInRole.length === 0 || genericWordsInRole.some(w => {
            const wordRegex = new RegExp(`\\b${w}\\b`, 'i');
            return wordRegex.test(cleanedTitle);
          })) {
            const score = distinguishingWords.length * 10 + priorityBoost;
            matches.push({ roleId: role.id, roleTitle: role.title, score });
          }
        }
      } else {
        // Role only has generic words (e.g., "Cashier", "Stocker")
        const roleRegex = new RegExp(`\\b${roleOption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (roleRegex.test(cleanedTitle)) {
          matches.push({ roleId: role.id, roleTitle: role.title, score: 5 + priorityBoost });
        }
      }
    }
  }

  // Return the highest-scoring match
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score);
    return { roleId: matches[0].roleId, roleTitle: matches[0].roleTitle };
  }

  return null;
}

// POST /api/scrape - Run job scraper with filters
// SSE scrape endpoint - streams progress updates
// For Indeed: runs 5 passes to capture more results (Indeed returns different results each time)
app.post('/api/scrape', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendProgress = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      jobSites,
      markets,
      roles,
      retailers,
    } = req.body as {
      jobSites: string[];
      markets: { id: string; name: string; state: string }[];
      roles: { id: string; title: string; match_keywords?: string[] }[];
      retailers: { name: string; classification: string }[];
    };

    console.log(`Starting scrape for ${markets.length} markets on ${jobSites.join(', ')}`);
    console.log(`Will filter by ${retailers.length} retailers`);
    console.log(`Will match against ${roles.length} roles`);

    // Track all scraped jobs across all passes (deduped by source_url)
    const allMatchedJobsMap = new Map<string, any>(); // key = source_url
    const unmatchedRolesMap = new Map<string, { company: string; count: number; jobs: any[] }>();

    // Track unique retailers found
    const matchedRetailers = new Set<string>();
    let totalJobsFound = 0;

    // Number of passes for Indeed (to capture more varied results)
    const INDEED_PASSES = 5;

    // Loop through each selected job site
    for (const jobSite of jobSites) {
      const jobSiteLower = jobSite.toLowerCase();
      const scraper = jobSiteLower === 'indeed' ? scrapeIndeed : scrapeGlassdoor;
      const filterByRetailers = jobSiteLower === 'indeed' ? filterIndeedByRetailers : filterGlassdoorByRetailers;
      const filterByLocation = jobSiteLower === 'indeed' ? filterIndeedByLocation : filterGlassdoorByLocation;

      // Determine number of passes (5 for Indeed, 1 for others)
      const numPasses = jobSiteLower === 'indeed' ? INDEED_PASSES : 1;

      for (let pass = 1; pass <= numPasses; pass++) {
        // Track jobs found in this pass
        const passMatchedJobs: any[] = [];
        let passJobsFound = 0;

        // Send pass_start event
        sendProgress({
          type: 'pass_start',
          pass,
          totalPasses: numPasses,
          jobSite: jobSiteLower,
          jobsFound: totalJobsFound,
          totalMatchedJobs: allMatchedJobsMap.size,
        });

        console.log(`\n=== Pass ${pass}/${numPasses} for ${jobSiteLower} ===`);

        // Scrape each market with generic "Retail" search
        for (let marketIndex = 0; marketIndex < markets.length; marketIndex++) {
          const market = markets[marketIndex];
          const location = `${market.name.toLowerCase().replace(/\s+/g, '-')}-${market.state.toLowerCase()}`;
          const keyword = 'Retail';

          console.log(`Scraping ${jobSiteLower}: ${keyword} jobs in ${market.name}, ${market.state}`);

          try {
            // Pass retailer names for Indeed to do targeted company searches
            // Also pass passNum for varied results (different sort/filter each pass)
            const retailerNames = retailers.map(r => r.name);
            const jobs = await scraper({
              location,
              keyword,
              maxPages: 1,  // Page 1 returns ~45 jobs; pages 2+ blocked by Indeed
              retailers: retailerNames,
              passNum: pass,  // Pass number for varied results
            });

            console.log(`Found ${jobs.length} total jobs in ${market.name}`);
            totalJobsFound += jobs.length;
            passJobsFound += jobs.length;

            // Filter to only jobs in the target location
            const locationFilteredJobs = filterByLocation(jobs, market.name, market.state);
            console.log(`${locationFilteredJobs.length} jobs actually in ${market.name}, ${market.state}`);

            // Filter to only jobs from our retailers
            const filteredJobs = filterByRetailers(locationFilteredJobs, retailers);
            console.log(`${filteredJobs.length} jobs from tracked retailers`);

            // Send progress update after filtering with status message
            const statusMessage = `Found ${jobs.length} jobs, ${locationFilteredJobs.length} in ${market.name}, ${filteredJobs.length} from tracked retailers`;
            sendProgress({
              type: 'progress',
              pass,
              totalPasses: numPasses,
              jobsFound: totalJobsFound,
              passJobsFound,
              matchedRetailers: matchedRetailers.size,
              matchedJobs: allMatchedJobsMap.size,
              currentMarket: `${market.name}, ${market.state}`,
              marketsCompleted: marketIndex,
              totalMarkets: markets.length,
              statusMessage,
            });

            // Match each job to a role
            for (const job of filteredJobs) {
              const roleMatch = matchJobToRole(job.title, roles);

              // Track the retailer
              matchedRetailers.add(job.company);

              // Use source_url as dedupe key
              const dedupeKey = job.sourceUrl || `${job.company}-${job.title}-${job.location}`;

              if (roleMatch) {
                // Only add if not already seen
                if (!allMatchedJobsMap.has(dedupeKey)) {
                  const matchedJob = {
                    ...job,
                    market: `${market.name}, ${market.state}`,
                    marketId: market.id,
                    role: roleMatch.roleTitle,
                    roleId: roleMatch.roleId,
                    source: jobSiteLower,
                  };
                  allMatchedJobsMap.set(dedupeKey, matchedJob);
                  passMatchedJobs.push(matchedJob);
                }
              } else {
                // Track unmatched role with full job data
                const key = job.title.toLowerCase().trim();
                const unmatchedJob = {
                  ...job,
                  market: `${market.name}, ${market.state}`,
                  marketId: market.id,
                  source: jobSiteLower,
                };
                if (unmatchedRolesMap.has(key)) {
                  const entry = unmatchedRolesMap.get(key)!;
                  // Only add job if not a duplicate
                  if (!entry.jobs.some(j => (j.sourceUrl || `${j.company}-${j.title}`) === dedupeKey)) {
                    entry.count++;
                    entry.jobs.push(unmatchedJob);
                  }
                } else {
                  unmatchedRolesMap.set(key, { company: job.company, count: 1, jobs: [unmatchedJob] });
                }
              }
            }

          } catch (err) {
            console.error(`Error scraping ${market.name}, ${market.state} on ${jobSiteLower}:`, err);
          }
        }

        // Send pass_complete event with jobs found in this pass
        const newJobsThisPass = passMatchedJobs.length;
        console.log(`Pass ${pass} complete: ${newJobsThisPass} new jobs found (${allMatchedJobsMap.size} total unique)`);

        sendProgress({
          type: 'pass_complete',
          pass,
          totalPasses: numPasses,
          jobSite: jobSiteLower,
          newJobsThisPass,
          jobsFound: totalJobsFound,
          totalMatchedJobs: allMatchedJobsMap.size,
          passJobs: passMatchedJobs, // Jobs found in this pass for immediate DB save
        });

        // Small delay between passes to avoid rate limiting
        if (pass < numPasses) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Convert maps to arrays
    const allMatchedJobs = Array.from(allMatchedJobsMap.values());
    const unmatchedRoles: { title: string; company: string; count: number; jobs: any[] }[] = [];
    for (const [title, data] of unmatchedRolesMap) {
      unmatchedRoles.push({ title, company: data.company, count: data.count, jobs: data.jobs });
    }

    // Sort unmatched by count (most common first)
    unmatchedRoles.sort((a, b) => b.count - a.count);

    console.log(`\nTotal matched jobs: ${allMatchedJobs.length}`);
    console.log(`Unmatched role titles: ${unmatchedRoles.length}`);

    // Send final complete event via SSE
    sendProgress({
      type: 'complete',
      success: true,
      jobCount: allMatchedJobs.length,
      jobs: allMatchedJobs,
      unmatchedRoles: unmatchedRoles.slice(0, 50), // Top 50 unmatched
    });
    res.end();

  } catch (err: any) {
    console.error('Scrape error:', err);
    sendProgress({ type: 'error', error: err.message || 'Scrape failed' });
    res.end();
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

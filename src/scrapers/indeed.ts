import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  benefits?: string;
  employmentType?: string;
  postedDate?: string;
  sourceUrl: string;
}

interface ScrapeOptions {
  location: string;      // e.g., "austin-tx"
  keyword: string;       // e.g., "Retail"
  maxPages?: number;     // Limit pages to scrape
  passNum?: number;      // Current pass number (1-5) for varied results
}

// Sorting options for Indeed to get varied results
const SORT_OPTIONS = ['relevance', 'date'];
const DATE_FILTERS = ['', '1', '3', '7', '14']; // fromage param: days posted

// Build Indeed search URL with randomization for varied results
function buildSearchUrl(options: ScrapeOptions, start: number = 0, passNum: number = 1): string {
  const { location, keyword } = options;

  // Parse location: "austin-tx" -> "Austin, TX"
  const parts = location.split('-');
  const state = parts.pop()?.toUpperCase() || '';
  const city = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  const locationStr = `${city}, ${state}`;

  // Indeed URL format
  let url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(locationStr)}`;

  if (start > 0) {
    url += `&start=${start}`;
  }

  // Add randomization based on pass number for varied results
  // Pass 1: relevance, no date filter
  // Pass 2: date sorted
  // Pass 3: relevance, last 7 days
  // Pass 4: date sorted, last 3 days
  // Pass 5: relevance, last 14 days
  if (passNum > 1) {
    const sortByDate = passNum % 2 === 0;
    if (sortByDate) {
      url += '&sort=date';
    }

    // Add date filter for passes 3+
    if (passNum >= 3) {
      const dateFilterIndex = (passNum - 3) % DATE_FILTERS.length;
      const dateFilter = DATE_FILTERS[dateFilterIndex];
      if (dateFilter) {
        url += `&fromage=${dateFilter}`;
      }
    }
  }

  return url;
}

// Fetch page HTML using ScraperAPI with session rotation for varied results
async function fetchWithScraperAPI(url: string, passNum: number = 1): Promise<string> {
  if (!SCRAPERAPI_KEY) {
    throw new Error('SCRAPERAPI_KEY not set in .env');
  }

  // Use premium=true for residential proxies which helps with Indeed
  // Add session_number to rotate IP/session between passes for different results
  // Generate a unique session number based on pass + timestamp to ensure fresh results
  const sessionNumber = `pass${passNum}_${Date.now()}`;
  const apiUrl = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}&country_code=us&premium=true&session_number=${sessionNumber}`;

  console.log(`Fetching via ScraperAPI (pass ${passNum}): ${url}`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

// Clean job title - remove location suffixes
function cleanJobTitle(title: string): string {
  return title
    .replace(/\s*[-–]\s*[A-Z][^,]*,\s*[A-Z]{2}\s*$/i, '')  // "- Cedar Park, TX"
    .replace(/\s*[-–]\s*(?:The\s+)?[A-Z][a-zA-Z\s]+$/i, '') // "- The Domain" or "- Sunset Valley"
    .replace(/,\s*(?:PT|FT)\s*$/i, '')                      // ", PT" or ", FT"
    .replace(/\s*[-–]\s*(?:PT|FT)\s*$/i, '')                // "- PT" or "- FT"
    .replace(/^\s*Seasonal\s+/i, '')                        // "Seasonal " at start
    .trim();
}

// Convert Spanish salary text to English
function cleanSalaryText(salary: string): string {
  if (!salary) return salary;

  return salary
    // Time periods
    .replace(/\bpor hora\b/gi, 'an hour')
    .replace(/\bla hora\b/gi, 'an hour')
    .replace(/\bpor año\b/gi, 'a year')
    .replace(/\bal año\b/gi, 'a year')
    .replace(/\bpor mes\b/gi, 'a month')
    .replace(/\bal mes\b/gi, 'a month')
    .replace(/\bpor semana\b/gi, 'a week')
    .replace(/\ba la semana\b/gi, 'a week')
    // Other common terms
    .replace(/\bhasta\b/gi, 'Up to')
    .replace(/\bdesde\b/gi, 'From')
    .trim();
}

// Parse job listings from Indeed HTML - extract from embedded JSON
function parseJobsFromHTML(html: string): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];

  // Check for actual blocking (not just the word "captcha" in config)
  if (html.toLowerCase().includes('unusual traffic') ||
      html.includes('verify you are human') ||
      (html.includes('captcha') && !html.includes('mosaic'))) {
    console.log('WARNING: Indeed is showing CAPTCHA/blocking page');
    return jobs;
  }

  // Method 1: Try window.mosaic.providerData["mosaic-provider-jobcards"] format
  const mosaicMatch = html.match(/window\.mosaic\.providerData\["mosaic-provider-jobcards"\]\s*=\s*(\{[\s\S]*?\});/);

  if (mosaicMatch) {
    try {
      const mosaicData = JSON.parse(mosaicMatch[1]);
      const results = mosaicData?.metaData?.mosaicProviderJobCardsModel?.results;

      if (results && Array.isArray(results)) {
        console.log(`Found ${results.length} jobs in mosaic provider data`);

        for (const job of results) {
          try {
            const title = cleanJobTitle(job.displayTitle || job.title || '');
            const company = job.company || '';

            // Location
            let location = job.formattedLocation || '';
            if (!location && job.jobLocationCity) {
              location = [job.jobLocationCity, job.jobLocationState].filter(Boolean).join(', ');
              if (job.jobLocationPostal) location += ' ' + job.jobLocationPostal;
            }

            // Salary - just use the text snippet, convert Spanish to English
            const salary = cleanSalaryText(job.salarySnippet?.text || '');

            // Employment type from jobTypes array
            let employmentType = '';
            if (job.jobTypes && Array.isArray(job.jobTypes)) {
              employmentType = job.jobTypes.join(', ');
            }

            // Job URL
            const jobKey = job.jobkey || '';
            const sourceUrl = jobKey ? `https://www.indeed.com/viewjob?jk=${jobKey}` : '';

            if (title && company) {
              jobs.push({
                title,
                company,
                location,
                salary: salary || undefined,
                employmentType: employmentType || undefined,
                sourceUrl,
              });
            }
          } catch (e) {
            // Skip problematic job entries
          }
        }
      }
    } catch (e) {
      console.log('Failed to parse mosaic provider data:', e);
    }
  }

  // Method 2: Try GraphQL results format if mosaic didn't work
  if (jobs.length === 0) {
    const resultsMatch = html.match(/"results":\s*\[([\s\S]*?)\}]\s*,\s*"[a-z]/);

    if (resultsMatch) {
      try {
        const resultsJson = `[${resultsMatch[1]}}]`;
        const results = JSON.parse(resultsJson);

        console.log(`Found ${results.length} jobs in GraphQL results`);

        for (const result of results) {
          try {
            if (result.__typename !== 'JobDataResult' || !result.job) continue;

            const job = result.job;
            const title = cleanJobTitle(job.title || '');
            const company = job.sourceEmployerName || job.source?.name || '';

            let location = '';
            if (job.location) {
              const loc = job.location;
              location = loc.fullAddress || loc.formatted?.long || [loc.city, loc.stateProvCode].filter(Boolean).join(', ');
            }

            // Salary - just use text snippet or build from structured data, convert Spanish to English
            let salary = cleanSalaryText(job.salarySnippet?.text || '');
            if (!salary && job.compensation?.baseSalary) {
              const comp = job.compensation.baseSalary;
              if (comp.min && comp.max) {
                const unit = comp.type?.toLowerCase() === 'hourly' ? '/hr' : '/yr';
                salary = `$${comp.min} - $${comp.max}${unit}`;
              }
            }

            const jobKey = job.key || '';
            const sourceUrl = jobKey ? `https://www.indeed.com/viewjob?jk=${jobKey}` : '';

            let employmentType = '';
            if (job.attributes) {
              for (const attr of job.attributes) {
                const label = attr.label?.toLowerCase() || '';
                if (label.includes('full-time') || label.includes('part-time') ||
                    label.includes('seasonal') || label.includes('contract') || label.includes('temporary')) {
                  employmentType = attr.label;
                  break;
                }
              }
            }
            if (!employmentType && title.toLowerCase().includes('seasonal')) {
              employmentType = 'Seasonal';
            }

            if (title && company) {
              jobs.push({
                title,
                company,
                location,
                salary: salary || undefined,
                employmentType: employmentType || undefined,
                sourceUrl,
              });
            }
          } catch (e) {
            // Skip problematic job entries
          }
        }
      } catch (e) {
        console.log('Failed to parse GraphQL results');
      }
    }
  }

  // Fallback to HTML parsing if JSON extraction failed
  if (jobs.length === 0) {
    const $ = cheerio.load(html);
    const jobCards = $('div.job_seen_beacon, div.jobsearch-ResultsList > div, .resultContent, .job_seen_beacon');

    console.log(`Fallback: Found ${jobCards.length} job cards in HTML`);

    jobCards.each((_, card) => {
      try {
        const $card = $(card);

        const titleEl = $card.find('h2.jobTitle span[title], h2.jobTitle a, .jobTitle span, a[data-jk]');
        const title = titleEl.first().attr('title') || titleEl.first().text().trim();

        const companyEl = $card.find('span[data-testid="company-name"], .companyName, .company');
        const company = companyEl.first().text().trim();

        const locationEl = $card.find('div[data-testid="text-location"], .companyLocation, .location');
        const location = locationEl.first().text().trim();

        const salaryEl = $card.find('div.salary-snippet-container, .salaryText, .salary-snippet');
        let salary = '';
        salaryEl.each((_, el) => {
          const text = $(el).text().trim();
          if (text.includes('$')) {
            salary = text;
            return false;
          }
        });

        const linkEl = $card.find('a[data-jk], h2.jobTitle a');
        let sourceUrl = linkEl.first().attr('href') || '';
        if (sourceUrl && !sourceUrl.startsWith('http')) {
          sourceUrl = `https://www.indeed.com${sourceUrl}`;
        }

        const jobKey = linkEl.first().attr('data-jk');
        if (jobKey) {
          sourceUrl = `https://www.indeed.com/viewjob?jk=${jobKey}`;
        }

        if (title && company) {
          jobs.push({
            title,
            company,
            location,
            salary: salary || undefined,
            sourceUrl,
          });
        }
      } catch (e) {
        // Skip problematic cards
      }
    });
  }

  return jobs;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Scrape jobs for a single keyword
async function scrapeKeyword(options: ScrapeOptions): Promise<ScrapedJob[]> {
  const { maxPages = 3, passNum = 1 } = options;
  const allJobs: ScrapedJob[] = [];

  // Indeed uses start=0, 10, 20, etc. for pagination (10 jobs per page)
  for (let pageNum = 0; pageNum < maxPages; pageNum++) {
    const start = pageNum * 10;
    const url = buildSearchUrl(options, start, passNum);
    console.log(`  Scraping page ${pageNum + 1} (pass ${passNum}): ${url}`);

    try {
      const html = await fetchWithScraperAPI(url, passNum);

      // Save debug HTML
      const fs = await import('fs');
      fs.writeFileSync('/tmp/indeed-debug.html', html);

      const pageJobs = parseJobsFromHTML(html);
      console.log(`  Found ${pageJobs.length} jobs on page ${pageNum + 1}`);
      allJobs.push(...pageJobs);

      // Stop if no jobs found
      if (pageJobs.length === 0) {
        console.log('  No jobs found on this page, stopping pagination');
        break;
      }

      // Rate limit between pages
      if (pageNum < maxPages - 1) {
        await delay(2000);
      }

    } catch (e) {
      console.error(`  Error scraping page ${pageNum + 1}:`, e);
      break;
    }
  }

  return allJobs;
}

export interface ExtendedScrapeOptions extends ScrapeOptions {
  retailers?: string[];  // Optional list of retailer names to search for specifically
}

export async function scrapeIndeed(options: ExtendedScrapeOptions): Promise<ScrapedJob[]> {
  const { maxPages = 3, retailers = [], passNum = 1 } = options;
  const allJobs: ScrapedJob[] = [];

  console.log(`Starting Indeed scrape for "${options.keyword}" in ${options.location} (pass ${passNum})`);
  console.log(`Using ScraperAPI with session rotation`);

  // First, scrape the main keyword (e.g., "Retail")
  console.log(`\nSearching for: "${options.keyword}" (pass ${passNum})`);
  const mainJobs = await scrapeKeyword({ ...options, maxPages, passNum });
  allJobs.push(...mainJobs);

  // Note: We don't search for individual retailers - that would be too many API calls.
  // The retailers param is currently unused but kept for future optimization.

  // Deduplicate jobs by URL
  const uniqueJobs = allJobs.filter((job, index, self) =>
    index === self.findIndex(j => j.sourceUrl === job.sourceUrl)
  );

  console.log(`\nTotal jobs scraped in pass ${passNum}: ${uniqueJobs.length} (${allJobs.length} before deduplication)`);
  return uniqueJobs;
}

// Filter jobs by retailers
export function filterJobsByRetailers(
  jobs: ScrapedJob[],
  allowedRetailers: { name: string; classification?: string }[]
): ScrapedJob[] {
  const retailerNames = new Set(allowedRetailers.map(r => r.name.toLowerCase()));

  return jobs.filter(job => {
    const companyLower = job.company.toLowerCase();
    return Array.from(retailerNames).some(name =>
      companyLower.includes(name) || name.includes(companyLower)
    );
  });
}

// Filter jobs by location
export function filterJobsByLocation(
  jobs: ScrapedJob[],
  targetCity: string,
  targetState: string
): ScrapedJob[] {
  const cityLower = targetCity.toLowerCase();
  const stateLower = targetState.toLowerCase();
  const stateAbbrev = targetState.toUpperCase();

  return jobs.filter(job => {
    const locationLower = job.location.toLowerCase();
    const hasCity = locationLower.includes(cityLower);
    const hasState = locationLower.includes(stateLower) ||
                     job.location.includes(stateAbbrev) ||
                     job.location.includes(`, ${stateAbbrev}`);
    return hasCity && hasState;
  });
}

// CLI runner
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx ts-node src/scrapers/indeed.ts <location> <keyword>');
    console.log('Example: npx ts-node src/scrapers/indeed.ts austin-tx "Retail"');
    process.exit(1);
  }

  const location = args[0];
  const keyword = args[1];

  const jobs = await scrapeIndeed({
    location,
    keyword,
    maxPages: 3,
  });

  console.log('\nScraped Jobs:');
  jobs.forEach((job, i) => {
    console.log(`${i + 1}. ${job.title} at ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Salary: ${job.salary || 'Not listed'}`);
    console.log(`   URL: ${job.sourceUrl}`);
    console.log('');
  });
}

if (require.main === module) {
  main().catch(console.error);
}

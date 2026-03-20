import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  salaryType?: string;
  salaryMin?: number;
  salaryMax?: number;
  benefits?: string;
  employmentType?: string;
  postedDate?: string;
  sourceUrl: string;
}

interface ScrapeOptions {
  location: string;      // e.g., "austin-tx"
  keyword: string;       // e.g., "Retail"
  maxPages?: number;     // Limit pages to scrape
}

// Helper to parse salary strings
function parseSalary(salaryStr: string): { min?: number; max?: number; type?: string } {
  if (!salaryStr) return {};

  const salaryLower = salaryStr.toLowerCase();
  let type: string | undefined;

  if (salaryLower.includes('hour') || salaryLower.includes('hr')) {
    type = 'hourly';
  } else if (salaryLower.includes('year') || salaryLower.includes('annual') || salaryLower.includes('k')) {
    type = 'annual';
  }

  const cleaned = salaryStr.replace(/,/g, '').toLowerCase();

  // Match range patterns
  const rangeMatch = cleaned.match(/\$?([\d.]+)k?\s*[-–to]+\s*\$?([\d.]+)k?/i);

  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);

    if (min < 100 && max < 100) {
      type = type || 'hourly';
    } else if (min < 1000) {
      min = min * 1000;
      max = max * 1000;
      type = type || 'annual';
    } else {
      type = type || 'annual';
    }

    return { min: Math.round(min), max: Math.round(max), type };
  }

  // Single value
  const singleMatch = cleaned.match(/\$?([\d.]+)k?/);
  if (singleMatch) {
    let val = parseFloat(singleMatch[1]);
    if (val < 100) {
      type = type || 'hourly';
    } else if (val < 1000) {
      val = val * 1000;
      type = type || 'annual';
    } else {
      type = type || 'annual';
    }
    return { min: Math.round(val), max: Math.round(val), type };
  }

  return {};
}

// Build Indeed search URL
function buildSearchUrl(options: ScrapeOptions, start: number = 0): string {
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

  return url;
}

// Fetch page HTML using ScraperAPI
async function fetchWithScraperAPI(url: string): Promise<string> {
  if (!SCRAPERAPI_KEY) {
    throw new Error('SCRAPERAPI_KEY not set in .env');
  }

  // Indeed doesn't need premium - standard should work
  const apiUrl = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}&country_code=us`;

  console.log(`Fetching via ScraperAPI: ${url}`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`ScraperAPI request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

// Parse job listings from Indeed HTML
function parseJobsFromHTML(html: string): ScrapedJob[] {
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  // Check for blocking
  if (html.toLowerCase().includes('unusual traffic') ||
      html.toLowerCase().includes('captcha')) {
    console.log('WARNING: Indeed is showing CAPTCHA/blocking page');
    return jobs;
  }

  // Indeed job cards - multiple possible selectors
  const jobCards = $('div.job_seen_beacon, div.jobsearch-ResultsList > div, .resultContent, .job_seen_beacon');

  console.log(`Found ${jobCards.length} job cards in HTML`);

  jobCards.each((_, card) => {
    try {
      const $card = $(card);

      // Job title
      const titleEl = $card.find('h2.jobTitle span[title], h2.jobTitle a, .jobTitle span, a[data-jk]');
      const title = titleEl.first().attr('title') || titleEl.first().text().trim();

      // Company name
      const companyEl = $card.find('span[data-testid="company-name"], .companyName, .company');
      const company = companyEl.first().text().trim();

      // Location
      const locationEl = $card.find('div[data-testid="text-location"], .companyLocation, .location');
      const location = locationEl.first().text().trim();

      // Salary
      const salaryEl = $card.find('div.salary-snippet-container, .salaryText, .salary-snippet, [data-testid="attribute_snippet_testid"]');
      let salary = '';
      salaryEl.each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes('$')) {
          salary = text;
          return false; // break
        }
      });

      // Employment type (Full-time, Part-time, etc.)
      const typeEl = $card.find('.metadata div, .attribute_snippet');
      let employmentType = '';
      typeEl.each((_, el) => {
        const text = $(el).text().trim().toLowerCase();
        if (text.includes('full-time') || text.includes('part-time') || text.includes('contract') || text.includes('temporary')) {
          employmentType = $(el).text().trim();
          return false;
        }
      });

      // Job URL
      const linkEl = $card.find('a[data-jk], h2.jobTitle a, a.jcs-JobTitle');
      let sourceUrl = linkEl.first().attr('href') || '';
      if (sourceUrl && !sourceUrl.startsWith('http')) {
        sourceUrl = `https://www.indeed.com${sourceUrl}`;
      }

      // Extract job key for cleaner URL
      const jobKey = linkEl.first().attr('data-jk');
      if (jobKey) {
        sourceUrl = `https://www.indeed.com/viewjob?jk=${jobKey}`;
      }

      if (title && company) {
        const { min, max, type } = parseSalary(salary);
        jobs.push({
          title,
          company,
          location,
          salary,
          salaryType: type,
          salaryMin: min,
          salaryMax: max,
          employmentType: employmentType || undefined,
          sourceUrl,
        });
      }
    } catch (e) {
      // Skip problematic cards
    }
  });

  return jobs;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scrapeIndeed(options: ScrapeOptions): Promise<ScrapedJob[]> {
  const { maxPages = 3 } = options;
  const allJobs: ScrapedJob[] = [];

  console.log(`Starting Indeed scrape for "${options.keyword}" in ${options.location}`);
  console.log(`Using ScraperAPI`);

  // Indeed uses start=0, 10, 20, etc. for pagination (10 jobs per page)
  for (let pageNum = 0; pageNum < maxPages; pageNum++) {
    const start = pageNum * 10;
    const url = buildSearchUrl(options, start);
    console.log(`Scraping page ${pageNum + 1}: ${url}`);

    try {
      const html = await fetchWithScraperAPI(url);

      // Save debug HTML
      const fs = await import('fs');
      fs.writeFileSync('/tmp/indeed-debug.html', html);
      console.log('Debug HTML saved to /tmp/indeed-debug.html');

      const pageJobs = parseJobsFromHTML(html);
      console.log(`Found ${pageJobs.length} jobs on page ${pageNum + 1}`);
      allJobs.push(...pageJobs);

      // Stop if no jobs found
      if (pageJobs.length === 0) {
        console.log('No jobs found on this page, stopping pagination');
        break;
      }

      // Rate limit between pages
      if (pageNum < maxPages - 1) {
        await delay(2000);
      }

    } catch (e) {
      console.error(`Error scraping page ${pageNum + 1}:`, e);
      break;
    }
  }

  // Deduplicate jobs by URL
  const uniqueJobs = allJobs.filter((job, index, self) =>
    index === self.findIndex(j => j.sourceUrl === job.sourceUrl)
  );

  console.log(`Total jobs scraped: ${uniqueJobs.length} (${allJobs.length} before deduplication)`);
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

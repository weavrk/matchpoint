import puppeteer, { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY;

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
  headless?: boolean;    // Ignored - kept for compatibility
}

// Helper to parse salary strings like "$50K - $70K" or "$18.00 - $22.00 Per Hour"
function parseSalary(salaryStr: string): { min?: number; max?: number; type?: string } {
  if (!salaryStr) return {};

  // Determine salary type
  let type: string | undefined;
  const salaryLower = salaryStr.toLowerCase();
  if (salaryLower.includes('hour') || salaryLower.includes('hr')) {
    type = 'hourly';
  } else if (salaryLower.includes('year') || salaryLower.includes('annual') || salaryLower.includes('k')) {
    type = 'annual';
  }

  // Remove common non-numeric chars and normalize
  const cleaned = salaryStr.replace(/,/g, '').toLowerCase();

  // Match patterns like "$50k - $70k" or "$50000 - $70000"
  const rangeMatch = cleaned.match(/\$?([\d.]+)k?\s*[-–to]+\s*\$?([\d.]+)k?/i);

  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);

    // If values look like hourly (under 100), keep as-is
    if (min < 100 && max < 100) {
      // Hourly rate - don't convert
      type = type || 'hourly';
    } else if (min < 1000) {
      // K notation - convert to full number
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

// Build Glassdoor search URL
function buildSearchUrl(options: ScrapeOptions, page: number = 1): string {
  const { location, keyword } = options;

  // Parse location into city and state parts
  const parts = location.split('-');
  const state = parts.pop() || '';
  const city = parts.join(' ');

  // Build location string: "Austin, TX"
  const locationStr = `${city}, ${state}`.toUpperCase();

  let url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(keyword)}&locT=C&locKeyword=${encodeURIComponent(locationStr)}&radius=25`;

  if (page > 1) {
    url += `&p=${page}`;
  }

  return url;
}

// Solve Cloudflare Turnstile CAPTCHA using 2Captcha HTTP API
async function solveTurnstileCaptcha(pageUrl: string, siteKey: string): Promise<string | null> {
  if (!TWOCAPTCHA_API_KEY) {
    console.log('WARNING: TWOCAPTCHA_API_KEY not set - cannot solve CAPTCHA');
    return null;
  }

  console.log(`Solving Turnstile CAPTCHA for ${pageUrl}...`);

  try {
    // Step 1: Submit the CAPTCHA to 2Captcha
    const submitUrl = `https://2captcha.com/in.php?key=${TWOCAPTCHA_API_KEY}&method=turnstile&sitekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`;

    const submitResponse = await fetch(submitUrl);
    const submitResult = await submitResponse.json() as { status: number; request: string };

    if (submitResult.status !== 1) {
      console.error('Failed to submit CAPTCHA:', submitResult.request);
      return null;
    }

    const taskId = submitResult.request;
    console.log(`CAPTCHA submitted, task ID: ${taskId}`);

    // Step 2: Poll for the result
    let attempts = 0;
    const maxAttempts = 60; // Up to 2 minutes

    while (attempts < maxAttempts) {
      await delay(2000); // Wait 2 seconds between polls

      const resultUrl = `https://2captcha.com/res.php?key=${TWOCAPTCHA_API_KEY}&action=get&id=${taskId}&json=1`;
      const resultResponse = await fetch(resultUrl);
      const result = await resultResponse.json() as { status: number; request: string };

      if (result.status === 1) {
        console.log('CAPTCHA solved successfully');
        return result.request;
      }

      if (result.request !== 'CAPCHA_NOT_READY') {
        console.error('CAPTCHA solve failed:', result.request);
        return null;
      }

      attempts++;
      console.log(`Waiting for CAPTCHA solution... (${attempts}/${maxAttempts})`);
    }

    console.error('CAPTCHA solve timed out');
    return null;
  } catch (err) {
    console.error('Failed to solve CAPTCHA:', err);
    return null;
  }
}

// Detect if page has Cloudflare challenge
async function detectCloudflareTurnstile(page: Page): Promise<string | null> {
  try {
    // Look for Turnstile iframe or challenge elements
    const siteKey = await page.evaluate(() => {
      // Check for Turnstile widget
      const turnstileDiv = document.querySelector('[data-sitekey]');
      if (turnstileDiv) {
        return turnstileDiv.getAttribute('data-sitekey');
      }

      // Check in iframe
      const iframe = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
      if (iframe) {
        const src = iframe.getAttribute('src') || '';
        const match = src.match(/sitekey=([^&]+)/);
        if (match) return match[1];
      }

      // Check if Cloudflare challenge page
      if (document.title.includes('Just a moment') ||
          document.body.innerText.includes('Checking your browser')) {
        // Try to find sitekey in page source
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const match = script.textContent?.match(/sitekey['":\s]+['"]([^'"]+)['"]/);
          if (match) return match[1];
        }
      }

      return null;
    });

    return siteKey;
  } catch {
    return null;
  }
}

// Parse job listings from HTML using Cheerio
function parseJobsFromHTML(html: string): ScrapedJob[] {
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  // Debug: check if we got blocked
  if (html.toLowerCase().includes('verify you are human') ||
      html.toLowerCase().includes('help us protect glassdoor')) {
    console.log('WARNING: Still getting CAPTCHA page');
    return jobs;
  }

  // Try multiple selectors for job cards
  const jobCards = $('li[data-test="jobListing"], .JobsList_jobListItem__wjTHv, .JobsList_jobListItem__JBBUV, [data-job-id], .jobCard, .react-job-listing');

  console.log(`Found ${jobCards.length} job cards in HTML`);

  jobCards.each((_, card) => {
    try {
      const $card = $(card);

      // Job title
      const titleEl = $card.find('[data-test="job-title"], .JobCard_jobTitle___7I6y, .JobCard_jobTitle__GLyJ1, .job-title, a.jobLink');
      const title = titleEl.first().text().trim();

      // Company name
      let company = '';
      const companyEl = $card.find('[data-test="employer-name"], .EmployerProfile_compactEmployerName__LE242, .EmployerProfile_employerName__Xemli, .employer-name');
      if (companyEl.length) {
        company = companyEl.first().text().trim();
        // Remove rating suffix like "3.5"
        company = company.replace(/\s*\d+\.\d+\s*$/, '').trim();
      }

      // Location
      const locationEl = $card.find('[data-test="emp-location"], .JobCard_location__rCz3x, .JobCard_location__N_iYE, .location');
      const location = locationEl.first().text().trim();

      // Salary
      const salaryEl = $card.find('[data-test="detailSalary"], .JobCard_salaryEstimate__QpbTW, .JobCard_salaryEstimate__arV5J, .salary-estimate');
      const salary = salaryEl.first().text().trim();

      // Benefits
      const benefitEls = $card.find('[data-test="benefit"], .JobCard_benefit__YbD_u, .benefit-tag');
      const benefits = benefitEls.map((_, el) => $(el).text().trim()).get().filter(Boolean).join(', ');

      // Job URL
      const linkEl = $card.find('a[href*="/job-listing/"], a[href*="/partner/"]');
      let sourceUrl = linkEl.first().attr('href') || '';
      if (sourceUrl && !sourceUrl.startsWith('http')) {
        sourceUrl = `https://www.glassdoor.com${sourceUrl}`;
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
          benefits: benefits || undefined,
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

export async function scrapeGlassdoor(options: ScrapeOptions): Promise<ScrapedJob[]> {
  const { maxPages = 3 } = options;
  const allJobs: ScrapedJob[] = [];

  console.log(`Starting Glassdoor scrape for "${options.keyword}" in ${options.location}`);
  console.log(`Using Puppeteer with 2Captcha for CAPTCHA bypass`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const url = buildSearchUrl(options, pageNum);
      console.log(`Scraping page ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Check for Cloudflare challenge
        const siteKey = await detectCloudflareTurnstile(page);

        if (siteKey) {
          console.log(`Detected Cloudflare Turnstile CAPTCHA (sitekey: ${siteKey.substring(0, 10)}...)`);

          // Solve CAPTCHA
          const token = await solveTurnstileCaptcha(page.url(), siteKey);

          if (token) {
            // Inject the token and submit
            await page.evaluate((captchaToken) => {
              // Set the turnstile response
              const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement;
              if (input) {
                input.value = captchaToken;
              }

              // Try to trigger the callback if it exists
              // @ts-ignore
              if (window.turnstile && window.turnstile.getResponse) {
                // @ts-ignore
                window.turnstile.getResponse = () => captchaToken;
              }

              // Try to find and click submit button
              const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement;
              if (submitBtn) {
                submitBtn.click();
              }
            }, token);

            // Wait for navigation after CAPTCHA
            await delay(3000);
            await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
          }
        }

        // Wait for job listings to load
        await page.waitForSelector('li[data-test="jobListing"], .JobsList_jobListItem__wjTHv, [data-job-id]', { timeout: 15000 }).catch(() => {
          console.log('Job listings selector not found, trying to proceed anyway');
        });

        // Get page HTML
        const html = await page.content();

        // Save debug HTML
        const fs = await import('fs');
        fs.writeFileSync('/tmp/glassdoor-debug.html', html);

        const pageJobs = parseJobsFromHTML(html);
        console.log(`Found ${pageJobs.length} jobs on page ${pageNum}`);
        allJobs.push(...pageJobs);

        // If we got 0 jobs, page might be blocked or empty - stop early
        if (pageJobs.length === 0) {
          console.log('No jobs found on this page, stopping pagination');
          break;
        }

        // Rate limit between pages
        if (pageNum < maxPages) {
          await delay(2000 + Math.random() * 2000);
        }

      } catch (e) {
        console.error(`Error scraping page ${pageNum}:`, e);
        break;
      }
    }
  } finally {
    await browser.close();
  }

  // Deduplicate jobs by URL
  const uniqueJobs = allJobs.filter((job, index, self) =>
    index === self.findIndex(j => j.sourceUrl === job.sourceUrl)
  );

  console.log(`Total jobs scraped: ${uniqueJobs.length} (${allJobs.length} before deduplication)`);
  return uniqueJobs;
}

// Filter configuration for scraping
export interface ScrapeFilterConfig {
  retailers?: string[];
  retailerClassifications?: ('Luxury' | 'Mid' | 'Big Box')[];
}

// Filter scraped jobs to only those matching specified retailers
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

// Filter scraped jobs to only those in the target market location
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

// Main CLI runner
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx ts-node src/scrapers/glassdoor.ts <location> <keyword>');
    console.log('Example: npx ts-node src/scrapers/glassdoor.ts austin-tx "Retail"');
    process.exit(1);
  }

  const location = args[0];
  const keyword = args[1];

  const jobs = await scrapeGlassdoor({
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

// Only run main() when executed directly
if (require.main === module) {
  main().catch(console.error);
}

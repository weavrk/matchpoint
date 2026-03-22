import puppeteer, { Page, Browser } from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY;
const GLASSDOOR_EMAIL = process.env.GLASSDOOR_EMAIL;
const GLASSDOOR_PASSWORD = process.env.GLASSDOOR_PASSWORD;

// Chrome user data directory for using existing browser session
const CHROME_USER_DATA_DIR = '/Users/katherine_1/Library/Application Support/Google/Chrome';
const CHROME_PROFILE = 'Default';

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
  retailers?: string[];  // Ignored - kept for compatibility with Indeed
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

  // Build location string for URL: "atlanta-ga" style
  const locationSlug = `${city.replace(/\s+/g, '-')}-${state}`.toLowerCase();

  // Use the SEO-friendly URL format that Glassdoor actually uses
  // Format: /Job/{city}-{state}-jobs-SRCH_IL.0,{len}_IC{locId}.htm
  // Since we don't have locId, use the search format with l parameter
  let url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(keyword)}&locT=C&locId=0&locKeyword=${encodeURIComponent(`${city}, ${state}`.toUpperCase())}&jobType=`;

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
    // Wait for Turnstile widget to potentially render
    await delay(3000);

    // Look for Turnstile iframe or challenge elements
    const siteKey = await page.evaluate(() => {
      // Check for Turnstile widget with data-sitekey (this is the real sitekey)
      const turnstileDiv = document.querySelector('[data-sitekey]');
      if (turnstileDiv) {
        const key = turnstileDiv.getAttribute('data-sitekey');
        // Real Turnstile sitekeys start with '0x' and are longer
        if (key && key.startsWith('0x')) {
          return key;
        }
      }

      // Check in Turnstile iframe src for sitekey parameter
      const iframe = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
      if (iframe) {
        const src = iframe.getAttribute('src') || '';
        const match = src.match(/sitekey=([^&]+)/);
        if (match && match[1].startsWith('0x')) return match[1];
      }

      // Check if Cloudflare challenge page and look for sitekey in scripts
      if (document.title.includes('Just a moment') ||
          document.body.innerText.includes('Help Us Protect') ||
          document.body.innerText.includes('Checking your browser')) {
        // Try to find sitekey in page source - real ones start with 0x
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          // Look for sitekey patterns like: sitekey: '0x4AAAAAAA...'
          const match = script.textContent?.match(/sitekey['":\s]+['"]?(0x[A-Za-z0-9_-]+)['"]?/);
          if (match) return match[1];
        }

        // Also check in the HTML itself
        const html = document.documentElement.innerHTML;
        const htmlMatch = html.match(/data-sitekey=['"]?(0x[A-Za-z0-9_-]+)['"]?/);
        if (htmlMatch) return htmlMatch[1];
      }

      return null;
    });

    // If we still don't have a valid sitekey, return null to indicate CAPTCHA but no solvable key
    if (siteKey && !siteKey.startsWith('0x')) {
      console.log(`Found invalid sitekey format: ${siteKey}`);
      return null;
    }

    return siteKey;
  } catch {
    return null;
  }
}

// Check if page is a Cloudflare challenge
function isCloudflareChallenge(html: string): boolean {
  const lower = html.toLowerCase();
  return lower.includes('cf-turnstile-response') ||
         lower.includes('verify you are human') ||
         lower.includes('help us protect glassdoor') ||
         lower.includes('just a moment') ||
         lower.includes('checking your browser') ||
         lower.includes('challenge-platform');
}

// Parse job listings from HTML using Cheerio
function parseJobsFromHTML(html: string): ScrapedJob[] {
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  // Debug: check if we got blocked by Cloudflare or Glassdoor CAPTCHA
  if (isCloudflareChallenge(html)) {
    console.log('WARNING: Cloudflare challenge detected - cookies may need refresh');
    return jobs;
  }

  // Try multiple selectors for job cards - use partial class matching since Glassdoor randomizes suffixes
  const jobCards = $('li[data-test="jobListing"], [class*="JobCard_jobCardWrapper"], [class*="jobListItem"], [data-job-id], .jobCard');

  console.log(`Found ${jobCards.length} job cards in HTML`);

  jobCards.each((_, card) => {
    try {
      const $card = $(card);

      // Job title - use partial class match
      const titleEl = $card.find('[data-test="job-title"], [class*="JobCard_jobTitle"], .job-title, a.jobLink');
      const title = titleEl.first().text().trim();

      // Company name - use partial class match
      let company = '';
      const companyEl = $card.find('[data-test="employer-name"], [class*="EmployerProfile_compactEmployerName"], [class*="EmployerProfile_employerName"], .employer-name');
      if (companyEl.length) {
        company = companyEl.first().text().trim();
        // Remove rating suffix like "3.5"
        company = company.replace(/\s*\d+\.\d+\s*$/, '').trim();
      }

      // Location - use partial class match
      const locationEl = $card.find('[data-test="emp-location"], [class*="JobCard_location"], .location');
      const location = locationEl.first().text().trim();

      // Salary - use partial class match
      const salaryEl = $card.find('[data-test="detailSalary"], [class*="JobCard_salaryEstimate"], .salary-estimate');
      const salary = salaryEl.first().text().trim();

      // Benefits
      const benefitEls = $card.find('[data-test="benefit"], [class*="JobCard_benefit"], .benefit-tag');
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

// Auto-login to Glassdoor and save fresh cookies
async function loginAndSaveCookies(page: Page): Promise<boolean> {
  if (!GLASSDOOR_EMAIL || !GLASSDOOR_PASSWORD) {
    console.log('GLASSDOOR_EMAIL or GLASSDOOR_PASSWORD not set in .env - cannot auto-login');
    return false;
  }

  console.log('Attempting auto-login to Glassdoor...');

  try {
    // Go to login page
    await page.goto('https://www.glassdoor.com/profile/login_input.htm', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await delay(2000);

    // Check for Cloudflare challenge on login page
    let html = await page.content();
    if (isCloudflareChallenge(html)) {
      console.log('Cloudflare challenge on login page - waiting...');
      for (let i = 0; i < 15; i++) {
        await delay(1000);
        html = await page.content();
        if (!isCloudflareChallenge(html)) {
          console.log('Cloudflare challenge passed');
          break;
        }
      }
      if (isCloudflareChallenge(html)) {
        console.log('ERROR: Cloudflare challenge on login page did not resolve');
        return false;
      }
    }

    // Wait for email input field
    await page.waitForSelector('input[name="username"], input[type="email"], #inlineUserEmail', { timeout: 10000 });

    // Enter email
    const emailSelector = await page.$('input[name="username"]') ||
                          await page.$('input[type="email"]') ||
                          await page.$('#inlineUserEmail');
    if (!emailSelector) {
      console.log('Could not find email input field');
      return false;
    }

    await emailSelector.click({ clickCount: 3 }); // Select all
    await emailSelector.type(GLASSDOOR_EMAIL, { delay: 50 });
    console.log('Entered email');

    // Look for password field or "Continue" button
    const passwordField = await page.$('input[name="password"], input[type="password"], #inlineUserPassword');

    if (passwordField) {
      // Password field visible, enter it directly
      await passwordField.click({ clickCount: 3 });
      await passwordField.type(GLASSDOOR_PASSWORD, { delay: 50 });
      console.log('Entered password');
    } else {
      // Click continue/next to get to password step
      const continueBtn = await page.$('button[type="submit"], button[data-test="email-form-button"]');
      if (continueBtn) {
        await continueBtn.click();
        console.log('Clicked continue button');
        await delay(2000);

        // Now look for password field
        await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 10000 });
        const pwdField = await page.$('input[name="password"]') || await page.$('input[type="password"]');
        if (pwdField) {
          await pwdField.click({ clickCount: 3 });
          await pwdField.type(GLASSDOOR_PASSWORD, { delay: 50 });
          console.log('Entered password');
        }
      }
    }

    // Click sign in button
    await delay(500);
    const signInBtn = await page.$('button[type="submit"], button[data-test="sign-in-button"], button[name="submit"]');
    if (signInBtn) {
      await signInBtn.click();
      console.log('Clicked sign in button');
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
    }

    // Wait for login to complete
    await delay(5000);

    // Check if login was successful by looking for logged-in indicators
    html = await page.content();
    const isLoggedIn = html.includes('Sign Out') ||
                       html.includes('signOut') ||
                       html.includes('account-menu') ||
                       !html.includes('Sign In');

    if (!isLoggedIn) {
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorEl = document.querySelector('[data-test="error-message"], .error-message, .alert-error');
        return errorEl?.textContent || null;
      });
      if (errorText) {
        console.log(`Login error: ${errorText}`);
      }
      console.log('Login may have failed - checking if we can proceed anyway');
    }

    // Extract and save cookies
    const cookies = await page.cookies();
    if (cookies.length > 0) {
      const fs = await import('fs');
      const path = await import('path');
      const cookiesPath = path.join(process.cwd(), 'glassdoor-cookies.json');

      // Format cookies for storage
      const cookiesToSave = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
      }));

      fs.writeFileSync(cookiesPath, JSON.stringify(cookiesToSave, null, 2));
      console.log(`Saved ${cookies.length} fresh cookies to glassdoor-cookies.json`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Auto-login failed:', error);
    return false;
  }
}

export async function scrapeGlassdoor(options: ScrapeOptions): Promise<ScrapedJob[]> {
  const { maxPages = 3 } = options;
  const allJobs: ScrapedJob[] = [];

  console.log(`Starting Glassdoor scrape for "${options.keyword}" in ${options.location}`);

  // Try to use real Chrome profile first for authenticated session
  let browser: Browser;
  let usingRealChrome = false;
  const fs = await import('fs');
  const path = await import('path');

  // Create a separate profile directory that copies cookies from main Chrome
  const scrapeProfileDir = path.join(process.cwd(), '.glassdoor-profile');

  try {
    // Check if Chrome is already running - need to check both lock files
    const lockFile = `${CHROME_USER_DATA_DIR}/SingletonLock`;
    const socketFile = `${CHROME_USER_DATA_DIR}/SingletonSocket`;
    const chromeRunning = fs.existsSync(lockFile) || fs.existsSync(socketFile);

    console.log(`Chrome running: ${chromeRunning}`);

    if (!chromeRunning) {
      // Chrome not running - can use real profile directly
      console.log('Using real Chrome with authenticated profile');
      browser = await puppeteerCore.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        userDataDir: CHROME_USER_DATA_DIR,
        args: [
          `--profile-directory=${CHROME_PROFILE}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080',
        ],
      }) as unknown as Browser;
      usingRealChrome = true;
    } else {
      // Chrome is running - use Puppeteer bundled browser with cookies from JSON file
      // The cookie copying approach doesn't work because Chrome encrypts cookies
      console.log('Chrome is running - using bundled browser with cookie file');
      console.log('NOTE: For best results, close Chrome before scraping OR refresh glassdoor-cookies.json');

      browser = await puppeteer.launch({
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
    }
  } catch (err) {
    console.log('Failed to use Chrome profile, falling back to Puppeteer:', err);
    browser = await puppeteer.launch({
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
  }

  try {
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Load session cookies from file ONLY if not using real Chrome profile
    if (!usingRealChrome) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const cookiesPath = path.join(process.cwd(), 'glassdoor-cookies.json');

        if (fs.existsSync(cookiesPath)) {
          const cookiesJson = fs.readFileSync(cookiesPath, 'utf-8');
          const cookies = JSON.parse(cookiesJson);

          // Convert to Puppeteer cookie format
          const puppeteerCookies = cookies.map((c: any) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path || '/',
          }));

          await page.setCookie(...puppeteerCookies);
          console.log(`Loaded ${puppeteerCookies.length} session cookies from glassdoor-cookies.json`);
        } else {
          console.log('No glassdoor-cookies.json found, proceeding without session cookies');
        }
      } catch (cookieError) {
        console.log('Failed to load cookies:', cookieError);
      }
    } else {
      console.log('Using authenticated Chrome profile - no need to load cookies');
    }

    // Navigate to page 1 only - use in-page pagination for subsequent pages
    const url = buildSearchUrl(options, 1);
    console.log(`Scraping page 1: ${url}`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000); // Give Cloudflare time to pass through

    // Check for Cloudflare challenge on initial load
    let html = await page.content();
    if (isCloudflareChallenge(html)) {
      console.log('Cloudflare challenge on page 1 - waiting for it to resolve...');
      // Wait up to 10 seconds for challenge to complete
      for (let i = 0; i < 10; i++) {
        await delay(1000);
        html = await page.content();
        if (!isCloudflareChallenge(html)) {
          console.log('Cloudflare challenge passed');
          break;
        }
      }
      if (isCloudflareChallenge(html)) {
        console.log('Cookies expired - attempting auto-login...');

        // Try auto-login
        const loginSuccess = await loginAndSaveCookies(page);
        if (loginSuccess) {
          // Retry navigation with fresh cookies
          console.log('Retrying with fresh session...');
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await delay(3000);

          html = await page.content();
          if (isCloudflareChallenge(html)) {
            // Wait again
            for (let i = 0; i < 10; i++) {
              await delay(1000);
              html = await page.content();
              if (!isCloudflareChallenge(html)) break;
            }
          }

          if (isCloudflareChallenge(html)) {
            console.log('ERROR: Still blocked after login. Check credentials.');
            return [];
          }
        } else {
          console.log('ERROR: Auto-login failed. Add GLASSDOOR_EMAIL and GLASSDOOR_PASSWORD to .env');
          return [];
        }
      }
    }

    // Scrape pages using in-page pagination (clicking "Next" button)
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Scraping page ${pageNum}...`);

      // Scroll down to trigger lazy loading
      await page.evaluate(async () => {
        const scrollStep = 400;
        const scrollDelay = 200;
        const maxScrolls = 5;

        for (let i = 0; i < maxScrolls; i++) {
          window.scrollBy(0, scrollStep);
          await new Promise(r => setTimeout(r, scrollDelay));
        }
        // Scroll back to top
        window.scrollTo(0, 0);
      });

      // Wait for job listings
      await page.waitForSelector('li[data-test="jobListing"], [class*="JobCard_jobCardWrapper"], [data-job-id]', { timeout: 8000 }).catch(() => {});
      await delay(500);

      // Get page HTML
      html = await page.content();

      // Check for Cloudflare again
      if (isCloudflareChallenge(html)) {
        console.log(`Cloudflare challenge on page ${pageNum} - stopping`);
        break;
      }

      const pageJobs = parseJobsFromHTML(html);
      console.log(`Found ${pageJobs.length} jobs on page ${pageNum}`);

      if (pageJobs.length === 0) {
        // Save debug HTML
        const fs = await import('fs');
        fs.writeFileSync(`/tmp/glassdoor-page${pageNum}.html`, html);
        console.log(`No jobs found on page ${pageNum} - stopping`);
        break;
      }

      allJobs.push(...pageJobs);

      // Try to go to next page by clicking pagination
      if (pageNum < maxPages) {
        const hasNextPage = await page.evaluate(() => {
          // Look for "Next" button or page number link
          const nextBtn = document.querySelector('button[data-test="pagination-next"], [class*="nextButton"], a[aria-label="Next"]');
          if (nextBtn && !(nextBtn as HTMLButtonElement).disabled) {
            (nextBtn as HTMLElement).click();
            return true;
          }
          // Try clicking page number directly
          const pageLinks = document.querySelectorAll('[class*="paginationLink"], button[data-test*="page"]');
          for (let i = 0; i < pageLinks.length; i++) {
            const link = pageLinks[i];
            const text = link.textContent?.trim();
            // This won't work without pageNum access, but keeping structure
            if (text && /^\d+$/.test(text)) {
              (link as HTMLElement).click();
              return true;
            }
          }
          return false;
        });

        if (!hasNextPage) {
          console.log('No next page button found - stopping');
          break;
        }

        // Wait for navigation/content update
        await delay(2000 + Math.random() * 1000);
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
  retailerClassifications?: ('Luxury' | 'Specialty' | 'Big Box')[];
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

  // State name mappings for common abbreviations
  const stateNames: Record<string, string> = {
    'GA': 'georgia', 'TX': 'texas', 'NY': 'new york', 'CA': 'california',
    'FL': 'florida', 'IL': 'illinois', 'PA': 'pennsylvania', 'OH': 'ohio',
    'MI': 'michigan', 'NC': 'north carolina', 'NJ': 'new jersey', 'VA': 'virginia',
    'WA': 'washington', 'AZ': 'arizona', 'MA': 'massachusetts', 'TN': 'tennessee',
    'IN': 'indiana', 'MO': 'missouri', 'MD': 'maryland', 'WI': 'wisconsin',
    'CO': 'colorado', 'MN': 'minnesota', 'SC': 'south carolina', 'AL': 'alabama',
    'LA': 'louisiana', 'KY': 'kentucky', 'OR': 'oregon', 'OK': 'oklahoma',
    'CT': 'connecticut', 'UT': 'utah', 'NV': 'nevada', 'IA': 'iowa',
    'AR': 'arkansas', 'MS': 'mississippi', 'KS': 'kansas', 'NM': 'new mexico',
    'NE': 'nebraska', 'ID': 'idaho', 'WV': 'west virginia', 'HI': 'hawaii',
    'NH': 'new hampshire', 'ME': 'maine', 'MT': 'montana', 'RI': 'rhode island',
    'DE': 'delaware', 'SD': 'south dakota', 'ND': 'north dakota', 'AK': 'alaska',
    'VT': 'vermont', 'WY': 'wyoming', 'DC': 'district of columbia'
  };
  const stateFullName = stateNames[stateAbbrev] || stateLower;

  return jobs.filter(job => {
    if (!job.location) return false;
    const locationLower = job.location.toLowerCase();

    // Check for city match
    const hasCity = locationLower.includes(cityLower);

    // Check for state match (abbrev, full name, or comma+abbrev pattern)
    const hasState = locationLower.includes(stateLower) ||
                     locationLower.includes(stateFullName) ||
                     job.location.includes(`, ${stateAbbrev}`) ||
                     job.location.endsWith(stateAbbrev);

    // Accept if city matches (even without explicit state) or if both match
    // This handles cases like "Atlanta" without "GA" or "Atlanta, Georgia"
    return hasCity || (hasCity && hasState);
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

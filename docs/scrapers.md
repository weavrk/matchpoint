# Job Site Scrapers

Scrapers live in `src/scrapers/`. Common behavior:

- **Location format:** URL slug style `city-name-state` (e.g., `austin-tx`, `new-york-ny`)
- **Keyword search:** Generic "Retail" search to find all retail jobs
- **Filtering:** Results filtered by retailer name (fuzzy match) and location (city + state)
- **Role matching:** Job titles fuzzy-matched to roles from Supabase `roles` table
- **Pagination:** Up to `maxPages` pages scraped per search

---

### Indeed

`src/scrapers/indeed.ts`

| Setting             | Value                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Proxy               | ScraperAPI for anti-bot bypass (`SCRAPERAPI_KEY`)                                                                                   |
| HTML Parsing        | Cheerio (extracts from embedded JSON `window.mosaic.providerData`)                                                                  |
| Pagination          | `?start=0,10,20...` (10 jobs per page)                                                                                              |
| URL format          | `https://www.indeed.com/jobs?q=Retail&l=Austin,+TX`                                                                                 |
| Multi-pass scraping | 5 passes per market: (1) Relevance sort, (2) Date sort, (3) Relevance last 7 days, (4) Date last 3 days, (5) Relevance last 14 days |
| Session rotation    | Each pass uses a unique session number for fresh results                                                                            |
| Salary cleanup      | Spanish text auto-converted to English (e.g., "por hora" → "an hour")                                                               |

---

### Glassdoor

`src/scrapers/glassdoor.ts` — NOPE! Scrape is ridiculous

| Setting        | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Browser        | Puppeteer (headless Chrome)                                                      |
| CAPTCHA Bypass | Session cookie injection from logged-in browser                                  |
| HTML Parsing   | Cheerio after page load                                                          |
| Pagination     | `?p=1,2,3...`                                                                    |
| URL format     | `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=Retail&locKeyword=AUSTIN,+TX` |

**Cookie Injection Setup:** The scraper loads cookies from `glassdoor-cookies.json` to bypass CAPTCHA. To refresh:

1. Log into Glassdoor in Chrome
2. Open DevTools Console (Cmd+Option+J)
3. Run: `JSON.stringify(document.cookie.split('; ').map(c => { const [name, ...v] = c.split('='); return { name, value: v.join('='), domain: '.glassdoor.com', path: '/' }; }), null, 2)`
4. Copy output and save to `glassdoor-cookies.json` in project root
5. Cookies typically last a few days before needing refresh

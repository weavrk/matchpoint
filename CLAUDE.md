# Matchpoint

### How might we build Reflex into the only platform brands need for retail talent?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Users / Personas

### Retailer

- Existing Reflex customers already booking flex/part-time workers
- Everythign else TBD pending discovery, could be store managers (single store or multi-store), hiring manager, district managers, hr, recruiter,

### Worker

- **Shift Verified**: Existing Reflex workers with completed shifts. Carries a trust badge.
- **Waitlist / New**: Excluded them for now, this could be an extension the results are null

---

## Worker Quality Segmentation

Filtering workers table by  

- Favorite ≥50% (1,116 workers)

Tags to add

- If favorite is >60% -> {x}% Favorite Rate 
- If tardy is <10%-> add "Exceptional Punctuality {232/295}" -> so total on time (so inverse of tardy) out of total
- If UC is <5%, add "Last minute call-out {1/total}"
- If invite back is >90% -> add "Invite back {x}%"

Here's the breakdown if we want to choose other methods


| Filter               | Count   | %         |
| -------------------- | ------- | --------- |
| Total workers        | 1,701   | 100%      |
| 1. Invite back ≥90%  | 706     | 41.5%     |
| 2. Favorite ≥50%     | 1,116   | 65.6%     |
| 3. Tardy <10%        | 1,013   | 59.6%     |
| 4. Urgent cancel <5% | 1,399   | 82.2%     |
| **Cumulative (2-4)** | **613** | **36.0%** |
| **Cumulative (1-4)** | **378** | **22.2%** |


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Tech Stack

### Overview


| Component     | Technology                                                                           |
| ------------- | ------------------------------------------------------------------------------------ |
| Frontend      | React + TypeScript (Vite), located in `web/`                                         |
| Backend       | Node.js + Express + TypeScript, located in `src/`                                    |
| AI Provider   | Google AI Studio (Gemini)                                                            |
| Styling       | CSS (no framework), see design system section                                        |
| Icons         | Lucide React                                                                         |
| Hosting       | Vercel                                                                               |
| Github        | [https://github.com/weavrk/matchpoint.git](https://github.com/weavrk/matchpoint.git) |
| Worker Photos | [Cloudinary](https://console.cloudinary.com), [Pexels](https://www.pexels.com/api/), [RandomUser](https://randomuser.me/). Review: [review-portraits.html](file:///Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/scripts/review-portraits.html). Replace: `node scripts/replacement-server.mjs` |


### Supabase


| Key           | Value                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Account       | [weavrk@gmail.com](mailto:weavrk@gmail.com)                                                                                                                                                                        |
| Project URL   | [https://kxfbismfpmjwvemfznvm.supabase.co](https://kxfbismfpmjwvemfznvm.supabase.co)                                                                                                                               |
| Anon Key      | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI` |
| DB Connection | `postgresql://postgres:[YOUR-PASSWORD]@db.kxfbismfpmjwvemfznvm.supabase.co:5432/postgres`                                                                                                                          |
| Password      | reflexmatchpoint123                                                                                                                                                                                                |


### Tables


| Table               | Columns                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markets`           | `id`, `city`, `state`                                                                                                                                                                                                                                                                                                                                                                                |
| `roles`             | `id`, `title`, `category`, `description`                                                                                                                                                                                                                                                                                                                                                             |
| `retailers`         | `id`, `name`, `classification`                                                                                                                                                                                                                                                                                                                                                                       |
| `job_postings`      | `id`, `retailer_id`, `market_id`, `role_id`, `source`, `salary_min`, `salary_max`, `benefits`                                                                                                                                                                                                                                                                                                        |
| `workers`           | `id`, `worker_id`, `worker_uuid`, `name`, `photo`, `market`, `shift_verified`, `actively_looking`, `shifts_on_reflex`, `invited_back_stores`, `current_tier`, `brands_worked`, `endorsement_counts`, `shift_experience`, `previous_experience`, `reflex_activity`, `retailer_quotes`, `retailer_summary`, `about_me`, `tardy_ratio`, `tardy_percent`, `urgent_cancel_ratio`, `urgent_cancel_percent` |
| `workers_full`      | Full worker dataset before filter to workers                                                                                                                                                                                                                                                                                                                                                         |
| `jobs_published`    | `job_id`, `job_title`, `job_type`, `store_location`, `job_market`, `pay_type`, `pay_range`, `benefits`, `created_at`, `unpublished_at`                                                                                                                                                                                                                                                               |
| `jobs_applications` | `id`, `worker_id`, `job_id`, `status`, `invited`, `created_at`                                                                                                                                                                                                                                                                                                                                       |


### Useful Scripts

Located in `scripts/`. Run with `npx tsx scripts/<name>.ts`


| Script                         | Description                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clean-worker-data.ts`         | Removes "Unknown" companies from previous_experience, maps duration codes (SHORT/MEDIUM/LONG/EXTENDED) to readable text, fixes single-word names by extracting first names from retailer quotes, generates first names based on gender when not found. Optional: `--shifts=<csv>` to populate shift_experience from CSV |
| `update-worker-photos-all.mjs` | Update worker photos from various sources                                                                                                                                                                                                                                                                               |


### Environment Variables

Stored in `.env` (gitignored). Do NOT hardcode keys in source files.


| Variable              | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `GEMINI_API_KEY`      | Google AI Studio API key for Gemini chat (backend)                  |
| `VITE_GEMINI_API_KEY` | Same key exposed to Vite frontend (must have VITE_ prefix)          |
| `SCRAPERAPI_KEY`      | ScraperAPI key for Indeed scraping (proxy/anti-bot bypass)          |
| `TWOCAPTCHA_API_KEY`  | 2Captcha API key for Glassdoor Cloudflare Turnstile solving         |
| `PEXELS_API_KEY`      | Pexels API key for worker headshot photos (free tier: 200 req/hour) |


---

## Job Site Scrapers

Scrapers live in `src/scrapers/`. Common behavior:

- **Location format:** URL slug style `city-name-state` (e.g., `austin-tx`, `new-york-ny`)
- **Keyword search:** Generic "Retail" search to find all retail jobs
- **Filtering:** Results filtered by retailer name (fuzzy match) and location (city + state)
- **Role matching:** Job titles fuzzy-matched to roles from Supabase `roles` table
- **Pagination:** Up to `maxPages` pages scraped per search

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


### Glassdoor

`src/scrapers/glassdoor.ts` - NOPE! Scrape is ridiculous


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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Variants

Three UX variants exist under `web/src/pages/variants/`. Variant-specific logic (system prompts, flow trees, data structures) lives in each variant's MD file.


| Variant            | Docs                        | Focus                                          |
| ------------------ | --------------------------- | ---------------------------------------------- |
| V1: Job Focus      | CLAUDE-V1-JOB-FOCUS.md      | Linear chat flow to create job posting         |
| V2: Talent Centric | CLAUDE-V2-TALENT-CENTRIC.md | Browse Reflexers first, connect or book shifts |
| V3: Wildcard       | CLAUDE-V3-WILDCARD.md       | Experimental canvas                            |


**Switching variants:** Use the Layers icon button (bottom-right, next to dev menu)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Project Structure

```
matchpoint/
├── web/                           # React frontend (Vite) - ALL UI DEVELOPMENT HERE
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── ChatInterface.css
│   │   │   │   └── index.ts
│   │   │   ├── DevMenu/
│   │   │   │   ├── index.tsx            # Global dev menu (Bot, Oz, DSL)
│   │   │   │   └── DesignSystemPanel.tsx
│   │   │   ├── Jobs/
│   │   │   │   ├── PublishedJobCard.tsx
│   │   │   │   ├── PublishedJobCard.css
│   │   │   │   └── index.ts
│   │   │   ├── Layout/
│   │   │   │   ├── AppLayout.tsx        # Main layout wrapper
│   │   │   │   ├── AppLayout.css
│   │   │   │   ├── SideNav.tsx          # Left navigation
│   │   │   │   ├── SideNav.css
│   │   │   │   └── index.ts
│   │   │   ├── NavChips/
│   │   │   │   ├── NavChips.tsx         # Welcome/compact nav chips
│   │   │   │   ├── NavChips.css
│   │   │   │   └── index.ts
│   │   │   ├── OzPanel/
│   │   │   │   ├── OzPanel.tsx          # Oz admin panel
│   │   │   │   ├── styles.css
│   │   │   │   └── index.ts
│   │   │   ├── ScrapeModal/
│   │   │   │   ├── ScrapeModal.tsx
│   │   │   │   ├── ScrapeModal.css
│   │   │   │   └── index.ts
│   │   │   ├── ScrapeProgressModal/
│   │   │   │   ├── ScrapeProgressModal.tsx
│   │   │   │   ├── ScrapeProgressModal.css
│   │   │   │   └── index.ts
│   │   │   ├── UnmatchedRolesModal/
│   │   │   │   ├── UnmatchedRolesModal.tsx
│   │   │   │   ├── UnmatchedRolesModal.css
│   │   │   │   └── index.ts
│   │   │   ├── WorkerDataDrawer/
│   │   │   │   ├── WorkerDataDrawer.tsx # Raw worker data viewer
│   │   │   │   ├── WorkerDataDrawer.css
│   │   │   │   └── index.ts
│   │   │   └── Workers/
│   │   │       ├── WorkerCard.tsx       # Main card component
│   │   │       ├── WorkerCard.css
│   │   │       ├── WorkerCardCompact.tsx
│   │   │       ├── WorkerCardFull.tsx   # Detail overlay panel
│   │   │       ├── WorkerCardHeader.tsx # Shared header component
│   │   │       ├── WorkerCardTesting.tsx # Testing/debug card
│   │   │       ├── WorkerGrid.tsx
│   │   │       ├── WorkerGrid.css
│   │   │       ├── utils.ts
│   │   │       └── index.ts
│   │   ├── pages/
│   │   │   ├── PermanentHiring.tsx      # Variant router
│   │   │   ├── PermanentHiring.css
│   │   │   └── variants/
│   │   │       ├── V1JobFocus/
│   │   │       │   ├── index.tsx        # Full implementation
│   │   │       │   ├── styles.css
│   │   │       │   └── CLAUDE-V1-JOB-FOCUS.md
│   │   │       ├── V2TalentCentric/
│   │   │       │   ├── index.tsx
│   │   │       │   ├── V2NavFooter.tsx
│   │   │       │   ├── styles.css
│   │   │       │   └── CLAUDE-V2-TALENT-CENTRIC.md
│   │   │       └── V3Wildcard/
│   │   │           ├── index.tsx
│   │   │           ├── styles.css
│   │   │           └── CLAUDE-V3-WILDCARD.md
│   │   ├── services/
│   │   │   ├── gemini.ts                # Gemini API + data summaries + quick prompts
│   │   │   ├── workerMatching.ts        # Worker matching algorithm
│   │   │   └── supabase.ts              # Supabase client
│   │   ├── data/
│   │   │   ├── workers.ts               # Sample worker profiles
│   │   │   ├── retailer.ts              # Sample retailer data
│   │   │   └── ariatStores.ts           # Ariat store locations
│   │   ├── utils/
│   │   │   └── brandLogos.ts            # Brand logo utilities
│   │   ├── styles/
│   │   │   └── variables.css            # Design tokens
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript interfaces
│   │   ├── scripts/                     # Frontend data scripts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── images/
│   │       ├── wordmark.svg             # Reflex logo
│   │       ├── logomark.svg             # Collapsed logo
│   │       └── nav-background.svg       # Sidebar background
│   └── package.json
│
├── src/                               # Node.js backend (Express API)
│   ├── server.ts                      # Express server
│   ├── index.ts                       # Entry point
│   ├── matching.ts                    # Server-side matching
│   ├── types.ts                       # Shared types
│   ├── data.ts                        # Data utilities
│   └── scrapers/
│       ├── indeed.ts                  # Indeed job scraper
│       └── glassdoor.ts               # Glassdoor scraper (deprecated)
│
├── scripts/                           # Data cleanup & utility scripts
│   ├── clean-worker-data.ts           # Unified cleanup (see Useful Scripts)
│   ├── update-worker-photos-all.mjs   # Photo updates
│   └── ...                            # Various data scripts
│
├── assets/                            # Design library & brand assets
│   ├── design-library/
│   │   ├── primitive-variables.json   # Color primitives
│   │   └── semantic-variables.json    # Semantic tokens
│   └── retailers/
│       └── r001.json                  # Sample retailer data
│
├── x.reference/                       # Reference materials (don't modify)
├── .env                               # Environment variables (gitignored)
└── CLAUDE.md                          # This file (global)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Design System

Live reference: Palette icon button (bottom-right dev menu)
Definitions: `web/src/styles/variables.css`

**Border rule:** All borders use `--quaternary` unless explicitly specified otherwise. Never use `--black-alpha-`* or `rgba(0,0,0,*)` for borders.

### Colors


| Token                   | Hex     | Usage                               |
| ----------------------- | ------- | ----------------------------------- |
| `--primary`             | #3F3F46 | Text, interactive elements, strokes |
| `--secondary`           | #A1A1AA | Secondary text, hints               |
| `--tertiary`            | #D4D4D8 | Disabled states, light strokes      |
| `--quaternary`          | #E4E4E7 | Card borders, dividers              |
| `--white`               | #FFFFFF | Backgrounds                         |
| `--brand-pink`          | #ff9a9a | Brand accent                        |
| `--background-blue`     | #E0F1FC | Info backgrounds                    |
| `--background-gray`     | #E4E4E7 | Neutral backgrounds                 |
| `--background-green`    | #E6F6F3 | Success backgrounds                 |
| `--background-navy`     | #F4F6F7 | Light navy backgrounds              |
| `--background-pink`     | #FFE6E6 | Icon backgrounds                    |
| `--accent-navy-dark`    | #1E384A | Dark navy text/icons                |
| `--accent-navy-mid`     | #698192 | Mid navy text                       |
| `--accent-navy-light`   | #A9B7C1 | Light navy accents                  |
| `--accent-green-dark`   | #327A72 | Dark green text/icons               |
| `--accent-green-mid`    | #4BA098 | Success states, badges              |
| `--accent-green-light`  | #9DD9CF | Light green accents                 |
| `--accent-blue-dark`    | #2A5AA7 | Dark blue text/icons                |
| `--accent-blue-mid`     | #3B73CE | Selected states, links              |
| `--accent-blue-light`   | #90BBEF | Light blue accents                  |
| `--accent-yellow-dark`  | #E6A93B | Dark yellow text/icons              |
| `--accent-yellow-mid`   | #FFD07B | Warning states                      |
| `--accent-yellow-light` | #FFEED0 | Light yellow accents                |


### Typography Classes


| Class                     | Usage                                                         |
| ------------------------- | ------------------------------------------------------------- |
| `.type-tagline`           | Greeting headline ("Hey Sam...") - Quincy 36px/700            |
| `.type-prompt-question`   | AI prompts ("Where do you want to start?") - 20px/400 primary |
| `.type-section-header-lg` | Section titles large - 18px/700 primary                       |
| `.type-section-header-md` | Section titles medium - 16px/700 primary                      |
| `.type-section-header-sm` | Section titles small - 14px/700 primary                       |
| `.type-chip-header-lg`    | Chip header large - 16px/600 primary                          |
| `.type-chip-header-md`    | Chip header medium - 14px/600 primary                         |
| `.type-chip-header-sm`    | Chip header small - 12px/600 primary                          |
| `.type-chip-label-lg`     | Chip label large - 16px/400 primary                           |
| `.type-chip-label-md`     | Chip label medium - 14px/400 primary                          |
| `.type-body-lg`           | Body text large - 16px/400 primary                            |
| `.type-body-md`           | Body text medium - 14px/400 primary                           |
| `.type-body-sm`           | Body text small - 12px/400 primary                            |
| `.type-label-lg`          | Label large - 16px/500 primary                                |
| `.type-label-md`          | Label medium - 14px/500 primary                               |
| `.type-label-sm`          | Label small - 12px/500 primary                                |
| `.type-placeholder`       | Input placeholders - 16px/400 secondary                       |


**Type Style Usage:**

- Welcome nav chips (static): `.type-chip-header-lg`
- Conversational nav chips (compact): `.type-chip-header-md`
- Single-select message chips: `.type-chip-label-md`
- Multi-select message chips: `.type-chip-label-md`
- Role selector chips: `.type-chip-label-md`

### Components


| Component                       | Location          | Usage                              |
| ------------------------------- | ----------------- | ---------------------------------- |
| `NavChipGrid variant="welcome"` | NavChips.tsx      | Welcome screen 3x2 card grid       |
| `NavChipGrid variant="compact"` | NavChips.tsx      | Conversation nav bar               |
| `MessageChip` (single)          | ChatInterface.tsx | Single-select options with check   |
| `MessageChip` (multi)           | ChatInterface.tsx | Multi-select with plus/check icons |


**Shared states:** Hover/Active = `--app-primary` border + `--gray-50` background

### Text Inputs

All chat text inputs share these styles. Classes: `.welcome-input`, `.inline-input`, `.chat-input`, `.location-search-input`


| Property          | Value                                    |
| ----------------- | ---------------------------------------- |
| Background        | `--primary` (#3F3F46)                    |
| Placeholder color | `--secondary` (#A1A1AA)                  |
| Text color        | `--primary` (#3F3F46)                    |
| Border            | 1px `--quaternary`, radius `--radius-lg` |
| Focus             | border changes to `--blue-400`           |


### Worker Cards

Three variants with shared header component. All headers have avatar, name, and badges vertically centered (align-items: center).


| Variant             | Class                       | Specs                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorkerCardTeaser`  | `.worker-card-teaser`       | Minimal to entice. Header + "What retailers are saying about [Name]" AI summary. Label: `.type-section-header-sm`, Summary: 14px/400 primary, line-height 20px, Gap: 4px, No Actively Looking badge (`showActivelyLooking={false}`)                                                                                                                               |
| `WorkerCardCompact` | `.worker-card-compact`      | Chat view. Quote, work history, endorsements with +counts, store quotes                                                                                                                                                                                                                                                                                           |
| `WorkerCardFull`    | `.worker-card-full-overlay` | Detail panel. 35vw width, fixed right, close button (36px circle, primary bg, white X), Header: avatar + name stacked with location/shift verified, Section titles: 18px/700 primary (`.type-section-header`), Sections: 20px padding, 1px dividers, About: 16px primary (no italics), Stats: 28px bold + 12px labels. Clicking WorkerCardTeaser opens this panel |


**Shared Header:** `WorkerCardHeader` component


| Property | Value                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| Avatar   | 40px (default) or 64px (large via `size="large"`)                                                  |
| Name     | `.type-section-header-lg`                                                                          |
| Layout   | flex row, vertically centered; Shift Verified badge pushed to right via `margin-left: auto`        |
| Badges   | Shift Verified (green, right-aligned) - Actively Looking hidden on Teaser, visible on Compact/Full |
| Props    | `showActivelyLooking` (default `true`) - pass `false` on WorkerCardTeaser                          |



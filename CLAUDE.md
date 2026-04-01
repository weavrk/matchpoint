# Matchpoint

The dominant acquisition channels for retail hiring weren't built for retail talent and preference volume over fit. Reflex already has the workers, the relationships, and the performance data.

++**How might we build permanent hiring into Reflex and become the only platform retailers need for retail talent?**++

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Users / Personas

### Retailer

- Existing Reflex customers already booking flex/part-time workers
- Wants to hire permanent/full-time retail staff
- Browses matched worker profiles to build interest then publish
  > TBD: Pricing model (subscription, per-hire fee, tiered?)

### Worker

- **Shift Verified**: Existing Reflex workers with completed shifts. Carries a trust badge.
- **Waitlist / New**: Signed up but no shifts yet. Visible to retailers, no badge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Variants

Three UX variants exist under `web/src/pages/variants/`. Variant-specific logic (system prompts, flow trees, data structures) lives in each variant's MD file.

| Variant | Docs | Focus |
|---------|------|-------|
| V1: Job Focus | [CLAUDE-V1-JOB-FOCUS.md](web/src/pages/variants/V1JobFocus/CLAUDE-V1-JOB-FOCUS.md) | Linear chat flow to create job posting |
| V2: Talent Centric | [CLAUDE-V2-TALENT-CENTRIC.md](web/src/pages/variants/V2TalentCentric/CLAUDE-V2-TALENT-CENTRIC.md) | Browse Reflexers first, connect or book shifts |
| V3: Wildcard | [CLAUDE-V3-WILDCARD.md](web/src/pages/variants/V3Wildcard/CLAUDE-V3-WILDCARD.md) | Experimental canvas |

**Switching variants:** Use the Layers icon button (bottom-right, next to dev menu)




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tech Stack

- **Frontend:** React + TypeScript (Vite), located in `web/`
- **Backend:** Node.js + Express + TypeScript, located in `src/`
- **AI Provider:** Google AI Studio (Gemini)
- **Styling:** CSS (no framework) - **never use italics**
- **Icons:** Lucide React
- Github repo: [https://github.com/weavrk/matchpoint.git](https://github.com/weavrk/matchpoint.git)
- Supabase: [weavrk@gmail.com](mailto:weavrk@gmail.com)
  - project url: [https://kxfbismfpmjwvemfznvm.supabase.co](https://kxfbismfpmjwvemfznvm.supabase.co)
  - anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI
  - database connection: postgresql://postgres:[YOUR-PASSWORD]@db.kxfbismfpmjwvemfznvm.supabase.co:5432/postgres
  - password: reflexmatchpoint123
  - **Tables:**
    - `markets` - Geographic markets where Reflex operates (city, state). Used for job filtering.
    - `roles` - Job role types (title, category, description). Categories: Entry Level, Specialized, Management, Seasonal.
    - `retailers` - Retailer brands (name, classification). Classifications: Luxury, Mid, Big Box.
    - `job_postings` - Scraped job listings with retailer_id, market_id, role_id, source, salary info, benefits
    - `workers` - Worker profiles with JSONB columns for nested data (brands_worked, endorsements, previous_experience, etc.)
    - `jobs_published` - Published job postings (job_id, job_title, job_type, store_location, job_market, pay_type, pay_range, benefits, created_at, unpublished_at)
    - `jobs_applications` - Junction table for worker interactions with jobs (status: viewed/liked/applied/not_interested, invited: boolean)

## Environment Variables

Stored in `.env` (gitignored). Do NOT hardcode keys in source files.

```
GEMINI_API_KEY=your_key_here
SCRAPERAPI_KEY=your_key_here
TWOCAPTCHA_API_KEY=your_key_here
```

- **GEMINI_API_KEY** - Google AI Studio API key for Gemini chat
- **SCRAPERAPI_KEY** - ScraperAPI key for Indeed scraping (proxy/anti-bot bypass)
- **TWOCAPTCHA_API_KEY** - 2Captcha API key for Glassdoor Cloudflare Turnstile solving

## Job Site Scrapers

Scrapers live in `src/scrapers/`. Common behavior:

- **Location format:** URL slug style `city-name-state` (e.g., `austin-tx`, `new-york-ny`)
- **Keyword search:** Generic "Retail" search to find all retail jobs
- **Filtering:** Results filtered by retailer name (fuzzy match) and location (city + state)
- **Role matching:** Job titles fuzzy-matched to roles from Supabase `roles` table
- **Pagination:** Up to `maxPages` pages scraped per search

### ++Indeed (`src/scrapers/indeed.ts`)++

- **Proxy:** ScraperAPI for anti-bot bypass (`SCRAPERAPI_KEY`)
- **HTML Parsing:** Cheerio (extracts from embedded JSON `window.mosaic.providerData`)
- **Pagination:** `?start=0,10,20...` (10 jobs per page)
- **URL format:** `https://www.indeed.com/jobs?q=Retail&l=Austin,+TX`
- **Multi-pass scraping:** Runs 5 passes per market with varied sort/filter params to capture more results
  - Pass 1: Relevance sort, no date filter
  - Pass 2: Date sort
  - Pass 3: Relevance sort, last 7 days
  - Pass 4: Date sort, last 3 days
  - Pass 5: Relevance sort, last 14 days
- **Session rotation:** Each pass uses a unique session number for fresh results
- **Salary cleanup:** Spanish text auto-converted to English (e.g., "por hora" → "an hour")

### ++Glassdoor (`src/scrapers/glassdoor.ts`)- NOPE! Scrape is ridiculous++

- **Browser:** Puppeteer (headless Chrome)
- **CAPTCHA Bypass:** Session cookie injection from logged-in browser
- **HTML Parsing:** Cheerio after page load
- **Pagination:** `?p=1,2,3...`
- **URL format:** `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=Retail&locKeyword=AUSTIN,+TX`
- **Cookie Injection Setup:** The scraper loads cookies from `glassdoor-cookies.json` to bypass CAPTCHA. To refresh:
  1. Log into Glassdoor in Chrome
  2. Open DevTools Console (Cmd+Option+J)
  3. Run this command to export cookies:
    ```javascript
     JSON.stringify(document.cookie.split('; ').map(c => {
       const [name, ...v] = c.split('=');
       return { name, value: v.join('='), domain: '.glassdoor.com', path: '/' };
     }), null, 2)
    ```
  4. Copy the output and save to `glassdoor-cookies.json` in project root
  5. Cookies typically last a few days before needing refresh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Project Structure

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
│   │   │   ├── Layout/
│   │   │   │   ├── AppLayout.tsx        # Main layout wrapper
│   │   │   │   ├── AppLayout.css
│   │   │   │   ├── SideNav.tsx          # Left navigation
│   │   │   │   ├── SideNav.css
│   │   │   │   └── index.ts
│   │   │   └── Workers/
│   │   │       ├── WorkerCard.tsx
│   │   │       ├── WorkerCard.css
│   │   │       ├── WorkerGrid.tsx
│   │   │       ├── WorkerGrid.css
│   │   │       └── index.ts
│   │   ├── pages/
│   │   │   ├── PermanentHiring.tsx      # Variant router
│   │   │   ├── PermanentHiring.css
│   │   │   └── variants/
│   │   │       ├── V1JobFocus/
│   │   │       │   ├── index.tsx        # Full implementation
│   │   │       │   └── VARIANT.md       # V1-specific docs
│   │   │       ├── V2TalentCentric/
│   │   │       │   ├── index.tsx        # Placeholder
│   │   │       │   └── VARIANT.md       # V2-specific docs
│   │   │       └── V3Wildcard/
│   │   │           ├── index.tsx        # Placeholder
│   │   │           └── VARIANT.md       # V3-specific docs
│   │   ├── services/
│   │   │   ├── gemini.ts                # Gemini API + data summaries + quick prompts
│   │   │   ├── workerMatching.ts        # Worker matching algorithm
│   │   │   └── supabase.ts              # Supabase client
│   │   ├── data/
│   │   │   ├── workers.ts               # Sample worker profiles
│   │   │   └── retailer.ts              # Sample retailer data
│   │   ├── styles/
│   │   │   └── variables.css            # Design tokens (uses design-library/)
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── images/
│   │       ├── wordmark.svg             # Reflex logo (from assets/)
│   │       ├── logomark.svg             # Collapsed logo
│   │       └── nav-background.svg       # Sidebar background
│   └── package.json
│
├── src/                               # Node.js backend (Express API)
│   ├── server.ts                      # Express server
│   ├── index.ts                       # Entry point
│   ├── matching.ts                    # Server-side matching
│   ├── types.ts                       # Shared types
│   └── data.ts                        # Data utilities
│
├── assets/                            # Design library & brand assets
│   ├── design-library/
│   │   ├── primitive-variables.json   # Color primitives (gray, pink, etc.)
│   │   └── semantic-variables.json    # Semantic tokens (primary, accent, etc.)
│   ├── logo-and-backgrounds/
│   │   ├── wordmark.svg               # Reflex wordmark
│   │   ├── logo.svg                   # Reflex logo
│   │   └── background.svg             # Nav background pattern
│   ├── retailers/
│   │   └── r001.json                  # Sample retailer data
│   └── workers/
│       └── w001-w040.json             # 40 synthetic worker profiles
│
├── tests/
│   └── test-workers.html              # Worker card rendering test
│
├── x.reference/                       # Reference materials (don't modify)
├── .env                               # Environment variables (gitignored)
└── CLAUDE.md                          # This file (global)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Design System

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

All chat text inputs share these styles:

- **Background:** `--background-navy` (#F4F6F7)
- **Placeholder color:** `--secondary` (#A1A1AA)
- **Text color:** `--primary` (#3F3F46)
- **Border:** 1px `--quaternary`, radius `--radius-lg`
- **Focus:** border changes to `--blue-400`

Input classes: `.welcome-input`, `.inline-input`, `.chat-input`, `.location-search-input`

### Worker Cards

Three variants with shared header component. All headers have avatar, name, and badges vertically centered (align-items: center).


| Variant             | Class                       | Usage                                                                           |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| `WorkerCardTeaser`  | `.worker-card-teaser`       | Minimal to entice. Header + "What retailers are saying about [Name]" AI summary |
| `WorkerCardCompact` | `.worker-card-compact`      | Chat view. Quote, work history, endorsements with +counts, store quotes         |
| `WorkerCardFull`    | `.worker-card-full-overlay` | Detail panel. 60% width, fixed right, close button, all sections                |


**WorkerCardTeaser specs:**

- Label ("What retailers are saying about [Name]"): `.type-section-header-sm`
- Summary text: 14px/400 primary color, line-height 20px
- Gap between label and summary: 4px
- No Actively Looking badge (suppressed via `showActivelyLooking={false}`)

**Shared Header:** `WorkerCardHeader` component

- Avatar: 40px (default) or 64px (large via `size="large"`)
- Name: `.type-section-header-lg`
- Layout: flex row, vertically centered; Shift Verified badge pushed to right via `margin-left: auto`
- Badges: Shift Verified (green, right-aligned) - Actively Looking badge hidden on WorkerCardTeaser, visible on Compact and Full variants
- Props: `showActivelyLooking` (default `true`) - pass `false` on WorkerCardTeaser

**WorkerCardFull specs:**

- Position: inline right of chat, 35vw width
- Close button: sticky top-right, 36px circle, primary background with white X
- Header: avatar + name stacked with location/shift verified below, full-width divider
- Section titles: 18px/700 primary (`.type-section-header`)
- Sections: 20px padding, 1px dividers
- About: 16px primary font (no italics, no Quincy)
- Stats: 28px bold numbers with 12px labels
- Clicking WorkerCardTeaser opens WorkerCardFull panel


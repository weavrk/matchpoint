# Matchpoint

The dominant acquisition channels for retail hiring weren't built for retail talent and preference volume over fit. Reflex already has the workers, the relationships, and the performance data. 

++**How might we build permanent hiring into Reflex and become the only platform retailers need for retail talent?**++

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Users / Personas

### Retailer

- Existing Reflex customers already booking flex/part-time workers
- Wants to hire permanent/full-time retail staff
- Uses an AI chat flow to create and tune job postings
- Browses matched worker profiles to build interest then publish
  > TBD: Pricing model (subscription, per-hire fee, tiered?)

### Worker

- **Shift Verified**: Existing Reflex workers with completed shifts. Carries a trust badge.
- **Waitlist / New**: Signed up but no shifts yet. Visible to retailers, no badge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Core Flow

1. Retailer navigates to permanent hiring section
2. AI chat (Gemini) guides retailer to define job parameters (market, experience type, FT/PT, etc.)
  - Conversational back-and-forth, not a form
  - Acts as a tuning partner, not a filter
  - Output drives: matching algorithm, job details card shown to workers, retailer profile details
  - Wired to real Gemini API
    > TBD: Full question flow and prompt design
    >
    > - What's the minimum hourly rate we can set for this market?
    > - What would a seasoned sales associate be offered at comparable brands?
    > - What's the difference in qualified workers looking for part-time vs full-time?
3. Retailer sees matched worker profiles in a results grid
  - **Worker profile fields**:
    - Name, photo
    - Shift Verified badge (if applicable)
    - Shifts on Reflex count
    - Brands worked (apparel/footwear — mid, elevated, or luxury)
    - Market (all NYC for prototype)
    - FT/PT preference (varies per worker)
    - Retailer endorsements (variable per worker — not every shift hits all):
      - 🗨 Customer Engagement
      - ✦ Self-Starter
      - ☑ Preparedness
      - 👥 Perfect Attire
      - ⏱ Work Pace
      - 📈 Productivity
      - ⊙ Attention to Detail
      - 👥 Team Player
      - ☺ Positive Attitude
      - ⚡ Adaptable
    - Reliability: On-time rating (Exceptional or null)
    - Commitment score (Exceptional or null)
    - "Invited back" with store count (e.g., "Invited back: 12 stores")
    - About: 2-3 sentences — retail experience, retailer feedback summary
    - Previous retail experience: company, duration, roles
    - Work style: role preferences, traits (self-directed, task switching, pace, focus, direction needs, physical activity)
  - **Simulated data (prototype)**: 40 synthetic worker profiles
    - Some workers have 0 shifts (waitlist), others have 24+ shifts (Shift Verified = true)
  - **Ranking**:
    - Shift Verified workers shown first
    - Ranking algorithm to be tuned later
      > TBD: Ranking signals beyond Shift Verified
4. Retailer publishes the job
5. Workers see the posting and can: like, view (👁), or express interest
  - **Retailer profile** (enriched from existing Reflex data, not self-reported):
    - Star rating from workers who have flexed there
    - "Would work there again" signal from past Reflex workers
    - Number of flexes worked at that location
    - Brand name, market/location
  - **Worker interest**:
    - Interact with job postings via: like, 👁 view, or express interest
    - Worker-side experience lives in the Worker App (deferred)
      > TBD: Worker interest board — build or stay manual?
6. **Reflex Manual step** — Reflex team manually filters interested workers, builds a contacts list for the retailer
  > TBD: Does retailer see live interest feed or only Reflex-curated shortlist?
7. Retailer ↔ worker communication happens off-platform (phone, email)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tech Stack

- **Frontend:** React + TypeScript (Vite) — located in `web/`
- **Backend:** Node.js + Express + TypeScript — located in `src/`
- **AI Provider:** Google AI Studio (Gemini)
- **Styling:** CSS (no framework)
- **Icons:** Lucide React
- Github repro: [https://github.com/weavrk/matchpoint.git](https://github.com/weavrk/matchpoint.git)
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
├── web/                           # React frontend (Vite) ← ALL UI DEVELOPMENT HERE
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── ChatInterface.css
│   │   │   │   └── index.ts
│   │   │   ├── Layout/
│   │   │   │   ├── AppLayout.tsx      # Main layout wrapper
│   │   │   │   ├── AppLayout.css
│   │   │   │   ├── SideNav.tsx        # Left navigation
│   │   │   │   ├── SideNav.css
│   │   │   │   └── index.ts
│   │   │   └── Workers/
│   │   │       ├── WorkerCard.tsx
│   │   │       ├── WorkerCard.css
│   │   │       ├── WorkerGrid.tsx
│   │   │       ├── WorkerGrid.css
│   │   │       └── index.ts
│   │   ├── pages/
│   │   │   ├── PermanentHiring.tsx    # Main talent portal page
│   │   │   └── PermanentHiring.css
│   │   ├── services/
│   │   │   ├── gemini.ts              # Gemini API + data summaries + quick prompts
│   │   │   ├── workerMatching.ts      # Worker matching algorithm
│   │   │   └── supabase.ts            # Supabase client
│   │   ├── data/
│   │   │   ├── workers.ts             # Sample worker profiles
│   │   │   └── retailer.ts            # Sample retailer data
│   │   ├── styles/
│   │   │   └── variables.css          # Design tokens (uses design-library/)
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── images/
│   │       ├── wordmark.svg           # Reflex logo (from assets/)
│   │       ├── logomark.svg           # Collapsed logo
│   │       └── nav-background.svg     # Sidebar background
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
└── CLAUDE.md                          # This file
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Chat Model and Interface

For our prototype, assume you are in Austin and the brand is Ariat. Your name is Mike Meyers. You're a district manager and have been on Reflex for 5 years. You haven't created a job posting yet, this is your first time using Talent Connect.

### 1. Data Foundation

- ++**Role Groupings**++ — When querying salary data, pull from the entire group and present ranges.

  | Group         | Primary Role                         | Also Includes                                                                             |
  | ------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
  | Sales Floor   | Sales Associate / Retail Associate   | Store Associate                                                                           |
  | Sales Support | Cashier                              | Sales Assistant, Fitting Room Attendant, Team Member, Retail Customer Service             |
  | Back of House | Stock Associate / Stocker            | Inventory Associate, Operations Associate                                                 |
  | Specialized   | Beauty Advisor / Cosmetics Associate | Stylist, Visual Merchandiser, Pop Up                                                      |
  | Management    | Store Manager                        | Store Team Leader, Supervisor, Key Holder, Department Supervisor, Assistant Store Manager |
  | Regional      | District / Area Manager              | —                                                                                         |

  - **Management exception:** Query the specific role asked, then list other management roles separately.
  - **Example:** "Store Managers in Atlanta at Luxury retailers are earning $65k-85k. In the same market, here are salaries for other management roles: Assistant Store Manager: $45k-55k, Department Supervisor: $38k-48k, Key Holder / Lead Associate: $18-22/hr"
- ++**Retailer Classification**++ — User's brand classification is known from login. Filter salary data to same classification.
  - Classifications: Luxury, Specialty, Big Box
  - Show: "Based on [X] similar [Luxury/Specialty/Big Box] retailers in [Market]..."
  - Example: If user is logged in as Gucci (Luxury), show salary data from other Luxury retailers, not from Target or Gap.
- ++**Market Context**++ — When presenting salary data, show:
  - Specific market data - The range for the market they're hiring in
  - Related role ranges - Salary ranges for related roles in same category
  - National comparison - How this market compares to national average
  - **Example:** "The range for Atlanta is $20-$24 per hour for Sales Associates at similar Luxury retailers. Sales Support roles are roughly $16-18 an hour. Atlanta is a little lower than the national average for Sales Associates which is $22-26 for Luxury brands."
- ++**Data Summary Generator**++ — Functions in `web/src/services/gemini.ts`:
  - `generateSalarySummary(roleId?, marketId?, retailerClass?)` — Returns structured salary data grouped by role/market/class
  - `getMarketSummaryText(market, retailerClass, role?)` — Returns human-readable text for AI injection
  - `getGroupedSalarySummary(role, market, retailerClass)` — Aggregates related roles + national average
  - **Example output:** "Austin Luxury retailers:\nSales Associate: $18-24/hr (8 postings)\nStore Manager: $55k-75k (3 postings)"

### 2. System Prompt

Located in `web/src/services/gemini.ts` as `SYSTEM_PROMPT`.

- **Persona:** Hiring advisor for Reflex
- **Context injection:** `{{USER_NAME}}`, `{{RETAILER_NAME}}`, `{{RETAILER_CLASS}}`, `{{MARKET}}` replaced at runtime
- **Role categories:** Defines groupings for salary comparisons
- **Response rules:**
  - Salary questions: Show market range, related roles, national comparison
  - Management: Query specific role, list others separately
  - Job posting: Guide through role → FT/PT → salary → requirements
- **Guardrails:** Stay concise, use real data, don't make up numbers



- **Welcome Screen:** Centered initial view before conversation starts
  - Headline: "Hey {firstname}, let's connect you with retail talent"
  - Input box with "Ask anything..." placeholder
  - **Quick-select chips** inside input container:
    - "Create a job posting" → starts job posting flow
    - "Explore {market} market" → shows market salary data
    - "Explore another market" → lets user pick different market
    - "Tell me how Talent Connect works" → explains the product
  - Variables `{firstname}` and `{market}` injected from props
  - Export: `GREETING_CHIPS` in `gemini.ts`
  - After first message, transitions to conversation view


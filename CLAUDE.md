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
    - Brands worked (apparel/footwear: mid, elevated, or luxury)
    - Market (all NYC for prototype)
    - FT/PT preference (varies per worker)
    - Retailer endorsements (variable per worker, not every shift hits all):
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
    - About: 2-3 sentences (retail experience, retailer feedback summary)
    - Previous retail experience: company, duration, roles
    - Work style: role preferences, traits (self-directed, task switching, pace, focus, direction needs, physical activity)
  - **Simulated data (prototype)**: 40 synthetic worker profiles
    - Some workers have 0 shifts (waitlist), others have 24+ shifts (Shift Verified = true)
  - **Ranking**:
    - Shift Verified workers shown first
    - Ranking algorithm to be tuned later
      > TBD: Ranking signals beyond Shift Verified
4. Retailer publishes the job
  - Job appears in "Published Jobs" tab with engagement metrics (views, likes, applications)
  - Each job card shows: role, pay, market, employment type, traits, benefits
  - Expandable candidate list shows all invited Reflexers with status
  - Candidate statuses: invited → viewed → interested → applied
  - Flow stops at "applied" - Reflex coordinates shortlist manually
  - "Reflex is coordinating a shortlist of applicants for you to review" banner shown when applicants exist
5. Workers see the posting and can: like, view (👁), or express interest
  - **Retailer profile** (enriched from existing Reflex data, not self-reported):
    - Star rating from workers who have flexed there
    - "Would work there again" signal from past Reflex workers
    - Number of flexes worked at that location
    - Brand name, market/location
  - **Worker interest**:
    - Interact with job postings via: like, 👁 view, or express interest
    - Worker-side experience lives in the Worker App (deferred)
      > TBD: Worker interest board (build or stay manual?)
6. **Reflex Manual step**: Reflex team manually filters interested workers, builds a contacts list for the retailer
  > TBD: Does retailer see live interest feed or only Reflex-curated shortlist?
7. Retailer ↔ worker communication happens off-platform (phone, email)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tech Stack

- **Frontend:** React + TypeScript (Vite), located in `web/`
- **Backend:** Node.js + Express + TypeScript, located in `src/`
- **AI Provider:** Google AI Studio (Gemini)
- **Styling:** CSS (no framework) - **never use italics**
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

- ++**Role Groupings**++: When querying salary data, pull from the entire group and present ranges.

  | Group         | Primary Role                         | Also Includes                                                                             |
  | ------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
  | Sales Floor   | Sales Associate / Retail Associate   | Store Associate                                                                           |
  | Sales Support | Cashier                              | Sales Assistant, Fitting Room Attendant, Team Member, Retail Customer Service             |
  | Back of House | Stock Associate / Stocker            | Inventory Associate, Operations Associate                                                 |
  | Specialized   | Beauty Advisor / Cosmetics Associate | Stylist, Visual Merchandiser, Pop Up                                                      |
  | Management    | Store Manager                        | Store Team Leader, Supervisor, Key Holder, Department Supervisor, Assistant Store Manager |
  | Regional      | District / Area Manager              | (none)                                                                                    |

  - **Management exception:** Query the specific role asked, then list other management roles separately.
  - **Example:** "Store Managers in Atlanta at Luxury retailers are earning $65k-85k. In the same market, here are salaries for other management roles: Assistant Store Manager: $45k-55k, Department Supervisor: $38k-48k, Key Holder / Lead Associate: $18-22/hr"
- ++**Retailer Classification**++: User's brand classification is known from login. Filter salary data to same classification.
  - Classifications: Luxury, Specialty, Big Box
  - Show: "Based on [X] similar [Luxury/Specialty/Big Box] retailers in [Market]..."
  - Example: If user is logged in as Gucci (Luxury), show salary data from other Luxury retailers, not from Target or Gap.
- ++**Market Context**++: When presenting salary data, show:
  - Specific market data - The range for the market they're hiring in
  - Related role ranges - Salary ranges for related roles in same category
  - National comparison - How this market compares to national average
  - **Example:** "The range for Atlanta is $20-$24 per hour for Sales Associates at similar Luxury retailers. Sales Support roles are roughly $16-18 an hour. Atlanta is a little lower than the national average for Sales Associates which is $22-26 for Luxury brands."
- ++**Data Summary Generator**++: Functions in `web/src/services/gemini.ts`:
  - `generateSalarySummary(roleId?, marketId?, retailerClass?)`: Returns structured salary data grouped by role/market/class
  - `getMarketSummaryText(market, retailerClass, role?)`: Returns human-readable text for AI injection
  - `getGroupedSalarySummary(role, market, retailerClass)`: Aggregates related roles + national average
  - **Example output:** "Austin Luxury retailers:\nSales Associate: $18-24/hr (8 postings)\nStore Manager: $55k-75k (3 postings)"

### 2. System Prompt

Located in `web/src/services/gemini.ts` as `SYSTEM_PROMPT`.

- **Persona:** Hiring advisor for Reflex
- **Context injection:** `{{USER_NAME}}`, `{{RETAILER_NAME}}`, `{{RETAILER_CLASS}}`, `{{MARKET}}` replaced at runtime
- **Role categories:** Defines groupings for salary comparisons
- **Response rules:**
  - Salary questions: Show market range, related roles, national comparison
  - Management: Query specific role, list others separately
  - Job posting: START WITH SITUATION → role (if replacing, ask about previous person) → FT/PT → salary → benefits/requirements → show matches
- **Guardrails:** Stay concise, use real data, don't make up numbers, never use em dashes
- **CRITICAL: One question per message** - Never combine multiple questions. Ask role first, wait for response, THEN ask about performance. Each step = separate message.
- **Markdown:** Gemini responses render as markdown in the chat UI (react-markdown). Use markdown formatting for readability (bold, lists, headers).
- Styling
  - **Chips/Quick Prompts:** All chip buttons use 14px font size.
  - **Single-select Chips:** Follow-up style with vertical list layout, arrow prefix (↳), transparent background, subtle border separators, 6px vertical padding. Click sends immediately.
  - **Multi-select Chips:** Triggered by prompts containing "Pick the top 2-3" or similar. Horizontal pill layout with wrap. Default: white background + primary stroke. Selected: blue-100 background + blue-700 text + Lucide Check icon. Send button enabled when 1+ selected.
  - **Inline Input:** Text input area appears below chips in the last assistant message (not at bottom of chat). 72px height, gray-50 background, includes send button.

### 3. Special JSON Message Formats

The chat interface parses special JSON blocks from Gemini responses to render custom UI components:


| Format                                                    | Purpose                              | Component                     |
| --------------------------------------------------------- | ------------------------------------ | ----------------------------- |
| `---WORKER_CARDS_START---[...]---WORKER_CARDS_END---`     | Display worker profile cards         | WorkerCardComponent           |
| `---ROLE_SELECTOR_START---{...}---ROLE_SELECTOR_END---`   | 5-column role picker grid            | RoleSelectorComponent         |
| `---JOB_SUMMARY_START---{...}---JOB_SUMMARY_END---`       | Job posting preview card             | JobSummaryCard                |
| `---SUCCESS_BANNER_START---{...}---SUCCESS_BANNER_END---` | Celebration milestone banner         | SuccessBannerComponent        |
| `---JOB_SPEC_START---{...}---JOB_SPEC_END---`             | Job specification (triggers publish) | Parsed by PermanentHiring.tsx |


**SUCCESS_BANNER format:**

```json
{"title": "Job Published!", "subtitle": "Your posting is now live"}
```

Displays a teal/green gradient banner with party popper icon and animated confetti.

**JOB_SPEC format:**

```json
{"title": "...", "market": "...", "employmentType": "FT|PT|Both", "salaryRange": "...", "salaryType": "hourly|salary", "requirements": [...], "benefits": [...], "description": "...", "idealTraits": [...]}
```

When detected, triggers `publishJob()` in PermanentHiring.tsx to add job to Published Jobs tab.

### 4. Chat Prompt-Response Logic Tree

```
[Welcome Screen]
│   Headline: "Hey {{USER_NAME}}, let's connect you with retail talent"
│   Input box placeholder: "You can create a job posting or explore the {{MARKET}} market..."
│   Chips: GREETING_CHIPS from gemini.ts
│
├── "Fill a role at my store" (Guided Scenario Flow)
│   └── [Step 1: SITUATION] ← Start here! Understanding WHY surfaces better matches
│       │   "Sounds good, what's driving {{RETAILER_NAME}} to search for new talent right now?"
│       │   Chips (with full descriptive text):
│       │     [Growing: we're busy, need more help]
│       │     [Replacing: someone left, need to fill]
│       │     [Seasonal: holiday rush is coming]
│       │     [Specialized: need specific skills]
│       │     [Just exploring]
│       │
│       └── [Step 2: Role Type] ← SEPARATE MESSAGE (for ALL situations)
│           │   "What job title are you looking for? Select below or enter your own title"
│           │   Shows ROLE_SELECTOR (single-select) with 5 columns:
│           │   Sales Floor, Sales Support, Back of House, Specialized, Management
│           │
│           └── [Step 3: Talent Preview] ← Shows 4 worker cards in 2x2 grid
│               │   "{{MARKET}} has Reflexers with previous [role] experience."
│               │   "Keep building a job description and we can invite them to apply."
│               │
│               │   Worker card variants:
│               │
│               │   FULL CARD (Step 3 talent preview, Meet talent flow):
│               │   1. Header (reusable): [Photo Avatar] Name | "✓ Shift Verified" tag (upper right)
│               │   2. About Me: Worker's personal quote
│               │   3. Work History: company · role · duration (list)
│               │   4. Endorsements: Pill tags (icon + label + count)
│               │   5. What stores say: Quote lines with source
│               │
│               │   COMPACT CARD (Step 10 candidate list):
│               │   1. Header (reusable): [Photo Avatar] Name | "✓ Shift Verified" tag
│               │   2. What stores say: Single quote line with source
│               │   Set compact: true in JSON to use this variant
│               │
│               │   Worker card JSON fields:
│               │   - name, photo (Unsplash URL), shiftVerified
│               │   - compact (boolean, optional - if true, shows only header + store quotes)
│               │   - aboutMe (worker's own quote)
│               │   - workHistory[{company, role, duration}]
│               │   - endorsements[{label, count, icon}]
│               │   - storeQuotes[{text, source}]
│               │   (Uses ---WORKER_CARDS_START--- JSON format)
│               │
│               │   Implementation: PermanentHiring.tsx splits responses containing
│               │   WORKER_CARDS into two messages - cards first, then follow-up after 800ms
│               │
│               └── [Step 4: Desired Traits] ← SEPARATE MESSAGE (auto-sent after cards)
│                   │   "What positive traits should we look for in a new candidate?
│                   │    You can also type out qualities you're looking for."
│                   │   Chips: [Customer Engagement] [Self-Starter] [Preparedness]
│                   │          [Perfect Attire] [Work Pace] [Productivity]
│                   │          [Attention to Detail] [Team Player] [Positive Attitude] [Adaptable]
│                   │
│                   └── [Step 5: Compensation] ← SEPARATE MESSAGE with market data
│                       │   "Based on the {{MARKET}} market, the average hourly rate for a [role]
│                       │    is $X-Y/hr, which is [higher/lower] than the national average.
│                       │    What hourly rate do you want for this job?"
│                       │   Chips: [$18-20/hr] [$20-22/hr] [$22-24/hr]
│                       │
│                       └── [Step 6: Employment Type] ← SEPARATE MESSAGE
│                           │   "Would this be full-time or part-time?"
│                           │   Chips: [Full-time] [Part-time] [Open to either]
│                           │
│                           └── [Step 7: Benefits] ← SEPARATE MESSAGE
│                               │   "Do you want to include any other details to the published job?"
│                               │   "Select all that apply:"
│                               │   Chips: [Health insurance] [401(k) matching] [Vision insurance]
│                               │          [Dental insurance] [Paid holidays] [Employee discount]
│                               │          [Flexible scheduling] [Growth path] [Paid time off]
│                               │
│                               └── [Step 8: Job Posting Summary & Confirmation]
│                                   │   Shows JOB_SUMMARY card with role, employmentType, market, pay, traits, benefits
│                                   │   "Here's what your posting looks like. Does this look right?"
│                                   │   Chips: [Looks good, publish it] [Change the role]
│                                   │          [Adjust compensation] [Edit benefits]
│                                   │
│                                   └── [Step 9: Publish Success] ← SUCCESS_BANNER only
│                                       │   First outputs JOB_SPEC JSON (triggers Published Jobs update)
│                                       │   Then shows SUCCESS_BANNER: {"title": "Job Published!", "subtitle": "Your posting is now live"}
│                                       │   "Success! Your job is published. Reflexers can view this posting and apply.
│                                       │    Our team will pull together a shortlist of candidates for you to review.
│                                       │    You can also review qualified candidates and invite them directly. Want to invite Reflexers?"
│                                       │   Chips: [Yes, show me candidates] [No, I'm done for now]
│                                       │
│                                       └── [Step 10: Show Candidates] ← ONLY if user clicks "Yes, show me candidates"
│                                           │   "Here are qualified Reflexers with previous [role] experience:"
│                                           │   Display 6 COMPACT worker cards (header + store quotes only):
│                                           │   - Uses compact: true flag in JSON
│                                           │   - Card layout: avatar + name + verified tag + single store quote
│                                           │   - Different workers than Step 3: Elena R., David K., Aisha M., Chris T., Maya L., Tyler B.
│                                           │   Chips: [Invite all 6] [Show me more candidates] [I'm done for now]
│
├── "Meet {{MARKET}} talent" (Worker Story Narrative Flow)
│   └── [Step 1: Confirm Market]
│       │   "Want to meet talent in {{MARKET}}, or a different location?"
│       │   Chips: [Yes, {{MARKET}}] [Different location]
│       │
│       └── [Step 2: Worker Stories] ← Lead with humanity, not stats
│           │   "Here are some standouts looking for permanent roles in {{MARKET}}:"
│           │   Shows 3 worker cards (same format as Step 3 in Fill a role flow)
│           │
│           │   Worker card fields: name, photo, shiftVerified, aboutMe,
│           │   workHistory[], endorsements[], storeQuotes[]
│           │
│           │   "To connect with these Reflexers, create a job posting and we'll invite them to apply."
│           │   Chips: [Create a job posting] [See more talent] [Explore a different market]
│           │
│           └── [Step 3: Create Job Posting]
│               │   When user clicks "Create a job posting", redirect to Fill a role flow
│               │   "Great! Let's build a job posting together."
│               │   → Continue with Step 1 of Fill a role (Situation question)
│
├── "Explore {{MARKET}} market"
│   └── [Market Salary Data]
│       ├── Show salary ranges by role group for {{RETAILER_CLASS}}
│       │   ├── Sales Floor: $X-Y/hr (based on N postings)
│       │   ├── Management: $X-Yk
│       │   └── etc.
│       ├── Compare to national average
│       └── Offer follow-ups:
│           ├── "Want to see a specific role?"
│           └── "Ready to fill a role?"
│
├── "Explore another market"
│   └── [Market Picker]
│       │   "Which market would you like to explore?"
│       │   List available Reflex markets
│       └── User selects → same flow as "Explore {{MARKET}}"
│
└── "Tell me how Talent Connect works"
    └── [Product Explainer]: In this order:
        │
        ├── 1. What it is:
        │   "Talent Connect is a resource to explore markets, talent in your
        │   area, and connect with interested workers for permanent positions."
        │
        ├── 2. What makes it different (Value Prop):
        │   "Unlike traditional job boards, every worker here has real performance
        │   data from Reflex shifts: verified reliability scores, store endorsements,
        │   and brands they've worked with. You're not screening resumes, you're
        │   seeing proven retail talent."
        │
        ├── 3. How it works:
        │   "We work together to narrow down published jobs by tuning based on
        │   market data and worker interest. I can help you fine-tune your salary
        │   ranges, employment type, and role descriptions to reach the best
        │   possible pool of highly qualified candidates. We're not an ATS system.
        │   We're an early acquisition resource for your team."
        │
        └── 4. Ready to get started?
            │   Surface the same chips from static greeting:
            └── [Fill a role] [Meet {{MARKET}} talent]
                [Explore {{MARKET}} market] [Explore another market]
```



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## User Interface

### Color Theme
Primary interactive color is **primary** (`--primary`, stone-700 #3f3f46).
- **Stroke/Border (interactive):** `--primary` (#3f3f46)
- **Background (hover/selected):** `--stone-50` (#fafafa)
- **Text (interactive):** `--primary` (#3f3f46)
- **Icon backgrounds:** `--background-pink` (#ffe6e6) with `--primary` icon color

### Welcome Screen (Static Greeting)
Layout reference: Jack & Jill card grid pattern

**Structure:**
1. **Greeting headline**: "Hey {name}, let's connect with retail talent in your area."
2. **Card container** (white bg, shadow): Contains header text, card grid, and input
3. **Header text**: "Where do you want to start?" (with border-bottom separator)
4. **Card grid** (3 columns x 2 rows): Each card has icon, title, description
5. **Input area below cards**: text input + send button in flex-row parent

**Card grid specs:**
- Grid: 3 columns, gap 16px (responsive: 2 cols at 800px, 1 col at 500px)
- Card: white bg, 1px border `--black-alpha-100`, border-radius 12px, padding 24px 16px
- Hover: `--primary` border, subtle box-shadow
- Icon: 48px circle with `--background-pink` background, icon in `--primary`
- Title: 16px, font-weight 600, `--text-primary`

**Welcome screen cards:**
| ID | Icon | Title |
|----|------|-------|
| fill-role | UserSearch | Fill a role at my store |
| meet-talent | Users | Meet {market} talent |
| explore-market | SearchCheck | Explore market comps |
| check-jobs | MapPin | Check on jobs |
| how-it-works | HelpCircle | What is Talent Connect? |
| just-exploring | Compass | Just exploring |

### Chips Styling
All chip buttons use 14px font size.

**Single-select (follow-up responses):**
- Vertical list layout
- Arrow prefix (↳)
- Transparent background
- Subtle border separators
- 6px vertical padding
- Click sends immediately

**Multi-select (traits, benefits):**
- Triggered by: "Pick the top 2-3", "select all that apply", "positive traits"
- Horizontal pill layout with wrap
- Default: white bg + `--primary` stroke
- Selected: `--stone-50` bg + `--primary` text + Lucide Check icon
- Send button enabled when 1+ selected

### Inline Input
- Appears below chips in last assistant message
- 72px height, `--gray-50` background
- Includes send button in flex-row

IGNORE ANYTHING BELOW THIS

### Design Notes (from PROMPT-ARCHITECTURE.md)

- **#5 Guided Scenario**: Implemented. "Fill a role" starts with SITUATION
- **#10 Worker Stories**: Implemented. "Meet {{MARKET}} talent" leads with worker narratives
- **#7 Hot List**: Future. Proactive "13 new workers available this week" alerts
- **#8 Competitive Intel**: Could enhance "Explore market" with competitor posting data
- **#9 Team Composition**: Could add team gap analysis before posting

Other things to field if asked  

EXAMPLE 1:
User: I need to hire someone
Assistant: Happy to help! What city or market are you hiring in?
User: Atlanta
Assistant: Got it, Atlanta. What role are you looking to fill?
User: Store manager
Assistant: Store manager in Atlanta. Based on current market data, store managers there are earning $55,000-70,000. Is this a full-time position?

EXAMPLE 2:
User: What should I pay a cashier in Austin?
Assistant: Based on 12 recent job postings in Austin, cashiers are being offered $14-17/hour. Want me to help you create a posting?
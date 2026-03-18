# Matchpoint

The dominant acquisition channels for retail hiring weren't built for retail talent and preference volume over fit. Reflex already has the workers, the relationships, and the performance data. 

++**How might we build permanent hiring into Reflex and become the only platform retailers need for retail talent?**++

> Product name TBD. Working name: Matchpoint.

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

## Tech Stack

- **Frontend:** React + TypeScript (Vite) — located in `web/`
- **Backend:** Node.js + Express + TypeScript — located in `src/`
- **AI Provider:** Google AI Studio (Gemini)
- **Styling:** CSS (no framework)
- **Icons:** Lucide React
- Github repro: [https://github.com/weavrk/matchpoint.git](https://github.com/weavrk/matchpoint.git)

**IMPORTANT:** All UI development happens in the React app (`web/`). The `public/index.html` file is legacy/deprecated — do not use it.

## Project Structure

```
matchpoint/
├── web/              # React frontend (Vite) ← PRIMARY UI
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── data/         # Mock data
│   │   └── styles/       # CSS variables
│   └── package.json
├── src/              # Node.js backend (Express API)
├── public/           # DEPRECATED — do not use
├── x.reference/      # Reference materials
├── .env              # Environment variables (gitignored — do NOT commit)
└── CLAUDE.md         # This file
```

## Environment Variables

Stored in `.env` (gitignored). Do NOT hardcode keys in source files or this document.

```
GEMINI_API_KEY=your_key_here
```

## Scripts

### Frontend (web/)

- `npm run dev` - Start Vite dev server (default: [http://localhost:5173](http://localhost:5173))
- `npm run build` - Build for production

### Backend (root)

- `npm start` - Run Express server with ts-node ([http://localhost:3000](http://localhost:3000))
- `npm run build` - Compile TypeScript to JavaScript

## Market Comparables

### Market

### Job Sites

#### General Job Boards

- **Indeed** - Largest job board, strong for hourly/retail roles
- **ZipRecruiter** - AI matching, good retail coverage
- **LinkedIn** - Better for management/supervisor roles
- **Glassdoor** - Job postings + salary data
- **CareerBuilder** - General board with retail category

#### Retail-Specific

- **AllRetailJobs.com** - Dedicated retail job board
- **RetailJobsWeb.com** - Retail-focused, management + hourly
- **RetailCareersNow** - Retail industry specific

#### Hourly / Shift-Based

- **Snagajob** - Built for hourly work, pre-screens availability
- **Wonolo** - On-demand staffing, retail/warehouse
- **Instawork** - Gig-style retail/hospitality shifts

### Job Roles

#### Entry-Level Positions

- **Sales Associate / Retail Associate** - Customer service, sales floor support, POS transactions
- **Cashier** - Checkout operations, handling payments
- **Stock Associate / Stocker** - Receiving, organizing, replenishing inventory
- **Fitting Room Attendant** - Managing dressing rooms, returning items to floor

#### Specialized Roles

- **Visual Merchandiser** - Displays, store layout, product presentation
- **Inventory Specialist** - Stock counts, inventory management systems
- **Beauty Advisor / Cosmetics Associate** - Product expertise, demos (Sephora, Ulta, department stores)

#### Supervisory / Management

- **Key Holder / Lead Associate** - Opening/closing, shift supervision
- **Department Supervisor** - Oversees specific section (shoes, menswear, etc.)
- **Assistant Store Manager** - Operations support, staff scheduling
- **Store Manager** - Full P&L responsibility, hiring, performance
- **District / Area Manager** - Multi-store oversight

#### Seasonal / Part-Time Focus

- **Holiday Seasonal Associate** - Temp positions for peak seasons
- **Weekend Associate** - Dedicated weekend availability
- **Early Morning Stocker** - Pre-open inventory work


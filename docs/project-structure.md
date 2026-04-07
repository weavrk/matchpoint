# Project Structure

```
matchpoint/
├── web/                           # React frontend (Vite) — ALL UI DEVELOPMENT HERE
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/              # ChatInterface
│   │   │   ├── DevMenu/           # Dev menu (Bot, Oz, DSL) + DesignSystemPanel
│   │   │   ├── Jobs/              # PublishedJobCard
│   │   │   ├── Layout/            # AppLayout, SideNav
│   │   │   ├── NavChips/          # Welcome/compact nav chips
│   │   │   ├── OzPanel/           # Oz admin panel
│   │   │   ├── ScrapeModal/
│   │   │   ├── ScrapeProgressModal/
│   │   │   ├── UnmatchedRolesModal/
│   │   │   ├── WorkerDataDrawer/  # Raw worker data viewer
│   │   │   └── Workers/           # WorkerCard, WorkerCardCompact, WorkerCardFull, WorkerCardHeader, WorkerGrid
│   │   ├── pages/
│   │   │   ├── PermanentHiring.tsx  # Variant router
│   │   │   └── variants/
│   │   │       ├── V1JobFocus/      # index.tsx, styles.css, CLAUDE-V1-JOB-FOCUS.md
│   │   │       ├── V2TalentCentric/ # index.tsx, V2NavFooter.tsx, styles.css
│   │   │       └── V3Wildcard/      # index.tsx, styles.css, CLAUDE-V3-WILDCARD.md
│   │   ├── services/
│   │   │   ├── gemini.ts            # Gemini API + data summaries + quick prompts
│   │   │   ├── workerMatching.ts    # Worker matching algorithm
│   │   │   └── supabase.ts          # Supabase client
│   │   ├── data/
│   │   │   ├── workers.ts           # Sample worker profiles
│   │   │   ├── retailer.ts          # Sample retailer data
│   │   │   └── ariatStores.ts       # Ariat store locations
│   │   ├── utils/brandLogos.ts      # Brand logo utilities
│   │   ├── styles/variables.css     # Design tokens
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   └── scripts/                 # Frontend data scripts
│   ├── public/brand-logos/          # Brand logo PNGs
│   └── package.json
│
├── src/                             # Node.js backend (Express API)
│   ├── server.ts                    # Express server
│   ├── matching.ts                  # Server-side matching
│   └── scrapers/
│       ├── indeed.ts                # Indeed job scraper
│       └── glassdoor.ts             # Glassdoor scraper (deprecated)
│
├── scripts/                         # Data cleanup & utility scripts
├── assets/                          # Design library & brand assets
│   ├── design-library/              # primitive-variables.json, semantic-variables.json
│   └── brand-logos/                 # Source brand logo PNGs
│
├── docs/                            # Reference docs
│   ├── claude-v2.md                 # V2 Talent Centric full spec
│   ├── database.md                  # Full Supabase table schemas
│   ├── design-system.md             # Colors, typography, components, worker cards
│   ├── project-structure.md         # This file
│   └── scrapers.md                  # Indeed + Glassdoor scraper details
│
├── x.reference/                     # Reference materials (don't modify)
├── .env                             # Environment variables (gitignored)
└── CLAUDE.md                        # Global agent context
```

# V2: Talent Centric

# Overview

- **Title:** Talent Centric
- **CTA:** "Connect with Reflexers" or "Book a shift"
- **Description:** Browse and discover Shift Verified Reflexers first, then invite them to connect or book a shift. No traditional linear chat flow. Think CYOA (choose your own adventure) / canvas experience where retailers feel like they're designing their talent search with us. This variant does NOT end in posting a job.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Core Flow

## Milestone 1: User Persona

Understand who is searching: individual store manager, multi-store manager, field recruiter, etc. This informs location logic and UX flow.

**Welcome → "Tell us about your role so we can focus our questions."**

Persona selection determines location flow: single-store users get a quick confirm ("Search the Austin market?"), multi-store users pick from their store locations, field/recruiters get full market search with no preselection.

**Two input modes:**

1. **Card selection** - Click a persona card to select and auto-advance to location
2. **Chat input** - Type freeform response ("Or share more detailed information..."), then select from follow-up chips


| Aspect             | Detail                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Business Value** | Tailors experience to user job role and motivations; single-store users skip location picker; multi-store/recruiters get full market selection |
| **Considerations** | Keep it light and smart; infer location when possible (single store = known market); persona drives downstream flow                            |
| **Risks**          | N/A                                                                                                                                            |
| **AI**             | V2GeminiService provides mock responses for chat; guides user to select persona via follow-up chips                                            |


**Persona Types (Starting point MVP):**


| Persona                   | Description                                    | Location Logic                                                     |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| Single-Store Manager      | Managing a team at one location                | Auto-detect market: "Search the {market} market?" (confirm/change) |
| Multi-Store Manager       | Managing multiple locations in same area       | Show store dropdown + "Hire in different market" option            |
| Regional/District Manager | Overseeing stores across region(s)             | Full market search with city grid, no preselection                 |
| HR/Recruiter              | Centralized hiring function across the country | Full market search with city grid, no preselection                 |


**Chat Follow-up Chips** (after user sends chat message):

- "One location" → Single-Store Manager
- "Multiple locations" → Multi-Store Manager
- "District or region" → Regional/District Manager
- "Nationally across the brand" → HR/Recruiter

---

## Milestone 2: Preference Shaping

Three-section preference flow with multi-chip selection screens. More open-ended filtering vs. strict constraints.


| Aspect             | Detail                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Business Value** | Reduces cognitive load; creates personalization; flexible matching (brands as proxy, not hard filter)    |
| **Considerations** | Questions feel natural, not interrogative; brand selection is about trust/affinity, not strict filtering |
| **Risks**          | Too many questions = friction; too few = weak signal; over-constraining on brands may limit good matches |
| **AI**             | N/A                                                                                                      |


### Section 1: Type of Employment

Two content areas in one screen:


| Content Area           | Options                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| **Employment Type**    | Part-Time, Full-Time, "I just need help" (with 😉 or playful icon)  |
| **Hours/Availability** | tbd is 0, <10 hrs/wk, 10-20 hrs/wk, 20-30 hrs/wk, 30-40 hrs/wk, 40+ |


**"I just need help" option:** Surfaces flex shift opportunity - "Sounds like you could use a Reflex shift while you figure out your hiring needs"

### Section 2: Brand Affinity

Open-ended matching.


| Aspect             | Detail                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Question**       | "What brands resonate with you?" or "Whose talent would you trust?"                                                         |
| **Selection**      | Multi-select brand logo grid with search                                                                                    |
| **Matching Logic** | Brands as proxy for trust/identity, not hard filter. Worker may have similar brand DNA without exact logo match             |
| **Philosophy**     | Are they looking for brand training (skill) or brand identity (culture fit)? Keep matching loose and surface related talent |


### Section 3: Experience in Role

Sliding scale approach vs. binary:


| Level                  | Description                                      | Data Signal                       |
| ---------------------- | ------------------------------------------------ | --------------------------------- |
| **New to retail**      | Career changer, first retail role                | 0-5 shifts, no retail experience  |
| **Rising talent**      | Some retail experience, building skills          | 5-30 shifts, 0-2 years experience |
| **Seasoned sales pro** | Experienced retail professional                  | 30+ shifts, 2+ years experience   |
| **Management**         | Store manager, supervisor, key holder background | Management roles in history       |


**Duration context:** Include tenure signals (6mo, 1yr, 2yr+) as confidence indicator

---

## Milestone 3: Meet Your Matches

Browse Shift Verified Reflexers filtered by selections. Results screen should feel delightful and drive toward connection.


| Aspect             | Detail                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **Business Value** | Immediate gratification; proof that Reflex has vetted talent they want; drives to CTA        |
| **Considerations** | Empty states need graceful handling; match quality > quantity; CTA is to connect/chat        |
| **Risks**          | Low match counts may discourage; too many feels overwhelming; dead-end if no clear next step |
| **AI**             | N/A                                                                                          |


---

## Milestone 4: Connect and Book

Express interest for permanent role OR schedule a Reflex shift to try them out.


| Aspect             | Detail                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| **Business Value** | Dual CTA removes commitment anxiety; "try before you hire" is unique to Reflex |
| **Considerations** | Book-a-shift requires shift availability; Connect needs clear next steps       |
| **Risks**          | Friction if worker unavailable; unclear handoff to Reflex team                 |
| **AI**             | N/A                                                                            |


### Worker Connection Status Model

**Status Triggers:**

- `liked` → sets `saved_for_later = true`, `chat_open = false`
- `invited` → `connected = false` until worker accepts, `chat_open = false`
- `accepted` → sets `connected = true`, `chat_open = true`
- `not_interested` → `connected = false`, `chat_open = false`
- `removed` → `connected = false`, `chat_open = false`
- When `connected = true`, `saved_for_later` automatically becomes `false`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RETAILER ACTIONS                                  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│   Liked     │   Invited   │  Accepted   │Not Interested│    Removed         │
│             │             │             │              │                    │
└──────┬──────┴─────────────┴──────┬──────┴──────┬───────┴─────────┬──────────┘
       │                           │             │                 │
       ▼                           ▼             ▼                 ▼
┌─────────────┐             ┌─────────────┐┌─────────────┐  ┌─────────────┐
│ Saved for   │             │ Connection  ││No connection│  │ Chat closed │
│ later       │             │             ││ (declined)  │  │             │
│             │             │ connected   ││             │  │             │
│saved_for_   │             │ = true      ││             │  │             │
│later = true │             └──────┬──────┘└─────────────┘  └─────────────┘
└─────────────┘                    │
                                   ▼
                            ┌─────────────┐
                            │ Chat open   │
                            │             │
                            │ chat_open   │
                            │ = true      │
                            └──────┬──────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │ Shift       │
                            │ scheduled   │
                            │             │
                            │shift_sched- │
                            │uled = true  │
                            └─────────────┘
```

### Milestone 4a: In-Platform Chat

Retailer and worker communicate directly within Reflex. AI may synthesize or facilitate prompts to guide conversation.


| Aspect             | Detail                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Business Value** | Keeps communication on-platform; builds relationship data; prevents off-platform leakage while acknowledging it may happen anyway |
| **Considerations** | Need conversation prompts/templates; AI synthesis of brand-worker comms TBD; moderation/safety guardrails                         |
| **Risks**          | Off-platform leakage still possible (phone, email exchange); chat fatigue if too many messages; privacy concerns                  |
| **AI**             | N/A                                                                                                                               |


### Milestone 4b: Book a Shift (Cahootz)

Retailer books a Reflex shift with a specific worker through Cahootz functionality. **Cahootz Feature:** Allows retailers to select a specific worker for a shift (vs. open pool). Core flow: brand decides to book shift with worker → agree on time via chat → retailer books through Cahootz with worker selection, time, role, and other shift details.


| Aspect             | Detail                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Business Value** | "Try before you hire" in action; Reflex earns revenue while facilitating permanent placement; worker gets paid shift + exposure                    |
| **Considerations** | Role may change from original match criteria; worker availability must sync with shift scheduling; Cahootz feature enables worker-specific booking |
| **Risks**          | Worker unavailable for desired time; role mismatch between what retailer wants and what shift requires; scheduling conflicts                       |
| **AI**             | N/A                                                                                                                                                |


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Logic Tree

```
                              ┌─────────────────────────────────────┐
                              │           TALENT CENTRIC            │
                              │     "Connect with Reflexers"        │
                              └─────────────────┬───────────────────┘
                                                │
                                                ▼
                              ┌─────────────────────────────────────┐
                              │             WELCOME                 │
                              │   "Hey {userName}, let's connect    │
                              │    with retail talent in your area" │
                              │                                     │
                              │           [Get started]             │
                              └─────────────────┬───────────────────┘
                                                │
                                                ▼
                              ┌─────────────────────────────────────┐
                              │         USER PERSONA                │
                              │   "Tell us about your role so we    │
                              │    can focus our questions."        │
                              │                                     │
                              │   ┌─────────────────────────────┐   │
                              │   │ 🏪 Single-Store Manager     │   │
                              │   │ 🏢 Multi-Store Manager      │   │
                              │   │ 🗺  Regional/District Mgr   │   │
                              │   │ 🌐 HR/Recruiter             │   │
                              │   └─────────────────────────────┘   │
                              │                                     │
                              │   [Or share more detailed info...]  │
                              │   (chat input for freeform entry)   │
                              └─────────────────┬───────────────────┘
                                                │
                                                │  (persona selection OR chat response)
                                                │
                                                ▼
                              ┌─────────────────────────────────────┐
                              │         LOCATION STEP               │
                              │   (persona determines variant)      │
                              └─────────────────┬───────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
    │   LOCATION CONFIRM        │ │    STORE PICKER           │ │    MARKET PICKER          │
    │   (Single Store)          │ │    (Multi-Store)          │ │    (Field/Recruiter)      │
    │                           │ │                           │ │                           │
    │   "Search the Austin      │ │   "Which location are     │ │   "Where are you          │
    │    market?"               │ │    you hiring for?"       │ │    hiring?"               │
    │                           │ │                           │ │                           │
    │   ┌─────────────────────┐ │ │   [Store location chips]  │ │   [Dropdown] or [Search]  │
    │   │ Yes, search Austin ✓│ │ │   + "Hire in different    │ │   [City chip grid]        │
    │   └─────────────────────┘ │ │      market" option       │ │                           │
    │   ┌─────────────────────┐ │ │                           │ │   *Shows worker sidebar   │
    │   │ Hire in different  ✓│ │ │   *Filter Logic:          │ │    when location selected │
    │   │ market              │ │ │   worker.market = market  │ │                           │
    │   └─────────────────────┘ │ │                           │ │   *Filter Logic:          │
    │                           │ │   *"Different market"     │ │   worker.market = market  │
    │   *"Yes" auto-progresses  │ │    → MARKET PICKER        │ │                           │
    │    to FOCUS step (150ms)  │ │                           │ │   *No preselection        │
    │                           │ │                           │ │    (empty state)          │
    │   *"Different market"     │ │                           │ │                           │
    │    → MARKET PICKER        │ │                           │ │                           │
    └───────────────┬───────────┘ └───────────────┬───────────┘ └───────────────┬───────────┘
                    │                             │                             │
                    └─────────────────────────────┼─────────────────────────────┘
                                                  │
                                                  ▼
                              ┌─────────────────────────────────────┐
                              │           FOCUS STEP                │
                              │   "Let's narrow down your           │
                              │    connections. Where would you     │
                              │    like to start, {userName}?"      │
                              │                                     │
                              │   ┌─────────────────────────────┐   │
                              │   │ Type of employment    → / ✓ │   │
                              │   ├─────────────────────────────┤   │
                              │   │ Brand affinity        → / ✓ │   │
                              │   ├─────────────────────────────┤   │
                              │   │ Experience level      → / ✓ │   │
                              │   └─────────────────────────────┘   │
                              └────────────────-─┬──────────────────┘
                                                 │
                                                 │ 
                                                 │
                                                 ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                   PREFERENCE SHAPING                        │
                    │                   (3-section CYOA flow)                     │
                    └─────────────────────────────┬───────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
    │   SECTION 1:              │ │   SECTION 2:              │ │   SECTION 3:              │
    │   TYPE OF EMPLOYMENT      │ │   BRAND AFFINITY          │ │   EXPERIENCE IN ROLE      │
    │                           │ │                           │ │                           │
    │   type-tagline:           │ │   type-tagline:           │ │   type-tagline:           │
    │   "What type of           │ │   "Whose talent do you    │ │   "What experience level  │
    │    employment?"           │ │    trust?"                │ │    are you looking for?"  │
    │                           │ │                           │ │                           │
    │   ┌─────┐ ┌─────┐ ┌─────┐ │ │   ┌─────┐ ┌─────┐ ┌─────┐ │ │   [Slider with 4 stops]   │
    │   │ FT  │ │ PT  │ │Eith-│ │ │   │Gucci│ │Nike │ │Ariat│ │ │   Rising | Experienced |  │
    │   │     │ │     │ │ er  │ │ │   └─────┘ └─────┘ └─────┘ │ │   Seasoned | Management   │
    │   └─────┘ └─────┘ └─────┘ │ │                           │ │                           │
    │                           │ │   [Search brands...]      │ │   *Selection auto-        │
    │   *Selection auto-        │ │   Multi-select grid       │ │    completes section      │
    │    completes section and  │ │   (loose matching)        │ │                           │
    │    goes to next focus     │ │                           │ │   *Filter Logic:          │
    │                           │ │   *Requires Continue btn  │ │   Rising: <6mo retail     │
    │   *No filtering -         │ │    (multi-select)         │ │     OR <20 Flexes         │
    │    data capture only      │ │                           │ │   Experienced: 6mo-2yr    │
    │                           │ │   *Filter Logic:          │ │     OR 50 Flexes          │
    │                           │ │   brands_worked (loose)   │ │   Seasoned: 2+ yrs retail │
    │                           │ │   brand_tier for proxy    │ │     OR 50+ Flexes         │
    │                           │ │   matching                │ │   Mgmt: managed team/store│
    │                           │ │                           │ │                           │
    │                           │ │                           │ │                           │
    └───────────────┬───────────┘ └───────────────┬───────────┘ └───────────────┬───────────┘
                    │                             │                             │
                    └─────────────────────────────┼─────────────────────────────┘
                                                  │
                                                  │  (after ANY section completes)
                                                  │
                                                  ▼
                              ┌─────────────────────────────────────┐
                              │         CYOA CYCLE LOGIC            │
                              │   completeSection(section)          │
                              │                                     │
                              │   completedSections.size >= 3?      │
                              │          │                          │
                              │    ┌─────┴─────┐                    │
                              │    │           │                    │
                              │   NO          YES                   │
                              │    │           │                    │
                              │    ▼           ▼                    │
                              │  getNext  → RESULTS STEP            │
                              │  Incomplete                         │
                              │  Section()                          │
                              │                                     │
                              │   *Order: employment, brands, roles │
                              │   *Wraps around from current index  │
                              │   *Maps: roles → experience step    │
                              │           brands → brands step      │
                              │           employment → employment   │
                              └─────────────────┬───────────────────┘
                                                │
                                                │  (all 3 complete)
                                                │
                                                ▼
    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                        WORKER CARDS - CHIP DISPLAY LOGIC                            │
    │                                                                                     │
    │  Status Tags (conditional):                                                         │
    │  ┌────────────────────────────┬────────────────────────────────────────────────┐    │
    │  │ ✓ Shift Verified (green)   │ shiftVerified: true                            │    │
    │  │ Actively Looking (blue)    │ activelyLooking: true                          │    │
    │  └────────────────────────────┴────────────────────────────────────────────────┘    │
    │                                                                                     │
    │  Stats Tags (unconditional):                                                        │
    │  ┌────────────────────────────┬────────────────────────────────────────────────┐    │
    │  │ {N} shifts                 │ shiftsOnReflex                                 │    │
    │  │ {N} store locations        │ uniqueStoreCount                               │    │
    │  └────────────────────────────┴────────────────────────────────────────────────┘    │
    │                                                                                     │
    │  Achievement Tags (conditional, tag-sm with left icon):                             │
    │  ┌────────────────────────────┬──────────────────────┬─────────────────────────┐    │
    │  │ Chip                       │ Variant              │ Condition               │    │
    │  ├────────────────────────────┼──────────────────────┼─────────────────────────┤    │
    │  │ ❤️ Market Favorite         │ tag-green            │ marketFavorite: true    │    │
    │  │ 🕐 100% On-Time            │ tag-green            │ tardyRatio = "0 /..."   │    │
    │  │ 🕐 X% On-Time              │ tag-green-light      │ tardyPercent < 10%      │    │
    │  │ ✨ Exceptional Commitment  │ tag-green-light      │ urgentCancelPercent < 5%│    │
    │  │ ✓ 0 Call-Outs             │ tag-green            │ urgentCancelRatio="0/." │    │
    │  │ ❤️ X% Favorite Rating      │ tag-green            │ storeFavorite >= 89%    │    │
    │  │ 👤 X% Invite Back Rate     │ tag-green-light      │ invitedBack >= 94%      │    │
    │  └────────────────────────────┴──────────────────────┴─────────────────────────┘    │
    └─────────────────────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                              RESULTS STEP                                           │
    │                              step="results"                                         │
    │                                                                                     │
    │   "Meet your matches"                                                               │
    │   "{N} Reflexers match your criteria. Connect to learn more or book a shift."       │
    │                                                                                     │
    │   Common brands row: "Experience at: Nike, Ariat, ..." (top 6 common brands)        │
    │                                                                                     │
    │   ┌─────────────────────────────────────────────────────────────────────────┐       │
    │   │  [Connect with all {N}]              [Start over]                       │       │
    │   └─────────────────────────────────────────────────────────────────────────┘       │
    │                                                                                     │
    │   *Sidebar shows "{N} matches" title with WorkerCardChip list                       │
    │   *"Start over" resets: step=welcome, clears all selections + completedSections     │
    │   *No footer nav (hideFooter=true) - uses action buttons instead                    │
    │   *Sparkles icon in header                                                          │
    │                                                                                     │
    │   Future: Individual worker CTAs "Connect" + "Invite to shift"                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                              WORKER CONNECTIONS (Connections Tab)

    Separate from Discover flow. Shows saved workers from worker_connections table.

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │   Filters: Market dropdown, Status filters (Connected, Saved, Shift Scheduled)      │
    │   Cards: WorkerCardChip with status tag, chat button                                │
    │   Data: Loads from worker_connections table via Supabase                            │
    │   Status flow: liked → invited → accepted / not_interested / removed                │
    └─────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼                                                   ▼
    ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
    │             CHAT                  │       │        SCHEDULE SHIFT             │
    │                                   │       │                                   │
    │   In-platform messaging between   │       │   Book a Reflex shift with a      │
    │   retailer and worker.            │       │   specific worker (Cahootz).      │
    │                                   │       │                                   │
    │   chat_id links to conversation   │       │   Date, role, store selection     │
    └───────────────────────────────────┘       └───────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Database

→ See [database.md](database.md) for full table schemas (workers, worker_connections, markets, roles, retailers, job_postings, jobs_published, jobs_applications).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# UX Rules

### Layout Structure

- **Left panel:** Question flow / navigation (main content area)
- **Right panel:** Worker cards updating reactively as filters change (sidebar)
- No traditional chat interface in preference shaping; chat appears after matching

### User Persona Selection

- 2x2 grid of persona cards (`.v2-focus-chips` layout)
- Cards have icon (circular, 54px) + title + description
- **Hover state**: drop shadow (`0 8px 24px rgba(0, 0, 0, 0.12)`), icon fills primary
- **Active state**: tighter drop shadow (`0 2px 8px rgba(0, 0, 0, 0.15)`), icon filled, border highlight
- Single-select, auto-advance on selection (clears any chat messages)
- Icons: Store (Single-Store), MapPinPlus (Multi-Store), MapPlus (Regional/District), Earth (HR/Recruiter)
- Chat input below cards: "Or share more detailed information..."
- When chat is used, persona cards shrink to compact mode (`.chat-active`)
- Chat follow-up chips appear after assistant responds, styled as single-select chips with CornerDownRight icon

### Location Flow


| Persona         | Location UX                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| Individual      | Confirm screen: "Search the {market} market?" with two chip options          |
|                 | - "Yes, search in {market}" → auto-advances to focus step                    |
|                 | - "Hire in a different market" → transitions to full market picker           |
| Multi-Store     | Store dropdown + "Hire in different market" option                           |
| Field/Recruiter | Full market picker with dropdown OR search + city chip grid, no preselection |


**Location confirmation chips** (Single-Store):

- Styled as full-width chips with checkmark icon on right
- Hover/selected state: primary background, white text, white checkmark
- Auto-advance after selection with brief delay (150ms for "Yes", 300ms for "Different")

**Market picker** (Field/Recruiter or "Different market"):

- Dropdown: "Select a location" (default empty state)
- Search input with X clear button
- City chip grid (`.v2-location-grid`)
- Worker sidebar appears when location is selected
- Back button returns to previous location step variant (or persona if from confirmation)

### Employment Type Section

- Two content areas on one screen
- **Area 1:** Employment type chips (Part-Time, Full-Time, "I just need help" with 😉)
- **Area 2:** Hours/availability chips (<10, 10-20, 20-30, 30+ hrs; Weekdays, Weekends)
- "I just need help" triggers flex shift suggestion

### Brand Affinity Grid

- Multi-select brand logo grid (5-7 columns responsive)
- Search input with real-time filtering
- **Loose matching philosophy:** brands as proxy for trust/identity, not hard filter
- Selected state with checkmark overlay
- Continue button shows selection count

### Experience Level Selection

- Sliding scale or card-based selection
- Options: New to retail, Rising talent, Seasoned sales pro, Management
- Include tenure/duration context as secondary signal
- Not a hard filter - influences scoring/ranking

### Worker Cards (Results View)

Use `WorkerCardTeaser` variant:

- Avatar (54px) with `WorkerCardHeader`
- Name formatted as "First L."
- Shift Verified badge (green)
- Hide "Actively Looking" badge (`showActivelyLooking={false}`)
- "What retailers are saying about [Name]" + AI summary
- Brand logos they've worked (max 4, +N overflow)

### Results Screen

**Headline:** "We found {N} Reflexers for you" - celebratory but professional

**Worker Cards in Results:**

- Show top matches prominently in main content area
- Each card has two CTAs: "Connect" (primary) and "Invite to shift" (secondary)
- AI summary visible on each card
- Sidebar continues showing full filtered list

**Match Count Display:**

- Count updates reactively as preferences change
- Sidebar header shows: "{N} Reflexers match" or "Shift Verified Reflexers"
- Empty state: "No exact matches. Try adjusting your preferences." with back navigation

### Connect/Book Actions

- **Primary CTA:** "Connect with [Name]" - opens in-platform chat
- **Secondary CTA:** "Invite to a shift" - opens Cahootz booking flow
- CTAs appear on each worker card AND at results level ("Connect with all")

### In-Platform Chat

- Thread-based conversation between retailer and worker
- AI-facilitated prompt suggestions:
  - Intro templates ("Hi [Name], I saw you worked at [Brand]...")
  - Availability questions ("What days work best for you?")
  - Role/fit discussion starters
- Message input with send button
- Conversation history scrollable
- CTA to transition to shift booking when ready
- Moderation/safety guardrails TBD

### Cahootz Shift Booking

Worker-specific shift booking flow:

- **Worker pre-selected** from chat or results
- **Date/time picker:** When do you need them?
- **Role selector:** May differ from original match criteria (worker could be booked for different role than what retailer initially searched for)
- **Store location:** Which store?
- **Confirmation:** Summary of shift details before booking
- Integrates with existing Reflex shift infrastructure

### DSL Component Usage

> Global components (NavChipGrid, MessageChip, Worker Cards, colors, typography, text inputs) → see `CLAUDE.md` → Design System


| Component                            | Usage                                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Page Components**                  |                                                                                                                                          |
| `V2Main`                             | Step wrapper (`.v2-main`) with transitions and footer; `stepClassName="v2-main-centered"` → `padding-top: 120px` (see Padding Reference) |
| `V2ContentShell`                     | Legacy/alternate step shell (animations, padding, footer)                                                                                |
| `V2NavFooter`                        | Sticky back/next navigation buttons                                                                                                      |
| **User Persona / Focus**             |                                                                                                                                          |
| `.v2-focus-chips`                    | 2-column grid of persona cards (`gap: 16px`; stacks to 1 column at max-width 500px)                                                      |
| `.v2-focus-chips.chat-active`        | Compact mode when chat is engaged (shorter cards, smaller icons)                                                                         |
| `.welcome-card.persona-card`         | Persona selection card with grid layout: title top-left, desc bottom-left, icon top-right                                                |
| `.welcome-card.persona-card:hover`   | Drop shadow `0 8px 24px rgba(0, 0, 0, 0.12)`, icon fills primary                                                                         |
| `.welcome-card.persona-card.active`  | Tighter shadow `0 2px 8px rgba(0, 0, 0, 0.15)`, icon filled                                                                              |
| `.v2-welcome-card-text`              | Wraps title + description; uses `display: contents` for grid positioning                                                                 |
| `h3.welcome-card-title`              | Card title (20px/24px); grid-area: title                                                                                                 |
| `p.welcome-card-description`         | Card subtitle (16px); grid-area: desc, aligned bottom                                                                                    |
| `.welcome-card-icon`                 | Circular icon (54px), border primary, hover/active fills                                                                                 |
| **Persona Chat**                     |                                                                                                                                          |
| `.v2-chat-inline`                    | Chat container spanning full width under persona chips                                                                                   |
| `.v2-chat-messages`                  | Scrollable message container                                                                                                             |
| `.v2-chat-message.user`              | User message (right-aligned, primary bg, white text)                                                                                     |
| `.v2-chat-message.assistant`         | Assistant message (left-aligned with avatar)                                                                                             |
| `.v2-chat-avatar`                    | 32px circular avatar with chatbot image                                                                                                  |
| `.v2-chat-bubble`                    | Message bubble with rounded corners                                                                                                      |
| `.v2-chat-followup-chips`            | Vertical stack of follow-up selection chips                                                                                              |
| `.v2-chat-followup-chip`             | Single-select chip with CornerDownRight icon left, Check icon right when active                                                          |
| `.v2-chat-prompt`                    | Input container with text input and send button                                                                                          |
| **Focus Step / Journey Cards**       |                                                                                                                                          |
| `.v2-journey-cards`                  | Container for 3 journey cards (flex column, gap 12px)                                                                                    |
| `.journey-card`                      | Navigation card with header (icon + title) and footer (desc + arrow/check)                                                               |
| `.journey-card-header`               | Flex row with icon circle (40px) and title                                                                                               |
| `.journey-card-icon`                 | Circular icon container, background-navy, primary icon                                                                                   |
| `.journey-card-title`                | 18px/700 title text                                                                                                                      |
| `.journey-card-footer`               | Description (left) + arrow/check icon (right)                                                                                            |
| `.journey-card-description`          | 14px secondary text                                                                                                                      |
| `.journey-card-arrow`                | Arrow (→) when available, Check (✓) when completed                                                                                       |
| `.journey-card.completed`            | Shows check icon (not disabled, can be re-edited)                                                                                        |
| `.journey-card:hover`                | Background navy-light, cursor pointer                                                                                                    |
| **Location Confirm**                 |                                                                                                                                          |
| `.v2-location-confirm-chips`         | Vertical stack of confirmation chips (Single-Store)                                                                                      |
| `.v2-location-confirm-chip`          | Full-width chip with text and checkmark icon                                                                                             |
| `.v2-confirm-chip-icon`              | Circular checkmark icon (28px), shows on hover/selected                                                                                  |
| **Location Picker**                  |                                                                                                                                          |
| `.v2-location-grid`                  | City chip grid (4 columns, 3 with sidebar)                                                                                               |
| `.v2-location-chip`                  | Individual city selection chip                                                                                                           |
| `.v2-location-select`                | Store dropdown (empty default state)                                                                                                     |
| `.v2-location-controls`              | Dropdown + "or" + search input layout                                                                                                    |
| `.v2-step-content-scroll`            | Scrollable container for location grid                                                                                                   |
| **Employment Type**                  |                                                                                                                                          |
| `.v2-employment-chips`               | Horizontal chip layout for employment options                                                                                            |
| `.v2-hours-chips`                    | Hours/availability selection chips (TBD)                                                                                                 |
| **Brand Affinity**                   |                                                                                                                                          |
| `.v2-brand-grid`                     | Brand logo grid (5-7 columns responsive)                                                                                                 |
| `.v2-brand-tile`                     | Individual brand logo tile with selection state                                                                                          |
| `.v2-brand-search`                   | Search input for filtering brands                                                                                                        |
| **Experience Level**                 |                                                                                                                                          |
| `.v2-experience-scale`               | Sliding scale or card selection for experience (TBD)                                                                                     |
| **Results**                          |                                                                                                                                          |
| `WorkerCardTeaser`                   | Worker cards in results/sidebar                                                                                                          |
| `WorkerCardHeader`                   | Shared header with avatar, name, badges                                                                                                  |
| `WorkerAchievementChips`             | Achievement tags with icons (green/green-light variants)                                                                                 |
| `.tag.tag-blue-light.tag-md`         | Shift Verified (BadgeCheck); **shift experience** role + count (`tag-text` + `tag-counter`); fill `--background-blue`                    |
| `.tag.tag-blue.tag-md`               | Actively Looking (Search icon); fill `**--accent-blue-light`** (not the same as blue light)                                              |
| `.tag.tag-primary-fill.tag-md`       | Retailers on Reflex name pill when showing text-only brands                                                                              |
| `.tag-logo` / `.brand-logo-fallback` | Brand logo tile vs primary-fill square fallback when no logo asset                                                                       |
| `.type-section-header-lg`            | "We found N Reflexers" heading                                                                                                           |
| `.type-section-header-sm`            | "What retailers are saying..." label                                                                                                     |
| `.type-body-md`                      | Worker summary text                                                                                                                      |
| **Worker Sidebar**                   |                                                                                                                                          |
| `V2WorkerSidebar`                    | Collapsible right panel for worker cards                                                                                                 |
| `.v2-sidebar`                        | Container: 380px open, 24px collapsed, white bg, left drop shadow, z-index: 10                                                           |
| `.v2-sidebar.collapsed`              | Narrow collapsed state with toggle button                                                                                                |
| `.v2-sidebar-toggle`                 | 24px circle toggle button, chevron icon                                                                                                  |
| `.v2-sidebar-header`                 | Title + count, sticky top                                                                                                                |
| `.v2-sidebar-cards`                  | Scrollable list of worker cards                                                                                                          |
| **Chat (TBD)**                       |                                                                                                                                          |
| `ChatThread`                         | In-platform retailer-worker conversation                                                                                                 |
| `ChatMessage`                        | Individual message bubble                                                                                                                |
| `ChatPromptSuggestions`              | AI-facilitated conversation starters                                                                                                     |
| **Cahootz Booking (TBD)**            |                                                                                                                                          |
| `CahootzBookingForm`                 | Worker-specific shift booking form                                                                                                       |
| `DateTimePicker`                     | Shift date/time selection                                                                                                                |
| `RoleSelector`                       | Role selection for shift                                                                                                                 |
| `StoreSelector`                      | Store location picker                                                                                                                    |


### Transitions

- Sidebar worker cards fade/slide in as filters apply
- Count updates with brief number animation
- Question cards slide left as user progresses

### States

- **Empty:** No matches found - suggest broadening criteria
- **Loading:** Skeleton cards while filtering
- **Success:** Show matches with celebration micro-interaction
- **Error:** Graceful fallback, retry option

---

## Page Components (DSL)

Reusable layout components for V2 flow steps.

### V2Main

Primary step container for the live V2 flow: renders a `div` with class `v2-main`, transition classes, optional `stepClassName`, and `V2NavFooter` when `footer` is set.

**File:** `V2Main.tsx`

**Layout:** Base padding and scroll behavior come from `.v2-main` in `styles.css`. For centered persona/focus-style steps, pass `stepClassName="v2-main-centered"` — that modifier sets `**padding-top: 120px`** and centers content (children capped at `720px` wide unless overridden). See **Padding Reference** below.

### V2ContentShell

Wrapper component providing consistent layout, padding, animations, and navigation footer.

**File:** `V2ContentShell.tsx`

**Props:**


| Prop                  | Type        | Default     | Description                         |
| --------------------- | ----------- | ----------- | ----------------------------------- |
| `children`            | `ReactNode` | required    | Content to render inside the shell  |
| `isTransitioning`     | `boolean`   | `false`     | Whether step is transitioning       |
| `transitionDirection` | `'forward'  | 'back'`     | `'forward'`                         |
| `variant`             | `'default'  | 'welcome'   | 'centered'                          |
| `hasHeaderSection`    | `boolean`   | `false`     | Fixed header section layout         |
| `hasGridWrapper`      | `boolean`   | `false`     | Split header/scrollable grid layout |
| `className`           | `string`    | `''`        | Additional CSS classes              |
| `footer`              | `object`    | `undefined` | Nav footer props                    |
| `hideFooter`          | `boolean`   | `false`     | Hide footer entirely                |


**Layout Specs:**


| Variant       | Padding            | Behavior                                     |
| ------------- | ------------------ | -------------------------------------------- |
| `default`     | `32px 64px 0 64px` | Standard step (top = 50% of left/right)      |
| `welcome`     | `96px 64px 64px`   | Centered welcome screen                      |
| `centered`    | `32px 64px 0 64px` | Flex centered content                        |
| `full-height` | `0`                | Full height with overflow hidden (for grids) |


**Usage Example:**

```tsx
import { V2ContentShell } from './V2ContentShell';

// Default step
<V2ContentShell
  isTransitioning={isTransitioning}
  transitionDirection={transitionDirection}
  footer={{
    onBack: () => transitionToStep('previous', 'back'),
    onNext: () => transitionToStep('next', 'forward'),
    nextDisabled: !isValid,
    nextLabel: 'Continue',
  }}
>
  <div className="v2-step-header">
    <h1 className="type-tagline">Step Title</h1>
  </div>
  {/* Step content */}
</V2ContentShell>

// Full-height step with scrollable grid
<V2ContentShell
  variant="full-height"
  hasGridWrapper
  footer={{ onBack: handleBack, onNext: handleNext }}
>
  <div className="v2-header-section">Header</div>
  <div className="v2-grid-wrapper">Scrollable grid</div>
</V2ContentShell>
```

---

### V2NavFooter

Sticky footer with back/next navigation buttons.

**File:** `V2NavFooter.tsx`

**Props:**


| Prop           | Type         | Default     | Description         |
| -------------- | ------------ | ----------- | ------------------- |
| `onBack`       | `() => void` | `undefined` | Back button handler |
| `onNext`       | `() => void` | `undefined` | Next button handler |
| `showBack`     | `boolean`    | `true`      | Show back button    |
| `nextDisabled` | `boolean`    | `false`     | Disable next button |
| `nextLabel`    | `string`     | `'Next'`    | Next button text    |
| `backLabel`    | `string`     | `'Back'`    | Back button text    |


**Style Specs:**


| Element     | Styles                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------- |
| Container   | `sticky bottom-0`, `bg-white`, `border-top: 1px solid var(--quaternary)`, `padding: 16px 0` |
| Back button | `padding: 12px 36px`, `min-width: 140px`, `border-radius: 8px`, ghost style                 |
| Next button | `padding: 12px 36px`, `min-width: 140px`, `border-radius: 8px`, primary fill                |


**Usage Example:**

```tsx
import { V2NavFooter } from './V2NavFooter';

<V2NavFooter
  onBack={() => goBack()}
  onNext={() => goNext()}
  showBack={step !== 'first'}
  nextDisabled={!canProceed}
  nextLabel={`Continue (${selectedCount})`}
/>
```

---

### Step Transition Animations

CSS keyframe animations for step transitions. Transitions use 250ms timeout in JS with CSS animations completing in 250-300ms.

**Animation Specs:**


| Animation                  | Duration | Easing     | Transform                                     |
| -------------------------- | -------- | ---------- | --------------------------------------------- |
| `slide-out-left-forward`   | `250ms`  | `ease-out` | `translateX(0) → translateX(-30px)`, fade 0→1 |
| `slide-out-right-backward` | `250ms`  | `ease-out` | `translateX(0) → translateX(30px)`, fade 0→1  |
| `slide-in-right-forward`   | `300ms`  | `ease-out` | `translateX(30px) → translateX(0)`, fade 0→1  |
| `slide-in-left-backward`   | `300ms`  | `ease-out` | `translateX(-30px) → translateX(0)`, fade 0→1 |


**CSS Classes on `.v2-main`:**

```css
.v2-main.slide-out-left-forward     /* Exit to left (forward navigation) */
.v2-main.slide-out-right-backward   /* Exit to right (back navigation) */
.v2-main.slide-in-right-forward     /* Enter from right (forward navigation) */
.v2-main.slide-in-left-backward     /* Enter from left (back navigation) */
```

**Transition Logic (V2Main.tsx):**

```tsx
function getTransitionClass(isTransitioning: boolean, direction: TransitionDirection): string {
  if (isTransitioning) {
    return direction === 'forward' ? 'slide-out-left-forward' : 'slide-out-right-backward';
  }
  return direction === 'forward' ? 'slide-in-right-forward' : 'slide-in-left-backward';
}
```

**JS Transition Timing (index.tsx):**

```tsx
const transitionToStep = (newStep: Step, direction: 'forward' | 'back' = 'forward') => {
  setTransitionDirection(direction);
  setIsTransitioning(true);
  setTimeout(() => {
    setStep(newStep);
    setIsTransitioning(false);
  }, 250); // 250ms matches CSS animation duration
};
```

---

### Width and Height Reference


| Element             | Width                       | Height    | Notes                          |
| ------------------- | --------------------------- | --------- | ------------------------------ |
| `.v2-main`          | `flex: 1`                   | `flex: 1` | Main content area, scrollable  |
| `.v2-sidebar`       | `380px` (collapsed: `24px`) | `100%`    | Right panel for worker cards   |
| `.v2-step-content`  | `100%`                      | `flex: 1` | Step content wrapper           |
| `.v2-nav-footer`    | `100%`                      | auto      | Sticky at bottom               |
| `.v2-brand-grid`    | `100%`                      | auto      | 5-column grid (7 expanded)     |
| `.v2-location-grid` | `100%`                      | auto      | 4-column grid (3 with sidebar) |


### Padding Reference


| Element                        | Padding              | Notes                                                                              |
| ------------------------------ | -------------------- | ---------------------------------------------------------------------------------- |
| `.v2-main`                     | `32px 64px 64px`     | Page inset (top = 50% of horizontal)                                               |
| `.v2-main-centered`            | `padding-top: 120px` | With `.v2-main`; overrides top inset for centered steps (`V2Main` `stepClassName`) |
| `.v2-step-content`             | `32px 64px 0 64px`   | Content shell (top = 50% of left/right)                                            |
| `.v2-welcome-step`             | `96px 64px 64px`     | Welcome hero padding                                                               |
| `.v2-shell-header-section`     | `32px 64px 0`        | Fixed header section                                                               |
| `.v2-nav-footer`               | `16px 0`             | Footer vertical padding (margin-top:auto)                                          |
| `.v2-sidebar-cards`            | `16px`               | Card list padding                                                                  |
| `.v2-btn-back`, `.v2-btn-next` | `12px 36px`          | Button padding                                                                     |


### Worker Sidebar (V2WorkerSidebar)

Collapsible right panel showing filtered worker cards. Appears on location step (when market selected), brands, experience, and results steps.

**File:** `V2WorkerSidebar.tsx`

**Style Specs:**


| Property      | Value                               | Notes              |
| ------------- | ----------------------------------- | ------------------ |
| Width         | `380px` (open), `24px` (collapsed)  | Fixed width        |
| Background    | `var(--white)`                      | White background   |
| Border        | none                                | No left border     |
| Box Shadow    | `-4px 0 16px rgba(0, 0, 0, 0.08)`   | Left drop shadow   |
| Z-Index       | `10`                                | Above main content |
| Toggle button | `24px` circle, centered, primary bg | Chevron icon       |


**Conditional Display:**

```tsx
// Sidebar shows on these steps with these conditions:
{(["brands", "experience", "results"].includes(step) ||
  (step === "location" && selectedLocation &&
   (persona === "field" || persona === "recruiter" ||
    (persona === "individual" && pickingDifferentMarket)))) && (
  <V2WorkerSidebar ... />
)}
```

**Props:**


| Prop            | Type               | Description                   |
| --------------- | ------------------ | ----------------------------- |
| `workers`       | `MatchedWorker[]`  | Filtered workers to display   |
| `isOpen`        | `boolean`          | Whether sidebar is expanded   |
| `onToggle`      | `() => void`       | Toggle handler                |
| `title`         | `string`           | Header title (varies by step) |
| `showCount`     | `boolean`          | Show worker count in header   |
| `onWorkerClick` | `(worker) => void` | Card click handler            |
| `emptyMessage`  | `string`           | Custom empty state message    |
| `isLoading`     | `boolean`          | Show loading skeleton         |



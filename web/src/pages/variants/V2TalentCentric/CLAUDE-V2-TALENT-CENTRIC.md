# V2: Talent Centric

## Overview

- **Title:** Talent Centric
- **CTA:** "Connect with Reflexers" or "Book a shift"
- **Description:** Browse and discover Shift Verified Reflexers first, then invite them to connect or book a shift. No traditional linear chat flow. Think CYOA (choose your own adventure) / canvas experience where retailers feel like they're designing their talent search with us. This variant does NOT end in posting a job.

---

## Core Flow

**Prototype context:** Same as V1 (Austin, Ariat, Mike Meyers).

**System prompt:** N/A - No AI chat in this variant.

**Guardrails:** Lead with talent, not forms. Every interaction should feel like discovery.

**Flow:**
1. Retailer lands on talent-first view (brand selector)
2. Early decision: Select brands they admire
3. This-or-that questions: Employment type, experience level, work style, availability
4. Browse Shift Verified Reflexers filtered by selections
5. CTA options:
   - **Connect:** Express interest in worker for permanent role
   - **Book a shift:** Schedule a Reflex shift to try them out
6. No job posting created (Reflex coordinates manually)

**UI Concepts:**
- Brand logo grid as entry point
- Sidebar shows workers updating reactively
- This-or-that binary choices (not chat)
- Worker cards with brand logos prominent

---

## Logic Tree

**Brand Tiers:**
| Tier | Brands |
|------|--------|
| Luxury | Gucci, Chanel, Louis Vuitton, Prada, Dior, Burberry |
| Elevated | Rag & Bone, Theory, Madewell, Club Monaco, Nordstrom, Lululemon |
| Mid | Nike, Adidas, Anthropologie, Free People, Urban Outfitters, UNIQLO |

**This-or-That Questions:**
1. What type of role? Full-time / Part-time
2. Experience level? Seasoned pro / Rising talent
3. Work style? Self-starter / Team player
4. Availability? Weekends / Weekdays

**Filtering Logic:**
- Brand match: Workers who have worked at selected brands
- Employment: Filter by FT/PT preference
- Experience: 30+ shifts = experienced, <30 = newer
- Style: Check endorsements (self-starter, team-player)
- Availability: Check weekends boolean

```
[Step 1: Brand Selection]
    "What brands do you admire?"
    Grid of brand tiles (luxury, elevated, mid)
    Select multiple, Continue button

[Step 2: This-or-That Questions]
    4 binary choice questions
    Auto-advance on selection
    Sidebar updates reactively

[Step 3: Results]
    "Meet your matches"
    Show filtered workers with match count
    Common brands they share
    CTAs: Connect with all, Start over

[Worker Card Display]
    - Photo, name, Shift Verified badge
    - Brand logos they've worked
    - Shifts count, reliability score
    - Endorsement highlights

[Connect/Book Actions]
    Capture: which store, timing
    Reflex team coordinates
    No job posting published
```

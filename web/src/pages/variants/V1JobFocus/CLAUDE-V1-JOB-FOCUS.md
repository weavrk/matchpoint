# V1: Job Focus

## Overview

- **Title:** Job Focus
- **CTA:** "Fill a role at my store"
- **Description:** Linear AI chat flow that guides retailers through creating a job posting step-by-step. Starts with location, situation, role selection, then builds out compensation, benefits, and publishes. Ends with a published job and optional candidate invitations.

---

## Core Flow

**Prototype context:** You are in Austin, the brand is Ariat. Your name is Mike Meyers. District manager on Reflex for 5 years. First time using Talent Connect.

**System prompt:** `web/src/services/gemini.ts` as `SYSTEM_PROMPT`. Persona is hiring advisor. Context variables: `{{USER_NAME}}`, `{{RETAILER_NAME}}`, `{{RETAILER_CLASS}}`, `{{MARKET}}`.

**Guardrails:** Stay concise, use real data, no made up numbers, never use em dashes, one question per message.

**Flow:**
1. Retailer clicks "Fill a role at my store"
2. AI chat guides retailer through job parameters
3. Retailer sees matched worker profiles (Shift Verified first)
4. Retailer publishes the job (appears in "Published Jobs" tab)
5. Workers can like, view, or express interest
6. Reflex team manually filters interested workers
7. Communication happens off-platform

---

## Logic Tree

**Role Groupings (for salary queries):**
| Group | Primary Role | Also Includes |
|-------|--------------|---------------|
| Sales Floor | Sales Associate | Store Associate |
| Sales Support | Cashier | Sales Assistant, Fitting Room, Team Member |
| Back of House | Stock Associate | Inventory Associate, Operations Associate |
| Specialized | Beauty Advisor | Stylist, Visual Merchandiser, Pop Up |
| Management | Store Manager | Team Leader, Supervisor, Key Holder, Dept Supervisor, ASM |
| Regional | District Manager | (none) |

**Retailer Classification:** Luxury, Specialty, Big Box (filter salary data to same class)

**Special JSON formats:**
- `---WORKER_CARDS_START---` / `---WORKER_CARDS_END---`
- `---ROLE_SELECTOR_START---` / `---ROLE_SELECTOR_END---`
- `---LOCATION_INPUT_START---` / `---LOCATION_INPUT_END---`
- `---JOB_SUMMARY_START---` / `---JOB_SUMMARY_END---`
- `---SUCCESS_BANNER_START---` / `---SUCCESS_BANNER_END---`
- `---JOB_SPEC_START---` / `---JOB_SPEC_END---` (triggers publish)

```
[Welcome Screen]
    Headline: "Hey {{USER_NAME}}, let's connect you with retail talent"
    Chips: GREETING_CHIPS from gemini.ts

"Fill a role at my store"
    [Step 0: Store Location]
        Renders LOCATION_INPUT. Wait for confirmed address.

    [Step 1: Situation]
        "What's driving {{RETAILER_NAME}} to search for new talent?"
        Chips: Growing, Replacing, Seasonal, Specialized

    [Step 2: Role Type]
        Shows ROLE_SELECTOR (Sales Floor, Sales Support, Back of House, Specialized, Management)

    [Step 3: Talent Preview]
        Shows 3 worker cards
        "{{MARKET}} has Reflexers with previous [role] experience."

    [Step 4: Desired Traits]
        Chips: Customer Engagement, Self-Starter, Preparedness, Work Pace,
               Productivity, Attention to Detail, Team Player, Positive Attitude, Adaptable

    [Step 5: Compensation]
        Pay type by role (hourly for frontline, salary for mgmt)

    [Step 6: Employment Type]
        Chips: Full-time, Part-time, Open to either

    [Step 7: Benefits]
        Chips: Health insurance, 401(k), Vision, Dental, Paid holidays, etc.

    [Step 8: Job Summary]
        Shows JOB_SUMMARY card
        Chips: Looks good publish it, Change the role, Adjust compensation, Edit benefits

    [Step 9: Publish Success]
        Outputs JOB_SPEC JSON, shows SUCCESS_BANNER
        Chips: Yes show me candidates, No I'm done for now

    [Step 10: Show Candidates]
        Display 6 COMPACT worker cards
        Chips: Invite all 6, Show me more, I'm done

"Meet {{MARKET}} talent"
    Confirm market, show 3 worker cards, redirect to Fill a role

"Explore {{MARKET}} market"
    Show salary ranges by role group, compare to national average

"Explore another market"
    Market picker, then salary data

"Tell me how Talent Connect works"
    Product explainer, then greeting chips
```

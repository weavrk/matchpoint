import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import type { JobSpec } from '../types';
import { supabase } from './supabase';

// Role groupings - when querying, pull from entire group
export const ROLE_GROUPS: Record<string, string[]> = {
  'Sales Floor': ['Sales Associate / Retail Associate', 'Store Associate'],
  'Sales Support': ['Cashier', 'Sales Assistant', 'Fitting Room Attendant', 'Team Member', 'Retail Customer Service'],
  'Back of House': ['Stock Associate / Stocker', 'Inventory Associate', 'Operations Associate', 'Operations Assistant'],
  'Specialized': ['Beauty Advisor / Cosmetics Associate', 'Stylist', 'Visual Merchandiser', 'Pop Up'],
  'Management': ['Store Manager', 'Store Team Leader', 'Supervisor', 'Key Holder', 'Department Supervisor', 'Assistant Store Manager', 'New Store Lead'],
  'Regional': ['District / Area Manager'],
};

// Get group name for a role
export function getRoleGroup(role: string): string | null {
  for (const [group, roles] of Object.entries(ROLE_GROUPS)) {
    if (roles.some(r => r.toLowerCase() === role.toLowerCase())) {
      return group;
    }
  }
  return null;
}

// Get all roles in same group
export function getRelatedRoles(role: string): string[] {
  const group = getRoleGroup(role);
  return group ? ROLE_GROUPS[group] : [role];
}

// Data Summary Generator
export interface SalarySummary {
  role: string;
  market: string;
  retailerClass: string;
  minHourly: number | null;
  maxHourly: number | null;
  minSalary: number | null;
  maxSalary: number | null;
  postingCount: number;
  retailers: string[];
}

// Parse salary string into hourly/annual values
function parseSalary(salary: string): { minHourly?: number; maxHourly?: number; minSalary?: number; maxSalary?: number } {
  if (!salary) return {};
  const normalized = salary.toLowerCase().replace(/,/g, '');
  const numbers = normalized.match(/\d+\.?\d*/g)?.map(Number) || [];
  if (numbers.length === 0) return {};

  const isHourly = /hour|hr|\/h/i.test(normalized);
  const isAnnual = /year|annual|salary/i.test(normalized) || numbers[0] > 1000;

  if (isHourly) return { minHourly: numbers[0], maxHourly: numbers[1] || numbers[0] };
  if (isAnnual) return { minSalary: numbers[0], maxSalary: numbers[1] || numbers[0] };
  if (numbers[0] < 200) return { minHourly: numbers[0], maxHourly: numbers[1] || numbers[0] };
  return { minSalary: numbers[0], maxSalary: numbers[1] || numbers[0] };
}

export async function generateSalarySummary(
  roleId?: string,
  marketId?: string,
  retailerClass?: 'Luxury' | 'Specialty' | 'Big Box'
): Promise<SalarySummary[]> {
  let query = supabase
    .from('job_postings')
    .select(`salary, role_id, market_id, retailer_id, company, roles(title, category), markets(name), retailers(name, classification)`);

  if (roleId) query = query.eq('role_id', roleId);
  if (marketId) query = query.eq('market_id', marketId);

  const { data: jobs, error } = await query;
  if (error) throw error;

  const groups = new Map<string, { role: string; market: string; retailerClass: string; hourlies: number[]; salaries: number[]; retailers: Set<string> }>();

  for (const job of jobs || []) {
    const role = (job.roles as any)?.title || 'Unknown';
    const market = (job.markets as any)?.name || 'Unknown';
    const rClass = (job.retailers as any)?.classification || 'Unknown';
    if (retailerClass && rClass !== retailerClass) continue;

    const key = `${role}|${market}|${rClass}`;
    if (!groups.has(key)) groups.set(key, { role, market, retailerClass: rClass, hourlies: [], salaries: [], retailers: new Set() });

    const group = groups.get(key)!;
    if (job.company) group.retailers.add(job.company);
    if (job.salary) {
      const parsed = parseSalary(job.salary);
      if (parsed.minHourly) group.hourlies.push(parsed.minHourly);
      if (parsed.maxHourly) group.hourlies.push(parsed.maxHourly);
      if (parsed.minSalary) group.salaries.push(parsed.minSalary);
      if (parsed.maxSalary) group.salaries.push(parsed.maxSalary);
    }
  }

  return Array.from(groups.values()).map(g => ({
    role: g.role, market: g.market, retailerClass: g.retailerClass,
    minHourly: g.hourlies.length ? Math.min(...g.hourlies) : null,
    maxHourly: g.hourlies.length ? Math.max(...g.hourlies) : null,
    minSalary: g.salaries.length ? Math.min(...g.salaries) : null,
    maxSalary: g.salaries.length ? Math.max(...g.salaries) : null,
    postingCount: g.retailers.size, retailers: Array.from(g.retailers),
  }));
}

// Get grouped salary summary (aggregates related roles)
export async function getGroupedSalarySummary(
  role: string,
  market: string,
  retailerClass: 'Luxury' | 'Specialty' | 'Big Box'
): Promise<{ roleGroup: string; roles: SalarySummary[]; nationalAvg: { minHourly: number | null; maxHourly: number | null } }> {
  const roleGroup = getRoleGroup(role) || 'Other';
  const relatedRoles = getRelatedRoles(role);

  const allSummaries = await generateSalarySummary(undefined, undefined, retailerClass);

  // Filter to related roles in this market
  const marketRoles = allSummaries.filter(s =>
    s.market.toLowerCase() === market.toLowerCase() &&
    relatedRoles.some(r => r.toLowerCase() === s.role.toLowerCase())
  );

  // Calculate national average for this role group
  const nationalRoles = allSummaries.filter(s =>
    relatedRoles.some(r => r.toLowerCase() === s.role.toLowerCase())
  );
  const allHourlies = nationalRoles.flatMap(s => [s.minHourly, s.maxHourly].filter((n): n is number => n !== null));

  return {
    roleGroup,
    roles: marketRoles,
    nationalAvg: {
      minHourly: allHourlies.length ? Math.min(...allHourlies) : null,
      maxHourly: allHourlies.length ? Math.max(...allHourlies) : null,
    }
  };
}

// Human-readable summary for AI (with role grouping + national comparison)
export async function getMarketSummaryText(market: string, retailerClass: 'Luxury' | 'Specialty' | 'Big Box', role?: string): Promise<string> {
  if (role) {
    const grouped = await getGroupedSalarySummary(role, market, retailerClass);
    if (grouped.roles.length === 0) return `No salary data for ${role} in ${market}.`;

    const lines = grouped.roles.map(s => {
      const range = s.minHourly && s.maxHourly ? `$${s.minHourly}-${s.maxHourly}/hr`
        : s.minSalary && s.maxSalary ? `$${(s.minSalary/1000).toFixed(0)}k-${(s.maxSalary/1000).toFixed(0)}k`
        : 'salary not reported';
      return `${s.role}: ${range} (${s.postingCount} postings)`;
    });

    const nationalRange = grouped.nationalAvg.minHourly && grouped.nationalAvg.maxHourly
      ? `$${grouped.nationalAvg.minHourly}-${grouped.nationalAvg.maxHourly}/hr`
      : 'N/A';

    return `${grouped.roleGroup} roles in ${market} (${retailerClass}):\n${lines.join('\n')}\n\nNational ${retailerClass} average: ${nationalRange}`;
  }

  // Original behavior - all roles in market
  const summaries = await generateSalarySummary(undefined, undefined, retailerClass);
  const marketSummaries = summaries.filter(s => s.market.toLowerCase() === market.toLowerCase());
  if (marketSummaries.length === 0) return `No salary data available for ${market} ${retailerClass} retailers.`;

  const lines = marketSummaries.map(s => {
    const range = s.minHourly && s.maxHourly ? `$${s.minHourly}-${s.maxHourly}/hr`
      : s.minSalary && s.maxSalary ? `$${(s.minSalary/1000).toFixed(0)}k-${(s.maxSalary/1000).toFixed(0)}k`
      : 'salary not reported';
    return `${s.role}: ${range} (${s.postingCount} postings)`;
  });
  return `${market} ${retailerClass} retailers:\n${lines.join('\n')}`;
}

// ============================================================
// DESIGN SYSTEM REFERENCE
// ============================================================
// Live reference: Palette icon button in dev menu
// Definitions: web/src/styles/variables.css
//
// TYPOGRAPHY CLASSES:
// - .type-tagline         → Greeting headline (Quincy 36px/700)
// - .type-prompt-question → AI prompts (20px/400 primary)
// - .type-chip-header-lg  → Welcome card titles (16px/600)
// - .type-chip-header     → Compact nav chip titles (14px/500 primary)
// - .type-chip-label      → Message chip text (16px/400 primary)
// - .type-body            → Message content (16px/400)
//
// COMPONENTS:
// - NavChipGrid variant="welcome" → Welcome screen 3x2 cards
// - NavChipGrid variant="compact" → Conversation nav bar
// - MessageChip (single)          → Single-select with ↳ prefix
// - MessageChip (multi)           → Multi-select with plus/check icons
//
// SHARED STATES: Hover/Active = --app-primary border + --gray-50 bg
// ============================================================

// Greeting response chips - initial options for user
// Note: {market} in label is replaced at runtime with actual market name
export const GREETING_CHIPS = [
  { id: 'fill-role', label: 'Fill a role at my store' },
  { id: 'meet-talent', label: 'Meet {market} talent' },
  { id: 'explore-market', label: 'Explore market comps' },
  { id: 'check-jobs', label: 'Check on jobs' },
  { id: 'how-it-works', label: 'What is Talent Connect?' },
  { id: 'just-exploring', label: 'Just exploring' },
];

// Follow-up prompts shown after user picks a branch
export const QUICK_PROMPTS = [
  {
    id: 'hire',
    label: 'Create job posting',
    template: "I'm looking for a {role} for {employmentType} around {salary}",
    variables: ['role', 'employmentType', 'salary'],
  },
  {
    id: 'avg-rate',
    label: 'Average rate',
    template: "What's the average hourly rate for {role}?",
    variables: ['role'],
  },
  {
    id: 'min-rate',
    label: 'Minimum rate',
    template: "What's the minimum hourly rate we can set for {role}?",
    variables: ['role'],
  },
  {
    id: 'seasoned-rate',
    label: 'Seasoned rate',
    template: "What would a seasoned {role} expect at comparable brands?",
    variables: ['role'],
  },
  {
    id: 'ft-vs-pt',
    label: 'FT vs PT candidates',
    template: "What's the difference in candidates looking for part-time vs full-time for {role}?",
    variables: ['role'],
  },
];

// Role options grouped by category for quick-select UI
export const ROLE_OPTIONS = {
  'Sales Floor': ['Sales Associate', 'Store Associate', 'Brand Representative'],
  'Sales Support': ['Cashier', 'Sales Assistant', 'Fitting Room Attendant', 'Team Member', 'Retail Customer Service'],
  'Back of House': ['Stock Associate', 'Inventory Associate', 'Operations Associate', 'Loss Prevention'],
  'Specialized': ['Beauty Advisor', 'Stylist', 'Visual Merchandiser', 'Pop Up'],
  'Management': ['Store Manager', 'Assistant Store Manager', 'Department Supervisor', 'Key Holder', 'Supervisor', 'Store Team Leader'],
  'Regional': ['District Manager', 'Area Manager'],
};

// Employment type options
export const EMPLOYMENT_OPTIONS = ['Full-time', 'Part-time', 'Both'];

// Salary range options
export const SALARY_OPTIONS = [
  '$15-18/hr',
  '$18-22/hr',
  '$22-26/hr',
  '$26-30/hr',
  '$40k-50k',
  '$50k-65k',
  '$65k-80k',
  '$80k+',
];

/** Step 7 benefits multi-select: UI uses this list so every option appears even if the model omits brackets. */
export const BENEFIT_SELECT_CHIPS: string[] = [
  'Health insurance',
  '401(k) matching',
  'Vision insurance',
  'Dental insurance',
  'Paid holidays',
  'Employee discount',
  'Flexible scheduling',
  'Growth path',
  'Paid time off',
  'Life insurance',
  'Short-term / long-term disability',
  'Paid parental leave',
  'Bonus or incentive pay',
  'Uniform allowance',
  'Wellness incentives',
];

// System prompt for Reflex hiring assistant
const SYSTEM_PROMPT = `You are a hiring advisor for Reflex, a retail labor marketplace. You help retailers find great permanent hires by understanding their situation first, then matching them with talent.

## CRITICAL RULE: ONE QUESTION PER MESSAGE
- Ask ONE question at a time, wait for a response, then ask the next question
- NEVER combine multiple questions in a single message
- NEVER ask about role AND performance in the same message
- Each step in the flow should be a SEPARATE message
- This creates a natural conversation flow, not an interview

## CRITICAL RULE: ALWAYS SHOW WORKER CARDS AFTER ROLE SELECTION
- When user selects a role (like "Store Associate", "Sales Associate", "Cashier", etc.), you MUST respond with Step 3 (worker cards)
- NEVER go back to Step 1 (situation question) after a role is selected
- NEVER repeat questions that have already been answered
- Use the WORKER_CARDS_START format with worker IDs: ["w001", "w002", "w004"]
- If user typed a custom role, first ask for category, then confirm mapping, THEN show worker cards

## CRITICAL RULE: CONVERSATION FLOW IS LINEAR
- The steps go in order: Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8 → Step 9 → Step 10
- NEVER go backwards in the flow
- If user says a role name, ALWAYS proceed to Step 3 (worker cards + store location)
- The conversation state is maintained - don't ask questions that were already answered

## Context
- User's name: {{USER_NAME}}
- User's brand: {{RETAILER_NAME}} ({{RETAILER_CLASS}})
- User's market: {{MARKET}}
- You have access to real salary data from job postings in their market

## Role Categories
When discussing salaries, group related roles:
- Sales Floor: Sales Associate, Store Associate, Brand Representative
- Sales Support: Cashier, Sales Assistant, Fitting Room Attendant, Team Member
- Back of House: Stock Associate, Inventory Associate, Operations Associate, Loss Prevention
- Specialized: Beauty Advisor, Stylist, Visual Merchandiser, Pop Up
- Management: Store Manager, Assistant Store Manager, Department Supervisor, Key Holder, Supervisor

## How to respond

### For salary questions
- Show the specific market range for their retailer class ({{RETAILER_CLASS}})
- Include related roles in the same category
- Compare to national average
- Always wrap every dollar figure in markdown bold: hourly ranges (**$18-22/hr**), annual (**$65k-75k**), single amounts (**$20/hr**). Apply to all salary values in the message.
- Example: "Sales Associates at {{RETAILER_CLASS}} retailers in {{MARKET}}: **$18-22/hr**. Similar roles like Cashier and Team Member: **$16-19/hr**. This is slightly above the national {{RETAILER_CLASS}} average of **$17-21/hr**."

### For Management roles
Query the specific role asked, then list other management salaries separately as bullet points.
Format each related role with **bold role name** before the colon, and bold all dollar amounts:
- **Assistant Store Manager:** **$42k-52k**
- **Department Supervisor:** **$38k-46k**
- **Key Holder:** **$18-22/hr**

### For "Fill a role" flow (Guided Scenario)
This is the main hiring flow. **START WITH SITUATION** to understand WHY they're hiring.
⚠️ CRITICAL: Each step below is a SEPARATE message. NEVER combine multiple steps.

**Step 1: Situation** — FIRST step when user wants to fill a role
"Sounds good, what's driving {{RETAILER_NAME}} to search for new talent right now?"

Output these EXACT chips with the full descriptive text:
[Growing: we're busy, need more help]
[Replacing: someone left, need to fill]
[Seasonal: holiday rush is coming]
[Specialized: need specific skills]

⚠️ STOP. Wait for response.

**Step 2: Role Type** — Ask about role (applies to ALL situations)
"What job title are you looking for?"

Show the role selector using this EXACT format (copy verbatim).
⚠️ IMPORTANT: When user responds with ANY role name (Sales Associate, Store Associate, Cashier, Stock Associate, Brand Representative, Beauty Advisor, Store Manager, etc.), IMMEDIATELY proceed to Step 3 with worker cards. Do NOT ask about situation again. This applies **including** when the user's message is **only** a role title after they **changed** their pick on the role grid (the app may branch the transcript; your context still includes situation).

---ROLE_SELECTOR_START---
{
  "groups": [
    {
      "header": "Sales Floor",
      "roles": ["Brand Representative", "Sales Associate", "Store Associate"]
    },
    {
      "header": "Sales Support",
      "roles": ["Cashier", "Fitting Room Attendant", "Retail Customer Service", "Sales Assistant", "Team Member"]
    },
    {
      "header": "Back of House",
      "roles": ["Inventory Associate", "Operations Assistant", "Operations Associate", "Stock Associate"]
    },
    {
      "header": "Specialized",
      "roles": ["Beauty Advisor", "Stylist", "Visual Merchandiser"]
    },
    {
      "header": "Management",
      "roles": ["Assistant Store Manager", "Department Supervisor", "District Manager", "Key Holder", "New Store Lead", "Store Manager", "Store Team Leader", "Supervisor"]
    }
  ]
}
---ROLE_SELECTOR_END---

⚠️ STOP. Wait for response.

**Step 2b: Custom Role Category** — ONLY if user typed a custom role instead of selecting from the grid
If user types a custom job title (not one from the role selector), ask which category it belongs to:
"Which category best describes [typed role]?"
Offer chips: [Sales Floor] [Sales Support] [Back of House] [Specialized] [Management]

⚠️ STOP. Wait for response.

**Step 2c: Confirm Role Mapping** — ONLY after Step 2b
After user selects a category, confirm the role mapping for market comparisons:
"For market comparisons, is [typed role] similar to [closest standard role from that category]?"
Offer chips: [Yes, that works] [No, let me specify]

⚠️ STOP. Wait for response.

**Step 2d: Specify Role from Category** — ONLY if user says "No, let me specify" in Step 2c
Show the roles from the category they selected as single-select chips:
"Select the closest role for market comparisons:"

Use the roles from the category they selected in Step 2b:
- If Sales Floor: [Sales Associate] [Store Associate] [Brand Representative]
- If Sales Support: [Sales Assistant] [Cashier] [Fitting Room Attendant] [Team Member] [Retail Customer Service]
- If Back of House: [Stock Associate] [Inventory Associate] [Operations Associate] [Operations Assistant]
- If Specialized: [Beauty Advisor] [Stylist] [Visual Merchandiser]
- If Management: [New Store Lead] [Store Team Leader] [Supervisor] [Key Holder] [Department Supervisor] [Assistant Store Manager] [Store Manager] [District Manager]

⚠️ STOP. Wait for response.

**Step 3: Talent Preview** — TRIGGERED BY: User says a role name (Sales Associate, Store Associate, Cashier, etc.)
⚠️ CRITICAL: When user provides a role name, THIS IS THE NEXT STEP. Show worker cards immediately.
⚠️ DO NOT go back to Step 1 (situation) or re-ask situation. After role is set or changed, the next step is **always** Step 3 (Reflexer teaser cards) for grid-aligned titles, or **Steps 2b-2d** (category → mapping → closest role) for a **custom** title not from the grid.
⚠️ **Role change / branch:** If situation was already completed and the user sends a **new** role title (often as the only message), treat it as **changing the selected role** — output Step 3 (or 2b-2d for custom), never situation again.

"{{MARKET}} has Reflexers with previous [role] experience. Keep building a job description and we can invite them to apply."

Then show 3 worker cards by referencing worker IDs from the database. Use this EXACT format:

---WORKER_CARDS_START---
["w001", "w002", "w004"]
---WORKER_CARDS_END---

⚠️ STOP after showing worker cards. The app will auto-trigger Step 4 by sending "__auto_location__".

**Step 4: Store Location** — When you receive the message "__auto_location__", respond with this step
"Where do you need help? Select a store location from the dropdown, or search for an address."

Output this EXACT format (the app shows the dropdown and map):

---LOCATION_INPUT_START---
{"placeholder": "Search for store address..."}
---LOCATION_INPUT_END---

⚠️ STOP. Wait for the user to confirm a location. Their reply will be the selected address string (not "__auto_location__").

**Step 5: Compensation** — SEPARATE message with market salary data
Use real data to determine whether this role is typically paid hourly or as an annual salary. Most frontline retail roles (Sales Associate, Cashier, Stock Associate, etc.) are hourly. Management roles (Store Manager, District Manager, etc.) are typically salaried.

**If hourly:** "Based on the {{MARKET}} market, the average hourly rate for a [role] at [Specialty/Luxury/Big Box] retailers is **$X-Y/hr**, which is [higher/lower/about the same as] the national average of **$X-Y/hr**. What hourly rate do you want for this job?"
Offer chips with suggested ranges based on market data (e.g. [$18-20/hr] [$20-22/hr] [$22-24/hr]) then add: [I want to set a salary range instead]

**If salaried:** "Based on the {{MARKET}} market, [role] positions at [Specialty/Luxury/Big Box] retailers typically offer **$Xk-Yk** annually, which is [higher/lower/about the same as] the national average of **$Xk-Yk**. What annual salary range do you want for this job?"
Offer chips with suggested ranges based on market data (e.g. [$45k-55k] [$55k-65k] [$65k-80k]) then add: [I want to set an hourly rate instead]

If user clicks the toggle chip, switch to the other pay type and re-offer appropriate ranges.

⚠️ STOP. Wait for response.

**Step 6: Employment Type** — SEPARATE message
"Would this be full-time or part-time?"
Offer chips: [Full-time] [Part-time] [Open to either]

⚠️ STOP. Wait for response.

**Step 7: Benefits** — SEPARATE message
"Do you want to include any benefits details to the published job? Select all that apply:"
The app renders the full benefits chip list automatically. You may omit inline [bracket] chips for benefits or include them for clarity; the UI always shows every option.
Reference (for JOB_SPEC / summaries): Health insurance, 401(k) matching, Vision, Dental, Paid holidays, Employee discount, Flexible scheduling, Growth path, PTO, Life insurance, Short-term / long-term disability, Paid parental leave, Bonus or incentive pay, Uniform allowance, Wellness incentives.

⚠️ STOP. Wait for response.

**Step 8: Job Posting Summary & Confirmation**
⚠️ IMPORTANT: Do NOT show worker cards in this step. Only show the job summary card.
Show a job posting card using this EXACT format:

"Here's your job description."

---JOB_SUMMARY_START---
{
  "role": "Brand Representative",
  "employmentType": "Part-time",
  "market": "Austin",
  "storeLocation": "123 Congress Ave, Austin, TX 78701, USA",
  "pay": "$18-20/hr",
  "benefits": ["Vision insurance", "Employee discount"]
}
---JOB_SUMMARY_END---

Fill in the actual values from the conversation (use the store address from Step 4 for storeLocation). Then ask:
"Is there anything you'd like to change or are you ready to publish?"
Offer chips: [Looks good, publish it] [Change the role] [Adjust compensation] [Edit benefits]

⚠️ STOP. Wait for response. Do NOT proceed to Step 9 or show worker cards until user clicks "Looks good, publish it".

**Step 9: Publish Success** — ONLY after user confirms "Looks good, publish it"

First, output the job spec (this triggers the job to be added to Published Jobs):
---JOB_SPEC_START---
{"title": "...", "market": "...", "employmentType": "FT|PT|Both", "salaryRange": "...", "salaryType": "hourly|salary", "requirements": [...], "benefits": [...], "description": "..."}
---JOB_SPEC_END---

Then output this EXACT response (copy verbatim, including the SUCCESS_BANNER block):

---SUCCESS_BANNER_START---
{"title": "Job Published!", "subtitle": "Your posting is now live"}
---SUCCESS_BANNER_END---

Success! Your job is published. Reflexers can view this posting and apply for the role. Our team will pull together a shortlist of candidates for you to review and reach out to.

You can also review qualified candidates and invite them directly to apply. Want to invite Reflexers?

[Yes, show me candidates] [No, I'm done for now]

⚠️ STOP. Do NOT show worker cards yet. Wait for user response.

**Step 10: Show Candidates** — ONLY if user clicks "Yes, show me candidates"
"Here are qualified Reflexers with previous [role] experience:"

Show 6 worker cards by referencing worker IDs from the database. Use this EXACT format:

---WORKER_CARDS_START---
["w005", "w006", "w007", "w008", "w009", "w010"]
---WORKER_CARDS_END---

"Let me know which candidates you would like to invite."

Offer chips: [Invite all 6] [Show me more candidates] [I'm done for now]

### For "Meet {market} talent" flow (Worker Story Narrative)
This flow leads with humanized worker stories. Workers are people, not profiles.

**Step 1: Confirm Market**
"Want to meet talent in {{MARKET}}, or a different location?"
Offer chips: [Yes, {{MARKET}}] [Different location]

**Step 2: Show Worker Stories**
"Here are some standouts looking for permanent roles in {{MARKET}}:"

Show 3 worker cards by referencing worker IDs from the database. Use this EXACT format:

---WORKER_CARDS_START---
["w001", "w002", "w003"]
---WORKER_CARDS_END---

Then offer chips to direct them toward creating a job posting:
"To connect with these Reflexers, create a job posting and we'll invite them to apply."

Offer chips: [Create a job posting] [See more talent] [Explore a different market]

**Step 3: Create Job Posting**
When user clicks "Create a job posting", redirect them to the Fill a role flow:
"Great! Let's build a job posting together."
Then continue with **Step 1 (Situation)** of the "Fill a role" flow.

### For "Explore market comps" flow (Market Salary Summary)
When user selects "Explore market comps" or asks about market data, show a comparison table of salary ranges across the top retail roles in their market vs national averages. Do NOT ask which role they're interested in - show all roles together in a table.

Respond with this format (use markdown table):

"Here's {{MARKET}} retail compensation compared to national averages:

| Role | {{MARKET}} | National | vs Avg |
|------|--------|----------|--------|
| Sales Associate | **$17-20/hr** | $15-18/hr | +12% |
| Stock Associate | **$16-19/hr** | $14-17/hr | +10% |
| Cashier | **$15-18/hr** | $13-16/hr | +13% |
| Team Member | **$16-18/hr** | $14-16/hr | +11% |
| Operations Associate | **$17-20/hr** | $15-18/hr | +9% |
| Asst. Store Manager | **$48-58k** | $42-52k | +12% |
| Store Manager | **$62-78k** | $55-70k | +11% |

Based on X recent job postings. {{MARKET}} pays [above/below/at] national average across all roles."

Offer chips: [Fill a role at my store] [Meet {{MARKET}} talent] [Explore a different market]

### For "Tell me how Talent Connect works" flow
When user asks how Talent Connect works, respond with this EXACT text (preserving paragraph breaks and bold formatting):

"Talent Connect is a resource to explore markets, talent in your area, and connect with interested workers for permanent positions. **Unlike traditional job boards, every worker here has real performance data from Reflex shifts: verified reliability scores, store endorsements, and brands they've worked with. You're not screening resumes, you're seeing proven retail talent.**

We work together to narrow down published jobs by tuning based on market data and worker interest. I can help you fine-tune your salary ranges, employment type, and role descriptions to reach the best possible pool of highly qualified Reflexers. We're not an ATS system, we're an early acquisition resource for your team.

Ready to get started?"

Then offer the same chips from the initial greeting:
[Fill a role at my store] [Meet {{MARKET}} talent] [Explore {{MARKET}} market] [Explore another market]

### For "Explore another market" flow
When user wants to explore a different market:
"Which market would you like to explore?"
List available Reflex markets and let them choose, then proceed with market salary data for that location.

### For "Just exploring" flow
When user is just exploring with no specific goal:
"No problem! Take your time. Here are a few things you can do here:

- **See available talent** - I can show you standout Reflexers in {{MARKET}} who are looking for permanent roles
- **Explore market data** - Get salary ranges and hiring trends for retail roles in your area
- **Create a job posting** - When you're ready, I'll walk you through building one step by step

What sounds interesting?"

Offer chips: [Show me talent] [Explore market data] [Start a job posting]

## Rules
- Keep responses concise (2-3 sentences max)
- Use real data when available, say "based on X postings"
- If no data, say so honestly
- Focus on {{RETAILER_CLASS}} retailers for salary comparisons
- Don't make up numbers
- Always offer chip-style choices in [brackets] to make responses easy
- **START FILL-A-ROLE WITH SITUATION (Step 1)** — understanding WHY surfaces better candidate matches
- **After Step 2 role is answered (or changed via grid branch), always Step 3 teasers or 2b-2d for custom roles** — never repeat Step 1 for a role-only follow-up when the arc already passed situation
- The Replacing flow is longer because it gathers trait data for better matching
- Never use italics in responses`;

// Build system prompt with context
function buildSystemPrompt(userName: string, retailerName: string, retailerClass: string, market: string, workerIds?: string[]): string {
  // Create worker ID placeholders from actual IDs
  const ids = workerIds || [];
  const worker3Ids = JSON.stringify(ids.slice(0, 3));
  const worker6Ids = JSON.stringify(ids.slice(0, 6));

  return SYSTEM_PROMPT
    .replace(/\{\{USER_NAME\}\}/g, userName)
    .replace(/\{\{RETAILER_NAME\}\}/g, retailerName)
    .replace(/\{\{RETAILER_CLASS\}\}/g, retailerClass)
    .replace(/\{\{MARKET\}\}/g, market)
    // Replace hardcoded sample worker IDs with actual ones
    .replace(/\["w001",\s*"w002",\s*"w003"\]/g, worker3Ids)
    .replace(/\["w001",\s*"w002",\s*"w004"\]/g, worker3Ids)
    .replace(/\["w005",\s*"w006",\s*"w007",\s*"w008",\s*"w009",\s*"w010"\]/g, worker6Ids);
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private chat: ChatSession | null = null;
  private workerIds: string[] = [];

  constructor(apiKey: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async startChat(
    userName: string,
    retailerName: string,
    retailerClass: 'Luxury' | 'Specialty' | 'Big Box' = 'Luxury',
    market: string = 'Austin',
    existingHistory?: { role: 'user' | 'model'; content: string }[],
    workerIds?: string[]
  ): Promise<string> {
    // Store worker IDs for use in responses
    this.workerIds = workerIds || [];
    if (!this.genAI) {
      throw new Error('API key not configured');
    }

    const prompt = buildSystemPrompt(userName, retailerName, retailerClass, market, this.workerIds);

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build history: system prompt + any existing conversation
    const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [
      { role: 'user', parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: "Understood. I'm ready to help with salary insights and job postings." }] },
    ];

    // Append existing conversation history if provided
    if (existingHistory && existingHistory.length > 0) {
      for (const msg of existingHistory) {
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    this.chat = model.startChat({ history });

    // Static greeting - no API call needed
    return `Hey ${userName}, I'm here to connect you with retail talent. Want to create a job posting or explore the ${market} market first?`;
  }

  async sendMessage(message: string): Promise<{ text: string; jobSpec?: JobSpec; followUp?: string }> {
    if (!this.chat) {
      throw new Error('Chat not started');
    }

    const response = await this.chat.sendMessage(message);
    const text = response.response.text();

    // Check for job spec in response
    const specMatch = text.match(/---JOB_SPEC_START---\s*([\s\S]*?)\s*---JOB_SPEC_END---/);

    if (specMatch) {
      try {
        const spec = JSON.parse(specMatch[1]) as Omit<JobSpec, 'retailerName'>;
        const cleanText = text.replace(/---JOB_SPEC_START---[\s\S]*?---JOB_SPEC_END---/, '').trim();
        return {
          text: cleanText || "I've created your job posting. Here are the matched candidates!",
          jobSpec: { ...spec, retailerName: '' },
        };
      } catch {
        // JSON parse failed, return text as-is
      }
    }

    return { text };
  }
}

/** Role titles from the in-prompt ROLE_SELECTOR grid (mock: treat as Step 3 after location). */
const MOCK_ROLE_SELECTOR_TITLES = new Set([
  'Sales Associate',
  'Store Associate',
  'Brand Representative',
  'Sales Assistant',
  'Cashier',
  'Fitting Room Attendant',
  'Team Member',
  'Retail Customer Service',
  'Stock Associate',
  'Inventory Associate',
  'Operations Associate',
  'Operations Assistant',
  'Beauty Advisor',
  'Stylist',
  'Visual Merchandiser',
  'New Store Lead',
  'Store Team Leader',
  'Supervisor',
  'Key Holder',
  'Department Supervisor',
  'Assistant Store Manager',
  'Store Manager',
  'District Manager',
]);

// Mock service for when no API key is available
// Simulates realistic conversation with salary data
export class MockGeminiService {
  private gathered: {
    roleType?: string;
    brandTier?: 'mid' | 'elevated' | 'luxury';
    preference?: 'FT' | 'PT' | 'Both';
    skills?: string[];
    title?: string;
  } = {};
  private workerIds: string[] = [];

  /** Aligns mock with Fill a role: Step 0 location first, then situation, then role. */
  private mockFillRoleStep: 'off' | 'need_location' | 'past_location' | 'need_situation' | 'past_situation' | 'past_role' = 'off';

  async startChat(
    userName: string,
    retailerName: string,
    _retailerClass: 'Luxury' | 'Specialty' | 'Big Box' = 'Luxury',
    market: string = 'Austin',
    existingHistory?: { role: 'user' | 'model'; content: string }[],
    workerIds?: string[]
  ): Promise<string> {
    this.gathered = {};
    this.mockFillRoleStep = 'off';
    this.workerIds = workerIds || [];
    if (existingHistory?.length) {
      const assistantBlob = existingHistory
        .filter((m) => m.role === 'model')
        .map((m) => m.content)
        .join('\n');
      if (assistantBlob.includes('what\'s driving')) {
        this.mockFillRoleStep = 'past_situation';
      }
    }
    return `Hi ${userName}! I can help you with salary insights and job postings for ${retailerName} in ${market}. What role are you looking to hire for, or would you like to see current market rates?`;
  }

  // Helper to get worker IDs for responses
  private getWorkerIds(count: number): string {
    return JSON.stringify(this.workerIds.slice(0, count));
  }

  async sendMessage(message: string): Promise<{ text: string; jobSpec?: JobSpec; followUp?: string; chips?: { label: string }[]; chipsType?: string }> {
    const lower = message.toLowerCase();
    const fillRoleIntent =
      /fill\s+(a\s+)?permanent|permanent\s+role|create\s+a\s+job\s+posting|start\s+a\s+job\s+posting|job\s+posting\s+together/i.test(
        lower
      );

    // Handle "Explore market comps" / "Show me market data" flow
    const marketDataIntent = /market\s*(data|comps|rates|salary)|explore.*market|show\s+me\s+.*market/i.test(lower);
    if (marketDataIntent) {
      return {
        text: `Here's Austin retail compensation compared to national averages:

| Role | Austin | National | vs Avg |
|------|--------|----------|--------|
| Sales Associate | **$17-20/hr** | $15-18/hr | +12% |
| Stock Associate | **$16-19/hr** | $14-17/hr | +10% |
| Cashier | **$15-18/hr** | $13-16/hr | +13% |
| Team Member | **$16-18/hr** | $14-16/hr | +11% |
| Operations Associate | **$17-20/hr** | $15-18/hr | +9% |
| Asst. Store Manager | **$48-58k** | $42-52k | +12% |
| Store Manager | **$62-78k** | $55-70k | +11% |

Based on 466 recent job postings. Austin pays above national average across all roles.

[Fill a role at my store] [Meet Austin talent] [Explore a different market]`,
      };
    }

    // Step 1: Situation (first step now)
    if (this.mockFillRoleStep === 'off' && fillRoleIntent) {
      this.mockFillRoleStep = 'need_situation';
      return {
        text: `Sounds good, what's driving Ariat to search for new talent right now?

[Growing: we're busy, need more help]
[Replacing: someone left, need to fill]
[Seasonal: holiday rush is coming]
[Specialized: need specific skills]`,
      };
    }

    // After situation, show role selector (Step 2)
    if (this.mockFillRoleStep === 'need_situation') {
      this.mockFillRoleStep = 'past_situation';
      return {
        text: `What job title are you looking for?

---ROLE_SELECTOR_START---
{"groups":[{"header":"Sales Floor","roles":["Brand Representative","Sales Associate","Store Associate"]},{"header":"Sales Support","roles":["Cashier","Fitting Room Attendant","Retail Customer Service","Sales Assistant","Team Member"]},{"header":"Back of House","roles":["Inventory Associate","Operations Assistant","Operations Associate","Stock Associate"]},{"header":"Specialized","roles":["Beauty Advisor","Stylist","Visual Merchandiser"]},{"header":"Management","roles":["Assistant Store Manager","Department Supervisor","District Manager","Key Holder","New Store Lead","Store Manager","Store Team Leader","Supervisor"]}]}
---ROLE_SELECTOR_END---`,
      };
    }

    const trimmed = message.trim();
    if (
      this.mockFillRoleStep === 'past_situation' &&
      MOCK_ROLE_SELECTOR_TITLES.has(trimmed)
    ) {
      this.gathered.title = trimmed;
      this.mockFillRoleStep = 'past_role';
      return {
        text: `Austin has Reflexers with previous ${trimmed} experience.

---WORKER_CARDS_START---
${this.getWorkerIds(3)}
---WORKER_CARDS_END---`,
        followUp: '__auto_location__',
      };
    }

    // Step 4: Store location (auto-triggered after worker cards)
    if (
      this.mockFillRoleStep === 'past_role' &&
      message === '__auto_location__'
    ) {
      this.mockFillRoleStep = 'past_location';
      return {
        text: `Choose a store location:`,
        chips: [
          { label: '2222 Rio Grande St' },
          { label: '2901 S Capital of Texas Hwy' },
          { label: '11601 Century Oaks Terrace' },
        ],
        chipsType: 'single-select',
      };
    }

    // Parse role type
    if (!this.gathered.roleType) {
      if (lower.includes('sales') || lower.includes('associate')) {
        this.gathered.roleType = 'sales';
        this.gathered.title = 'Sales Associate';
      } else if (lower.includes('manager') || lower.includes('lead')) {
        this.gathered.roleType = 'manager';
        this.gathered.title = 'Store Manager';
      } else if (lower.includes('cashier')) {
        this.gathered.roleType = 'cashier';
        this.gathered.title = 'Cashier';
      } else if (lower.includes('stock') || lower.includes('inventory')) {
        this.gathered.roleType = 'stock';
        this.gathered.title = 'Stock Associate';
      } else if (lower.includes('stylist') || lower.includes('fashion')) {
        this.gathered.roleType = 'stylist';
        this.gathered.title = 'Fashion Stylist';
      } else if (lower.includes('beauty') || lower.includes('cosmetic')) {
        this.gathered.roleType = 'beauty';
        this.gathered.title = 'Beauty Advisor';
      } else {
        this.gathered.roleType = 'general';
        this.gathered.title = 'Retail Associate';
      }
    }

    // Parse brand tier
    if (!this.gathered.brandTier) {
      if (lower.includes('luxury') || lower.includes('high-end') || lower.includes('gucci') || lower.includes('neiman')) {
        this.gathered.brandTier = 'luxury';
      } else if (lower.includes('elevated') || lower.includes('nordstrom') || lower.includes('j.crew') || lower.includes('j crew')) {
        this.gathered.brandTier = 'elevated';
      } else if (lower.includes('mid') || lower.includes('gap') || lower.includes('h&m') || lower.includes('zara')) {
        this.gathered.brandTier = 'mid';
      }
    }

    // Parse FT/PT preference
    if (!this.gathered.preference) {
      if (lower.includes('full-time') || lower.includes('full time') || lower.includes('ft')) {
        this.gathered.preference = 'FT';
      } else if (lower.includes('part-time') || lower.includes('part time') || lower.includes('pt')) {
        this.gathered.preference = 'PT';
      } else if (lower.includes('both') || lower.includes('either') || lower.includes('flexible')) {
        this.gathered.preference = 'Both';
      }
    }

    // Parse skills mentioned
    const skillKeywords = ['customer service', 'communication', 'teamwork', 'leadership', 'visual merchandising', 'inventory', 'pos', 'clienteling'];
    const foundSkills = skillKeywords.filter(skill => lower.includes(skill));
    if (foundSkills.length > 0) {
      this.gathered.skills = [...(this.gathered.skills || []), ...foundSkills];
    }

    // Determine what to ask next
    if (!this.gathered.brandTier) {
      const roleAck = this.gathered.roleType === 'sales' ? 'A sales role' :
                      this.gathered.roleType === 'manager' ? 'A management position' :
                      this.gathered.roleType === 'stylist' ? 'A stylist role' :
                      this.gathered.roleType === 'beauty' ? 'A beauty advisor position' :
                      `A ${this.gathered.title?.toLowerCase()} role`;
      return {
        text: `${roleAck} sounds great! What level of brand experience are you looking for: mid-tier like Gap or H&M, elevated like Nordstrom or J.Crew, or luxury like Gucci or Neiman Marcus?`,
      };
    }

    if (!this.gathered.preference) {
      return {
        text: `Got it, ${this.gathered.brandTier} experience. Would this be a full-time or part-time position? Or are you open to both?`,
      };
    }

    // We have enough info - generate job spec
    const defaultSkills = this.gathered.roleType === 'manager'
      ? ['Leadership experience', 'Team management', 'Sales floor operations']
      : this.gathered.roleType === 'beauty'
      ? ['Beauty product knowledge', 'Customer consultation', 'Makeup application']
      : this.gathered.roleType === 'stylist'
      ? ['Fashion knowledge', 'Clienteling', 'Visual merchandising']
      : ['Customer service', 'Retail experience', 'Strong communication'];

    const description = this.gathered.roleType === 'manager'
      ? `Seeking an experienced retail manager with ${this.gathered.brandTier} brand background to lead our team.`
      : this.gathered.roleType === 'beauty'
      ? `Looking for a passionate beauty advisor with ${this.gathered.brandTier} cosmetics experience.`
      : `Looking for a ${this.gathered.preference === 'FT' ? 'full-time' : this.gathered.preference === 'PT' ? 'part-time' : 'flexible'} ${this.gathered.title?.toLowerCase()} with ${this.gathered.brandTier} retail experience.`;

    return {
      text: `Perfect! I've created your job posting for a ${this.gathered.preference === 'FT' ? 'full-time' : this.gathered.preference === 'PT' ? 'part-time' : 'full-time or part-time'} ${this.gathered.title} with ${this.gathered.brandTier} brand experience. Here are the candidates that match your criteria!`,
      jobSpec: {
        title: this.gathered.title || 'Retail Associate',
        market: 'New York City',
        brandTier: [this.gathered.brandTier],
        preference: this.gathered.preference,
        requirements: this.gathered.skills?.length ? this.gathered.skills : defaultSkills,
        description,
        retailerName: '',
      },
    };
  }
}

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

// Greeting response chips - initial options for user
// Note: {market} in label is replaced at runtime with actual market name
export const GREETING_CHIPS = [
  { id: 'fill-role', label: 'Fill a role at my store' },
  { id: 'meet-talent', label: 'Meet {market} talent' },
  { id: 'explore-market', label: 'Explore {market} market' },
  { id: 'explore-other', label: 'Explore another market' },
  { id: 'how-it-works', label: 'Tell me how Talent Connect works' },
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

// System prompt for Reflex hiring assistant
const SYSTEM_PROMPT = `You are a hiring advisor for Reflex, a retail labor marketplace. You help retailers find great permanent hires by understanding their situation first, then matching them with talent.

## CRITICAL RULE: ONE QUESTION PER MESSAGE
- Ask ONE question at a time, wait for a response, then ask the next question
- NEVER combine multiple questions in a single message
- NEVER ask about role AND performance in the same message
- Each step in the flow should be a SEPARATE message
- This creates a natural conversation flow, not an interview

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
- Example: "Sales Associates at {{RETAILER_CLASS}} retailers in {{MARKET}}: $18-22/hr. Similar roles like Cashier and Team Member: $16-19/hr. This is slightly above the national {{RETAILER_CLASS}} average of $17-21/hr."

### For Management roles
Query the specific role asked, then list other management salaries separately as bullet points.
Format each related role with **bold role name** before the colon:
- **Assistant Store Manager:** $42k-52k
- **Department Supervisor:** $38k-46k
- **Key Holder:** $18-22/hr

### For "Fill a role" flow (Guided Scenario)
This is the main hiring flow. **START WITH THE SITUATION** to understand WHY they're hiring.
⚠️ CRITICAL: Each step below is a SEPARATE message. NEVER combine multiple steps.

**Step 1: Situation** — ALWAYS start here when user wants to fill a role
"Sounds good, what's driving {{RETAILER_NAME}} to search for new talent right now?"

Output these EXACT chips with the full descriptive text:
[Growing: we're busy, need more help]
[Replacing: someone left, need to fill]
[Seasonal: holiday rush is coming]
[Specialized: need specific skills]
[Just exploring]

⚠️ STOP. Wait for response.

**Step 2: Role Type** — Ask about role (applies to ALL situations)
"What job title are you looking for?"

Show the role selector using this EXACT format (copy verbatim):

---ROLE_SELECTOR_START---
{
  "columns": [
    {
      "header": "Sales Floor",
      "roles": ["Sales Associate", "Store Associate", "Brand Representative"]
    },
    {
      "header": "Sales Support",
      "roles": ["Sales Assistant", "Cashier", "Fitting Room Attendant", "Team Member", "Retail Customer Service"]
    },
    {
      "header": "Back of House",
      "roles": ["Stock Associate", "Inventory Associate", "Operations Associate", "Operations Assistant"]
    },
    {
      "header": "Specialized",
      "roles": ["Beauty Advisor", "Stylist", "Visual Merchandiser", "Pop Up"]
    },
    {
      "header": "Management",
      "roles": ["New Store Lead", "Store Team Leader", "Supervisor", "Key Holder", "Department Supervisor", "Assistant Store Manager", "Store Manager", "District Manager"]
    }
  ]
}
---ROLE_SELECTOR_END---

⚠️ STOP. Wait for response.

**Step 3: Talent Preview** — Show 4 worker cards in 2x2 grid
After role is selected, show the talent preview:
"{{MARKET}} has Reflexers with previous [role] experience. Keep building a job description and we can invite them to apply."

Then show 4 worker cards using this format (include aboutMe and storeQuotes):

---WORKER_CARDS_START---
[
  {
    "name": "Jordan F.",
    "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "aboutMe": "I love the fast pace of retail and connecting with customers. Reflex has given me experience across different brands, and I'm eager to find a team to grow with.",
    "workHistory": [
      {"company": "MIZZEN+MAIN", "role": "Brand Rep", "duration": "6 mo"},
      {"company": "Faherty", "role": "Sales Associate", "duration": "4 mo"},
      {"company": "Marine Layer", "role": "Sales Associate", "duration": "3 mo"}
    ],
    "endorsements": [
      {"label": "Customer Engagement", "count": 117, "icon": "chat"},
      {"label": "Hustle", "count": 89, "icon": "rocket"},
      {"label": "Team Player", "count": 97, "icon": "users"}
    ],
    "storeQuotes": [
      {"text": "Jordan was awesome!! Great with customers and a natural seller.", "source": "MIZZEN+MAIN Store Manager"},
      {"text": "Would definitely book again", "source": "Faherty"}
    ]
  },
  {
    "name": "Sofia M.",
    "photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "aboutMe": "I started on Reflex while finishing school. Now I've worked 47 shifts across 15 brands, and 12 have invited me back. I'm ready for something permanent.",
    "workHistory": [
      {"company": "Madewell", "role": "Sales Associate", "duration": "8 mo"},
      {"company": "Anthropologie", "role": "Sales Associate", "duration": "5 mo"},
      {"company": "J.Crew", "role": "Sales Associate", "duration": "4 mo"}
    ],
    "endorsements": [
      {"label": "Self-Starter", "count": 84, "icon": "star"},
      {"label": "Positive Attitude", "count": 102, "icon": "smile"},
      {"label": "Attention to Detail", "count": 76, "icon": "target"}
    ],
    "storeQuotes": [
      {"text": "Sofia is reliable and always shows up ready to work.", "source": "Madewell Assistant Manager"},
      {"text": "Would hire full-time if we had headcount", "source": "J.Crew"}
    ]
  },
  {
    "name": "Marcus T.",
    "photo": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "aboutMe": "I take pride in keeping things organized and running smoothly. I've learned back-of-house operations at several brands and I'm ready for a permanent home.",
    "workHistory": [
      {"company": "J.Crew", "role": "Stock Associate", "duration": "1 yr"},
      {"company": "Everlane", "role": "Inventory", "duration": "6 mo"},
      {"company": "Bonobos", "role": "Operations", "duration": "4 mo"}
    ],
    "endorsements": [
      {"label": "Team Player", "count": 91, "icon": "users"},
      {"label": "Work Pace", "count": 88, "icon": "zap"},
      {"label": "Preparedness", "count": 73, "icon": "check"}
    ],
    "storeQuotes": [
      {"text": "Marcus picks up tasks without being asked. Great addition to any team.", "source": "J.Crew Store Manager"},
      {"text": "Meticulous with inventory counts", "source": "Everlane"}
    ]
  },
  {
    "name": "Priya K.",
    "photo": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "aboutMe": "Fashion is my passion. I love helping customers find pieces that make them feel confident. I'm looking for a brand that values personal styling.",
    "workHistory": [
      {"company": "Anthropologie", "role": "Stylist", "duration": "10 mo"},
      {"company": "Free People", "role": "Sales Associate", "duration": "6 mo"},
      {"company": "Madewell", "role": "Stylist", "duration": "5 mo"}
    ],
    "endorsements": [
      {"label": "Customer Engagement", "count": 95, "icon": "chat"},
      {"label": "Perfect Attire", "count": 110, "icon": "shirt"},
      {"label": "Adaptable", "count": 82, "icon": "refresh"}
    ],
    "storeQuotes": [
      {"text": "Priya has excellent style sense and connects naturally with customers.", "source": "Anthropologie Keyholder"},
      {"text": "Clients ask for her by name", "source": "Free People"}
    ]
  }
]
---WORKER_CARDS_END---

Then IMMEDIATELY in the same response, add a blank line and continue with Step 4:

**Step 4: Desired Traits** — (sent as second bubble after worker cards, auto-split by frontend)
"What positive traits should we look for in a new candidate? You can also type out qualities you're looking for."

Offer chips: [Customer Engagement] [Self-Starter] [Preparedness] [Perfect Attire] [Work Pace] [Productivity] [Attention to Detail] [Team Player] [Positive Attitude] [Adaptable]

⚠️ STOP. Wait for response.

**Step 5: Compensation** — SEPARATE message with market salary data
"Based on the {{MARKET}} market, the average hourly rate for a [role] is $X-Y/hr, which is [higher/lower/about the same as] the national average of $X-Y/hr. What hourly rate do you want for this job?"

Offer chips with suggested ranges: [$18-20/hr] [$20-22/hr] [$22-24/hr]

⚠️ STOP. Wait for response.

**Step 6: Employment Type** — SEPARATE message
"Would this be full-time or part-time?"
Offer chips: [Full-time] [Part-time] [Open to either]

⚠️ STOP. Wait for response.

**Step 7: Benefits** — SEPARATE message
"Do you want to include any other details to the published job? Select all that apply:"
Offer chips: [Health insurance] [401(k) matching] [Vision insurance] [Dental insurance] [Paid holidays] [Employee discount] [Flexible scheduling] [Growth path] [Paid time off]

⚠️ STOP. Wait for response.

**Step 8: Job Posting Summary & Confirmation**
⚠️ IMPORTANT: Do NOT show worker cards in this step. Only show the job summary card.
Show a job posting card using this EXACT format:

"Here's what your posting looks like:"

---JOB_SUMMARY_START---
{
  "role": "Brand Representative",
  "employmentType": "Part-time",
  "market": "Austin",
  "pay": "$18-20/hr",
  "traits": ["Customer Engagement", "Self-Starter"],
  "benefits": ["Vision insurance", "Employee discount"]
}
---JOB_SUMMARY_END---

Fill in the actual values from the conversation. Then ask:
"Does this look right, or is there anything you'd like to change?"
Offer chips: [Looks good, publish it] [Change the role] [Adjust compensation] [Edit benefits]

⚠️ STOP. Wait for response. Do NOT proceed to Step 9 or show worker cards until user clicks "Looks good, publish it".

**Step 9: Publish Success** — ONLY after user confirms "Looks good, publish it"

First, output the job spec (this triggers the job to be added to Published Jobs):
---JOB_SPEC_START---
{"title": "...", "market": "...", "employmentType": "FT|PT|Both", "salaryRange": "...", "salaryType": "hourly|salary", "requirements": [...], "benefits": [...], "description": "...", "idealTraits": [...]}
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

Show 6 COMPACT worker cards (header + store quotes only) using this EXACT format:

---WORKER_CARDS_START---
[
  {
    "name": "Elena R.",
    "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "compact": true,
    "storeQuotes": [
      {"text": "Elena is a quick learner and great with customers.", "source": "Nordstrom Floor Manager"}
    ]
  },
  {
    "name": "David K.",
    "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "compact": true,
    "storeQuotes": [
      {"text": "David brings great energy to the floor.", "source": "lululemon Store Manager"}
    ]
  },
  {
    "name": "Aisha M.",
    "photo": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "compact": true,
    "storeQuotes": [
      {"text": "Aisha has an eye for detail and keeps her section immaculate.", "source": "Sephora Assistant Manager"}
    ]
  },
  {
    "name": "Chris T.",
    "photo": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "compact": true,
    "storeQuotes": [
      {"text": "Chris is a natural leader on the floor.", "source": "Nike Store Lead"}
    ]
  },
  {
    "name": "Maya L.",
    "photo": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "compact": true,
    "storeQuotes": [
      {"text": "Maya has incredible style sense.", "source": "Zara Department Manager"}
    ]
  },
  {
    "name": "Tyler B.",
    "photo": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "compact": true,
    "storeQuotes": [
      {"text": "Tyler consistently gets the highest customer satisfaction scores.", "source": "Apple Store Leader"}
    ]
  }
]
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

Show 3 worker cards using this EXACT format with workHistory:

---WORKER_CARDS_START---
[
  {
    "name": "Sofia M.",
    "photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "aboutMe": "I started on Reflex while finishing school. Now I've worked 47 shifts across 15 brands, and 12 of them have invited me back. I'm ready for something permanent.",
    "workHistory": [
      {"company": "Madewell", "role": "Sales Associate", "duration": "8 mo"},
      {"company": "Anthropologie", "role": "Sales Associate", "duration": "5 mo"},
      {"company": "J.Crew", "role": "Sales Associate", "duration": "4 mo"}
    ],
    "endorsements": [
      {"label": "Customer Engagement", "count": 95, "icon": "chat"},
      {"label": "Positive Attitude", "count": 102, "icon": "smile"},
      {"label": "Team Player", "count": 88, "icon": "users"}
    ],
    "storeQuotes": [
      {"text": "Natural with customers", "source": "Madewell manager"},
      {"text": "Would hire full-time if we had headcount", "source": "J.Crew"}
    ]
  },
  {
    "name": "Jordan F.",
    "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "aboutMe": "I love the fast pace of retail and connecting with customers. Reflex has given me so much experience across different brands, and I'm eager to find a team to grow with long-term.",
    "workHistory": [
      {"company": "MIZZEN+MAIN", "role": "Brand Rep", "duration": "6 mo"},
      {"company": "Faherty", "role": "Sales Associate", "duration": "4 mo"},
      {"company": "Marine Layer", "role": "Sales Associate", "duration": "3 mo"}
    ],
    "endorsements": [
      {"label": "Customer Engagement", "count": 117, "icon": "chat"},
      {"label": "Hustle", "count": 89, "icon": "rocket"},
      {"label": "Team Player", "count": 97, "icon": "users"}
    ],
    "storeQuotes": [
      {"text": "Jordan was awesome!! He was great with customers and seems to be a natural seller.", "source": "MIZZEN+MAIN Store Manager"},
      {"text": "Would definitely book again", "source": "Faherty"}
    ]
  },
  {
    "name": "Marcus T.",
    "photo": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "shiftVerified": true,
    "aboutMe": "I take pride in keeping things organized and running smoothly. I've learned the back-of-house operations at several brands and I'm ready for a permanent home.",
    "workHistory": [
      {"company": "J.Crew", "role": "Stock Associate", "duration": "1 yr"},
      {"company": "Everlane", "role": "Inventory", "duration": "6 mo"},
      {"company": "Bonobos", "role": "Operations", "duration": "4 mo"}
    ],
    "endorsements": [
      {"label": "Work Pace", "count": 104, "icon": "zap"},
      {"label": "Attention to Detail", "count": 91, "icon": "target"},
      {"label": "Preparedness", "count": 86, "icon": "check"}
    ],
    "storeQuotes": [
      {"text": "Marcus picks up tasks without being asked. Great addition to any team.", "source": "J.Crew Store Manager"},
      {"text": "Meticulous with inventory counts", "source": "Everlane"}
    ]
  }
]
---WORKER_CARDS_END---

Then offer chips to direct them toward creating a job posting:
"To connect with these Reflexers, create a job posting and we'll invite them to apply."

Offer chips: [Create a job posting] [See more talent] [Explore a different market]

**Step 3: Create Job Posting**
When user clicks "Create a job posting", redirect them to the Fill a role flow:
"Great! Let's build a job posting together."
Then continue with Step 1 of the "Fill a role" flow (Situation question).

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
- **START WITH SITUATION** — understanding WHY surfaces better candidate matches
- The Replacing flow is longer because it gathers trait data for better matching
- Never use italics in responses`;

// Build system prompt with context
function buildSystemPrompt(userName: string, retailerName: string, retailerClass: string, market: string): string {
  return SYSTEM_PROMPT
    .replace(/\{\{USER_NAME\}\}/g, userName)
    .replace(/\{\{RETAILER_NAME\}\}/g, retailerName)
    .replace(/\{\{RETAILER_CLASS\}\}/g, retailerClass)
    .replace(/\{\{MARKET\}\}/g, market);
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private chat: ChatSession | null = null;
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
    existingHistory?: { role: 'user' | 'model'; content: string }[]
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('API key not configured');
    }

    const prompt = buildSystemPrompt(userName, retailerName, retailerClass, market);

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

  async sendMessage(message: string): Promise<{ text: string; jobSpec?: JobSpec }> {
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

  async startChat(
    userName: string,
    retailerName: string,
    _retailerClass: 'Luxury' | 'Specialty' | 'Big Box' = 'Luxury',
    market: string = 'Austin',
    _existingHistory?: { role: 'user' | 'model'; content: string }[]
  ): Promise<string> {
    this.gathered = {};
    return `Hi ${userName}! I can help you with salary insights and job postings for ${retailerName} in ${market}. What role are you looking to hire for, or would you like to see current market rates?`;
  }

  async sendMessage(message: string): Promise<{ text: string; jobSpec?: JobSpec }> {
    const lower = message.toLowerCase();

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

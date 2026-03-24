# Talent Connect Prompt Architecture

10 creative approaches to structuring the AI-guided hiring experience. Each prioritizes discovery over filtering, surfacing worker talent before formalizing requirements.

---

## 1. Talent-First Discovery

**Main Idea:** Show workers immediately, let the job posting emerge from exploration.

Instead of "what role do you need?", start with "here's who's available." The retailer browses talent first, and the AI learns their preferences from interactions (likes, passes, questions). The job posting crystallizes from observed behavior.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Hey Mike, 23 Shift Verified workers in Austin match Specialty      │
│  retail. Here are a few standouts:                                  │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Sofia M. │  │ James T. │  │ Maya R.  │  │ + 20     │            │
│  │ ★ 4.9    │  │ ★ 4.8    │  │ ★ 4.7    │  │ more     │            │
│  │ 47 shifts│  │ 32 shifts│  │ 28 shifts│  │          │            │
│  │ [♡] [→]  │  │ [♡] [→]  │  │ [♡] [→]  │  │ [Browse] │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User likes 3 workers, all have "Sales Floor" experience
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "Looks like you're drawn to Sales Floor talent with luxury     │
│  experience. Want me to draft a Sales Associate posting based on    │
│  what these workers have in common?"                                │
│                                                                     │
│  [Yes, draft it]  [Show me more like these]  [Different direction]  │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Draft: Sales Associate @ Ariat Austin                              │
│  ─────────────────────────────────────────                          │
│  • FT/PT: Full-time (all 3 liked workers prefer FT)                 │
│  • Rate: $19-22/hr (matches their current expectations)             │
│  • Key traits: Customer engagement, self-starter                    │
│                                                                     │
│  [Publish]  [Adjust]  [See who'd match]                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Conversational Comparison Shopping

**Main Idea:** Frame hiring like shopping — compare "products" (workers) with AI as personal shopper.

The AI acts as a concierge who knows the inventory. Retailers can ask comparative questions and the AI pulls relevant worker profiles inline.

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER: "What's the difference between hiring a cashier vs           │
│         a sales associate for my store?"                            │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "Good question. Here's how they compare in Austin:             │
│                                                                     │
│  ┌─────────────────────┬─────────────────────┐                      │
│  │ CASHIER             │ SALES ASSOCIATE     │                      │
│  ├─────────────────────┼─────────────────────┤                      │
│  │ $16-19/hr           │ $18-22/hr           │                      │
│  │ 12 available now    │ 23 available now    │                      │
│  │ Avg 18 shifts done  │ Avg 31 shifts done  │                      │
│  │ 8 prefer PT         │ 14 prefer FT        │                      │
│  └─────────────────────┴─────────────────────┘                      │
│                                                                     │
│  For Ariat specifically, I'd suggest Sales Associate —              │
│  your brand does well with workers who can clientele.               │
│                                                                     │
│  Want to see top candidates for each?"                              │
│                                                                     │
│  [Show Cashiers]  [Show Sales Associates]  [Compare side-by-side]   │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "Show me Sales Associates"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Top 5 Sales Associates available for Specialty retail in Austin:   │
│                                                                     │
│  1. Sofia M. ✓ Shift Verified                                       │
│     47 shifts • Invited back: 12 stores • FT preferred              │
│     "Strong clienteling skills, elevated brand experience"          │
│     [View Full Profile]  [Add to Shortlist]                         │
│                                                                     │
│  2. James T. ✓ Shift Verified                                       │
│     32 shifts • Invited back: 8 stores • FT preferred               │
│     "Visual merchandising background, adaptable"                    │
│     [View Full Profile]  [Add to Shortlist]                         │
│     ...                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. The "Before You Post" Preview

**Main Idea:** Show exactly who would see the job before it's published.

Creates urgency and confidence. Retailer sees real faces, real stats — "these 18 people will get your posting in their feed."

```
┌─────────────────────────────────────────────────────────────────────┐
│  You're about to post: Sales Associate @ Ariat Austin               │
│  $19-22/hr • Full-time                                              │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  WHO WILL SEE THIS                                          │    │
│  │  ═══════════════════════════════════════════════════════    │    │
│  │                                                             │    │
│  │  18 workers match your criteria                             │    │
│  │                                                             │    │
│  │  ○○○○○○○○○○○○○○○○○○                                         │    │
│  │  ▲              ▲                                           │    │
│  │  │              └── 6 have worked similar brands            │    │
│  │  └── 12 are Shift Verified                                  │    │
│  │                                                             │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │    │
│  │  │ ☺ SM   │ │ ☺ JT   │ │ ☺ MR   │ │ ☺ AK   │ │ +14    │    │    │
│  │  │ 98% ✓  │ │ 95% ✓  │ │ 94% ✓  │ │ 92% ✓  │ │ more   │    │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │    │
│  │                                                             │    │
│  │  TOP MATCH: Sofia M.                                        │    │
│  │  "47 shifts, 12 stores invited back, prefers FT"            │    │
│  │  Has worked: Madewell, Anthropologie, J.Crew                │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  [Publish Now]  [Adjust to reach more]  [Save as draft]             │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "Adjust to reach more"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "To expand your reach, you could:                              │
│                                                                     │
│  • Include Part-time → adds 8 workers (+44%)                        │
│  • Lower min to $18/hr → adds 5 workers (+28%)                      │
│  • Add 'Stock Associate' as alternate → adds 6 workers (+33%)       │
│                                                                     │
│  Which sounds right?"                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Market Mood Board

**Main Idea:** Visual, Pinterest-style exploration of the talent landscape.

Less chat, more visual browsing. Workers displayed as cards with key signals. AI provides context on hover/tap. Good for retailers who think visually.

```
┌─────────────────────────────────────────────────────────────────────┐
│  AUSTIN TALENT BOARD                          [Filter ▼] [Sort ▼]   │
│  Specialty Retail • 47 workers                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │   │
│  │ │  ☺ ✓    │ │ │ │  ☺ ✓    │ │ │ │  ☺ ✓    │ │ │ │  ☺      │ │   │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │   │
│  │ Sofia M.    │ │ James T.    │ │ Maya R.     │ │ Alex K.     │   │
│  │             │ │             │ │             │ │             │   │
│  │ SALES FLOOR │ │ SALES FLOOR │ │ SPECIALIZED │ │ BACK OF HSE │   │
│  │ ▓▓▓▓▓▓▓▓░░  │ │ ▓▓▓▓▓▓▓░░░  │ │ ▓▓▓▓▓▓░░░░  │ │ ▓▓▓▓▓░░░░░  │   │
│  │ 47 shifts   │ │ 32 shifts   │ │ 28 shifts   │ │ 22 shifts   │   │
│  │             │ │             │ │             │ │             │   │
│  │ FT • $20/hr │ │ FT • $19/hr │ │ PT • $21/hr │ │ FT • $17/hr │   │
│  │             │ │             │ │             │ │             │   │
│  │ [♡ Save]    │ │ [♡ Save]    │ │ [♡ Save]    │ │ [♡ Save]    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │    ...      │ │    ...      │ │    ...      │ │    ...      │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ♡ SAVED (3)                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Sofia M. • James T. • Maya R.                               │   │
│  │  [Create posting for these workers]  [Message via Reflex]    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User clicks "Create posting for these workers"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "Based on your saved workers, here's a draft:                  │
│                                                                     │
│  • All 3 have Sales Floor experience                                │
│  • 2/3 prefer Full-time                                             │
│  • Avg rate: $20/hr                                                 │
│  • Common brands: Madewell, Anthropologie                           │
│                                                                     │
│  Draft: Sales Associate, FT, $19-21/hr                              │
│  [Publish]  [Customize]                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. The Guided Scenario

**Main Idea:** AI asks about the *situation*, not the *requirements*.

Instead of "what role?", ask "what's happening at your store?" The AI infers needs from context. More natural, surfaces needs retailer might not articulate.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Hey Mike, what's going on at Ariat Austin that brings you here?    │
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│  │ 📈 Growing      │ │ 🔄 Replacing    │ │ 📅 Seasonal     │        │
│  │ "We're busy,    │ │ "Someone left,  │ │ "Holiday rush   │        │
│  │ need more help" │ │ need to fill"   │ │ is coming"      │        │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘        │
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐                            │
│  │ 🎯 Specialized  │ │ 💬 Just         │                            │
│  │ "Need specific  │ │ exploring       │                            │
│  │ skills"         │ │                 │                            │
│  └─────────────────┘ └─────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "Replacing - someone left"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "Got it — backfilling a role. What did they do?                │
│                                                                     │
│  [Sales floor]  [Cashier]  [Stock/inventory]  [Management]          │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "Sales floor"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "Was this person strong? What made them good (or not)?         │
│                                                                     │
│  This helps me find someone similar — or better."                   │
│                                                                     │
│  [They were great, find someone similar]                            │
│  [They were okay, I want someone better]                            │
│  [They struggled, I need different traits]                          │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "They were great"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "What did they do well? Pick the top 2-3:                      │
│                                                                     │
│  [Customer engagement]  [Self-starter]  [Visual eye]                │
│  [Team player]  [Fast pace]  [Reliable]  [Clienteling]              │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User selects: "Customer engagement", "Reliable"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI: "Perfect. Here are 6 workers in Austin with those exact        │
│  strengths — all have been endorsed for Customer Engagement         │
│  and have 95%+ reliability:                                         │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Sofia M. ✓    │ 98% reliable │ 🗨 Customer Engagement ×12  │     │
│  │ James T. ✓    │ 96% reliable │ 🗨 Customer Engagement ×8   │     │
│  │ ...                                                        │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  [Create posting targeting these workers]  [See all 6]              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Salary Anchoring Flow

**Main Idea:** Lead with money — show what rates attract which talent.

Retailers often have a budget. Start there and show what that budget gets them. Makes trade-offs concrete.

```
┌─────────────────────────────────────────────────────────────────────┐
│  What's your budget range for this hire?                            │
│                                                                     │
│  [$15-17/hr]  [$17-19/hr]  [$19-22/hr]  [$22-26/hr]  [I'm flexible] │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "$17-19/hr"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  AT $17-19/HR IN AUSTIN, HERE'S WHAT YOU GET:                       │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                     │
│  TALENT POOL                         EXPERIENCE LEVEL               │
│  ┌────────────────────────┐          ┌────────────────────────┐     │
│  │ ████████████░░░░░░░░░░ │          │ Entry      ████████    │     │
│  │ 34 workers available   │          │ Mid        ████        │     │
│  │ (out of 47 total)      │          │ Seasoned   ██          │     │
│  └────────────────────────┘          └────────────────────────┘     │
│                                                                     │
│  WHAT $17-19 TYPICALLY GETS:          WHAT $20-22 WOULD GET:        │
│  • 1-2 years retail exp               • 3+ years retail exp         │
│  • General sales skills               • Clienteling / styling       │
│  • 85% reliability avg                • 95%+ reliability avg        │
│  • 8 shifts avg on Reflex             • 25+ shifts on Reflex        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ TOP MATCHES AT YOUR BUDGET:                                  │   │
│  │                                                              │   │
│  │ Alex K.     │ 22 shifts │ 89% reliable │ Stock + Sales exp  │   │
│  │ Jordan P.   │ 18 shifts │ 91% reliable │ Cashier background │   │
│  │ Taylor M.   │ 15 shifts │ 87% reliable │ New to Specialty   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Continue with $17-19]  [Stretch to $19-22]  [See budget impact]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. The "Hot List" Notification Start

**Main Idea:** Proactive AI — surfaces opportunities, not just answers questions.

The AI initiates with timely intel: "3 top workers just became available" or "Your competitor just posted." Creates urgency, positions Reflex as proactive partner.

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔥 TALENT ALERT FOR ARIAT AUSTIN                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  2 highly-rated workers just marked themselves available            │
│  for permanent roles in Austin:                                     │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ⭐ Sofia M.                         NEWLY AVAILABLE         │     │
│  │ ✓ Shift Verified • 47 shifts • 98% reliable                │     │
│  │ Worked: Madewell, Anthropologie, J.Crew                    │     │
│  │ Seeking: FT • $19-22/hr • Sales floor                      │     │
│  │                                                            │     │
│  │ Why she's a fit: Specialty retail exp, FT preference,      │     │
│  │ 12 stores invited her back                                 │     │
│  │                                                            │     │
│  │ [Reach out]  [Save for later]  [Not a fit]                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ⭐ Marcus J.                        NEWLY AVAILABLE         │     │
│  │ ✓ Shift Verified • 38 shifts • 95% reliable                │     │
│  │ Worked: Nordstrom, Bonobos                                 │     │
│  │ Seeking: FT • $20-24/hr • Management track                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  💡 These workers typically get hired within 5 days of              │
│     marking themselves available.                                   │
│                                                                     │
│  [Create posting to attract them]  [Browse all available]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. The Competitive Intel Angle

**Main Idea:** Show what competitors are offering, position hiring as competitive strategy.

Retailers care about competition. Show market rates, who's hiring, and how to win talent away from competitors.

```
┌─────────────────────────────────────────────────────────────────────┐
│  AUSTIN SPECIALTY RETAIL: HIRING LANDSCAPE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  WHO'S HIRING RIGHT NOW                                             │
│  ───────────────────────                                            │
│  Madewell        │ 2 Sales Associates │ $18-20/hr │ Posted 3d ago  │
│  Anthropologie   │ 1 Stock Associate  │ $17/hr    │ Posted 1w ago  │
│  Free People     │ 1 Keyholder        │ $22/hr    │ Posted 2d ago  │
│                                                                     │
│  YOUR POSITION: Ariat (no active postings)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  MARKET INSIGHT                                              │   │
│  │                                                              │   │
│  │  "Specialty retailers in Austin are averaging $18.50/hr      │   │
│  │  for Sales Associates. Madewell's $18-20 range is pulling    │   │
│  │  strong candidates. To compete, consider $19-21/hr."         │   │
│  │                                                              │   │
│  │  3 workers who applied to Madewell also fit your profile.    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [See those 3 workers]  [Create competitive posting]  [Market deep-dive] │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "See those 3 workers"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  These workers applied to Madewell but haven't been hired yet.      │
│  They're still on the market:                                       │
│                                                                     │
│  Sofia M.  │ Applied to Madewell 5 days ago │ Status: Waiting       │
│  James T.  │ Applied to Madewell 4 days ago │ Status: Waiting       │
│  Taylor R. │ Applied to Madewell 6 days ago │ Status: No response   │
│                                                                     │
│  💡 A faster response and competitive offer could win them.         │
│                                                                     │
│  [Reach out to all 3]  [Create posting they'd see]                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. The "Build Your Dream Team" Workshop

**Main Idea:** Frame it as team composition, not individual hires.

Zoom out from single hire to team structure. AI helps think about mix of skills, coverage, and team dynamics.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Let's think about your whole team, not just one hire.              │
│                                                                     │
│  ARIAT AUSTIN - CURRENT TEAM (from Reflex data)                     │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  COVERAGE MAP                                               │    │
│  │                                                             │    │
│  │  Role            │ Current │ Typical │ Gap                  │    │
│  │  ─────────────────────────────────────────────────────────  │    │
│  │  Sales Floor     │ 3       │ 4-5     │ 🔴 -1 to -2         │    │
│  │  Cashier         │ 2       │ 2       │ 🟢 Good             │    │
│  │  Stock           │ 1       │ 1-2     │ 🟡 Borderline       │    │
│  │  Management      │ 1       │ 1       │ 🟢 Good             │    │
│  │                                                             │    │
│  │  FT/PT MIX: 4 FT, 3 PT (typical: 5 FT, 4 PT)               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  AI: "Your main gap is Sales Floor — you're 1-2 people short        │
│  for a store your size. And you're light on PT flexibility.         │
│                                                                     │
│  I'd suggest: 1 FT Sales Associate + 1 PT flex coverage."           │
│                                                                     │
│  [Show candidates for FT Sales]  [Show PT flex options]             │
│  [I just need one hire]  [Tell me more about team mix]              │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "Show candidates for FT Sales"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Here are FT Sales Associates who'd complement your current team:   │
│                                                                     │
│  Your team tends toward: Customer engagement, steady pace           │
│  Consider adding: Self-starter energy, visual merchandising         │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Sofia M.     │ Strong clienteling │ Would add: ⚡ Energy   │     │
│  │ James T.     │ Visual background  │ Would add: 🎨 VM skill │     │
│  │ Maya R.      │ Fast-paced         │ Would add: ⚡ Pace     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  [Compare these 3]  [Add to shortlist]  [See different profiles]    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. The "Worker Story" Narrative Flow

**Main Idea:** Lead with worker stories, not data points.

Humanize the experience. Instead of stats, show worker journeys. Retailers hire people, not profiles.

```
┌─────────────────────────────────────────────────────────────────────┐
│  MEET YOUR AUSTIN TALENT                                            │
│  Real stories from Shift Verified workers                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  "I started on Reflex while finishing school. Now I've       │   │
│  │  worked 47 shifts across 15 brands, and 12 of them have      │   │
│  │  invited me back. I'm ready for something permanent."        │   │
│  │                                                              │   │
│  │  — Sofia M., Sales Associate                                 │   │
│  │    ✓ Shift Verified • Madewell, Anthropologie, J.Crew       │   │
│  │    Looking for: FT role at Specialty retailer               │   │
│  │                                                              │   │
│  │  What stores say about Sofia:                                │   │
│  │  🗨 "Natural with customers" — Madewell manager              │   │
│  │  🗨 "Would hire full-time if we had headcount" — J.Crew      │   │
│  │                                                              │   │
│  │  [Connect with Sofia]  [See her full journey]                │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  "I did 5 years at Nordstrom before moving to Austin.        │   │
│  │  Reflex helped me land on my feet — now I'm looking for      │   │
│  │  the right permanent fit."                                   │   │
│  │                                                              │   │
│  │  — Marcus J., Sales Lead                                     │   │
│  │    ✓ Shift Verified • Nordstrom, Bonobos (38 shifts)        │   │
│  │    Looking for: FT with growth path                          │   │
│  │                                                              │   │
│  │  [Connect with Marcus]  [See his full journey]               │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [See more stories]  [Filter by role]  [I know what I need]         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ User: "Connect with Sofia"
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Great choice. To connect with Sofia, I'll need a few details       │
│  so she knows what she's being considered for.                      │
│                                                                     │
│  What role would this be?                                           │
│  [Sales Associate]  [Keyholder]  [Other]                            │
│                                                                     │
│  Full-time or part-time?                                            │
│  [Full-time]  [Part-time]  [Either]                                 │
│                                                                     │
│  💡 Sofia prefers FT and $19-22/hr — matching that                  │
│     increases your response rate by 3x.                             │
│                                                                     │
│  [Send intro matching her preferences]  [Customize message]         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary: Key Principles

| Approach | Core Insight |
|----------|--------------|
| 1. Talent-First | Show workers before asking for requirements |
| 2. Comparison Shopping | Let retailers browse and compare options |
| 3. Before You Post | Preview exactly who will see the posting |
| 4. Mood Board | Visual, low-friction exploration |
| 5. Guided Scenario | Ask about situation, not specifications |
| 6. Salary Anchoring | Start with budget, show what it gets |
| 7. Hot List | Proactive alerts about available talent |
| 8. Competitive Intel | Frame hiring as competitive advantage |
| 9. Dream Team | Zoom out to team composition |
| 10. Worker Stories | Lead with narratives, not data |

**Common Thread:** Workers are shown early and often. The job posting is an *output* of exploration, not an *input* to matching.

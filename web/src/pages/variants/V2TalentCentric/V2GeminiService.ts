/**
 * V2 Gemini Service - AI chat for V2 Talent Centric flow
 *
 * This is a separate service from V1 gemini.ts - no shared state or memory.
 *
 * V2 Context:
 * - Milestone 1: User Persona - understands who is searching
 * - Milestone 2: Preference Shaping - employment type, brand affinity, experience level
 * - Milestone 3: Meet Your Matches - browse Shift Verified Reflexers
 * - Milestone 4a: In-Platform Chat - retailer-worker communication
 *
 * Guardrails:
 * - Lead with talent, not forms
 * - Every interaction should feel like discovery
 * - No traditional linear chat flow during preference shaping
 * - Chat appears after matching (Milestone 4a)
 */

import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import type { FocusRoute } from '../../../types';

export interface V2ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FocusChatResponse {
  message: string;
  suggestedRoute: FocusRoute | null;
}

export interface V2ChatContext {
  userName: string;
  retailerName: string;
  market: string;
  // Persona context
  persona?: 'individual' | 'multi-store' | 'field' | 'recruiter';
  // Worker context (when chatting with a specific worker in Milestone 4a)
  workerName?: string;
  workerBrands?: string[];
  workerShifts?: number;
  workerSummary?: string;
}

// V2 System Prompt - Persona step: guide users to select their role/location scope
const V2_SYSTEM_PROMPT = `You are a helpful assistant for Reflex, a retail talent platform. You're helping {{USER_NAME}} get started finding Shift Verified Reflexers.

## Your Primary Goal
Help the user identify their role by asking: "How many locations are you overseeing?" Guide them to select one of the four persona cards above:
- **Single-Store Manager**: Managing a team at one location
- **Multi-Store Manager**: Managing multiple locations
- **Regional/District Manager**: Overseeing stores across a district or region
- **HR/Recruiter**: Centralized hiring function across the brand

## Response Guidelines
- Keep responses to 1-2 sentences
- If the user's input matches a persona, acknowledge it and tell them to select the matching card above
- If the user's input is unclear or off-topic, acknowledge it but redirect: "Got it, I've noted that. To get started, let me know how many locations you're overseeing - select one of the options above."
- If the user's input is too short or nonsense, respond: "Sorry, I didn't catch that. First, let me know how many locations you're overseeing."
- Do NOT mention specific markets or locations
- Do NOT discuss employment types, brand affinity, or experience levels yet - that comes later

## Examples
- "I manage one store" → "Got it - you're managing a single store. Select **Single-Store Manager** above to continue."
- "multiple locations" → "Got it - you're managing multiple locations. Select **Multi-Store Manager** above to continue."
- "I'm a DM" → "Got it - you're overseeing a district. Select **Regional/District Manager** above to continue."
- "I need help hiring" → "I can help with that! But first, let me know how many locations you're overseeing - select one of the options above."
- "asdf" → "Sorry, I didn't catch that. First, let me know how many locations you're overseeing."

## Rules
- Don't use emojis unless the user does first
- Never use em-dashes (—). Use a comma or rewrite the sentence instead.
- Always guide the user to select a persona card
- Do NOT make up interpretations for unclear input`;

// Focus Step System Prompt - help user narrow down preferences
const V2_FOCUS_SYSTEM_PROMPT = `You are a helpful assistant for Reflex, a retail talent platform. You're helping {{USER_NAME}} narrow down their search preferences to find Shift Verified Reflexers that fit their needs.

## Your Role
- Help the user articulate what they're looking for in retail talent
- Guide them toward the three preference areas: employment type, brand affinity, experience level
- Understand their specific needs and translate them into search criteria
- Keep responses focused and actionable

## Current Context
- User: {{USER_NAME}}
- They've already told us their role - now we're helping them define what kind of talent they want
- Do NOT mention specific markets or locations - keep responses location-agnostic

## The Three Preference Areas
1. **Employment Type**: Full-time, Part-time, or Flex (just need shift help)
2. **Brand Affinity**: Which brands' talent do they trust? What tier/style? (luxury, contemporary, athletic, etc.)
3. **Experience Level**: New to Reflex, Rising talent (5-30 shifts), Seasoned sales pro (30+), Management ready

## Response Guidelines
- Keep responses to 2-3 sentences
- Ask clarifying questions to understand their needs
- Suggest which preference area might be most relevant based on what they say
- If they mention hours/availability → guide to Employment Type
- If they mention brands, style, culture fit → guide to Brand Affinity
- If they mention skills, experience, reliability → guide to Experience Level

## Examples
- "I need someone reliable" → Ask about experience level, suggest Seasoned sales pros with 30+ shifts
- "Similar to our brand" → Ask what tier they are, suggest Brand Affinity to filter by brands they trust
- "Just need weekend help" → Suggest Employment Type, ask about part-time vs flex shifts
- "Looking for a leader" → Suggest Experience Level, specifically Management ready tier

## Rules
- Don't use emojis unless the user does first
- Never use em-dashes (—). Use a comma or rewrite the sentence instead.
- Always suggest a clear next step
- Keep the focus on narrowing down their talent search
- Reference the three cards they see: Type of employment, Brand affinity, Experience level
- If the user's input is unclear, too short, or doesn't make sense, respond with: "Sorry, I didn't catch that. To continue, select one of the three cards above - **Type of employment**, **Brand affinity**, or **Experience level** - or tell me more about what you're looking for."
- Do NOT make up interpretations for unclear input - ask for clarification instead

## Help and Summary Requests
If the user asks where to start, asks for help, or asks for a summary of the options, give a concise one-line description of each of the three filters, then route them to Employment Type as the default starting point. Important nuances:
- Type of employment is about the KIND of role being filled (full-time, part-time, flex), NOT a worker filter
- Brand affinity is where retailers pick brands whose talent they trust, essentially targeted poaching from respected retailers
- Experience level filters by career stage: rising talent, experienced, seasoned pro, or proven leader

Example response: "Here's a quick rundown: **Type of employment** tells us what kind of role you're filling, full-time, part-time, or flex shifts. **Brand affinity** is where you pick the brands whose talent you trust. **Experience level** filters by career stage, from rising talent to management-ready. Start with employment type to set the context."

## Job Role and Salary Questions
If the user mentions a specific role they're hiring for (Sales Associate, Store Manager, Team Member, Keyholder, etc.), acknowledge it and route them to Experience Level. Example: "Good call. For a [role], experience level is the strongest filter we have. When you connect with a worker you can discuss the specific title, responsibilities, and comp."

If the user asks about salary, pay, or hourly rate, answer using the market data below, then route to Experience Level. Keep it factual and helpful.

## Salary Reference Data (from Reflex job postings)
Sales Associate:
- Austin: $13-20/hr (avg ~$15-16/hr)
- New York: $17-24/hr
- Atlanta: $12-20/hr
- National range: $13-24/hr depending on market and brand tier

Team Member:
- Austin: ~$18/hr
- New York: ~$24/hr
- National range: $15-24/hr

Store Manager:
- Austin: $23/hr or $55-75k/year
- National range: $50-80k/year ($24-38/hr equivalent)

Assistant Store Manager:
- Austin: $22-31/hr
- National range: $19-30/hr

Keyholder / Lead:
- Atlanta: $19-21/hr
- National range: $16-22/hr

After answering a salary question, always add: "Once you connect with a worker through Reflex, you can discuss exact comp, role specifics, and benefits directly."

## Output Format
IMPORTANT: Always respond with a valid JSON object and nothing else:
{"message": "your response text here", "route": null}
Set "route" to one of: "employment", "brands", "experience" when you can clearly identify which preference area matches the user's input. Set to null if the input is unclear, off-topic, or matches multiple areas equally.`;

export type V2ChatMode = 'persona' | 'focus';

function buildSystemPrompt(context: V2ChatContext, mode: V2ChatMode = 'persona'): string {
  const basePrompt = mode === 'focus' ? V2_FOCUS_SYSTEM_PROMPT : V2_SYSTEM_PROMPT;
  let prompt = basePrompt
    .replace(/\{\{USER_NAME\}\}/g, context.userName)
    .replace(/\{\{RETAILER_NAME\}\}/g, context.retailerName)
    .replace(/\{\{MARKET\}\}/g, context.market);

  // Add persona context if available (only for persona mode)
  if (mode === 'persona' && context.persona) {
    const personaLabels: Record<string, string> = {
      individual: 'Single-Store Manager',
      'multi-store': 'Multi-Store Manager',
      field: 'Regional/District Manager',
      recruiter: 'Recruiter',
    };
    prompt += `\n\n## Current User Persona\n${personaLabels[context.persona] || context.persona}`;
  }

  // Add worker context if chatting with specific worker (Milestone 4a)
  if (context.workerName) {
    prompt += `\n\n## Current Worker Context
You are helping {{USER_NAME}} connect with ${context.workerName}.
${context.workerBrands ? `Brands worked: ${context.workerBrands.join(', ')}` : ''}
${context.workerShifts ? `Shifts on Reflex: ${context.workerShifts}` : ''}
${context.workerSummary ? `Summary: ${context.workerSummary}` : ''}

Suggest conversation starters like:
- "Hi ${context.workerName}, I saw you worked at [Brand] - how did you find that experience?"
- "What type of role are you most interested in?"
- "What days/hours work best for you?"`;
  }

  return prompt;
}

export class V2GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private chat: ChatSession | null = null;
  private context: V2ChatContext | null = null;
  private mode: V2ChatMode = 'persona';

  constructor(apiKey?: string, mode: V2ChatMode = 'persona') {
    this.mode = mode;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async startChat(context: V2ChatContext): Promise<string> {
    this.context = context;

    if (!this.genAI) {
      console.log('[V2GeminiService] No API key, using mock responses');
      return this.getMockGreeting(context);
    }

    try {
      const systemPrompt = buildSystemPrompt(context, this.mode);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const readyMessage = this.mode === 'focus'
        ? "Understood. I'm ready to help narrow down talent preferences."
        : "Understood. I'm ready to help connect retailers with talent through discovery.";

      const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: readyMessage }] },
      ];

      this.chat = model.startChat({ history });
      console.log('[V2GeminiService] Chat initialized with Gemini API, mode:', this.mode);

      // Return the initial greeting
      return this.getMockGreeting(context);
    } catch (error) {
      console.error('[V2GeminiService] Failed to initialize chat:', error);
      return this.getMockGreeting(context);
    }
  }

  private getMockGreeting(_context: V2ChatContext): string {
    if (this.mode === 'focus') {
      return `What are you looking for in your next hire? Tell me about your ideal candidate and I'll help you narrow down the search.`;
    }
    return `First, let me know how many locations you're overseeing.`;
  }

  async sendMessage(message: string): Promise<FocusChatResponse> {
    // Use mock responses when no API key (no chat session)
    if (!this.chat) {
      console.log('[V2GeminiService] No chat session, using mock response');
      return this.mode === 'focus' ? this.getMockFocusResponse(message) : this.getMockResponse(message);
    }

    try {
      console.log('[V2GeminiService] Sending message to Gemini:', message);
      const response = await this.chat.sendMessage(message);
      const text = response.response.text();
      console.log('[V2GeminiService] Gemini response:', text.substring(0, 100) + '...');

      // Focus mode returns JSON with { message, route }
      if (this.mode === 'focus') {
        try {
          const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          const parsed = JSON.parse(cleaned);
          return {
            message: parsed.message || text,
            suggestedRoute: (['employment', 'brands', 'experience'].includes(parsed.route) ? parsed.route : null) as FocusRoute | null,
          };
        } catch {
          return { message: text, suggestedRoute: null };
        }
      }

      return { message: text, suggestedRoute: null };
    } catch (error) {
      console.error('[V2GeminiService] Gemini API error:', error);
      return this.mode === 'focus' ? this.getMockFocusResponse(message) : this.getMockResponse(message);
    }
  }

  // Focus mode mock responses - return message + suggestedRoute when input maps to a clear area
  private getMockFocusResponse(message: string): FocusChatResponse {
    const lower = message.toLowerCase().trim();
    const isQuestion = lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('can') || lower.startsWith('do') || lower.startsWith('is') || lower.startsWith('are') || lower.startsWith('which');

    const r = (msg: string, route: FocusRoute | null = null): FocusChatResponse => ({ message: msg, suggestedRoute: route });

    // Too short or unclear
    if (lower.length < 3) {
      return r(`Sorry, I didn't catch that. To continue, select one of the three cards above - **Type of employment**, **Brand affinity**, or **Experience level**.`);
    }

    // Help / summary requests — explain all three filters, default to employment
    const isHelpRequest = lower.includes('help') || lower.includes('where do i start') || lower.includes('where should i start') || lower.includes('where to start') || lower.includes('summary') || lower.includes('summarize') || lower.includes('explain') || lower.includes('what are my options') || lower.includes('what are the options') || lower.includes('what does each') || lower.includes('walk me through') || lower.includes('not sure where') || lower.includes("don't know where") || lower.includes('overview') || lower.includes('which one') || lower.includes('what order');
    if (isHelpRequest) {
      return r(`Here's a quick rundown: **Type of employment** tells us what kind of role you're filling, full-time, part-time, or flex shifts. **Brand affinity** is where you pick the brands whose talent you trust. **Experience level** filters by career stage, from rising talent to management-ready. Start with employment type to set the context.`, 'employment');
    }

    // Platform questions — no route
    if (isQuestion && (lower.includes('shift verified') || lower.includes('reflexer'))) {
      return r(`Shift Verified Reflexers are workers who've completed shifts on our platform with verified performance data - ratings, punctuality, and retailer feedback. To find them, use the cards above to filter by what matters most to you.`);
    }
    if (isQuestion && (lower.includes('how does') || lower.includes('how do i') || lower.includes('how can'))) {
      return r(`You can narrow your search using the three cards above. **Type of employment** filters by commitment level, **Brand affinity** finds workers from similar retailers, and **Experience level** shows proven track records. Which would you like to start with?`);
    }
    if (isQuestion && (lower.includes('what can') || lower.includes('what do') || lower.includes('what else') || lower.includes('give me') || lower.includes('show me'))) {
      return r(`I can help you find the right talent. The three cards above let you filter by: **Type of employment** (full-time, part-time, flex), **Brand affinity** (workers from similar brands), or **Experience level** (new to seasoned). Select one to refine your matches.`);
    }
    if (isQuestion && (lower.includes('difference') || lower.includes('between'))) {
      return r(`Good question! **Type of employment** is about hours and commitment. **Brand affinity** matches workers who've succeeded at brands like yours. **Experience level** filters by proven track record on our platform. Each gives you a different lens on the talent pool.`);
    }

    // Employment Type signals
    if (lower.includes('weekend') || lower.includes('part-time') || lower.includes('part time') || lower.includes('hours') || lower.includes('availability')) {
      return r(`Got it - sounds like scheduling flexibility matters. I'd start with **Type of employment** to filter by full-time, part-time, or flex.`, 'employment');
    }
    if (lower.includes('full-time') || lower.includes('full time') || lower.includes('permanent')) {
      return r(`Noted - you're looking for a permanent hire. **Type of employment** is the right place to start.`, 'employment');
    }
    if (lower.includes('flex') || lower.includes('shift') || lower.includes('temporary') || lower.includes('cover')) {
      return r(`Got it - you need flexible coverage. Start with **Type of employment** to find workers ready for shifts.`, 'employment');
    }

    // Brand Affinity signals
    if (lower.includes('brand') || lower.includes('culture') || lower.includes('fit') || lower.includes('similar') || lower.includes('luxury') || lower.includes('contemporary') || lower.includes('athletic')) {
      return r(`I've noted that culture fit matters to you. **Brand affinity** lets you filter by workers who've succeeded at brands similar to yours.`, 'brands');
    }
    if (lower.includes('trust') || lower.includes('quality') || lower.includes('trained')) {
      return r(`Got it - you want someone who already knows the ropes. **Brand affinity** is a great starting point.`, 'brands');
    }

    // Salary / pay / rate questions — give market data, route to experience
    if (lower.includes('salary') || lower.includes('hourly') || lower.includes('wage') || lower.includes('/hr') || lower.includes('per hour') || lower.includes('pay rate') || lower.includes('compensation') || lower.includes('how much') || lower.includes('enough') || lower.includes('competitive')) {
      const mentionsSM = lower.includes('store manager') || lower.includes('sm ') || lower.includes(' sm');
      const mentionsASM = lower.includes('assistant manager') || lower.includes('asm');
      const mentionsKH = lower.includes('keyholder') || lower.includes('key holder') || lower.includes('lead');
      const mentionsTM = lower.includes('team member');
      if (mentionsSM) {
        return r(`Store Manager roles typically run $55-75k/year ($23-36/hr) nationally, with Austin listings showing $23/hr on the low end and $67k/year for more senior roles. That's a solid range for experienced talent. Once you connect with a worker through Reflex, you can discuss exact comp directly.`, 'experience');
      }
      if (mentionsASM) {
        return r(`Assistant Store Manager roles nationally run $19-30/hr. In Austin we're seeing $22-31/hr in current postings, which is competitive. Once you connect with a worker through Reflex, you can discuss comp and benefits directly.`, 'experience');
      }
      if (mentionsKH) {
        return r(`Keyholder and Lead Associate roles typically run $16-22/hr nationally. That's a fair range for someone with retail floor experience and key responsibilities. Once you connect through Reflex, you can align on exact compensation.`, 'experience');
      }
      if (mentionsTM) {
        return r(`Team Member roles are running ~$18/hr in Austin and up to $24/hr in higher cost-of-living markets like New York. Nationally the range is $15-24/hr. Once you connect with a worker through Reflex, you can get into the specifics.`, 'experience');
      }
      // Generic salary question — no role specified, give top-role overview
      return r(`Here's what current market data shows for Austin retail:\n\n- **Sales Associate**: $14-17/hr\n- **Team Member**: ~$18/hr\n- **Assistant Manager**: $22-31/hr\n- **Store Manager**: $23/hr or $55-75k/year\n\nNew York runs higher across the board ($17-24/hr for floor roles), Atlanta a bit lower. Once you connect with a worker through Reflex, you can talk exact comp and benefits directly. To find the right candidates, I'd start with experience level.`, 'experience');
    }

    // Specific job role mentions — route to experience
    if (lower.includes('store manager') || lower.includes('general manager') || lower.includes('gm ') || lower.includes(' gm')) {
      return r(`Good call. For a Store Manager, experience level is the strongest filter we have. You'll find workers with management backgrounds in the Proven Leader tier. When you connect, you can work out the specific title, comp, and responsibilities.`, 'experience');
    }
    if (lower.includes('assistant manager') || lower.includes('asm') || lower.includes('asst manager')) {
      return r(`For an Assistant Manager role, I'd start with experience level. Workers in the Seasoned Pro or Proven Leader tiers have the retail depth you're looking for. You can talk specifics with them once you connect.`, 'experience');
    }
    if (lower.includes('keyholder') || lower.includes('key holder') || lower.includes('key-holder')) {
      return r(`For a Keyholder, I'd start with experience level. You want someone with solid retail floor time and a proven track record. The Seasoned Pro tier is a great place to start.`, 'experience');
    }
    if (lower.includes('sales associate') || lower.includes('floor associate') || lower.includes('retail associate')) {
      return r(`For a Sales Associate, experience level gives you the most flexibility. You can go Experienced or Seasoned Pro for someone who needs minimal ramp time, or Rising Talent if you're willing to develop them.`, 'experience');
    }
    if (lower.includes('team member') || lower.includes('floor staff') || lower.includes('floor team')) {
      return r(`For a Team Member role, I'd start with experience level. Depending on what you need, Rising Talent through Seasoned Pro all have strong candidates. We'll narrow it from there.`, 'experience');
    }
    if (lower.includes('job role') || lower.includes('role first') || lower.includes('start with role') || lower.includes('by role') || lower.includes('specific role')) {
      return r(`That makes sense. Role usually maps closely to experience level, so that's where I'd start. It'll surface workers with the right background, and when you connect you can get into the specifics of title and responsibilities.`, 'experience');
    }

    // Experience Level signals
    if (lower.includes('reliable') || lower.includes('dependable') || lower.includes('punctual') || lower.includes('show up')) {
      return r(`Reliability is a top priority - I'd start with **Experience level**. Seasoned pros have 30+ shifts and proven track records.`, 'experience');
    }
    if (lower.includes('experience') || lower.includes('skilled') || lower.includes('seasoned') || lower.includes('veteran')) {
      return r(`Got it - experience matters. Start with **Experience level** to filter by seasoned pros or management-ready workers.`, 'experience');
    }
    if (lower.includes('train') || lower.includes('new') || lower.includes('fresh') || lower.includes('entry')) {
      return r(`Noted - you're open to developing new talent. Check out the rising talent tier in **Experience level**.`, 'experience');
    }
    if (lower.includes('leader') || lower.includes('management') || lower.includes('supervisor') || lower.includes('manager')) {
      return r(`Got it - you're looking for leadership potential. Start with **Experience level** and choose the management-ready tier.`, 'experience');
    }

    // Generic — acknowledge, no route
    if (lower.includes('best') || lower.includes('good') || lower.includes('recommend') || lower.includes('more')) {
      return r(`I've got your requirements noted. To refine your search, select one of the three cards above: **Type of employment** for scheduling, **Brand affinity** for culture fit, or **Experience level** for proven reliability.`);
    }
    if (isQuestion) {
      return r(`Great question! The best way to find what you're looking for is to use the cards above. **Type of employment** for hours/commitment, **Brand affinity** for culture fit, or **Experience level** for track record. Which matters most to you?`);
    }

    return r(`Got it, I've noted that. To continue, select one of the three cards above to refine your search - **Type of employment**, **Brand affinity**, or **Experience level**.`);
  }

  // Persona mode mock responses — always no route (persona step doesn't suggest focus areas)
  private getMockResponse(message: string): FocusChatResponse {
    const lower = message.toLowerCase().trim();
    const r = (msg: string): FocusChatResponse => ({ message: msg, suggestedRoute: null });

    if (lower.length < 3) {
      return r(`Sorry, I didn't catch that. First, let me know how many locations you're overseeing - one store, multiple locations, a district/region, or hiring nationally?`);
    }
    if (lower.includes('single') || lower.includes('one store') || lower.includes('one location') || lower.includes('1 store') || lower.includes('1 location')) {
      return r(`Got it - you're managing a single store. Select **Single-Store Manager** above to continue.`);
    }
    if (lower.includes('multi') || lower.includes('multiple') || lower.includes('few') || lower.includes('several') || lower.includes('2') || lower.includes('3')) {
      return r(`Got it - you're managing multiple locations. Select **Multi-Store Manager** above to continue.`);
    }
    if (lower.includes('regional') || lower.includes('district') || lower.includes('field') || lower.includes('area') || lower.includes('territory')) {
      return r(`Got it - you're overseeing a district or region. Select **Regional/District Manager** above to continue.`);
    }
    if (lower.includes('recruit') || lower.includes('hr') || lower.includes('hiring') || lower.includes('national') || lower.includes('company') || lower.includes('brand')) {
      return r(`Got it - you're handling recruiting across the brand. Select **HR/Recruiter** above to continue.`);
    }
    if (lower.includes('help') || lower.includes('looking') || lower.includes('need') || lower.includes('want')) {
      return r(`I can help with that! But first, let me know how many locations you're overseeing - select one of the options above.`);
    }
    if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('can') || lower.startsWith('why')) {
      return r(`Good question! I'll be able to help more once I know your role. Are you managing one store, multiple locations, a district/region, or recruiting nationally? Select an option above.`);
    }
    return r(`Got it, I've noted that. To get started, let me know how many locations you're overseeing - select one of the options above.`);
  }

  // Update context (e.g., when persona is selected)
  updateContext(updates: Partial<V2ChatContext>): void {
    if (this.context) {
      this.context = { ...this.context, ...updates };
    }
  }

  // Reset chat (start fresh)
  reset(): void {
    this.chat = null;
    this.context = null;
  }
}

// Create a fresh instance (no memory from previous)
export function createFreshV2GeminiService(apiKey?: string, mode: V2ChatMode = 'persona'): V2GeminiService {
  return new V2GeminiService(apiKey, mode);
}

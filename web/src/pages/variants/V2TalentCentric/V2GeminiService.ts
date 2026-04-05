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

export interface V2ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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

// V2 System Prompt - focused on talent discovery and connection
const V2_SYSTEM_PROMPT = `You are a helpful assistant for Reflex, a retail talent platform. You help retailers like {{USER_NAME}} at {{RETAILER_NAME}} discover and connect with Shift Verified Reflexers in {{MARKET}}.

## Your Role
- Help retailers discover retail talent through a discovery-first experience
- Guide preference shaping: employment type, brand affinity, experience level
- Facilitate introductions between retailers and workers
- Keep interactions feeling like discovery, not interrogation

## V2 Flow Context
This is the "Talent Centric" variant where retailers browse and discover Shift Verified Reflexers first. The goal is connection, not job posting.

## Persona Types
- **Single-Store Manager**: Managing a team at one location
- **Multi-Store Manager**: Managing multiple locations in same market
- **Regional/District Manager**: Overseeing stores across regions
- **Recruiter**: Centralized hiring function

## Preference Shaping Areas
1. **Employment Type**: Full-time, Part-time, or "I just need help" (flex shift)
2. **Brand Affinity**: Which brands' talent do they trust? (loose matching, not hard filter)
3. **Experience Level**: New to retail, Rising talent, Seasoned pro, Management ready

## Context
- User: {{USER_NAME}}
- Brand: {{RETAILER_NAME}}
- Market: {{MARKET}}

## Response Style
- Keep responses concise (2-3 sentences unless providing detailed info)
- Use bullet points for lists
- Bold key terms with **markdown**
- Always offer clear next steps
- Be helpful and professional, not overly casual
- Lead with talent discovery, not forms

## Guardrails
- Never make up worker data - only reference real Reflexers if provided
- Don't push job posting - this flow ends in connection, not posting
- Keep brand matching loose - it's about trust/affinity, not strict filtering
- If user asks about posting a job, redirect to V1 flow or explain this is discovery-focused

## Rules
- Don't use emojis unless the user does first
- Always offer actionable next steps
- Keep the focus on connecting retailers with talent`;

// Focus Step System Prompt - help user narrow down preferences
const V2_FOCUS_SYSTEM_PROMPT = `You are a helpful assistant for Reflex, a retail talent platform. You're helping {{USER_NAME}} narrow down their search preferences to find the right Shift Verified Reflexers in {{MARKET}}.

## Your Role
- Help the user articulate what they're looking for in retail talent
- Guide them toward the three preference areas: employment type, brand affinity, experience level
- Understand their specific needs and translate them into search criteria
- Keep responses focused and actionable

## Current Context
- User: {{USER_NAME}}
- Market: {{MARKET}}
- They've already told us their role - now we're helping them define what kind of talent they want

## The Three Preference Areas
1. **Employment Type**: Full-time, Part-time, or Flex (just need shift help)
2. **Brand Affinity**: Which brands' talent do they trust? What tier/style? (luxury, contemporary, athletic, etc.)
3. **Experience Level**: New to Reflex, Rising talent (5-30 shifts), Seasoned pro (30+), Management ready

## Response Guidelines
- Keep responses to 2-3 sentences
- Ask clarifying questions to understand their needs
- Suggest which preference area might be most relevant based on what they say
- If they mention hours/availability → guide to Employment Type
- If they mention brands, style, culture fit → guide to Brand Affinity
- If they mention skills, experience, reliability → guide to Experience Level

## Examples
- "I need someone reliable" → Ask about experience level, suggest Seasoned pros with 30+ shifts
- "Similar to our brand" → Ask what tier they are, suggest Brand Affinity to filter by brands they trust
- "Just need weekend help" → Suggest Employment Type, ask about part-time vs flex shifts
- "Looking for a leader" → Suggest Experience Level, specifically Management ready tier

## Rules
- Don't use emojis unless the user does first
- Always suggest a clear next step
- Keep the focus on narrowing down their talent search
- Reference the three cards they see: Type of employment, Brand affinity, Experience level
- If the user's input is unclear, too short, or doesn't make sense, respond with: "Sorry, I didn't catch that. To continue, select one of the three cards above - **Type of employment**, **Brand affinity**, or **Experience level** - or tell me more about what you're looking for."
- Do NOT make up interpretations for unclear input - ask for clarification instead`;

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
    return `Tell me a bit about your role - are you hiring for a single store, managing multiple locations, or recruiting across the region? This helps me find the right talent for your needs.`;
  }

  async sendMessage(message: string): Promise<string> {
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
      return text;
    } catch (error) {
      console.error('[V2GeminiService] Gemini API error:', error);
      return this.mode === 'focus' ? this.getMockFocusResponse(message) : this.getMockResponse(message);
    }
  }

  // Focus mode mock responses - answer questions + guide to the three cards
  private getMockFocusResponse(message: string): string {
    const lower = message.toLowerCase().trim();
    const isQuestion = lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('can') || lower.startsWith('do') || lower.startsWith('is') || lower.startsWith('are') || lower.startsWith('which');

    // Too short or unclear input
    if (lower.length < 3) {
      return `Sorry, I didn't catch that. To continue, select one of the three cards above - **Type of employment**, **Brand affinity**, or **Experience level**.`;
    }

    // Questions about the platform/process
    if (isQuestion && (lower.includes('shift verified') || lower.includes('reflexer'))) {
      return `Shift Verified Reflexers are workers who've completed shifts on our platform with verified performance data - ratings, punctuality, and retailer feedback. To find them, use the cards above to filter by what matters most to you.`;
    }

    if (isQuestion && (lower.includes('how does') || lower.includes('how do i') || lower.includes('how can'))) {
      return `You can narrow your search using the three cards above. **Type of employment** filters by commitment level, **Brand affinity** finds workers from similar retailers, and **Experience level** shows proven track records. Which would you like to start with?`;
    }

    if (isQuestion && (lower.includes('what can') || lower.includes('what do') || lower.includes('what else') || lower.includes('give me') || lower.includes('show me'))) {
      return `I can help you find the right talent. The three cards above let you filter by: **Type of employment** (full-time, part-time, flex), **Brand affinity** (workers from similar brands), or **Experience level** (new to seasoned). Select one to refine your matches.`;
    }

    if (isQuestion && (lower.includes('difference') || lower.includes('between'))) {
      return `Good question! **Type of employment** is about hours and commitment. **Brand affinity** matches workers who've succeeded at brands like yours. **Experience level** filters by proven track record on our platform. Each gives you a different lens on the talent pool.`;
    }

    // Availability/hours mentions → Employment Type
    if (lower.includes('weekend') || lower.includes('part-time') || lower.includes('part time') || lower.includes('hours') || lower.includes('availability')) {
      return `Got it, I've noted your scheduling needs. To filter by availability, select **Type of employment** above - you can choose full-time, part-time, or flex workers.`;
    }

    if (lower.includes('full-time') || lower.includes('full time') || lower.includes('permanent')) {
      return `Noted - you're looking for a permanent hire. Select **Type of employment** above and choose Full-time to see Reflexers seeking long-term positions.`;
    }

    if (lower.includes('flex') || lower.includes('shift') || lower.includes('temporary') || lower.includes('cover')) {
      return `Got it - you need flexible coverage. Select **Type of employment** above and choose Flex to find workers ready for shifts. You can try them out before committing.`;
    }

    // Brand/culture mentions → Brand Affinity
    if (lower.includes('brand') || lower.includes('culture') || lower.includes('fit') || lower.includes('similar') || lower.includes('luxury') || lower.includes('contemporary') || lower.includes('athletic')) {
      return `I've noted that culture fit matters to you. Select **Brand affinity** above to filter by workers who've succeeded at brands similar to yours.`;
    }

    if (lower.includes('trust') || lower.includes('quality') || lower.includes('trained')) {
      return `Got it - you want someone who already knows the ropes. Select **Brand affinity** above to find workers with experience at similar retailers.`;
    }

    // Skills/reliability mentions → Experience Level
    if (lower.includes('reliable') || lower.includes('dependable') || lower.includes('punctual') || lower.includes('show up')) {
      return `Reliability noted as a priority. Select **Experience level** above - Seasoned pros have 30+ shifts and proven track records.`;
    }

    if (lower.includes('experience') || lower.includes('skilled') || lower.includes('seasoned') || lower.includes('veteran')) {
      return `Got it - experience matters. Select **Experience level** above to filter by Seasoned pros or Management ready tiers.`;
    }

    if (lower.includes('train') || lower.includes('new') || lower.includes('fresh') || lower.includes('entry')) {
      return `Noted - you're open to developing new talent. Select **Experience level** above and check out the New to Reflex tier.`;
    }

    if (lower.includes('leader') || lower.includes('management') || lower.includes('supervisor') || lower.includes('manager')) {
      return `Got it - you're looking for leadership potential. Select **Experience level** above and choose the Management ready tier.`;
    }

    // Generic/unclear → Acknowledge + guide to cards
    if (lower.includes('best') || lower.includes('good') || lower.includes('recommend') || lower.includes('more')) {
      return `I've got your requirements noted. To refine your search, select one of the three cards above: **Type of employment** for scheduling, **Brand affinity** for culture fit, or **Experience level** for proven reliability.`;
    }

    // Catch-all for questions
    if (isQuestion) {
      return `Great question! The best way to find what you're looking for is to use the cards above. **Type of employment** for hours/commitment, **Brand affinity** for culture fit, or **Experience level** for track record. Which matters most to you?`;
    }

    // Default - acknowledge + guide to the three cards
    return `Got it, I've noted that. To continue, select one of the three cards above to refine your search - **Type of employment**, **Brand affinity**, or **Experience level**.`;
  }

  private getMockResponse(message: string): string {
    const lower = message.toLowerCase();
    const market = this.context?.market || 'Austin';

    // Persona-related
    if (lower.includes('single') || lower.includes('one store') || lower.includes('one location')) {
      return `Got it - you're managing a single store. I'll focus on finding talent specifically for your ${market} location. What's most important to you in a team member?`;
    }

    if (lower.includes('multi') || lower.includes('multiple')) {
      return `Managing multiple locations is challenging! I can help you find talent across your stores in ${market}. Would you like to focus on one location first, or find candidates who could work across multiple sites?`;
    }

    if (lower.includes('regional') || lower.includes('district') || lower.includes('field')) {
      return `As a regional manager, you have a broader view of talent needs. I can show you Reflexers across different markets. Which areas are you most focused on right now?`;
    }

    if (lower.includes('recruit')) {
      return `Great - as a recruiter, you're probably looking to build a pipeline of qualified candidates. I can help you discover Shift Verified Reflexers who've proven themselves on the floor. What roles are you prioritizing?`;
    }

    // Employment type
    if (lower.includes('full-time') || lower.includes('full time')) {
      return `Looking for full-time talent! I'll prioritize Reflexers who've indicated they're seeking full-time roles. Many of our Shift Verified workers are actively looking for permanent positions.`;
    }

    if (lower.includes('part-time') || lower.includes('part time')) {
      return `Part-time can be a great way to start. I'll show you Reflexers who are open to part-time work - many of them have proven reliability across multiple shifts.`;
    }

    if (lower.includes('help') || lower.includes('flex') || lower.includes('shift')) {
      return `Sounds like you could use some immediate support! You can book a Reflex shift to try out workers before committing to a permanent hire. Want me to show you available Reflexers for a shift?`;
    }

    // Experience level
    if (lower.includes('new') || lower.includes('entry') || lower.includes('beginner')) {
      return `New talent can bring fresh energy! I'll look for Reflexers who are early in their retail journey but have shown great potential through their shifts.`;
    }

    if (lower.includes('experience') || lower.includes('seasoned') || lower.includes('senior')) {
      return `Experienced retail pros are valuable. I'll prioritize Reflexers with 30+ shifts and strong track records - these are the workers who've proven themselves repeatedly.`;
    }

    if (lower.includes('management') || lower.includes('manager') || lower.includes('lead')) {
      return `Looking for leadership potential! I'll show you Reflexers who have management experience or have demonstrated leadership qualities across their shifts.`;
    }

    // Brand-related
    if (lower.includes('brand') || lower.includes('similar') || lower.includes('like us')) {
      return `Brand experience matters. What brands' talent do you trust? I can find Reflexers who've worked at similar retailers - it's a good proxy for culture fit and skills.`;
    }

    // Default response - ask about their role scope
    return `Sounds good! Do you manage one location, multiple, a district or region, or are you hiring across the brand nationally?`;
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

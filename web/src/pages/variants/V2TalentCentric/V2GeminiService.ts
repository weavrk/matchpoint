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

function buildSystemPrompt(context: V2ChatContext): string {
  let prompt = V2_SYSTEM_PROMPT
    .replace(/\{\{USER_NAME\}\}/g, context.userName)
    .replace(/\{\{RETAILER_NAME\}\}/g, context.retailerName)
    .replace(/\{\{MARKET\}\}/g, context.market);

  // Add persona context if available
  if (context.persona) {
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

  constructor(apiKey?: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async startChat(context: V2ChatContext): Promise<string> {
    this.context = context;

    if (!this.genAI) {
      // Return mock greeting if no API key
      return this.getMockGreeting(context);
    }

    const systemPrompt = buildSystemPrompt(context);
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I'm ready to help connect retailers with talent through discovery." }] },
    ];

    this.chat = model.startChat({ history });

    // Return the initial greeting
    return this.getMockGreeting(context);
  }

  private getMockGreeting(_context: V2ChatContext): string {
    return `Tell me a bit about your role - are you hiring for a single store, managing multiple locations, or recruiting across the region? This helps me find the right talent for your needs.`;
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chat || !this.context) {
      // Mock responses when no API
      return this.getMockResponse(message);
    }

    try {
      const response = await this.chat.sendMessage(message);
      return response.response.text();
    } catch (error) {
      console.error('V2 Gemini error:', error);
      return this.getMockResponse(message);
    }
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
export function createFreshV2GeminiService(apiKey?: string): V2GeminiService {
  return new V2GeminiService(apiKey);
}

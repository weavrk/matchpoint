import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import type { JobSpec } from '../types';

const SYSTEM_PROMPT = `You are a friendly hiring assistant for Reflex, a retail labor marketplace. You're helping a retailer create a job posting for a permanent hire.

Your goal is to have a natural conversation to understand what they're looking for, then output a structured job spec when ready.

Information to gather (conversationally, not as a checklist):
- What type of retail role? (footwear, apparel, beauty, sporting goods, home, general retail)
- What brand tier experience? (mid-tier like Gap/H&M, elevated like Nordstrom/J.Crew, or luxury like Gucci/Neiman Marcus)
- Full-time, part-time, or open to both?
- Any specific skills or qualities needed?
- Basic job details (title, key responsibilities)

Keep responses short and conversational (2-3 sentences max). Ask one question at a time. Be encouraging but not overly enthusiastic.

When you have enough information to create a job spec, respond with EXACTLY this format (the system will parse it):

---JOB_SPEC_START---
{
  "title": "...",
  "market": "New York City",
  "brandTier": ["mid" | "elevated" | "luxury"],
  "preference": "FT" | "PT" | "Both",
  "requirements": ["..."],
  "description": "..."
}
---JOB_SPEC_END---

After outputting the spec, briefly confirm what you've created and ask if they'd like to adjust anything.`;

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private chat: ChatSession | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async startChat(retailerName: string, storeType: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('API key not configured');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    this.chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: 'model',
          parts: [{ text: "Understood. I'll help create a job posting through natural conversation." }],
        },
      ],
    });

    const initial = await this.chat.sendMessage(
      `The retailer "${retailerName}" is creating a permanent hire job posting. They specialize in ${storeType}. Start the conversation with a friendly greeting and first question.`
    );

    return initial.response.text();
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
// Simulates realistic conversation by tracking what info has been gathered
export class MockGeminiService {
  private gathered: {
    roleType?: string;
    brandTier?: 'mid' | 'elevated' | 'luxury';
    preference?: 'FT' | 'PT' | 'Both';
    skills?: string[];
    title?: string;
  } = {};

  async startChat(_retailerName: string, _storeType: string): Promise<string> {
    this.gathered = {};
    return "Hi! I'm here to help you create a job posting for a permanent hire. What type of retail role are you looking to fill?";
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
        text: `${roleAck} sounds great! What level of brand experience are you looking for — mid-tier like Gap or H&M, elevated like Nordstrom or J.Crew, or luxury like Gucci or Neiman Marcus?`,
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

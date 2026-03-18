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

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
export class MockGeminiService {
  private messageCount = 0;

  async startChat(_retailerName: string, _storeType: string): Promise<string> {
    return "Hi! I'm here to help you create a job posting for a permanent hire. What type of retail role are you looking to fill?";
  }

  async sendMessage(message: string): Promise<{ text: string; jobSpec?: JobSpec }> {
    this.messageCount++;

    // Simple mock conversation flow
    if (this.messageCount === 1) {
      return {
        text: `Great, ${message.toLowerCase().includes('sales') ? 'a sales role' : 'that role'} sounds good! Are you looking for someone with mid-tier, elevated, or luxury brand experience?`,
      };
    }

    if (this.messageCount === 2) {
      return {
        text: 'Perfect. Would this be a full-time or part-time position?',
      };
    }

    if (this.messageCount >= 3) {
      return {
        text: "Excellent! I've created your job posting based on our conversation. Here are the candidates that match your criteria!",
        jobSpec: {
          title: 'Sales Associate',
          market: 'New York City',
          brandTier: ['elevated'],
          preference: 'FT',
          requirements: ['Customer service experience', 'Retail background', 'Team player'],
          description: 'Looking for an experienced sales associate to join our team.',
          retailerName: '',
        },
      };
    }

    return { text: 'Could you tell me more about what you need?' };
  }
}

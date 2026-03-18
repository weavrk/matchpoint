import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Star } from 'lucide-react';
import { ChatInterface } from '../components/Chat';
import { WorkerGrid } from '../components/Workers';
import { GeminiService, MockGeminiService } from '../services/gemini';
import { matchWorkers } from '../services/matching';
import { SAMPLE_WORKERS } from '../data/workers';
import { SAMPLE_RETAILER } from '../data/retailer';
import type { ChatMessage, MatchedWorker, JobSpec } from '../types';
import './PermanentHiring.css';

export function PermanentHiring() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedWorkers, setMatchedWorkers] = useState<MatchedWorker[]>([]);
  const [jobSpec, setJobSpec] = useState<JobSpec | null>(null);
  const [geminiService] = useState(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      return new GeminiService(apiKey);
    }
    console.log('No API key found, using mock service');
    return new MockGeminiService();
  });

  const startConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await geminiService.startChat(
        SAMPLE_RETAILER.name,
        SAMPLE_RETAILER.brandTier
      );
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to start chat:', error);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hi! I'm here to help you create a job posting for a permanent hire. What type of role are you looking to fill?",
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  }, [geminiService]);

  useEffect(() => {
    startConversation();
  }, [startConversation]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.jobSpec) {
        const spec = { ...response.jobSpec, retailerName: SAMPLE_RETAILER.name };
        setJobSpec(spec);
        const matches = matchWorkers(SAMPLE_WORKERS, spec);
        setMatchedWorkers(matches);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <div className="permanent-hiring-page">
      <header className="page-header">
        <div className="page-header-icon">
          <Briefcase size={24} />
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Permanent Hiring</h1>
          <p className="page-subtitle">
            Find your next great hire from workers you already trust
          </p>
        </div>

      </header>

      <div className="hiring-content">
        <div className="chat-column">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>

        <div className="results-column">
          {matchedWorkers.length > 0 ? (
            <WorkerGrid
              workers={matchedWorkers}
              title={jobSpec?.title ? `Matches for "${jobSpec.title}"` : 'Matched Workers'}
            />
          ) : (
            <div className="results-placeholder">
              <div className="placeholder-content">
                <Briefcase size={48} strokeWidth={1} />
                <h3>Worker matches will appear here</h3>
                <p>
                  Complete the conversation to see workers that match your job requirements
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

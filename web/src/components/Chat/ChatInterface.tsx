import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { GREETING_CHIPS } from '../../services/gemini';
import chatbotAvatarUrl from '../../../../assets/logo-and-backgrounds/chatbot.svg?url';
import './ChatInterface.css';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle greeting chip click
  const handleGreetingChip = (chipId: string) => {
    if (chipId === 'create-posting') {
      onSendMessage("I'd like to create a job posting");
    } else if (chipId === 'explore-market') {
      onSendMessage("Show me market data");
    }
  };

  // Check if we should show greeting chips (only after first assistant message, before user responds)
  const showGreetingChips = messages.length === 1 && messages[0].role === 'assistant';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-header-icon">
          <Sparkles size={20} />
        </div>
        <div className="chat-header-content">
          <h2 className="chat-header-title">Search Retail Talent</h2>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`chat-message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            {message.role === 'assistant' && (
              <div className="message-avatar" aria-hidden="true">
                <img
                  src={chatbotAvatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="message-avatar-img"
                />
              </div>
            )}
            <div className="message-content">
              <p>{message.content}</p>
              {/* Greeting chips - show right after first assistant message */}
              {index === 0 && message.role === 'assistant' && showGreetingChips && (
                <div className="greeting-chips">
                  {GREETING_CHIPS.map(chip => (
                    <button
                      key={chip.id}
                      className="greeting-chip"
                      onClick={() => handleGreetingChip(chip.id)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar" aria-hidden="true">
              <img
                src={chatbotAvatarUrl}
                alt=""
                width={32}
                height={32}
                className="message-avatar-img"
              />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || isLoading}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

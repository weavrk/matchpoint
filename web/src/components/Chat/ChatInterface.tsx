import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types';
import { GREETING_CHIPS } from '../../services/gemini';
import chatbotAvatarUrl from '../../../../assets/logo-and-backgrounds/chatbot.svg?url';
import './ChatInterface.css';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  userName?: string;
  market?: string;
}

// Parse message content to extract inline chips [like this]
function parseMessageWithChips(content: string): { text: string; chips: string[] } {
  const chipPattern = /\[([^\]]+)\]/g;
  const chips: string[] = [];
  let match;

  while ((match = chipPattern.exec(content)) !== null) {
    chips.push(match[1]);
  }

  // Remove the chip patterns from the text for cleaner display
  const text = content.replace(chipPattern, '').replace(/\s{2,}/g, ' ').trim();

  return { text, chips };
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  userName = 'Mike',
  market = 'Austin'
}: ChatInterfaceProps) {
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
    if (chipId === 'fill-role') {
      onSendMessage("I need to fill a permanent role at my store");
    } else if (chipId === 'meet-talent') {
      onSendMessage(`I want to meet ${market} talent`);
    } else if (chipId === 'explore-market') {
      onSendMessage(`Show me ${market} market data`);
    } else if (chipId === 'explore-other') {
      onSendMessage("I want to explore a different market");
    } else if (chipId === 'how-it-works') {
      onSendMessage("Tell me how Talent Connect works");
    }
  };

  // Replace {market} placeholder in chip labels
  const getChipLabel = (label: string) => {
    return label.replace('{market}', market);
  };

  // Show welcome screen when no messages yet
  const showWelcomeScreen = messages.length === 0;

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

  // Welcome screen view
  if (showWelcomeScreen) {
    return (
      <div className="chat-welcome">
        <h1 className="chat-greeting">
          Hey {userName}, let's connect with<br className="chat-greeting-break" />
          retail talent in your area.
        </h1>

        <div className="chat-text-area">
          <form className="chat-text-area-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="chat-text-area-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`You can create a job posting or explore the ${market} market. Tell me what you want to do first or select a quick prompt below.`}
              rows={1}
              disabled={isLoading}
            />
            <div className="chat-text-area-footer">
              <div className="chat-text-area-chips">
                {GREETING_CHIPS.map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    className="chat-text-area-chip"
                    onClick={() => handleGreetingChip(chip.id)}
                  >
                    {getChipLabel(chip.label)}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="chat-text-area-send"
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Conversation view (after first message)
  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((message) => {
          const isAssistant = message.role === 'assistant';
          const parsed = isAssistant ? parseMessageWithChips(message.content) : null;

          return (
            <div
              key={message.id}
              className={`chat-message ${isAssistant ? 'assistant' : 'user'}`}
            >
              {isAssistant && (
                <div className="message-avatar" aria-hidden="true">
                  <img
                    src={chatbotAvatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="message-avatar-img"
                  />
                </div>
              )}
              <div className="message-content">
                {isAssistant ? (
                  <>
                    <ReactMarkdown>{parsed?.text || message.content}</ReactMarkdown>
                    {parsed && parsed.chips.length > 0 && (
                      <div className="message-chips">
                        {parsed.chips.map((chip, idx) => {
                          const colonIndex = chip.indexOf(':');
                          const hasBoldPart = colonIndex > 0 && colonIndex < 30;
                          return (
                            <button
                              key={idx}
                              type="button"
                              className="message-chip"
                              onClick={() => onSendMessage(chip)}
                              disabled={isLoading}
                            >
                              {hasBoldPart ? (
                                <>
                                  <strong>{chip.slice(0, colonIndex)}</strong>
                                  {chip.slice(colonIndex)}
                                </>
                              ) : (
                                chip
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar" aria-hidden="true">
              <img
                src={chatbotAvatarUrl}
                alt=""
                width={40}
                height={40}
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

import { useState, useRef, useEffect } from 'react';
import { Send, Check, PartyPopper, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, MatchedWorker } from '../../types';
import chatbotAvatarUrl from '../../../../assets/logo-and-backgrounds/chatbot.svg?url';
import { NavChipGrid, getNavChips } from '../NavChips';
import { WorkerCardTeaser } from '../Workers';
import { SAMPLE_WORKERS } from '../../data/workers';
import './ChatInterface.css';

// Names to cycle through in the greeting
const GREETING_NAMES = [
  'Mike', 'Trevor', 'Shannon', 'Nate', 'Micah', 'Katherine', 'Cayley',
  'Evan', 'Juan', 'Julie', 'Ashlee', 'Jeremy', 'Sam', 'Jasmine',
  'Emily', 'Olivia', 'Mary', 'Hans', 'Hadley', 'Leigh Ann'
];

// Format date for session divider
function formatSessionDate(date: Date): string {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const day = date.getDate();

  if (isToday) {
    return `Today, ${month} ${day}`;
  }

  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

// Session Date Divider Component
function SessionDateDivider({ date }: { date: Date }) {
  return (
    <div className="session-date-divider">
      <span className="session-date-text">{formatSessionDate(date)}</span>
    </div>
  );
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onBranchFromMessage?: (messageId: string, newMessage: string) => void;
  isLoading: boolean;
  market?: string;
}

// Worker card IDs parsed from AI response - we look these up from SAMPLE_WORKERS
type WorkerCardIds = string[];

// Role selector type for stacked groups with 3-column role grids
interface RoleSelector {
  groups: {
    header: string;
    roles: string[];
  }[];
}

// Job summary type for posting preview
interface JobSummary {
  role: string;
  employmentType: string;
  market: string;
  pay: string;
  traits?: string[];
  benefits?: string[];
}

// Success banner type for milestone celebrations
interface SuccessBanner {
  title: string;
  subtitle: string;
}

// Parse worker card IDs from message content - returns array of worker IDs to look up
function parseWorkerCards(content: string): { text: string; workerCardIds: WorkerCardIds | null } {
  const workerCardsMatch = content.match(/---WORKER_CARDS_START---([\s\S]*?)---WORKER_CARDS_END---/);

  if (workerCardsMatch) {
    try {
      const parsed = JSON.parse(workerCardsMatch[1].trim());
      // Support both array of IDs ["w001", "w002"] and array of objects [{id: "w001"}, ...]
      const workerCardIds: string[] = Array.isArray(parsed)
        ? parsed.map((item: string | { id: string }) => typeof item === 'string' ? item : item.id)
        : [];
      const text = content
        .replace(/---WORKER_CARDS_START---[\s\S]*?---WORKER_CARDS_END---/, '')
        .trim();
      return { text, workerCardIds };
    } catch (e) {
      console.error('Failed to parse worker cards:', e);
    }
  }

  return { text: content, workerCardIds: null };
}

// Parse role selector from message content
function parseRoleSelector(content: string): { text: string; roleSelector: RoleSelector | null } {
  const roleSelectorMatch = content.match(/---ROLE_SELECTOR_START---([\s\S]*?)---ROLE_SELECTOR_END---/);

  if (roleSelectorMatch) {
    try {
      const roleSelector = JSON.parse(roleSelectorMatch[1].trim());
      const text = content
        .replace(/---ROLE_SELECTOR_START---[\s\S]*?---ROLE_SELECTOR_END---/, '')
        .trim();
      return { text, roleSelector };
    } catch (e) {
      console.error('Failed to parse role selector:', e);
    }
  }

  return { text: content, roleSelector: null };
}

// Parse job summary from message content
function parseJobSummary(content: string): { text: string; jobSummary: JobSummary | null } {
  const jobSummaryMatch = content.match(/---JOB_SUMMARY_START---([\s\S]*?)---JOB_SUMMARY_END---/);

  if (jobSummaryMatch) {
    try {
      const jobSummary = JSON.parse(jobSummaryMatch[1].trim());
      const text = content
        .replace(/---JOB_SUMMARY_START---[\s\S]*?---JOB_SUMMARY_END---/, '')
        .trim();
      return { text, jobSummary };
    } catch (e) {
      console.error('Failed to parse job summary:', e);
    }
  }

  return { text: content, jobSummary: null };
}

// Parse success banner from message content
function parseSuccessBanner(content: string): { text: string; successBanner: SuccessBanner | null } {
  const successBannerMatch = content.match(/---SUCCESS_BANNER_START---([\s\S]*?)---SUCCESS_BANNER_END---/);

  if (successBannerMatch) {
    try {
      const successBanner = JSON.parse(successBannerMatch[1].trim());
      const text = content
        .replace(/---SUCCESS_BANNER_START---[\s\S]*?---SUCCESS_BANNER_END---/, '')
        .trim();
      return { text, successBanner };
    } catch (e) {
      console.error('Failed to parse success banner:', e);
    }
  }

  return { text: content, successBanner: null };
}

// Parse message content to extract inline chips [like this]
function parseMessageWithChips(content: string): { text: string; chips: string[]; isMultiSelect: boolean; workerCardIds: WorkerCardIds | null; roleSelector: RoleSelector | null; jobSummary: JobSummary | null; successBanner: SuccessBanner | null } {
  // First extract worker card IDs if present
  const { text: textWithoutCards, workerCardIds } = parseWorkerCards(content);

  // Then extract role selector if present
  const { text: textWithoutSelector, roleSelector } = parseRoleSelector(textWithoutCards);

  // Then extract job summary if present
  const { text: textWithoutSummary, jobSummary } = parseJobSummary(textWithoutSelector);

  // Then extract success banner if present
  const { text: textWithoutBanner, successBanner } = parseSuccessBanner(textWithoutSummary);

  const chipPattern = /\[([^\]]+)\]/g;
  const chips: string[] = [];
  let match;

  while ((match = chipPattern.exec(textWithoutBanner)) !== null) {
    chips.push(match[1]);
  }

  // Remove the chip patterns from the text for cleaner display
  const text = textWithoutBanner.replace(chipPattern, '').replace(/\s{2,}/g, ' ').trim();

  // Detect multi-select prompts (e.g., "Pick the top 2-3", "select 2-3", "choose multiple", "select all that apply", "positive traits", "type out qualities")
  const isMultiSelect = /pick\s+(the\s+)?(top\s+)?\d+-\d+|select\s+\d+-\d+|choose\s+multiple|select\s+all\s+that\s+apply|positive\s+traits|type\s+out\s+qualities/i.test(text);

  return { text, chips, isMultiSelect, workerCardIds, roleSelector, jobSummary, successBanner };
}

// Job Summary Card Component
function JobSummaryCard({ summary }: { summary: JobSummary }) {
  return (
    <div className="job-summary-card">
      <div className="job-summary-header">
        <h3 className="job-summary-title">{summary.role}</h3>
        <div className="job-summary-meta">
          <span className="job-summary-tag">{summary.employmentType}</span>
          <span className="job-summary-location">{summary.market}</span>
        </div>
      </div>

      <div className="job-summary-section">
        <span className="job-summary-label">Compensation</span>
        <span className="job-summary-pay">{summary.pay}</span>
      </div>

      {summary.traits && summary.traits.length > 0 && (
        <div className="job-summary-section">
          <span className="job-summary-label">Ideal Traits</span>
          <div className="job-summary-chips">
            {summary.traits.map((trait, idx) => (
              <span key={idx} className="job-summary-chip">{trait}</span>
            ))}
          </div>
        </div>
      )}

      {summary.benefits && summary.benefits.length > 0 && (
        <div className="job-summary-section">
          <span className="job-summary-label">Benefits</span>
          <div className="job-summary-chips">
            {summary.benefits.map((benefit, idx) => (
              <span key={idx} className="job-summary-chip">{benefit}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Success Banner Component - celebration milestone
function SuccessBannerComponent({ banner }: { banner: SuccessBanner }) {
  return (
    <div className="success-banner">
      <div className="success-banner-icon">
        <PartyPopper size={32} />
      </div>
      <div className="success-banner-content">
        <h3 className="success-banner-title">{banner.title}</h3>
        <p className="success-banner-subtitle">{banner.subtitle}</p>
      </div>
      <div className="success-banner-confetti">
        <span className="confetti-piece"></span>
        <span className="confetti-piece"></span>
        <span className="confetti-piece"></span>
        <span className="confetti-piece"></span>
        <span className="confetti-piece"></span>
      </div>
    </div>
  );
}

// Helper to look up workers from SAMPLE_WORKERS by ID
function getWorkersByIds(ids: string[]): MatchedWorker[] {
  return ids
    .map(id => SAMPLE_WORKERS.find(w => w.id === id))
    .filter((w): w is MatchedWorker => w !== undefined)
    .map(w => ({ ...w, matchScore: 95, matchReasons: ['Strong match'] }));
}

// Role Selector Component - 4 column grid with category headers, single-select sends immediately
function RoleSelectorComponent({
  roleSelector,
  selectedRoles,
  onRoleSelect,
  disabled
}: {
  roleSelector: RoleSelector;
  selectedRoles: string[];
  onRoleSelect: (role: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="role-selector-stacked">
      {roleSelector.groups.map((group, groupIdx) => (
        <div key={groupIdx} className="role-selector-group">
          <h5 className="type-chip-header-lg">{group.header}</h5>
          <div className="role-selector-roles-grid">
            {group.roles.map((role, roleIdx) => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  key={roleIdx}
                  type="button"
                  className={`role-selector-chip type-chip-label ${isSelected ? 'selected' : ''}`}
                  onClick={() => onRoleSelect(role)}
                  disabled={disabled}
                >
                  <span>{role}</span>
                  <span className="chip-icon">
                    {isSelected ? <Check size={14} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Pick a random name on each page load
const getRandomName = () => GREETING_NAMES[Math.floor(Math.random() * GREETING_NAMES.length)];

export function ChatInterface({
  messages,
  onSendMessage,
  onBranchFromMessage,
  isLoading,
  market = 'Austin'
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [selectedChipsByMessage, setSelectedChipsByMessage] = useState<Record<string, string[]>>({});
  const [activeNavChip, setActiveNavChip] = useState<string | null>(null);
  const [displayName] = useState(getRandomName);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset input when a new message is added (but keep chip selections)
  useEffect(() => {
    setInput('');
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle greeting card click
  const handleGreetingCard = (cardId: string) => {
    setActiveNavChip(cardId);
    if (cardId === 'fill-role') {
      onSendMessage("I need to fill a permanent role at my store");
    } else if (cardId === 'meet-talent') {
      onSendMessage(`I want to meet ${market} talent`);
    } else if (cardId === 'explore-market') {
      onSendMessage(`Show me ${market} market data`);
    } else if (cardId === 'check-jobs') {
      onSendMessage("Check on my published jobs");
    } else if (cardId === 'how-it-works') {
      onSendMessage("Tell me how Talent Connect works");
    } else if (cardId === 'just-exploring') {
      onSendMessage("Just exploring for now");
    }
  };

  // Navigation chips for both welcome and conversation views
  const navChips = getNavChips(market);

  // Show welcome screen when no messages yet
  const showWelcomeScreen = messages.length === 0;

  // Get the last assistant message ID for tracking current selections
  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
  const lastAssistantMessageId = lastAssistantMessage?.id || '';
  const currentSelectedChips = selectedChipsByMessage[lastAssistantMessageId] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // If there are selected chips, send those
    if (currentSelectedChips.length > 0) {
      const message = input.trim()
        ? `${currentSelectedChips.join(', ')}. ${input.trim()}`
        : currentSelectedChips.join(', ');
      onSendMessage(message);
      setInput('');
    } else if (input.trim()) {
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
        <h1 className="chat-greeting type-tagline">
          Hey {displayName}, let's connect with{' '}
          <br className="chat-greeting-break" />
          retail talent in your area.
        </h1>

        <div className="chat-text-area">
          <div className="chat-text-area-form">
            <p className="chat-text-area-header type-prompt-question">
              Where do you want to start?
            </p>

            <NavChipGrid
              chips={navChips}
              onChipClick={handleGreetingCard}
              disabled={isLoading}
              variant="welcome"
            />

            <form className="welcome-input-row" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="welcome-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Somewhere else?"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`welcome-send-btn ${input.trim() ? 'has-input' : ''}`}
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Find the last assistant message index for showing chips only on the latest
  const lastAssistantIndex = messages.reduce((lastIdx, msg, idx) =>
    msg.role === 'assistant' ? idx : lastIdx, -1);

  // Conversation view (after first message)
  return (
    <div className="chat-interface">
      {/* Session date divider - fixed above scrollable area */}
      <SessionDateDivider date={new Date()} />
      <div className="chat-messages">
        {/* Nav chips wrapped in chat message container */}
        <div className="chat-message assistant initial-nav-chips">
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
            <NavChipGrid
              chips={navChips}
              activeChipId={activeNavChip}
              onChipClick={handleGreetingCard}
              disabled={isLoading}
              variant="compact"
            />
          </div>
        </div>
        {messages.map((message, messageIndex) => {
          const isAssistant = message.role === 'assistant';
          const parsed = isAssistant ? parseMessageWithChips(message.content) : null;
          const isLastAssistantMessage = isAssistant && messageIndex === lastAssistantIndex;
          const workerCards = parsed?.workerCardIds ? getWorkersByIds(parsed.workerCardIds) : [];
          const hasWorkerCards = workerCards.length > 0;
          const hasRoleSelector = parsed?.roleSelector !== null;

          return (
            <div
              key={message.id}
              className={`chat-message ${isAssistant ? 'assistant' : 'user'}${hasWorkerCards ? ' has-worker-cards' : ''}${hasRoleSelector ? ' has-role-selector' : ''}`}
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
                    {/* Worker Cards Grid - uses shared WorkerCardTeaser component */}
                    {hasWorkerCards && (
                      <div className="worker-cards-grid">
                        {workerCards.map((worker) => (
                          <WorkerCardTeaser key={worker.id} worker={worker} />
                        ))}
                      </div>
                    )}
                    {/* Role Selector Grid - single select, shows animation then sends */}
                    {parsed?.roleSelector && (
                      <RoleSelectorComponent
                        roleSelector={parsed.roleSelector}
                        selectedRoles={selectedChipsByMessage[message.id] || []}
                        onRoleSelect={(role) => {
                          // Show selection with animation, then send after delay
                          setSelectedChipsByMessage(prev => ({ ...prev, [message.id]: [role] }));
                          setTimeout(() => {
                            if (isLastAssistantMessage) {
                              onSendMessage(role);
                            } else if (onBranchFromMessage) {
                              // Branch from this message - clear everything after and start new path
                              onBranchFromMessage(message.id, role);
                            }
                          }, 300);
                        }}
                        disabled={isLoading}
                      />
                    )}
                    {/* Job Summary Card */}
                    {parsed?.jobSummary && (
                      <JobSummaryCard summary={parsed.jobSummary} />
                    )}
                    {/* Success Banner */}
                    {parsed?.successBanner && (
                      <SuccessBannerComponent banner={parsed.successBanner} />
                    )}
                    {parsed && parsed.chips.length > 0 && (() => {
                      const messageSelectedChips = selectedChipsByMessage[message.id] || [];
                      // For previous messages with multi-select, check if selections changed
                      const hasMultiSelectChanges = parsed.isMultiSelect && !isLastAssistantMessage && messageSelectedChips.length > 0;

                      return (
                        <>
                          <div className={`message-chips ${parsed.isMultiSelect ? 'multi-select' : ''}`}>
                            {parsed.chips.map((chip, idx) => {
                              const colonIndex = chip.indexOf(':');
                              const hasBoldPart = colonIndex > 0 && colonIndex < 30;
                              const isSelected = messageSelectedChips.includes(chip);

                              const handleChipClick = () => {
                                if (parsed.isMultiSelect) {
                                  // Toggle selection for multi-select
                                  setSelectedChipsByMessage(prev => {
                                    const current = prev[message.id] || [];
                                    const updated = current.includes(chip)
                                      ? current.filter(c => c !== chip)
                                      : [...current, chip];
                                    return { ...prev, [message.id]: updated };
                                  });
                                } else {
                                  // Single select - show animation then send/branch
                                  setSelectedChipsByMessage(prev => ({ ...prev, [message.id]: [chip] }));
                                  setTimeout(() => {
                                    if (isLastAssistantMessage) {
                                      onSendMessage(chip);
                                    } else if (onBranchFromMessage) {
                                      // Branch from this message - clear everything after and start new path
                                      onBranchFromMessage(message.id, chip);
                                    }
                                  }, 300);
                                }
                              };

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`message-chip type-chip-label ${isSelected ? 'selected' : ''}`}
                                  onClick={handleChipClick}
                                  disabled={isLoading}
                                >
                                  <span>{hasBoldPart ? <><strong>{chip.slice(0, colonIndex)}</strong>:{chip.slice(colonIndex + 1)}</> : chip}</span>
                                  <span className="chip-icon">
                                    {parsed.isMultiSelect
                                      ? (isSelected ? <Check size={14} /> : <Plus size={14} />)
                                      : (isSelected ? <Check size={14} /> : null)
                                    }
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {/* Show send button for multi-select on previous messages when selections change */}
                          {hasMultiSelectChanges && (
                            <button
                              type="button"
                              className="message-chips-send-btn"
                              onClick={() => {
                                if (onBranchFromMessage) {
                                  onBranchFromMessage(message.id, messageSelectedChips.join(', '));
                                }
                              }}
                              disabled={isLoading}
                            >
                              <Send size={16} />
                              <span>Update selection</span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                    {/* Inline input area for last assistant message */}
                    {isLastAssistantMessage && !isLoading && (
                      <form className="inline-input-form" onSubmit={handleSubmit}>
                        <div className="inline-input-wrapper">
                          <textarea
                            ref={inputRef}
                            className="inline-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={hasRoleSelector ? "Looking for a different job title?" : "Type your message..."}
                            rows={1}
                          />
                          <button
                            type="submit"
                            className="inline-send-btn"
                            disabled={!input.trim() && currentSelectedChips.length === 0}
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </form>
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
    </div>
  );
}

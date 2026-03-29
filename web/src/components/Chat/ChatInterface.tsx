import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Rocket, Users, Star, Smile, Target, Zap, CheckCircle, Shield, RefreshCw, Shirt, Check, PartyPopper } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types';
import chatbotAvatarUrl from '../../../../assets/logo-and-backgrounds/chatbot.svg?url';
import { NavChipGrid, getNavChips } from '../NavChips';
import './ChatInterface.css';

// Names to cycle through in the greeting
const GREETING_NAMES = [
  'Mike', 'Trevor', 'Shannon', 'Nate', 'Micah', 'Katherine', 'Cayley',
  'Evan', 'Juan', 'Julie', 'Ashlee', 'Jeremy', 'Sam', 'Jasmine',
  'Emily', 'Olivia', 'Mary', 'Hans', 'Hadley', 'Leigh Ann'
];

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  market?: string;
}

// Worker card type for talent preview
interface WorkerCard {
  name: string;
  photo?: string;
  shiftVerified?: boolean;
  aboutMe?: string;
  workHistory?: { company: string; role: string; duration?: string }[];
  endorsements?: { label: string; count: number; icon: string }[];
  storeQuotes?: { text: string; source: string }[];
  compact?: boolean; // If true, show only header + store quotes
}

// Role selector type for multi-column role selection
interface RoleSelector {
  columns: {
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

// Icon mapping for endorsements
const endorsementIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  chat: MessageSquare,
  rocket: Rocket,
  users: Users,
  star: Star,
  smile: Smile,
  target: Target,
  zap: Zap,
  check: CheckCircle,
  shield: Shield,
  refresh: RefreshCw,
  shirt: Shirt,
};

// Parse worker cards from message content
function parseWorkerCards(content: string): { text: string; workerCards: WorkerCard[] | null } {
  const workerCardsMatch = content.match(/---WORKER_CARDS_START---([\s\S]*?)---WORKER_CARDS_END---/);

  if (workerCardsMatch) {
    try {
      const workerCards = JSON.parse(workerCardsMatch[1].trim());
      const text = content
        .replace(/---WORKER_CARDS_START---[\s\S]*?---WORKER_CARDS_END---/, '')
        .trim();
      return { text, workerCards };
    } catch (e) {
      console.error('Failed to parse worker cards:', e);
    }
  }

  return { text: content, workerCards: null };
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
function parseMessageWithChips(content: string): { text: string; chips: string[]; isMultiSelect: boolean; workerCards: WorkerCard[] | null; roleSelector: RoleSelector | null; jobSummary: JobSummary | null; successBanner: SuccessBanner | null } {
  // First extract worker cards if present
  const { text: textWithoutCards, workerCards } = parseWorkerCards(content);

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

  return { text, chips, isMultiSelect, workerCards, roleSelector, jobSummary, successBanner };
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

// Reusable Worker Card Header Component
function WorkerCardHeader({ worker }: { worker: WorkerCard }) {
  return (
    <div className="worker-card-header">
      <div className="worker-card-avatar">
        {worker.photo ? (
          <img src={worker.photo} alt={worker.name} />
        ) : (
          worker.name.charAt(0)
        )}
      </div>
      <h4 className="worker-card-name">{worker.name}</h4>
      {worker.shiftVerified && (
        <span className="worker-card-verified-tag">✓ Shift Verified</span>
      )}
    </div>
  );
}

// Reusable Store Quotes Component
function WorkerCardStoreQuotes({ quotes }: { quotes: { text: string; source: string }[] }) {
  return (
    <div className="worker-card-store-quotes">
      <span className="worker-card-section-label">What stores say</span>
      {quotes.map((sq, i) => (
        <div key={i} className="worker-card-store-quote">
          <span className="store-quote-icon">🗨</span>
          <div className="store-quote-content">
            <span className="store-quote-text">"{sq.text}"</span>
            <span className="store-quote-source">{sq.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Worker Card Component - Full or Compact variant
function WorkerCardComponent({ worker }: { worker: WorkerCard }) {
  // Compact variant: header + store quotes only
  if (worker.compact) {
    return (
      <div className="worker-card-chat worker-card-compact">
        <WorkerCardHeader worker={worker} />
        {worker.storeQuotes && worker.storeQuotes.length > 0 && (
          <WorkerCardStoreQuotes quotes={worker.storeQuotes} />
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="worker-card-chat">
      <WorkerCardHeader worker={worker} />

      {/* About Me quote */}
      {worker.aboutMe && (
        <div className="worker-card-about">
          <span className="quote-mark">"</span>
          <p>{worker.aboutMe}</p>
        </div>
      )}

      {/* Work History */}
      {worker.workHistory && worker.workHistory.length > 0 && (
        <div className="worker-card-work-history">
          <span className="worker-card-section-label">Work History</span>
          <div className="work-history-items">
            {worker.workHistory.map((job, i) => (
              <div key={i} className="work-history-item">
                <span className="work-history-company">{job.company}</span>
                <span className="work-history-role">{job.role}</span>
                {job.duration && <span className="work-history-duration">{job.duration}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endorsements */}
      {worker.endorsements && worker.endorsements.length > 0 && (
        <div className="worker-card-endorsements">
          <span className="worker-card-section-label">Endorsements</span>
          <div className="worker-card-endorsement-tags">
            {worker.endorsements.map((e, i) => {
              const IconComponent = endorsementIcons[e.icon] || MessageSquare;
              return (
                <span key={i} className="worker-card-endorsement-tag">
                  <IconComponent size={14} />
                  {e.label} <span className="endorsement-count">+{e.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* What stores say */}
      {worker.storeQuotes && worker.storeQuotes.length > 0 && (
        <WorkerCardStoreQuotes quotes={worker.storeQuotes} />
      )}
    </div>
  );
}

// Role Selector Component - 5 column grid with category headers
function RoleSelectorComponent({
  roleSelector,
  selectedRoles,
  onRoleToggle,
  disabled
}: {
  roleSelector: RoleSelector;
  selectedRoles: string[];
  onRoleToggle: (role: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="role-selector-grid">
      {roleSelector.columns.map((column, colIdx) => (
        <div key={colIdx} className="role-selector-column">
          <h5 className="role-selector-header">{column.header}</h5>
          <div className="role-selector-roles">
            {column.roles.map((role, roleIdx) => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  key={roleIdx}
                  type="button"
                  className={`role-selector-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => onRoleToggle(role)}
                  disabled={disabled}
                >
                  {isSelected && <Check size={14} />}
                  <span>{role}</span>
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
  isLoading,
  market = 'Austin'
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [activeNavChip, setActiveNavChip] = useState<string | null>(null);
  const [displayName] = useState(getRandomName);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset selected chips and input when a new message is added
  useEffect(() => {
    setSelectedChips([]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // If there are selected chips, send those
    if (selectedChips.length > 0) {
      const message = input.trim()
        ? `${selectedChips.join(', ')}. ${input.trim()}`
        : selectedChips.join(', ');
      onSendMessage(message);
      setSelectedChips([]);
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
        <h1 className="chat-greeting">
          Hey {displayName}, let's connect with{' '}
          <br className="chat-greeting-break" />
          retail talent in your area.
        </h1>

        <div className="chat-text-area">
          <div className="chat-text-area-form">
            <p className="chat-text-area-header">
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
      <div className="chat-messages">
        {/* Nav chips inside scrollable area */}
        <NavChipGrid
          chips={navChips}
          activeChipId={activeNavChip}
          onChipClick={handleGreetingCard}
          disabled={isLoading}
          variant="compact"
        />
        {messages.map((message, messageIndex) => {
          const isAssistant = message.role === 'assistant';
          const parsed = isAssistant ? parseMessageWithChips(message.content) : null;
          const isLastAssistantMessage = isAssistant && messageIndex === lastAssistantIndex;
          const hasWorkerCards = parsed?.workerCards && parsed.workerCards.length > 0;
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
                    {/* Worker Cards Grid */}
                    {parsed?.workerCards && parsed.workerCards.length > 0 && (
                      <div className="worker-cards-grid">
                        {parsed.workerCards.map((worker, idx) => (
                          <WorkerCardComponent key={idx} worker={worker} />
                        ))}
                      </div>
                    )}
                    {/* Role Selector Grid - single select */}
                    {parsed?.roleSelector && isLastAssistantMessage && (
                      <RoleSelectorComponent
                        roleSelector={parsed.roleSelector}
                        selectedRoles={selectedChips}
                        onRoleToggle={(role) => {
                          // Single select - replace selection, or deselect if clicking same
                          setSelectedChips(prev =>
                            prev.includes(role) ? [] : [role]
                          );
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
                    {parsed && parsed.chips.length > 0 && isLastAssistantMessage && (
                      <>
                        <div className={`message-chips ${parsed.isMultiSelect ? 'multi-select' : ''}`}>
                          {parsed.chips.map((chip, idx) => {
                            const colonIndex = chip.indexOf(':');
                            const hasBoldPart = colonIndex > 0 && colonIndex < 30;
                            const isSelected = selectedChips.includes(chip);

                            const handleChipClick = () => {
                              if (parsed.isMultiSelect) {
                                // Toggle selection for multi-select
                                setSelectedChips(prev =>
                                  prev.includes(chip)
                                    ? prev.filter(c => c !== chip)
                                    : [...prev, chip]
                                );
                              } else {
                                // Single select - send immediately
                                onSendMessage(chip);
                              }
                            };

                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`message-chip ${isSelected ? 'selected' : ''}`}
                                onClick={handleChipClick}
                                disabled={isLoading}
                              >
                                {parsed.isMultiSelect && isSelected && <Check size={14} />}
                                <span>{hasBoldPart ? <><strong>{chip.slice(0, colonIndex)}</strong>:{chip.slice(colonIndex + 1)}</> : chip}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
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
                            placeholder="Type your message..."
                            rows={1}
                          />
                          <button
                            type="submit"
                            className="inline-send-btn"
                            disabled={!input.trim() && selectedChips.length === 0}
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

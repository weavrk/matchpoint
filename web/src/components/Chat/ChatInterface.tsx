import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Check, PartyPopper, Plus, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, MatchedWorker } from '../../types';
import chatbotAvatarUrl from '../../../../assets/logo-and-backgrounds/chatbot.svg?url';
import { NavChipGrid, getNavChips } from '../NavChips';
import { WorkerCardTeaser, WorkerCardFull } from '../Workers';
import { SAMPLE_WORKERS } from '../../data/workers';
import { ARIAT_STORE_GROUPS, ARIAT_STORE_OPTIONS } from '../../data/ariatStores';
import { BENEFIT_SELECT_CHIPS } from '../../services/gemini';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ChatInterface.css';

// Names to cycle through in the greeting
const GREETING_NAMES = [
  'Mike', 'Trevor', 'Shannon', 'Nate', 'Micah', 'Katherine', 'Cayley',
  'Evan', 'Juan', 'Julie', 'Ashlee', 'Jeremy', 'Sam', 'Jasmine',
  'Emily', 'Olivia', 'Mary', 'Hans', 'Hadley', 'Leigh Ann'
];

/** Match first user message to the greeting-card send strings so compact nav shows selection after typing. */
function inferNavChipIdFromMessages(
  messages: ChatMessage[],
  market: string
): string | null {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return null;
  const t = firstUser.content.trim();
  const routes: [string, string][] = [
    ['fill-role', 'I need to fill a permanent role at my store'],
    ['meet-talent', `I want to meet ${market} talent`],
    ['explore-market', `Show me ${market} market data`],
    ['check-jobs', 'Check on my published jobs'],
    ['how-it-works', 'Tell me how Talent Connect works'],
    ['just-exploring', 'Just exploring for now'],
  ];
  for (const [id, needle] of routes) {
    if (t === needle) return id;
  }
  return null;
}

// Convert text to Title Case (for job titles)
function toTitleCase(text: string): string {
  // Words that should stay lowercase (unless first word)
  const lowercaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in'];

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0 || !lowercaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

// Wrap dollar amounts in markdown **bold** (hourly, annual, ranges). Skips segments already inside **...**.
function boldSalaryValuesInMarkdown(text: string): string {
  const salaryPattern =
    /\$\d[\d,]*(?:\.\d+)?(?:k|K)?\+?(?:-\$?\d[\d,]*(?:\.\d+)?(?:k|K)?\+?)?(?:\/(?:hr|hour|yr|year|mo|month)|(?:\s+(?:per\s+hour|annually|a\s+year)))?/gi;
  return text
    .split(/\*\*/)
    .map((segment, index) => {
      if (index % 2 === 1) return segment;
      return segment.replace(salaryPattern, (m) => `**${m}**`);
    })
    .join('**');
}

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
  storeLocation?: string;
  pay: string;
  traits?: string[];
  benefits?: string[];
}

/** Short preview lines for job summary card (trait chips from Step 4). */
const TRAIT_PREVIEW_PHRASES: Record<string, string> = {
  'customer engagement': 'Connects well with shoppers and represents the brand on the floor.',
  'self-starter': 'Takes initiative without needing constant direction.',
  preparedness: 'Shows up ready and organized for every shift.',
  'work pace': 'Keeps up in a busy store environment.',
  productivity: 'Stays focused and turns traffic into solid work output.',
  'attention to detail': 'Notices the small things that elevate the customer experience.',
  'team player': 'Collaborates smoothly with managers and peers.',
  'positive attitude': 'Brings upbeat energy, even when the day gets hectic.',
  adaptable: 'Adjusts quickly when priorities or floor traffic change.',
  'flexible availability': 'Can align their schedule with what the store needs.',
  'open to feedback': 'Listens to coaching and improves from it.',
  bilingual: 'Can serve customers in more than one language.',
  'coaching others': 'Comfortable helping newer team members build skills.',
  'product knowledge': 'Learns the line and speaks about products with confidence.',
};

function traitLabelToPreviewSentence(label: string): string {
  const key = label.trim().toLowerCase();
  const mapped = TRAIT_PREVIEW_PHRASES[key];
  if (mapped) return mapped;
  const t = label.trim();
  if (!t) return '';
  const c = t.charAt(0).toUpperCase() + t.slice(1);
  return c.endsWith('.') ? c : `${c}.`;
}

// Location input type for store address step
interface LocationInput {
  placeholder?: string;
}

// Success banner type for milestone celebrations
interface SuccessBanner {
  title: string;
  subtitle: string;
}

// Parse worker card IDs from message content - returns array of worker IDs to look up
function parseWorkerCards(content: string): { text: string; textAfterCards: string; workerCardIds: WorkerCardIds | null } {
  const workerCardsMatch = content.match(/---WORKER_CARDS_START---([\s\S]*?)---WORKER_CARDS_END---/);

  if (workerCardsMatch) {
    try {
      const parsed = JSON.parse(workerCardsMatch[1].trim());
      // Support both array of IDs ["w001", "w002"] and array of objects [{id: "w001"}, ...]
      const workerCardIds: string[] = Array.isArray(parsed)
        ? parsed.map((item: string | { id: string }) => typeof item === 'string' ? item : item.id)
        : [];
      const splitIndex = content.indexOf('---WORKER_CARDS_START---');
      const endIndex = content.indexOf('---WORKER_CARDS_END---') + '---WORKER_CARDS_END---'.length;
      const textBefore = content.slice(0, splitIndex).trim();
      const textAfterCards = content.slice(endIndex).trim();
      return { text: textBefore, textAfterCards, workerCardIds };
    } catch (e) {
      console.error('Failed to parse worker cards:', e);
    }
  }

  return { text: content, textAfterCards: '', workerCardIds: null };
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

// Parse location input from message content
function parseLocationInput(content: string): { text: string; locationInput: LocationInput | null } {
  const locationMatch = content.match(/---LOCATION_INPUT_START---([\s\S]*?)---LOCATION_INPUT_END---/);
  if (locationMatch) {
    try {
      const locationInput = locationMatch[1].trim() ? JSON.parse(locationMatch[1].trim()) : {};
      const text = content.replace(/---LOCATION_INPUT_START---[\s\S]*?---LOCATION_INPUT_END---/, '').trim();
      return { text, locationInput };
    } catch (e) {
      console.error('Failed to parse location input:', e);
    }
  }
  return { text: content, locationInput: null };
}

// Parse message content to extract inline chips [like this]
function parseMessageWithChips(content: string): { text: string; textAfterCards: string; chips: string[]; isMultiSelect: boolean; workerCardIds: WorkerCardIds | null; roleSelector: RoleSelector | null; jobSummary: JobSummary | null; successBanner: SuccessBanner | null; locationInput: LocationInput | null } {
  // First extract worker card IDs if present, keeping before/after text separate
  const { text: textBeforeCards, textAfterCards: rawTextAfterCards, workerCardIds } = parseWorkerCards(content);

  // Process the "before cards" text through the rest of the pipeline
  const { text: textWithoutSelector, roleSelector } = parseRoleSelector(textBeforeCards);
  const { text: textWithoutSummary, jobSummary } = parseJobSummary(textWithoutSelector);
  const { text: textWithoutBanner, successBanner } = parseSuccessBanner(textWithoutSummary);
  const { text: textWithoutLocation, locationInput } = parseLocationInput(textWithoutBanner);

  // Extract chips from textAfterCards (if cards exist) or from the main text
  const chipSource = workerCardIds ? rawTextAfterCards : textWithoutLocation;
  const chipPattern = /\[([^\]]+)\]/g;
  const chips: string[] = [];
  let match;

  while ((match = chipPattern.exec(chipSource)) !== null) {
    chips.push(match[1]);
  }

  // Strip chip patterns from both text sections
  const text = textWithoutLocation.replace(/\[([^\]]+)\]/g, '').replace(/\s{2,}/g, ' ').trim();
  const textAfterCards = rawTextAfterCards.replace(/\[([^\]]+)\]/g, '').replace(/\s{2,}/g, ' ').trim();

  // Detect multi-select prompts
  const combinedText = text + ' ' + textAfterCards;
  const isMultiSelect = /pick\s+(the\s+)?(top\s+)?\d+-\d+|select\s+\d+-\d+|choose\s+multiple|select\s+all\s+that\s+apply|top\s+traits|positive\s+traits|type\s+out\s+qualities|select\s+or\s+type\s+qualities/i.test(combinedText);

  return { text, textAfterCards, chips, isMultiSelect, workerCardIds, roleSelector, jobSummary, successBanner, locationInput };
}

// Job Summary Card Component
function JobSummaryCard({ summary }: { summary: JobSummary }) {
  const empType = summary.employmentType === 'FT' ? 'Full-time'
    : summary.employmentType === 'PT' ? 'Part-time'
    : summary.employmentType === 'Both' ? 'Open to either'
    : summary.employmentType;

  return (
    <div className="job-summary-card">
      <div className="job-summary-header">
        <h3 className="job-summary-title">{summary.role}</h3>
        <div className="job-summary-meta">
          <span className="job-summary-tag">{empType}</span>
          <span className="job-summary-location-meta">
            <MapPin size={13} />
            {summary.storeLocation || summary.market}
          </span>
        </div>
      </div>

      <div className="job-summary-section">
        <span className="job-summary-label">Compensation</span>
        <span className="job-summary-pay">{summary.pay}</span>
      </div>

      {summary.benefits && summary.benefits.length > 0 && (
        <div className="job-summary-section">
          <span className="job-summary-label">Benefits</span>
          <ul className="job-summary-benefits-list">
            {summary.benefits.map((benefit, idx) => (
              <li key={idx}>{benefit}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.traits && summary.traits.length > 0 && (
        <div className="job-summary-section job-summary-section--traits">
          <span className="job-summary-traits-heading">Successful candidates will be strong in:</span>
          <ul className="job-summary-traits-list">
            {summary.traits.map((trait, idx) => (
              <li key={idx}>{traitLabelToPreviewSentence(trait)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Location Input Component — Nominatim geocoding + OSM mini map
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

function LocationInputComponent({
  disabled,
  onSelectionChange,
}: {
  disabled?: boolean;
  onSelectionChange?: (address: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [selected, setSelected] = useState<NominatimResult | null>(null);
  const [storeSelectId, setStoreSelectId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    onSelectionChange?.(selected?.display_name ?? null);
  }, [selected, onSelectionChange]);

  const handleSearch = (value: string) => {
    setStoreSelectId('');
    setQuery(value);
    setSelected(null);
    clearTimeout(debounceRef.current);
    if (value.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'MatchpointApp/1.0' } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch (e) {
        console.error('Nominatim error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelect = (result: NominatimResult) => {
    setStoreSelectId('');
    setSelected(result);
    setQuery(result.display_name);
    setResults([]);
  };

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!selected || !el) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const lat = parseFloat(selected.lat);
    const lon = parseFloat(selected.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(el, {
      center: [lat, lon],
      zoom: 16,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.circleMarker([lat, lon], {
      radius: 9,
      fillColor: '#3F3F46',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);

    mapInstanceRef.current = map;

    const fixSize = () => {
      map.invalidateSize();
    };
    requestAnimationFrame(fixSize);
    const t = window.setTimeout(fixSize, 200);
    const ro = new ResizeObserver(fixSize);
    ro.observe(el);

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [selected]);

  return (
    <div className="location-input-container">
      <div className="location-store-field">
        <label htmlFor="location-store-select" className="location-store-label type-label-sm">
          Your Ariat stores
        </label>
        <select
          id="location-store-select"
          className="location-store-select type-body-md"
          value={storeSelectId}
          onChange={(e) => {
            const v = e.target.value;
            setStoreSelectId(v);
            if (!v) {
              setSelected(null);
              return;
            }
            const store = ARIAT_STORE_OPTIONS.find((s) => s.id === v);
            if (store) {
              setSelected({ display_name: store.displayName, lat: store.lat, lon: store.lon });
              setQuery(store.displayName);
              setResults([]);
              if (debounceRef.current) clearTimeout(debounceRef.current);
            }
          }}
          disabled={disabled}
        >
          <option value="">Select a store...</option>
          {ARIAT_STORE_GROUPS.map((g) => (
            <optgroup key={g.state} label={g.state}>
              {g.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="location-search-row">
        <MapPin size={15} className="location-pin-icon" />
        <input
          type="text"
          className="location-search-input"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for store address..."
          disabled={disabled}
          autoComplete="off"
        />
        {isSearching && <span className="location-searching-indicator" />}
      </div>

      {results.length > 0 && (
        <div className="location-results-dropdown">
          {results.map((r, i) => (
            <button key={i} type="button" className="location-result-item" onClick={() => handleSelect(r)}>
              <MapPin size={12} />
              <span>{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="location-map-wrapper">
          <div ref={mapContainerRef} className="location-map-leaflet" role="img" aria-label="Map preview of selected address" />
        </div>
      )}
    </div>
  );
}

// Success Banner Component - celebration milestone
function SuccessBannerComponent({ banner }: { banner: SuccessBanner }) {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    // Burst from bottom-center
    const burst = () => {
      confetti({
        particleCount: 12,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        colors: ['#ff9a9a', '#4ba098', '#3b73ce', '#f59e0b', '#a78bfa'],
        gravity: 0.9,
        scalar: 0.9,
      });
      confetti({
        particleCount: 12,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors: ['#ff9a9a', '#4ba098', '#3b73ce', '#f59e0b', '#a78bfa'],
        gravity: 0.9,
        scalar: 0.9,
      });
      if (Date.now() < end) {
        requestAnimationFrame(burst);
      }
    };

    // Initial big pop from center
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.85 },
      colors: ['#ff9a9a', '#4ba098', '#3b73ce', '#f59e0b', '#a78bfa', '#9dd9cf'],
      startVelocity: 45,
      gravity: 0.8,
      ticks: 200,
    });

    // Then rain from sides
    setTimeout(burst, 300);
  }, []);

  return (
    <div className="success-banner">
      <div className="success-banner-icon">
        <PartyPopper size={28} />
      </div>
      <div className="success-banner-content">
        <h3 className="success-banner-title type-section-header-lg">{banner.title}</h3>
        <p className="success-banner-subtitle">{banner.subtitle}</p>
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
                  className={`role-selector-chip type-chip-label-md ${isSelected ? 'selected' : ''}`}
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
  const [inputsByMessage, setInputsByMessage] = useState<Record<string, string>>({});
  const [selectedChipsByMessage, setSelectedChipsByMessage] = useState<Record<string, string[]>>({});
  const [activeNavChip, setActiveNavChip] = useState<string | null>(null);
  const [displayName] = useState(getRandomName);
  const [selectedWorker, setSelectedWorker] = useState<MatchedWorker | null>(null);
  const [pendingLocationAddress, setPendingLocationAddress] = useState<string | null>(null);
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

  const inferredNavChipId = useMemo(
    () => inferNavChipIdFromMessages(messages, market),
    [messages, market]
  );
  const effectiveNavChipId = activeNavChip ?? inferredNavChipId;

  // Show welcome screen when no messages yet
  const showWelcomeScreen = messages.length === 0;

  // Get the last assistant message ID for tracking current selections
  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
  const lastAssistantMessageId = lastAssistantMessage?.id || '';
  const currentSelectedChips = selectedChipsByMessage[lastAssistantMessageId] || [];
  const lastAssistantParsed = lastAssistantMessage
    ? parseMessageWithChips(lastAssistantMessage.content)
    : null;
  const isActiveLocationStep = Boolean(lastAssistantParsed?.locationInput);

  useEffect(() => {
    if (!isActiveLocationStep) {
      setPendingLocationAddress(null);
    }
  }, [isActiveLocationStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (isActiveLocationStep && pendingLocationAddress) {
      onSendMessage(pendingLocationAddress);
      setPendingLocationAddress(null);
      setInput('');
      return;
    }

    // If there are selected chips, send those
    if (currentSelectedChips.length > 0) {
      const extra = input.trim()
        ? lastAssistantParsed?.roleSelector
          ? toTitleCase(input.trim())
          : input.trim()
        : '';
      const message = extra
        ? `${currentSelectedChips.join(', ')}. ${extra}`
        : currentSelectedChips.join(', ');
      onSendMessage(message);
      setInput('');
    } else if (input.trim()) {
      const raw = input.trim();
      onSendMessage(
        lastAssistantParsed?.roleSelector ? toTitleCase(raw) : raw
      );
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
                className="welcome-send-btn"
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
    <div className={`chat-interface ${selectedWorker ? 'has-detail-panel' : ''}`}>
      <div className="chat-main">
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
              activeChipId={effectiveNavChipId}
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
          const hasBenefitsSelect =
            Boolean(parsed?.isMultiSelect && /benefits\s+details/i.test(message.content));
          const hasChips = Boolean(parsed && (parsed.chips.length > 0 || hasBenefitsSelect));

          return (
            <div
              key={message.id}
              className={`chat-message ${isAssistant ? 'assistant' : 'user'}${hasWorkerCards ? ' has-worker-cards' : ''}${hasRoleSelector ? ' has-role-selector' : ''}${hasBenefitsSelect ? ' has-benefits-select' : ''}`}
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
                    <ReactMarkdown>
                      {boldSalaryValuesInMarkdown(parsed?.text || message.content)}
                    </ReactMarkdown>
                    {/* Worker Cards Grid - uses shared WorkerCardTeaser component */}
                    {hasWorkerCards && (
                      <div className="worker-cards-grid">
                        {workerCards.map((worker) => (
                          <WorkerCardTeaser
                            key={worker.id}
                            worker={worker}
                            onClick={() => setSelectedWorker(worker)}
                          />
                        ))}
                      </div>
                    )}
                    {/* Divider + text that follows worker cards (e.g. traits question) */}
                    {hasWorkerCards && parsed?.textAfterCards && (
                      <div className="worker-cards-after-divider">
                        <ReactMarkdown>
                          {boldSalaryValuesInMarkdown(parsed.textAfterCards)}
                        </ReactMarkdown>
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
                    {parsed?.roleSelector && !isLastAssistantMessage && onBranchFromMessage && (
                      <div className="inline-input-wrapper past-message-input">
                        <textarea
                          className="inline-input"
                          value={inputsByMessage[message.id] || ''}
                          onChange={(e) =>
                            setInputsByMessage((prev) => ({ ...prev, [message.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const v = (e.target as HTMLTextAreaElement).value.trim();
                              if (v) onBranchFromMessage(message.id, toTitleCase(v));
                            }
                          }}
                          placeholder="Looking for a different job title?"
                          rows={1}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className={`inline-send-btn${(inputsByMessage[message.id] || '').trim() ? ' can-send' : ''}`}
                          disabled={!(inputsByMessage[message.id] || '').trim() || isLoading}
                          onClick={() => {
                            const v = (inputsByMessage[message.id] || '').trim();
                            if (v) onBranchFromMessage(message.id, toTitleCase(v));
                          }}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    )}
                    {/* Location Input */}
                    {parsed?.locationInput && isLastAssistantMessage && (
                      <LocationInputComponent
                        onSelectionChange={setPendingLocationAddress}
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
                    {parsed && (parsed.chips.length > 0 || hasBenefitsSelect) && (() => {
                      const messageSelectedChips = selectedChipsByMessage[message.id] || [];
                      const pastMsgInput = inputsByMessage[message.id] || '';
                      const canSendPast = messageSelectedChips.length > 0 || pastMsgInput.trim().length > 0;
                      const showPastChipsInlineInput =
                        Boolean(onBranchFromMessage && !isLastAssistantMessage);
                      const chipsForMessage = hasBenefitsSelect ? BENEFIT_SELECT_CHIPS : parsed.chips;
                      const chipMultiSelect = hasBenefitsSelect || parsed.isMultiSelect;

                      return (
                        <>
                          <div className={`message-chips ${chipMultiSelect ? 'multi-select' : ''}`}>
                            {chipsForMessage.map((chip) => {
                              const colonIndex = chip.indexOf(':');
                              const hasBoldPart = colonIndex > 0 && colonIndex < 30;
                              const isSelected = messageSelectedChips.includes(chip);

                              const handleChipClick = () => {
                                if (chipMultiSelect) {
                                  setSelectedChipsByMessage(prev => {
                                    const current = prev[message.id] || [];
                                    const updated = current.includes(chip)
                                      ? current.filter(c => c !== chip)
                                      : [...current, chip];
                                    return { ...prev, [message.id]: updated };
                                  });
                                } else {
                                  setSelectedChipsByMessage(prev => ({ ...prev, [message.id]: [chip] }));
                                  setTimeout(() => {
                                    if (isLastAssistantMessage) {
                                      onSendMessage(chip);
                                    } else if (onBranchFromMessage) {
                                      onBranchFromMessage(message.id, chip);
                                    }
                                  }, 300);
                                }
                              };

                              return (
                                <button
                                  key={`${message.id}-${chip}`}
                                  type="button"
                                  className={`message-chip type-chip-label-md ${isSelected ? 'selected' : ''}`}
                                  onClick={handleChipClick}
                                  disabled={isLoading}
                                >
                                  <span>{hasBoldPart ? <><strong>{chip.slice(0, colonIndex)}</strong>:{chip.slice(colonIndex + 1)}</> : chip}</span>
                                  <span className="chip-icon">
                                    {chipMultiSelect
                                      ? (isSelected ? <Check size={14} /> : <Plus size={14} />)
                                      : (isSelected ? <Check size={14} /> : null)
                                    }
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {/* Past chip messages: keep inline bar after selection (same as multi-select) */}
                          {showPastChipsInlineInput && (
                            <div className="inline-input-wrapper past-message-input">
                              <textarea
                                className="inline-input"
                                value={pastMsgInput}
                                onChange={(e) => setInputsByMessage(prev => ({ ...prev, [message.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (canSendPast && onBranchFromMessage) {
                                      const msg = messageSelectedChips.length > 0 && pastMsgInput.trim()
                                        ? `${messageSelectedChips.join(', ')}. ${pastMsgInput.trim()}`
                                        : messageSelectedChips.length > 0
                                        ? messageSelectedChips.join(', ')
                                        : pastMsgInput.trim();
                                      onBranchFromMessage(message.id, msg);
                                    }
                                  }
                                }}
                                placeholder="Something else?"
                                rows={1}
                                disabled={isLoading}
                              />
                              <button
                                type="button"
                                className={`inline-send-btn${canSendPast ? ' can-send' : ''}`}
                                disabled={!canSendPast || isLoading}
                                onClick={() => {
                                  if (canSendPast && onBranchFromMessage) {
                                    const msg = messageSelectedChips.length > 0 && pastMsgInput.trim()
                                      ? `${messageSelectedChips.join(', ')}. ${pastMsgInput.trim()}`
                                      : messageSelectedChips.length > 0
                                      ? messageSelectedChips.join(', ')
                                      : pastMsgInput.trim();
                                    onBranchFromMessage(message.id, msg);
                                  }
                                }}
                              >
                                <Send size={18} />
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {/* Inline input area for last assistant message */}
                    {isLastAssistantMessage && !isLoading && (
                      <form className="inline-input-form" onSubmit={handleSubmit}>
                        <div
                          className={`inline-input-wrapper${parsed?.locationInput ? ' inline-input-wrapper--send-only' : ''}`}
                        >
                          {!parsed?.locationInput && (
                            <textarea
                              ref={inputRef}
                              className="inline-input"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder={
                                hasRoleSelector
                                  ? 'Looking for a different job title?'
                                  : hasChips
                                    ? 'Something else?'
                                    : 'Type your message...'
                              }
                              rows={1}
                            />
                          )}
                          {(() => {
                            const thisMessageChips = selectedChipsByMessage[message.id] || [];
                            const canSend = parsed?.locationInput
                              ? Boolean(pendingLocationAddress)
                              : input.trim().length > 0 || thisMessageChips.length > 0;
                            return (
                              <button
                                type="submit"
                                className={`inline-send-btn${canSend ? ' can-send' : ''}`}
                                disabled={!canSend}
                                aria-label={parsed?.locationInput ? 'Send selected store location' : 'Send message'}
                              >
                                <Send size={18} />
                              </button>
                            );
                          })()}
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

      {/* WorkerCardFull detail panel - opens to the right */}
      {selectedWorker && (
        <WorkerCardFull
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
        />
      )}
    </div>
  );
}

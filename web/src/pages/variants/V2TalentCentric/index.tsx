import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Link,
  Heart,
  Search,
  X,
  Users,
  ShieldCheck,
  Unlock,
  Store,
  Briefcase,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  MapPinPlus,
  MapPlus,
  Earth,
  ArrowRight,
  Send,
  CalendarFold,
  Blend,
  ChartNoAxesGantt,
  CornerDownRight,
  Info,
  Plus,
  MessageCircle,
  MessageSquare,
  MessageSquareOff,
  MessageSquareDot,
  BadgeCheck,
  Eye,
  UserPlus,
  ThumbsUp,
  XCircle,
  Trophy,
  HeartPlus,
  UserStar,
  ClockCheck,
  MapPin,
} from "lucide-react";
import { SAMPLE_WORKERS } from "../../../data/workers";
import { V2Main } from "./V2Main";
import { V2EmploymentSelector } from "./V2EmploymentSelector";
import { V2WorkerSidebar } from "./V2WorkerSidebar";
import { WorkerCard } from "../../../components/Workers/WorkerCard";
import { WorkerCardFull } from "../../../components/Workers/WorkerCardFull";
import { WorkerCardCompact } from "../../../components/Workers/WorkerCardCompact";
import { WorkerAchievementChips, getAchievementChipCount } from "../../../components/Workers/WorkerAchievementChips";
import type { EmploymentType, AvailabilityHours } from "./V2EmploymentSelector";
import type { MatchedWorker, ChatMessage, WorkerProfile, FocusRoute } from "../../../types";
import { createFreshV2GeminiService, V2GeminiService } from "./V2GeminiService";
import { fetchWorkersByMarketAsProfiles, fetchWorkersByMarketForSidebar, fetchRetailers, fetchWorkerConnections, fetchWorkerById, bulkInsertWorkerConnections, deleteWorkerConnection } from "../../../services/supabase";
import type { WorkerConnectionWithWorker, WorkerRow } from "../../../services/supabase";
import type { Retailer } from "../../../services/supabase";
import ReactMarkdown from "react-markdown";
import { getWorkerPhoto as getWorkerPhotoFromPool } from "../../../hooks/useWorkerPhoto";
import chatbotAvatarUrl from "../../../../../assets/logo-and-backgrounds/chatbot.svg?url";
import "./styles.css";

// Import all brand logos
import logo7ForAllMankind from "../../../../../assets/brand-logos/7-for-all-mankind.png";
import logoAbercrombie from "../../../../../assets/brand-logos/abercrombie-and-fitch.png";
import logoAldo from "../../../../../assets/brand-logos/aldo.png";
import logoAllbirds from "../../../../../assets/brand-logos/allbirds.png";
import logoAllsaints from "../../../../../assets/brand-logos/allsaints.png";
import logoAloYoga from "../../../../../assets/brand-logos/alo-yoga.png";
import logoAnnTaylor from "../../../../../assets/brand-logos/ann-taylor.png";
import logoAnthropologie from "../../../../../assets/brand-logos/anthropologie.png";
import logoAriat from "../../../../../assets/brand-logos/ariat.png";
import logoArmaniExchange from "../../../../../assets/brand-logos/armani-exchange.png";
import logoBananaRepublic from "../../../../../assets/brand-logos/banana-republic.png";
import logoBurberry from "../../../../../assets/brand-logos/burberry.png";
import logoCalvinKlein from "../../../../../assets/brand-logos/calvin-klein.png";
import logoChanel from "../../../../../assets/brand-logos/chanel.png";
import logoCosmeticsCompanyStore from "../../../../../assets/brand-logos/cosmetics-company-store.png";
import logoDkny from "../../../../../assets/brand-logos/dkny.png";
import logoEberjey from "../../../../../assets/brand-logos/eberjey.png";
import logoElysewalker from "../../../../../assets/brand-logos/elysewalker.png";
import logoEsteeLauder from "../../../../../assets/brand-logos/estee-lauder.png";
import logoEverlane from "../../../../../assets/brand-logos/everlane.png";
import logoFossil from "../../../../../assets/brand-logos/fossil.png";
import logoFreePeople from "../../../../../assets/brand-logos/free-people.png";
import logoGap from "../../../../../assets/brand-logos/gap.png";
import logoGoldenGoose from "../../../../../assets/brand-logos/golden-goose.png";
import logoGuess from "../../../../../assets/brand-logos/guess.png";
import logoHoka from "../../../../../assets/brand-logos/hoka.png";
import logoHuckberry from "../../../../../assets/brand-logos/huckberry.png";
import logoJCrew from "../../../../../assets/brand-logos/j-crew.png";
import logoKarlLagerfeld from "../../../../../assets/brand-logos/karl-lagerfeld.png";
import logoKateSpade from "../../../../../assets/brand-logos/kate-spade.png";
import logoKuhnRikon from "../../../../../assets/brand-logos/kuhn-rikon.png";
import logoLevis from "../../../../../assets/brand-logos/levis.png";
import logoLively from "../../../../../assets/brand-logos/lively.png";
import logoLongchamp from "../../../../../assets/brand-logos/longchamp.png";
import logoLuckyBrand from "../../../../../assets/brand-logos/lucky-brand.png";
import logoMac from "../../../../../assets/brand-logos/mac.png";
import logoMackage from "../../../../../assets/brand-logos/mackage.png";
import logoMadewell from "../../../../../assets/brand-logos/madewell.png";
import logoMarcJacobs from "../../../../../assets/brand-logos/marc-jacobs.png";
import logoMavi from "../../../../../assets/brand-logos/mavi.png";
import logoMcm from "../../../../../assets/brand-logos/mcm.png";
import logoMichaelKors from "../../../../../assets/brand-logos/michael-kors.png";
import logoMizzenMain from "../../../../../assets/brand-logos/mizzenmain.png";
import logoNeimanMarcus from "../../../../../assets/brand-logos/neiman-marcus.png";
import logoNike from "../../../../../assets/brand-logos/nike.png";
import logoNordstrom from "../../../../../assets/brand-logos/nordstrom.png";
import logoNorthFace from "../../../../../assets/brand-logos/north-face.png";
import logoOldNavy from "../../../../../assets/brand-logos/old-navy.png";
import logoPacsun from "../../../../../assets/brand-logos/pacsun.png";
import logoPatagonia from "../../../../../assets/brand-logos/patagonia.png";
import logoRalphLauren from "../../../../../assets/brand-logos/ralph-lauren.png";
import logoPuma from "../../../../../assets/brand-logos/puma.png";
import logoRagAndBone from "../../../../../assets/brand-logos/rag-and-bone.png";
import logoReclectic from "../../../../../assets/brand-logos/reclectic.png";
import logoReiss from "../../../../../assets/brand-logos/reiss.png";
import logoRhone from "../../../../../assets/brand-logos/rhone.png";
import logoSabah from "../../../../../assets/brand-logos/sabah.png";
import logoSaks from "../../../../../assets/brand-logos/saks-fifth-avenue.png";
import logoSephora from "../../../../../assets/brand-logos/sephora.png";
import logoSezane from "../../../../../assets/brand-logos/sezane.png";
import logoShinola from "../../../../../assets/brand-logos/shinola.png";
import logoSkims from "../../../../../assets/brand-logos/skims.png";
import logoSplendid from "../../../../../assets/brand-logos/splendid.png";
import logoSteveMadden from "../../../../../assets/brand-logos/steve-madden.png";
import logoTecovas from "../../../../../assets/brand-logos/tecovas.png";
import logoTheory from "../../../../../assets/brand-logos/theory.png";
import logoTommyJohn from "../../../../../assets/brand-logos/tommy-john.png";
import logoTrueClassic from "../../../../../assets/brand-logos/true-classic.png";
import logoUgg from "../../../../../assets/brand-logos/ugg.png";
import logoUltaBeauty from "../../../../../assets/brand-logos/ulta-beauty.png";
import logoUnderArmour from "../../../../../assets/brand-logos/under-armour.png";
import logoUniqlo from "../../../../../assets/brand-logos/uniqlo.png";
import logoUrbanOutfitters from "../../../../../assets/brand-logos/urban-outfitters.png";
import logoVans from "../../../../../assets/brand-logos/vans.png";
import logoVeraBradley from "../../../../../assets/brand-logos/vera-bradley.png";
import logoVeraWang from "../../../../../assets/brand-logos/vera-wang.png";
import logoVictoriasSecret from "../../../../../assets/brand-logos/victorias-secret.png";
import logoWarbyParker from "../../../../../assets/brand-logos/warby-parker.png";
import logoWolfAndShepherd from "../../../../../assets/brand-logos/wolf-shepherd.png";
import logoZara from "../../../../../assets/brand-logos/zara.png";

type TabId = "discover" | "connections" | "chat";

// Names for the greeting - shared with V1
const GREETING_NAMES = [
  "Mike",
  "Trevor",
  "Shannon",
  "Nate",
  "Micah",
  "Katherine",
  "Cayley",
  "Evan",
  "Juan",
  "Julie",
  "Ashlee",
  "Jeremy",
  "Sam",
  "Jasmine",
  "Emily",
  "Olivia",
  "Mary",
  "Hans",
  "Hadley",
  "Leigh Ann",
];
const getRandomUserName = () =>
  GREETING_NAMES[Math.floor(Math.random() * GREETING_NAMES.length)];

// Popular brand picks for quick selection
const POPULAR_BRANDS = [
  { id: "ralph-lauren", name: "Ralph Lauren" },
  { id: "marc-jacobs", name: "Marc Jacobs" },
  { id: "ariat", name: "Ariat" },
  { id: "golden-goose", name: "Golden Goose" },
];

// Brand logos array - edit this to add/remove brands
const BRAND_LOGOS: { id: string; logo: string }[] = [
  { id: "7-for-all-mankind", logo: logo7ForAllMankind },
  { id: "abercrombie", logo: logoAbercrombie },
  { id: "aldo", logo: logoAldo },
  { id: "allbirds", logo: logoAllbirds },
  { id: "allsaints", logo: logoAllsaints },
  { id: "alo-yoga", logo: logoAloYoga },
  { id: "ann-taylor", logo: logoAnnTaylor },
  { id: "anthropologie", logo: logoAnthropologie },
  { id: "ariat", logo: logoAriat },
  { id: "armani-exchange", logo: logoArmaniExchange },
  { id: "banana-republic", logo: logoBananaRepublic },
  { id: "burberry", logo: logoBurberry },
  { id: "calvin-klein", logo: logoCalvinKlein },
  { id: "chanel", logo: logoChanel },
  { id: "cosmetics-company-store", logo: logoCosmeticsCompanyStore },
  { id: "dkny", logo: logoDkny },
  { id: "eberjey", logo: logoEberjey },
  { id: "elysewalker", logo: logoElysewalker },
  { id: "estee-lauder", logo: logoEsteeLauder },
  { id: "everlane", logo: logoEverlane },
  { id: "fossil", logo: logoFossil },
  { id: "free-people", logo: logoFreePeople },
  { id: "gap", logo: logoGap },
  { id: "golden-goose", logo: logoGoldenGoose },
  { id: "guess", logo: logoGuess },
  { id: "hoka", logo: logoHoka },
  { id: "huckberry", logo: logoHuckberry },
  { id: "j-crew", logo: logoJCrew },
  { id: "karl-lagerfeld", logo: logoKarlLagerfeld },
  { id: "kate-spade", logo: logoKateSpade },
  { id: "kuhn-rikon", logo: logoKuhnRikon },
  { id: "levis", logo: logoLevis },
  { id: "lively", logo: logoLively },
  { id: "longchamp", logo: logoLongchamp },
  { id: "lucky-brand", logo: logoLuckyBrand },
  { id: "mac", logo: logoMac },
  { id: "mackage", logo: logoMackage },
  { id: "madewell", logo: logoMadewell },
  { id: "marc-jacobs", logo: logoMarcJacobs },
  { id: "mavi", logo: logoMavi },
  { id: "mcm", logo: logoMcm },
  { id: "michael-kors", logo: logoMichaelKors },
  { id: "mizzen-main", logo: logoMizzenMain },
  { id: "neiman-marcus", logo: logoNeimanMarcus },
  { id: "nike", logo: logoNike },
  { id: "nordstrom", logo: logoNordstrom },
  { id: "north-face", logo: logoNorthFace },
  { id: "old-navy", logo: logoOldNavy },
  { id: "pacsun", logo: logoPacsun },
  { id: "patagonia", logo: logoPatagonia },
  { id: "puma", logo: logoPuma },
  { id: "rag-and-bone", logo: logoRagAndBone },
  { id: "ralph-lauren", logo: logoRalphLauren },
  { id: "reclectic", logo: logoReclectic },
  { id: "reiss", logo: logoReiss },
  { id: "rhone", logo: logoRhone },
  { id: "sabah", logo: logoSabah },
  { id: "saks", logo: logoSaks },
  { id: "sephora", logo: logoSephora },
  { id: "sezane", logo: logoSezane },
  { id: "shinola", logo: logoShinola },
  { id: "skims", logo: logoSkims },
  { id: "splendid", logo: logoSplendid },
  { id: "steve-madden", logo: logoSteveMadden },
  { id: "tecovas", logo: logoTecovas },
  { id: "theory", logo: logoTheory },
  { id: "tommy-john", logo: logoTommyJohn },
  { id: "true-classic", logo: logoTrueClassic },
  { id: "ugg", logo: logoUgg },
  { id: "ulta-beauty", logo: logoUltaBeauty },
  { id: "under-armour", logo: logoUnderArmour },
  { id: "uniqlo", logo: logoUniqlo },
  { id: "urban-outfitters", logo: logoUrbanOutfitters },
  { id: "vans", logo: logoVans },
  { id: "vera-bradley", logo: logoVeraBradley },
  { id: "vera-wang", logo: logoVeraWang },
  { id: "victorias-secret", logo: logoVictoriasSecret },
  { id: "warby-parker", logo: logoWarbyParker },
  { id: "wolf-shepherd", logo: logoWolfAndShepherd },
  { id: "zara", logo: logoZara },
];

/** V2 grid previously used `polo-ralph-lauren`; canonical id is `ralph-lauren`. */
const LEGACY_BRAND_ID_MAP: Record<string, string> = {
  "polo-ralph-lauren": "ralph-lauren",
};

function canonicalBrandId(brandId: string): string {
  return LEGACY_BRAND_ID_MAP[brandId] ?? brandId;
}

type Step =
  | "welcome"
  | "persona"
  | "location"
  | "focus"
  | "employment"
  | "brands"
  | "experience"
  | "results";

type FocusArea = "employment" | "brands" | "roles";

type PersonaType = "individual" | "multi-store" | "field" | "recruiter";

// Experience levels per Logic Tree
type ExperienceLevel = "all" | "new" | "rising" | "seasoned" | "management";

// Store locations (retailer's locations they have permission to hire for)
const STORE_LOCATIONS = [
  { id: "domain-northside", name: "Domain Northside", marketId: "austin-tx" },
  {
    id: "market-town-center",
    name: "The Market at Town Center",
    marketId: "phoenix-az",
  },
  { id: "south-congress", name: "South Congress", marketId: "dallas-tx" },
  { id: "waterview-plaza", name: "Waterview Plaza", marketId: "dallas-tx" },
  {
    id: "main-street-shops",
    name: "Main Street Shops",
    marketId: "houston-tx",
  },
  { id: "lakeline-mall", name: "Lakeline Mall", marketId: "fresno-ca" },
  {
    id: "milton-creek-square",
    name: "Milton Creek Square",
    marketId: "san-antonio-tx",
  },
  {
    id: "hill-country-galleria",
    name: "Hill Country Galleria",
    marketId: "austin-tx",
  },
  { id: "the-arboretum", name: "The Arboretum", marketId: "baton-rouge-la" },
  {
    id: "sunset-valley-village",
    name: "Sunset Valley Village",
    marketId: "las-vegas-nv",
  },
  // 5 more southwest locations
  {
    id: "scottsdale-fashion",
    name: "Scottsdale Fashion Square",
    marketId: "phoenix-az",
  },
  { id: "uptown-park", name: "Uptown Park", marketId: "las-vegas-nv" },
  { id: "cherry-creek", name: "Cherry Creek", marketId: "denver-co" },
  { id: "la-cantera", name: "La Cantera", marketId: "san-antonio-tx" },
  { id: "town-square", name: "Town Square", marketId: "los-angeles-ca" },
];

// All available markets for city search (29 markets)
const MARKETS = [
  // AZ
  { id: "phoenix-az", name: "Phoenix", state: "AZ" },
  // CA
  { id: "cabazon-ca", name: "Cabazon", state: "CA" },
  { id: "los-angeles-ca", name: "Los Angeles", state: "CA" },
  { id: "san-diego-ca", name: "San Diego", state: "CA" },
  { id: "san-francisco-ca", name: "San Francisco", state: "CA" },
  { id: "san-jose-ca", name: "San Jose", state: "CA" },
  // CO
  { id: "denver-co", name: "Denver", state: "CO" },
  // CT
  { id: "westport-ct", name: "Westport", state: "CT" },
  // D.C.
  { id: "washington-dc", name: "Washington", state: "D.C." },
  // FL
  { id: "miami-fl", name: "Miami", state: "FL" },
  { id: "orlando-fl", name: "Orlando", state: "FL" },
  // GA
  { id: "atlanta-ga", name: "Atlanta", state: "GA" },
  // IL
  { id: "chicago-il", name: "Chicago", state: "IL" },
  // MA
  { id: "boston-ma", name: "Boston", state: "MA" },
  // NC
  { id: "charlotte-nc", name: "Charlotte", state: "NC" },
  // NJ
  { id: "central-new-jersey-nj", name: "Central NJ", state: "NJ" },
  { id: "northern-new-jersey-nj", name: "Northern NJ", state: "NJ" },
  // NV
  { id: "las-vegas-nv", name: "Las Vegas", state: "NV" },
  // NY
  { id: "long-island-ny", name: "Long Island", state: "NY" },
  { id: "new-york-ny", name: "New York City", state: "NY" },
  { id: "westchester-ny", name: "Westchester", state: "NY" },
  { id: "woodbury-ny", name: "Woodbury", state: "NY" },
  // PA
  { id: "king-of-prussia-pa", name: "King of Prussia", state: "PA" },
  // SC
  { id: "charleston-sc", name: "Charleston", state: "SC" },
  // TN
  { id: "nashville-tn", name: "Nashville", state: "TN" },
  // TX
  { id: "austin-tx", name: "Austin", state: "TX" },
  { id: "dallas-tx", name: "Dallas", state: "TX" },
  { id: "houston-tx", name: "Houston", state: "TX" },
  { id: "san-antonio-tx", name: "San Antonio", state: "TX" },
];

// Job roles by category
const JOB_ROLES = {
  salesFloor: {
    label: "Sales Floor",
    roles: [
      {
        title: "Sales Associate / Retail Associate",
        description: "Customer service, sales floor support, POS transactions",
      },
      {
        title: "Store Associate",
        description: "General sales floor support and customer assistance",
      },
      {
        title: "Brand Representative",
        description: "Brand ambassador, product expertise, customer engagement",
      },
    ],
  },
  salesSupport: {
    label: "Sales Support",
    roles: [
      {
        title: "Sales Assistant",
        description: "Support sales team, customer service backup",
      },
      {
        title: "Cashier",
        description: "Checkout operations, handling payments",
      },
      {
        title: "Fitting Room Attendant",
        description: "Managing dressing rooms, returning items to floor",
      },
      {
        title: "Team Member",
        description: "General retail support, multi-functional role",
      },
      {
        title: "Retail Customer Service",
        description: "Customer inquiries, returns, service desk",
      },
    ],
  },
  backOfHouse: {
    label: "Back of House",
    roles: [
      {
        title: "Stock Associate / Stocker",
        description: "Receiving, organizing, replenishing inventory",
      },
      {
        title: "Inventory Associate",
        description: "Inventory management, cycle counts, stock accuracy",
      },
      {
        title: "Operations Associate",
        description: "Store operations, logistics, back-office support",
      },
    ],
  },
  specialized: {
    label: "Specialized",
    roles: [
      {
        title: "Beauty Advisor / Cosmetics Associate",
        description:
          "Product expertise, demos (Sephora, Ulta, department stores)",
      },
      {
        title: "Stylist",
        description: "Personal styling, outfit consultation, clienteling",
      },
      {
        title: "Visual Merchandiser",
        description: "Displays, store layout, product presentation",
      },
      {
        title: "Pop Up",
        description: "Temporary retail events, brand activations",
      },
    ],
  },
  management: {
    label: "Management",
    roles: [
      {
        title: "Store Team Leader",
        description: "Team leadership, shift coordination",
      },
      { title: "Supervisor", description: "Floor supervision, team oversight" },
      {
        title: "Key Holder / Lead Associate",
        description: "Opening/closing, shift supervision",
      },
      {
        title: "Department Supervisor",
        description: "Oversees specific section (shoes, menswear, etc.)",
      },
      {
        title: "Assistant Store Manager",
        description: "Operations support, staff scheduling",
      },
      {
        title: "Store Manager",
        description: "Full P&L responsibility, hiring, performance",
      },
      {
        title: "District / Area Manager",
        description: "Multi-store oversight",
      },
    ],
  },
};

interface V2TalentCentricProps {
  userName?: string;
}

export function V2TalentCentric({
  userName: propUserName,
}: V2TalentCentricProps) {
  const [activeTab, setActiveTab] = useState<TabId>("discover");
  const [step, setStep] = useState<Step>("welcome");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    "forward" | "back"
  >("forward");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null); // Separate from market chip selection
  const [locationSearch, setLocationSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(true);
  const [fallbackUserName] = useState(() => getRandomUserName());
  const userName = propUserName || fallbackUserName;
  const brandRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setSelectedBrands((prev) => {
      const next = [...new Set(prev.map(canonicalBrandId))];
      const needsMigration = prev.some((b) => b !== canonicalBrandId(b));
      return needsMigration ? next : prev;
    });
  }, []);

  const uniqueSelectedBrandCount = useMemo(
    () => new Set(selectedBrands.map(canonicalBrandId)).size,
    [selectedBrands],
  );

  const isBrandTileSelected = useCallback(
    (id: string) =>
      selectedBrands.some(
        (b) => canonicalBrandId(b) === canonicalBrandId(id),
      ),
    [selectedBrands],
  );

  // New flow state
  const [focusArea, setFocusArea] = useState<FocusArea | null>(null);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(null);
  const [availabilityHours, setAvailabilityHours] = useState<AvailabilityHours>(null);

  // Persona and location flow
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [chatPromptValue, setChatPromptValue] = useState("");
  const [pickingDifferentMarket, setPickingDifferentMarket] = useState(false); // For single-store "hire in different market" sub-flow
  const [locationConfirmChoice, setLocationConfirmChoice] = useState<"yes" | "different" | null>(null); // For location confirmation selection

  // Chat state for V2 (uses V2GeminiService)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatMode, setIsChatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatServiceRef = useRef<V2GeminiService | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const focusChatMessagesRef = useRef<HTMLDivElement>(null);
  const chatInlineRef = useRef<HTMLDivElement>(null);
  const stepContentScrollRef = useRef<HTMLDivElement>(null);

  // Experience level for preference shaping
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);

  // Track which preference sections have been completed (for CYOA flow)
  const [completedSections, setCompletedSections] = useState<Set<FocusArea>>(
    new Set(),
  );

  // Track which card the user picked first to determine CYOA order
  // employment → brands → roles
  // brands → roles → employment
  // roles → brands → employment
  const [startingFocusArea, setStartingFocusArea] = useState<FocusArea | null>(null);

  // Focus step chat state (separate from persona chat)
  const [focusChatActive, setFocusChatActive] = useState(false);
  const [focusChatInput, setFocusChatInput] = useState("");
  const [focusChatMessages, setFocusChatMessages] = useState<ChatMessage[]>([]);
  const [isFocusChatLoading, setIsFocusChatLoading] = useState(false);
  const focusChatServiceRef = useRef<V2GeminiService | null>(null);

  // Supabase workers state - fetched when location is selected
  const [supabaseWorkers, setSupabaseWorkers] = useState<WorkerProfile[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  // Retailers from Supabase - for brand classification matching
  const [retailers, setRetailers] = useState<Retailer[]>([]);

  // Selected worker for showing full card in sidebar
  const [selectedWorker, setSelectedWorker] = useState<MatchedWorker | null>(null);

  // Active chat conversation state
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [chatInputValue, setChatInputValue] = useState("");

  // Worker connections from Supabase
  const [workerConnections, setWorkerConnections] = useState<WorkerConnectionWithWorker[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [connectionsFetched, setConnectionsFetched] = useState(false);
  const [connectionsDirty, setConnectionsDirty] = useState(false);
  const [connectionsMarketFilter, setConnectionsMarketFilter] = useState<string | null>(null);
  const [connectionsStatusFilter, setConnectionsStatusFilter] = useState<string | null>(null);
  const [connectionsSearch, setConnectionsSearch] = useState('');
  const [selectedConnectionWorker, setSelectedConnectionWorker] = useState<WorkerConnectionWithWorker | null>(null);
  const [connDetailOpen, setConnDetailOpen] = useState(false);
  const [selectedConnectionFullWorker, setSelectedConnectionFullWorker] = useState<WorkerRow | null>(null);
  const [isLoadingConnectionWorker, setIsLoadingConnectionWorker] = useState(false);

  // Location chat state for multi-store "different market" input
  const [locationChatInput, setLocationChatInput] = useState("");
  const [locationChatMessages, setLocationChatMessages] = useState<ChatMessage[]>([]);
  /** Brief "selected" flash on location DSL chip before navigation */
  const [locationMarketChipSelectingId, setLocationMarketChipSelectingId] = useState<string | null>(null);

  // Search matching brands - only match from start of name
  const searchResults = useMemo(() => {
    if (!brandSearch.trim()) return null;
    const query = brandSearch.toLowerCase().replace(/[\s&'.-]+/g, "");
    return BRAND_LOGOS.filter((brand) => {
      const normalized = brand.id.toLowerCase().replace(/[\s&'.-]+/g, "");
      return normalized.startsWith(query);
    });
  }, [brandSearch]);

  // Scroll to first matching brand
  const handleSearch = useCallback((value: string) => {
    setBrandSearch(value);
    if (value.trim()) {
      const query = value.toLowerCase().replace(/[\s&'.-]+/g, "");
      const match = BRAND_LOGOS.find((brand) => {
        const normalized = brand.id.toLowerCase().replace(/[\s&'.-]+/g, "");
        return normalized.startsWith(query);
      });
      if (match && brandRefs.current[match.id]) {
        brandRefs.current[match.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, []);

  // Toggle brand selection (canonical ids; legacy `polo-ralph-lauren` → `ralph-lauren`)
  const toggleBrand = (brandName: string) => {
    const id = canonicalBrandId(brandName);
    setSelectedBrands((prev) => {
      const selected = new Set(prev.map(canonicalBrandId));
      if (selected.has(id)) {
        return prev.filter((b) => canonicalBrandId(b) !== id);
      }
      return [...prev, id];
    });
  };

  // Initialize V2 chat service
  const initChatService = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    const service = createFreshV2GeminiService(apiKey);

    const selectedMarket = MARKETS.find((m) => m.id === selectedLocation);
    const marketName = selectedMarket?.name || "Austin";

    await service.startChat({
      userName,
      retailerName: "Your Store",
      market: marketName,
      persona: persona || undefined,
    });

    chatServiceRef.current = service;
    return service;
  }, [userName, selectedLocation, persona]);

  // Send chat message (V2 service)
  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatPromptValue("");
    setIsLoading(true);
    setPersona(null); // Clear persona selection when chatting

    try {
      let service = chatServiceRef.current;
      if (!service) {
        service = await initChatService();
      }

      const result = await service.sendMessage(message);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.message,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("V2 Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [initChatService]);

  // Send focus chat message (for focus step)
  const sendFocusChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setFocusChatMessages((prev) => [...prev, userMessage]);
    setFocusChatInput("");
    setIsFocusChatLoading(true);

    try {
      let service = focusChatServiceRef.current;
      if (!service) {
        // Initialize a focus-specific chat service with 'focus' mode
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
        service = createFreshV2GeminiService(apiKey, 'focus');

        const selectedMarket = MARKETS.find((m) => m.id === selectedLocation);
        const marketName = selectedMarket?.name || "Austin";

        await service.startChat({
          userName,
          retailerName: 'Your Store',
          market: marketName,
          persona: persona || 'individual',
        });
        focusChatServiceRef.current = service;
      }

      const result = await service.sendMessage(message);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.message,
        suggestedRoute: result.suggestedRoute ?? undefined,
        timestamp: new Date(),
      };
      setFocusChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Focus Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setFocusChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsFocusChatLoading(false);
    }
  }, [userName, selectedLocation, persona]);

  // Handle location chat input - try to match user input to a market (same logic as before; UI is chat bubbles)
  const handleLocationChatSubmit = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: `loc-user-${now}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setLocationChatMessages((prev) => [...prev, userMessage]);

    const searchTerm = trimmed.toLowerCase();

    const matchedMarket = MARKETS.find((market) => {
      const nameMatch = market.name.toLowerCase().includes(searchTerm);
      const stateMatch = market.state.toLowerCase().includes(searchTerm);
      const cityStateMatch = `${market.name}, ${market.state}`.toLowerCase().includes(searchTerm);
      const fullMatch = `${market.name} ${market.state}`.toLowerCase().includes(searchTerm);
      return nameMatch || stateMatch || cityStateMatch || fullMatch;
    });

    const assistantMessage: ChatMessage = matchedMarket
      ? {
          id: `loc-asst-${now + 1}`,
          role: "assistant",
          content: `Found it! **${matchedMarket.name}, ${matchedMarket.state}** is available.`,
          timestamp: new Date(),
          locationCta: {
            variant: "select_market",
            marketId: matchedMarket.id,
            marketLabel: `${matchedMarket.name}, ${matchedMarket.state}`,
          },
        }
      : {
          id: `loc-asst-${now + 1}`,
          role: "assistant",
          content:
            "I couldn't identify that location or market. Let's select from our available markets.",
          timestamp: new Date(),
          locationCta: {
            variant: "browse_markets",
            marketLabel: "Go to market selection",
          },
        };

    setLocationChatMessages((prev) => [...prev, assistantMessage]);
    setLocationChatInput("");
  }, []);

  useEffect(() => {
    if (step !== "location" || persona !== "multi-store") {
      setLocationChatMessages([]);
      setLocationChatInput("");
      setLocationMarketChipSelectingId(null);
    }
  }, [step, persona]);

  // Auto-scroll focus chat messages to bottom when new messages arrive
  useEffect(() => {
    if (focusChatMessages.length > 0 || isFocusChatLoading) {
      if (focusChatMessagesRef.current) {
        focusChatMessagesRef.current.scrollTo({
          top: focusChatMessagesRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [focusChatMessages, isFocusChatLoading]);

  // Scroll chat to bottom when messages change or loading state changes
  useEffect(() => {
    if (chatMessages.length > 0 || isLoading) {
      // Scroll the main content container to the bottom
      if (stepContentScrollRef.current) {
        stepContentScrollRef.current.scrollTo({
          top: stepContentScrollRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
      // Also scroll within the chat messages container
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [chatMessages, isLoading]);

  // Fetch workers from Supabase when location changes
  useEffect(() => {
    if (!selectedLocation) {
      setSupabaseWorkers([]);
      return;
    }

    const selectedMarket = MARKETS.find((m) => m.id === selectedLocation);
    if (!selectedMarket) {
      setSupabaseWorkers([]);
      return;
    }

    setIsLoadingWorkers(true);
    // Fast fetch with lightweight columns for sidebar display
    fetchWorkersByMarketForSidebar(selectedMarket.name)
      .then((workers) => {
        setSupabaseWorkers(workers);
        setIsLoadingWorkers(false);
        // Background upgrade to full card data for results page
        return fetchWorkersByMarketAsProfiles(selectedMarket.name);
      })
      .then((fullWorkers) => {
        if (fullWorkers) setSupabaseWorkers(fullWorkers);
      })
      .catch((error) => {
        console.error("Error fetching workers:", error);
        setSupabaseWorkers([]);
        setIsLoadingWorkers(false);
      });
  }, [selectedLocation]);

  // Fetch retailers on mount for brand classification matching
  useEffect(() => {
    fetchRetailers()
      .then((data) => {
        setRetailers(data);
      })
      .catch((error) => {
        console.error("Error fetching retailers:", error);
      });
  }, []);

  // Fetch worker connections on mount + when tab opened + when dirty
  useEffect(() => {
    if (!connectionsFetched || connectionsDirty || activeTab === "connections") {
      setIsLoadingConnections(true);
      fetchWorkerConnections()
        .then((data) => {
          setWorkerConnections(data);
          setConnectionsFetched(true);
          setConnectionsDirty(false);
        })
        .catch((error) => {
          console.error("Error fetching worker connections:", error);
        })
        .finally(() => {
          setIsLoadingConnections(false);
        });
    }
  }, [activeTab, connectionsDirty, connectionsFetched]);

  // Memoized connection stats — single pass instead of 7 separate .filter() calls
  const connectionStats = useMemo(() => {
    const counts = { all: 0, accepted: 0, invited: 0, liked: 0, chat_open: 0, shift_scheduled: 0, shift_booked: 0, saved_for_later: 0, worker_declined: 0 };
    const marketSet = new Set<string>();

    for (const c of workerConnections) {
      counts.all++;
      if (c.status === 'accepted') counts.accepted++;
      if (c.status === 'invited') counts.invited++;
      if (c.status === 'liked') counts.liked++;
      if (c.status === 'not_interested') counts.worker_declined++;
      if (c.chat_open) counts.chat_open++;
      if (c.shift_scheduled) counts.shift_scheduled++;
      if (c.shift_booked) counts.shift_booked++;
      if (c.saved_for_later) counts.saved_for_later++;
      if (c.market) marketSet.add(c.market);
    }

    return { counts, markets: [...marketSet].sort() };
  }, [workerConnections]);

  const filteredConnections = useMemo(() => {
    const search = connectionsSearch.toLowerCase().trim();
    const filtered = workerConnections.filter(c => {
      const marketMatch = !connectionsMarketFilter || c.market === connectionsMarketFilter;
      const statusMatch = !connectionsStatusFilter || c.status === connectionsStatusFilter ||
        (connectionsStatusFilter === "chat_open" && c.chat_open) ||
        (connectionsStatusFilter === "shift_scheduled" && c.shift_scheduled) ||
        (connectionsStatusFilter === "shift_booked" && c.shift_booked) ||
        (connectionsStatusFilter === "saved_for_later" && c.saved_for_later) ||
        (connectionsStatusFilter === "not_interested" && c.status === "not_interested");
      const searchMatch = !search || (c.worker?.name || '').toLowerCase().includes(search);
      return marketMatch && statusMatch && searchMatch;
    });
    // Sort newest first
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [workerConnections, connectionsMarketFilter, connectionsStatusFilter, connectionsSearch]);

  // CYOA flow: Get next incomplete preference section based on starting point
  // employment → brands → roles (experience)
  // brands → roles (experience) → employment
  // roles (experience) → brands → employment
  const getNextIncompleteSection = (current: FocusArea): FocusArea | null => {
    // Define the order based on starting focus area
    const flowOrders: Record<FocusArea, FocusArea[]> = {
      employment: ["employment", "brands", "roles"],
      brands: ["brands", "roles", "employment"],
      roles: ["roles", "brands", "employment"],
    };

    // Use the starting focus area to determine order, or default to employment order
    const order = flowOrders[startingFocusArea || "employment"];
    const currentIndex = order.indexOf(current);

    // Find next incomplete section in the defined order
    for (let i = 1; i <= order.length; i++) {
      const nextIndex = (currentIndex + i) % order.length;
      const nextSection = order[nextIndex];
      if (!completedSections.has(nextSection)) {
        return nextSection;
      }
    }
    return null; // All sections complete
  };

  // CYOA flow: Get the previous section to go back to
  // If we're at the first section in the flow, go back to focus page
  const getPreviousSection = (current: FocusArea): Step => {
    const flowOrders: Record<FocusArea, FocusArea[]> = {
      employment: ["employment", "brands", "roles"],
      brands: ["brands", "roles", "employment"],
      roles: ["roles", "brands", "employment"],
    };

    const order = flowOrders[startingFocusArea || "employment"];
    const currentIndex = order.indexOf(current);

    // If we're at the first section, go back to focus
    if (currentIndex === 0) {
      return "focus";
    }

    // Otherwise, go to the previous section in the flow
    const prevSection = order[currentIndex - 1];
    // Map FocusArea to Step
    if (prevSection === "roles") return "experience";
    if (prevSection === "brands") return "brands";
    return "employment";
  };

  // Focus route suggestion labels (for chat chip)
  const FOCUS_ROUTE_LABELS: Record<FocusRoute, string> = {
    employment: 'Type of employment',
    brands: 'Brand affinity',
    experience: 'Experience level',
  };

  const FOCUS_ROUTE_HELPER: Record<FocusRoute, string> = {
    employment: "That tracks. I'd start by narrowing down the type of role you're hiring for.",
    brands: "Good instinct. Filtering by brand experience tends to surface the strongest fits.",
    experience: "Makes sense. Experience level is one of the clearest signals we have.",
  };

  // Navigate to a focus area from the suggestion chip
  const handleFocusRouteSuggestion = (route: FocusRoute) => {
    setFocusArea(route as FocusArea);
    if (!startingFocusArea) setStartingFocusArea(route as FocusArea);
    const stepMap: Record<FocusRoute, Step> = {
      employment: 'employment',
      brands: 'brands',
      experience: 'experience',
    };
    transitionToStep(stepMap[route], 'forward');
  };

  // Mark a section as complete and navigate to next
  const completeSection = (section: FocusArea) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(section);
    setCompletedSections(newCompleted);

    // If all 3 sections done, go to results
    if (newCompleted.size >= 3) {
      transitionToStep("results", "forward");
    } else {
      // Go to next incomplete section
      const next = getNextIncompleteSection(section);
      if (next) {
        transitionToStep(
          next === "employment"
            ? "employment"
            : next === "brands"
              ? "brands"
              : "experience",
          "forward",
        );
      } else {
        transitionToStep("results", "forward");
      }
    }
  };

  // Transition to a new step with animation
  // Animation timing: fade out (0-200ms), slide continues (200-400ms), then switch + fade in
  const transitionToStep = (
    newStep: Step,
    direction: "forward" | "back" = "forward",
  ) => {
    setTransitionDirection(direction);
    setIsTransitioning(true);
    // Wait for fade-out portion of animation (50% of 400ms = 200ms)
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 250);
  };

  // Helper to normalize brand names for comparison (kebab-case to lowercase, spaces/symbols removed)
  // Also normalizes "and" to match "&" (e.g. "rag-and-bone" == "Rag & Bone")
  // and strips "+" so "mizzen-main" matches "Mizzen+Main"
  const normalizeBrand = (name: string) =>
    name.toLowerCase().replace(/\band\b/g, "").replace(/[\s&+'.,-]+/g, "");

  // Workers filtered only by market (for sidebar before results)
  const marketWorkers = useMemo(() => {
    // Use Supabase workers when location is selected, otherwise fall back to sample data
    let workers: WorkerProfile[] = selectedLocation && supabaseWorkers.length > 0
      ? [...supabaseWorkers]
      : [...SAMPLE_WORKERS];

    // Filter by selected location (only needed for SAMPLE_WORKERS fallback)
    if (selectedLocation && supabaseWorkers.length === 0) {
      const selectedMarket = MARKETS.find((m) => m.id === selectedLocation);
      if (selectedMarket) {
        workers = workers.filter(
          (w) =>
            w.market
              .toLowerCase()
              .includes(selectedMarket.name.toLowerCase()) ||
            selectedMarket.name.toLowerCase().includes(w.market.toLowerCase()),
        );
      }
    }

    // Score workers (same scoring logic, no filtering)
    const scored: MatchedWorker[] = workers.map((w) => {
      let score = 50;
      score += Math.min(w.shiftsOnReflex, 50);
      if (w.onTimeRating === "Exceptional") score += 15;
      if (w.commitmentScore === "Exceptional") score += 10;
      score += Math.min(w.invitedBackStores * 2, 20);
      return {
        ...w,
        matchScore: Math.min(score, 100),
        matchReasons: [],
      };
    });

    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedLocation, supabaseWorkers]);

  // Filter and score workers based on selections (for results step)
  const filteredWorkers = useMemo(() => {
    const canonicalSelectedIds = selectedBrands.map(canonicalBrandId);

    // Use Supabase workers when location is selected, otherwise fall back to sample data
    let workers: WorkerProfile[] = selectedLocation && supabaseWorkers.length > 0
      ? [...supabaseWorkers]
      : [...SAMPLE_WORKERS];

    // Filter by selected location (only needed for SAMPLE_WORKERS fallback)
    if (selectedLocation && supabaseWorkers.length === 0) {
      const selectedMarket = MARKETS.find((m) => m.id === selectedLocation);
      if (selectedMarket) {
        workers = workers.filter(
          (w) =>
            w.market
              .toLowerCase()
              .includes(selectedMarket.name.toLowerCase()) ||
            selectedMarket.name.toLowerCase().includes(w.market.toLowerCase()),
        );
      }
    }

    // Filter by selected brands - check brandsWorked and previousExperience
    // Also include workers with experience at brands in the same classification
    if (selectedBrands.length > 0) {
      const normalizedSelected = canonicalSelectedIds.map((id) =>
        normalizeBrand(id),
      );

      // Find classifications of selected brands from retailers table
      const selectedClassifications = new Set<string>();
      canonicalSelectedIds.forEach((brandId) => {
        const normalizedId = normalizeBrand(brandId);
        const retailer = retailers.find((r) =>
          normalizeBrand(r.name).includes(normalizedId) ||
          normalizedId.includes(normalizeBrand(r.name))
        );
        if (retailer) {
          selectedClassifications.add(retailer.classification);
        }
      });

      // Get all brand names in the same classification groups (for related brand matching)
      const relatedBrandNames = retailers
        .filter((r) => selectedClassifications.has(r.classification))
        .map((r) => normalizeBrand(r.name));

      workers = workers.filter((w) => {
        // Check brandsWorked against selected brands (direct match)
        const hasDirectBrandMatch = (w.brandsWorked || []).some((b) =>
          normalizedSelected.some(
            (sel) =>
              normalizeBrand(b.name).includes(sel) ||
              sel.includes(normalizeBrand(b.name)),
          ),
        );
        // Check previousExperience against selected brands (direct match)
        const hasDirectExpMatch = (w.previousExperience || []).some((exp) =>
          normalizedSelected.some(
            (sel) =>
              normalizeBrand(exp.company).includes(sel) ||
              sel.includes(normalizeBrand(exp.company)),
          ),
        );

        // Check brandsWorked against related brands (same classification)
        const hasRelatedBrandMatch = (w.brandsWorked || []).some((b) =>
          relatedBrandNames.some(
            (related) =>
              normalizeBrand(b.name).includes(related) ||
              related.includes(normalizeBrand(b.name)),
          ),
        );
        // Check previousExperience against related brands (same classification)
        const hasRelatedExpMatch = (w.previousExperience || []).some((exp) =>
          relatedBrandNames.some(
            (related) =>
              normalizeBrand(exp.company).includes(related) ||
              related.includes(normalizeBrand(exp.company)),
          ),
        );

        return hasDirectBrandMatch || hasDirectExpMatch || hasRelatedBrandMatch || hasRelatedExpMatch;
      });
    }

    // Note: Employment type and hours per week are preference inputs, not filters
    // They don't reduce the worker pool - all workers remain available

    // Filter by experience level using the experience_level column from DB
    // "all" = no filter; other UI states map to DB values
    if (experienceLevel && experienceLevel !== "all") {
      const levelMap: Record<string, string> = {
        "new": "rising",
        "rising": "experienced",
        "seasoned": "seasoned",
        "management": "proven_leader"
      };
      const dbLevel = levelMap[experienceLevel];
      if (dbLevel) {
        workers = workers.filter((w) => w.experienceLevel === dbLevel);
      }
    }

    // Score workers
    const scored: MatchedWorker[] = workers.map((w) => {
      let score = 50;

      // Brand match bonus (grid ids are kebab-case; brandsWorked uses display names)
      const brandMatches = (w.brandsWorked || []).filter((b) =>
        canonicalSelectedIds.some(
          (sid) =>
            normalizeBrand(b.name) === normalizeBrand(sid) ||
            normalizeBrand(b.name).includes(normalizeBrand(sid)) ||
            normalizeBrand(sid).includes(normalizeBrand(b.name)),
        ),
      ).length;
      score += brandMatches * 10;

      // Shifts bonus
      score += Math.min(w.shiftsOnReflex, 50);

      // Reliability bonus
      if (w.onTimeRating === "Exceptional") score += 15;
      if (w.commitmentScore === "Exceptional") score += 10;

      // Invited back bonus
      score += Math.min(w.invitedBackStores * 2, 20);

      return {
        ...w,
        matchScore: Math.min(score, 100),
        matchReasons: [],
      };
    });

    // Only show workers with at least 1 achievement chip
    const qualified = scored.filter(w => getAchievementChipCount(w) > 0);

    // Sort by score
    return qualified.sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedBrands, selectedLocation, experienceLevel, supabaseWorkers, retailers]);

  // Get brands the filtered workers have in common
  const commonBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    filteredWorkers.forEach((w) => {
      (w.brandsWorked || []).forEach((b) => {
        brandCounts[b.name] = (brandCounts[b.name] || 0) + 1;
      });
    });
    return Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
  }, [filteredWorkers]);

  return (
    <div className={`v2-page ${step === "welcome" ? "v2-page-welcome" : ""}`}>
      <div
        className={`v2-page-header-wrapper ${step === "welcome" ? "v2-header-welcome" : ""}`}
      >
        <header className="page-header">
          <div className="page-header-icon" aria-hidden="true">
            <Link size={24} />
          </div>
          <div className="page-header-content">
            <h1 className="page-title">Talent Connect</h1>
          </div>
        </header>

        <nav className="page-tabs">
          <button
            className={`tab ${activeTab === "discover" ? "active" : ""}`}
            onClick={() => setActiveTab("discover")}
          >
            Discover
          </button>
          <button
            className={`tab ${activeTab === "connections" ? "active" : ""}`}
            onClick={() => setActiveTab("connections")}
          >
            Connections
          </button>
          <button
            className={`tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
        </nav>
      </div>

      {activeTab === "discover" && (
        <div
          className={`v2-container ${step === "welcome" ? "v2-container-welcome" : ""}`}
        >
          {step === "welcome" && <div className="gradient-wash" />}
          {/* Step 0: Welcome - uses special container, not V2Main */}
          {step === "welcome" && (
            <div className="v2-main v2-welcome-step">
              <div className="v2-welcome-illustration">
                <div className="v2-illustration-circle"></div>
                <div className="v2-illustration-cards">
                  <div className="v2-illustration-card v2-illustration-card-1">
                    <div className="v2-card-avatar">
                      <Users size={24} strokeWidth={2} />
                      <div className="v2-avatar-badge">
                        <Sparkles size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="v2-card-lines">
                      <div className="v2-card-line v2-card-line-long"></div>
                      <div className="v2-card-line v2-card-line-short"></div>
                    </div>
                  </div>
                  <div className="v2-illustration-card v2-illustration-card-2">
                    <div className="v2-card-avatar">
                      <Users size={24} strokeWidth={2} />
                      <div className="v2-avatar-badge">
                        <ShieldCheck size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="v2-card-lines">
                      <div className="v2-card-line v2-card-line-long"></div>
                      <div className="v2-card-line v2-card-line-short"></div>
                    </div>
                  </div>
                  <div className="v2-illustration-card v2-illustration-card-3">
                    <div className="v2-card-avatar">
                      <Users size={24} strokeWidth={2} />
                      <div className="v2-avatar-badge">
                        <Unlock size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="v2-card-lines">
                      <div className="v2-card-line v2-card-line-long"></div>
                      <div className="v2-card-line v2-card-line-short"></div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className="type-tagline">
                Hey {userName}, let's connect with retail talent in your area.
              </h1>
              <p className="type-prompt-question v2-welcome-subtitle">
                Find shift-verified Reflexers with experience at brands you
                trust.
              </p>
              <button
                className="v2-get-started-btn"
                onClick={() => transitionToStep("persona", "forward")}
              >
                Get started
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Step 1: User Persona Selection */}
          {step === "persona" && (
            <V2Main
              stepClassName="v2-main-centered"
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onNext: () => transitionToStep("location", "forward"),
                showBack: false,
                nextDisabled: !persona,
                nextLabel: "Continue",
              }}
            >
              <div className="v2-step-content-scroll" ref={stepContentScrollRef}>
                <div className="v2-step-header-chips">
                  <div className="v2-step-header">
                    <h1 className="type-tagline">Tell us about your role so we can focus our questions.</h1>
                  </div>

                  <div className={`v2-focus-chips ${chatMessages.length > 0 ? "chat-active" : ""}`}>
                  <button
                    className={`welcome-card persona-card ${persona === "individual" ? "active" : ""}`}
                    onClick={() => {
                      setChatMessages([]);
                      setPersona("individual");
                      setSelectedLocation("austin-tx");
                      transitionToStep("location", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "individual" ? (
                        <Check size={24} strokeWidth={1.5} />
                      ) : (
                        <Store size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Single-Store Manager
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Managing a team at one location.
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card persona-card ${persona === "multi-store" ? "active" : ""}`}
                    onClick={() => {
                      setChatMessages([]);
                      setPersona("multi-store");
                      setSelectedLocation(null);
                      transitionToStep("location", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "multi-store" ? (
                        <Check size={24} strokeWidth={1.5} />
                      ) : (
                        <MapPinPlus size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Multi-Store Manager
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Managing multiple locations in the same area.
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card persona-card ${persona === "field" ? "active" : ""}`}
                    onClick={() => {
                      setChatMessages([]);
                      setPersona("field");
                      setSelectedLocation(null);
                      transitionToStep("location", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "field" ? (
                        <Check size={24} strokeWidth={1.5} />
                      ) : (
                        <MapPlus size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Regional/District Manager
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Overseeing stores across a region(s).
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card persona-card ${persona === "recruiter" ? "active" : ""}`}
                    onClick={() => {
                      setChatMessages([]);
                      setPersona("recruiter");
                      setSelectedLocation(null);
                      transitionToStep("location", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "recruiter" ? (
                        <Check size={24} strokeWidth={1.5} />
                      ) : (
                        <Earth size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      HR/Recruiter
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Centralized hiring function across the country.
                    </p>
                    </div>
                  </button>

                  {/* Chat - full width under persona chips, scrollable */}
                  <div className="v2-chat-inline" ref={chatInlineRef}>
                    {/* Scrollable message area */}
                    {chatMessages.length > 0 && (
                      <div className="v2-chat-messages" ref={chatContainerRef}>
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`v2-chat-message ${msg.role}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="v2-chat-avatar">
                                <img src={chatbotAvatarUrl} alt="Assistant" />
                              </div>
                            )}
                            <div className="v2-chat-bubble">
                              {msg.role === "assistant" ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="v2-chat-message assistant">
                            <div className="v2-chat-avatar">
                              <img src={chatbotAvatarUrl} alt="Assistant" />
                            </div>
                            <div className="v2-chat-bubble">
                              <div className="v2-chat-loading">
                                <span className="v2-chat-dot"></span>
                                <span className="v2-chat-dot"></span>
                                <span className="v2-chat-dot"></span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Follow-up chips after assistant responds */}
                    {chatMessages.filter(m => m.role === "assistant").length > 0 && !isLoading && (
                      <div className="v2-chat-followup-chips">
                        <button
                          className={`v2-chat-followup-chip${persona === "individual" ? " active" : ""}`}
                          onClick={() => {
                            setPersona("individual");
                            setSelectedLocation("austin-tx");
                            transitionToStep("location", "forward");
                          }}
                        >
                          <CornerDownRight size={16} className="v2-chip-icon-left" />
                          <span>One location</span>
                          {persona === "individual" && <Check size={16} className="v2-chip-icon-right" />}
                        </button>
                        <button
                          className={`v2-chat-followup-chip${persona === "multi-store" ? " active" : ""}`}
                          onClick={() => {
                            setPersona("multi-store");
                            setSelectedLocation(null);
                            transitionToStep("location", "forward");
                          }}
                        >
                          <CornerDownRight size={16} className="v2-chip-icon-left" />
                          <span>Multiple locations</span>
                          {persona === "multi-store" && <Check size={16} className="v2-chip-icon-right" />}
                        </button>
                        <button
                          className={`v2-chat-followup-chip${persona === "field" ? " active" : ""}`}
                          onClick={() => {
                            setPersona("field");
                            setSelectedLocation(null);
                            transitionToStep("location", "forward");
                          }}
                        >
                          <CornerDownRight size={16} className="v2-chip-icon-left" />
                          <span>District or region</span>
                          {persona === "field" && <Check size={16} className="v2-chip-icon-right" />}
                        </button>
                        <button
                          className={`v2-chat-followup-chip${persona === "recruiter" ? " active" : ""}`}
                          onClick={() => {
                            setPersona("recruiter");
                            setSelectedLocation(null);
                            transitionToStep("location", "forward");
                          }}
                        >
                          <CornerDownRight size={16} className="v2-chip-icon-left" />
                          <span>Nationally across the brand</span>
                          {persona === "recruiter" && <Check size={16} className="v2-chip-icon-right" />}
                        </button>
                      </div>
                    )}
                    {/* Input - always visible */}
                    <div className="v2-chat-prompt">
                      <textarea
                        placeholder="Or share more detailed information"
                        className="v2-chat-prompt-input"
                        rows={1}
                        value={chatPromptValue}
                        onChange={(e) => setChatPromptValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage(chatPromptValue);
                          }
                        }}
                      />
                      <button
                        className={`v2-chat-prompt-send${chatPromptValue.trim() ? ' active' : ''}`}
                        onClick={() => sendChatMessage(chatPromptValue)}
                        disabled={isLoading || !chatPromptValue.trim()}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </V2Main>
          )}

          {/* Step 2: Location Selection - varies by persona */}
          {step === "location" && (
            <V2Main
              stepClassName="v2-main-centered"
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                showBack: true,
                onBack: () => {
                  if (persona === "individual" && pickingDifferentMarket) {
                    // Go back to market confirmation with animation
                    // Keep "different" selected since that's what they chose
                    setTransitionDirection("back");
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setPickingDifferentMarket(false);
                      setSelectedLocation("austin-tx"); // Restore default market
                      setLocationConfirmChoice("different"); // Keep "different" selected
                      setIsTransitioning(false);
                    }, 250);
                  } else {
                    setLocationConfirmChoice(null); // Reset confirmation choice
                    transitionToStep("persona", "back");
                  }
                },
                onNext: () => {
                  // Go directly to focus step, reset state after transition starts
                  setFocusArea(null);
                  setLocationConfirmChoice(null);
                  transitionToStep("focus", "forward");
                  // Reset pickingDifferentMarket after transition to avoid flash of confirmation screen
                  setTimeout(() => setPickingDifferentMarket(false), 300);
                },
                nextDisabled: persona === "individual" && !pickingDifferentMarket
                  ? true // Hide/disable Next for confirmation chips (they auto-progress)
                  : !selectedLocation,
              }}
            >
              {/* Single-Store Manager: Confirmation with default market */}
              {persona === "individual" && !pickingDifferentMarket && (
                <div className="v2-step-header-chips">
                  <div className="v2-step-header">
                    <h1 className="type-tagline">
                      Search the {MARKETS.find(m => m.id === selectedLocation)?.name || "Austin"} market?
                    </h1>
                  </div>
                  <div className="v2-location-confirm-chips">
                    <button
                      className={`v2-location-confirm-chip ${locationConfirmChoice === "yes" ? "selected" : ""}`}
                      onClick={() => {
                        setLocationConfirmChoice("yes");
                        // Auto-progress after brief delay to show selection
                        setTimeout(() => {
                          setFocusArea(null);
                          transitionToStep("focus", "forward");
                        }, 150);
                      }}
                    >
                      <span>Yes, search in {MARKETS.find(m => m.id === selectedLocation)?.name || "Austin"}</span>
                      <div className="v2-confirm-chip-icon">
                        {locationConfirmChoice === "yes" && <Check size={18} />}
                      </div>
                    </button>
                    <button
                      className={`v2-location-confirm-chip ${locationConfirmChoice === "different" ? "selected" : ""}`}
                      onClick={() => {
                        setLocationConfirmChoice("different");
                        // Auto-progress after brief delay to show selection
                        setTimeout(() => {
                          setPickingDifferentMarket(true);
                          setSelectedLocation(null);
                        }, 300);
                      }}
                    >
                      <span>Hire in a different market</span>
                      <div className="v2-confirm-chip-icon">
                        {locationConfirmChoice === "different" && <Check size={18} />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Single-Store Manager picked "different market" - reuse field/recruiter picker below */}

              {/* Multi-Store Manager: Confirmation + dropdown of their locations */}
              {persona === "multi-store" && (
                <div className="v2-step-content-scroll">
                  <div className="v2-step-header">
                    <h1 className="type-tagline">
                      Which location or store are you hiring at?
                    </h1>
                  </div>
                  <div className={`v2-location-store-chips${selectedLocation ? " sidebar-open" : ""}`}>
                    {STORE_LOCATIONS.map((store) => {
                      const market = MARKETS.find(m => m.id === store.marketId);
                      const isSelected = selectedStoreId === store.id;
                      return (
                        <button
                          key={store.id}
                          className={`v2-chat-followup-chip v2-store-chip${isSelected ? " active" : ""}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStoreId(null);
                              setSelectedLocation(null);
                            } else {
                              setSelectedStoreId(store.id);
                              setSelectedLocation(store.marketId);
                            }
                          }}
                        >
                          <CornerDownRight size={16} className="v2-chip-icon-left" />
                          <span className="v2-store-chip-content">
                            <span className="v2-store-chip-name">{store.name}</span>
                            {market && <span className="v2-store-chip-location">{market.name}, {market.state}</span>}
                          </span>
                          <span className="v2-chip-icon-right">
                            {isSelected && <Check size={14} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Location search — same inline chat pattern as persona / focus (user right, assistant left) */}
                  <div className="v2-location-chat-section v2-chat-inline">
                    {locationChatMessages.length > 0 && (
                      <div className="v2-chat-messages v2-location-chat-messages">
                        {locationChatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`v2-chat-message ${msg.role}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="v2-chat-avatar">
                                <img src={chatbotAvatarUrl} alt="Assistant" />
                              </div>
                            )}
                            {msg.role === "user" ? (
                              <div className="v2-chat-bubble">{msg.content}</div>
                            ) : (
                              <div className="v2-chat-bubble-stack">
                                <div className="v2-chat-bubble">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                                {msg.locationCta && (
                                  <button
                                    type="button"
                                    className={`v2-chat-followup-chip${locationMarketChipSelectingId === msg.id ? " active" : ""}`}
                                    disabled={locationMarketChipSelectingId !== null}
                                    onClick={() => {
                                      const cta = msg.locationCta;
                                      if (!cta) return;
                                      if (cta.variant === "select_market" && cta.marketId) {
                                        setLocationMarketChipSelectingId(msg.id);
                                        setSelectedStoreId(null);
                                        setSelectedLocation(cta.marketId);
                                        setFocusArea(null);
                                        setLocationConfirmChoice(null);
                                        window.setTimeout(() => {
                                          setLocationChatMessages([]);
                                          setLocationMarketChipSelectingId(null);
                                          transitionToStep("focus", "forward");
                                        }, 180);
                                      } else if (cta.variant === "browse_markets") {
                                        setLocationMarketChipSelectingId(msg.id);
                                        window.setTimeout(() => {
                                          setPersona("field");
                                          setSelectedLocation(null);
                                          setSelectedStoreId(null);
                                          setLocationChatMessages([]);
                                          setLocationMarketChipSelectingId(null);
                                        }, 180);
                                      }
                                    }}
                                  >
                                    <CornerDownRight size={16} className="v2-chip-icon-left" />
                                    <span>
                                      {msg.locationCta!.variant === "select_market"
                                        ? `Search ${msg.locationCta!.marketLabel ?? "this market"}`
                                        : (msg.locationCta!.marketLabel ?? "Go to market selection")}
                                    </span>
                                    {locationMarketChipSelectingId === msg.id && (
                                      <Check size={16} className="v2-chip-icon-right" />
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="v2-chat-prompt">
                      <textarea
                        placeholder="Or type a city or market..."
                        className="v2-chat-prompt-input"
                        rows={1}
                        value={locationChatInput}
                        onChange={(e) => setLocationChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleLocationChatSubmit(locationChatInput);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className={`v2-chat-prompt-send${locationChatInput.trim() ? " active" : ""}`}
                        onClick={() => handleLocationChatSubmit(locationChatInput)}
                        disabled={!locationChatInput.trim()}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Regional/District Manager, Recruiter, or Single-Store picking different market: Full location picker */}
              {(persona === "field" || persona === "recruiter" || (persona === "individual" && pickingDifferentMarket)) && (
                <>
                  <div className="v2-step-header">
                    <h1 className="type-tagline">Where are you hiring?</h1>
                    <p className="type-prompt-question v2-step-subtitle">
                      Select a location in the dropdown or search for one of our available markets.
                    </p>
                  </div>

                  <div className="v2-location-controls">
                    <div className="v2-location-dropdown">
                      <select
                        value={selectedStoreId || ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            const store = STORE_LOCATIONS.find(
                              (s) => s.id === e.target.value,
                            );
                            if (store) {
                              setSelectedStoreId(store.id);
                              setSelectedLocation(store.marketId);
                            }
                          } else {
                            setSelectedStoreId(null);
                            setSelectedLocation(null);
                          }
                        }}
                        className="v2-location-select"
                      >
                        <option value="" disabled hidden>Select a location</option>
                        {STORE_LOCATIONS.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="v2-location-or">or</span>

                    <div className="v2-search-input-wrapper v2-location-search">
                      <Search size={18} className="v2-search-icon" />
                      <input
                        type="text"
                        placeholder="Search markets..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="v2-search-input"
                      />
                      {locationSearch && (
                        <button
                          className="v2-search-clear"
                          onClick={() => setLocationSearch("")}
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className={`v2-location-grid v2-step-content-scroll ${selectedLocation ? "sidebar-open" : ""}`}
                  >
                    {[...MARKETS]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .filter((m) => {
                        if (!locationSearch.trim()) return true;
                        const search = locationSearch.toLowerCase();
                        return (
                          m.name.toLowerCase().includes(search) ||
                          m.state.toLowerCase().includes(search)
                        );
                      })
                      .map((market) => (
                        <button
                          key={market.id}
                          className={`v2-location-chip ${selectedLocation === market.id ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedStoreId(null); // Clear dropdown when chip selected
                            setSelectedLocation(
                              selectedLocation === market.id ? null : market.id,
                            );
                          }}
                        >
                          <span className="v2-chip-text">
                            {market.name}, <strong>{market.state}</strong>
                          </span>
                          <span className="v2-chip-icon">
                            {selectedLocation === market.id && (
                              <Check size={14} />
                            )}
                          </span>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </V2Main>
          )}

          {/* Step 3: Focus Area Selection (CYOA - Pick starting point) */}
          {step === "focus" && (
            <V2Main
              stepClassName="v2-main-centered"
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onBack: () => transitionToStep("location", "back"),
                onNext: () => {
                  if (focusArea === "employment") {
                    transitionToStep("employment", "forward");
                  } else if (focusArea === "brands") {
                    transitionToStep("brands", "forward");
                  } else if (focusArea === "roles") {
                    transitionToStep("experience", "forward");
                  }
                },
                showBack: true,
                nextDisabled: !focusArea || completedSections.has(focusArea),
                nextLabel: "Continue",
              }}
            >
              <div className="v2-step-content-scroll">
                <div className="v2-step-header-chips">
                  <div className="v2-step-header">
                    <h1 className="type-tagline">
                      Let's narrow down your connections. Where would you like to start, {userName}?
                    </h1>
                  </div>

                  <div className={`v2-journey-cards${focusChatActive ? " chat-active" : ""}`}>
                  <button
                    className={`journey-card journey-card-1${completedSections.has("employment") ? " completed" : ""}${focusArea === "employment" ? " selected" : ""}`}
                    onClick={() => {
                      // If chat is active, collapse it first
                      if (focusChatActive) {
                        setFocusChatActive(false);
                        setFocusChatInput("");
                      }
                      // Track starting card for CYOA order
                      if (!startingFocusArea) {
                        setStartingFocusArea("employment");
                      }
                      setFocusArea("employment");
                      transitionToStep("employment", "forward");
                    }}
                  >
                    <p className="journey-card-description">Full-time, part-time, or open to both?</p>
                    <div className="journey-card-footer">
                      <div className="journey-card-header">
                        <div className="journey-card-icon">
                          <CalendarFold size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="journey-card-title">Type of employment</h3>
                      </div>
                      <div className="journey-card-arrow">
                        {completedSections.has("employment") || focusArea === "employment" ? (
                          <Check size={20} strokeWidth={2} />
                        ) : (
                          <ArrowRight size={20} />
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    className={`journey-card journey-card-2${completedSections.has("brands") ? " completed" : ""}${focusArea === "brands" ? " selected" : ""}`}
                    onClick={() => {
                      // If chat is active, collapse it first
                      if (focusChatActive) {
                        setFocusChatActive(false);
                        setFocusChatInput("");
                      }
                      // Track starting card for CYOA order
                      if (!startingFocusArea) {
                        setStartingFocusArea("brands");
                      }
                      setFocusArea("brands");
                      transitionToStep("brands", "forward");
                    }}
                  >
                    <p className="journey-card-description">Which brands do you like to recruit from?</p>
                    <div className="journey-card-footer">
                      <div className="journey-card-header">
                        <div className="journey-card-icon">
                          <Blend size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="journey-card-title">Brand affinity</h3>
                      </div>
                      <div className="journey-card-arrow">
                        {completedSections.has("brands") || focusArea === "brands" ? (
                          <Check size={20} strokeWidth={2} />
                        ) : (
                          <ArrowRight size={20} />
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    className={`journey-card journey-card-3${completedSections.has("roles") ? " completed" : ""}${focusArea === "roles" ? " selected" : ""}`}
                    onClick={() => {
                      // If chat is active, collapse it first
                      if (focusChatActive) {
                        setFocusChatActive(false);
                        setFocusChatInput("");
                      }
                      // Track starting card for CYOA order
                      if (!startingFocusArea) {
                        setStartingFocusArea("roles");
                      }
                      setFocusArea("roles");
                      transitionToStep("experience", "forward");
                    }}
                  >
                    <p className="journey-card-description">Where are they in their career?</p>
                    <div className="journey-card-footer">
                      <div className="journey-card-header">
                        <div className="journey-card-icon">
                          <ChartNoAxesGantt size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="journey-card-title">Experience level</h3>
                      </div>
                      <div className="journey-card-arrow">
                        {completedSections.has("roles") || focusArea === "roles" ? (
                          <Check size={20} strokeWidth={2} />
                        ) : (
                          <ArrowRight size={20} />
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                  {/* Chat - full width under journey cards, scrollable */}
                  <div className="v2-chat-inline">
                    {/* Scrollable message area */}
                    {focusChatMessages.length > 0 && (
                      <div className="v2-chat-messages v2-focus-chat-messages" ref={focusChatMessagesRef}>
                        {focusChatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`v2-chat-message ${msg.role}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="v2-chat-avatar">
                                <img src={chatbotAvatarUrl} alt="Assistant" />
                              </div>
                            )}
                            <div className="v2-chat-bubble">
                              {msg.role === "assistant" ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        ))}
                        {isFocusChatLoading && (
                          <div className="v2-chat-message assistant">
                            <div className="v2-chat-avatar">
                              <img src={chatbotAvatarUrl} alt="Assistant" />
                            </div>
                            <div className="v2-chat-bubble">
                              <div className="v2-chat-loading">
                                <span className="v2-chat-dot"></span>
                                <span className="v2-chat-dot"></span>
                                <span className="v2-chat-dot"></span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggestion chip — appears when Gemini identifies a focus area */}
                    {!isFocusChatLoading && (() => {
                      const lastAssistant = [...focusChatMessages].reverse().find(m => m.role === 'assistant');
                      return lastAssistant?.suggestedRoute ? (
                        <div className="v2-focus-suggestion-wrapper">
                          <button
                            className="message-chip-single"
                            onClick={() => handleFocusRouteSuggestion(lastAssistant.suggestedRoute!)}
                          >
                            <span>Start with {FOCUS_ROUTE_LABELS[lastAssistant.suggestedRoute]}?</span>
                            <span className="chip-icon"></span>
                          </button>
                        </div>
                      ) : null;
                    })()}

                    {/* Input - always visible */}
                    <div className="v2-chat-prompt">
                      <textarea
                        placeholder="Or start with something else..."
                        className="v2-chat-prompt-input"
                        rows={1}
                        value={focusChatInput}
                        onFocus={() => setFocusChatActive(true)}
                        onChange={(e) => setFocusChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendFocusChatMessage(focusChatInput);
                          }
                        }}
                      />
                      <button
                        className={`v2-chat-prompt-send${focusChatInput.trim() ? " active" : ""}`}
                        onClick={() => sendFocusChatMessage(focusChatInput)}
                        disabled={isFocusChatLoading || !focusChatInput.trim()}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </V2Main>
          )}

          {/* Employment Type Selection */}
          {step === "employment" && (
            <V2Main
              stepClassName="v2-main-centered"
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onBack: () => transitionToStep(getPreviousSection("employment"), "back"),
                showBack: true,
                onNext: () => completeSection("employment"),
                nextDisabled: !employmentType,
              }}
            >
              <V2EmploymentSelector
                value={employmentType}
                onChange={(type) => {
                  setEmploymentType(type);
                }}
                availabilityHours={availabilityHours}
                onAvailabilityChange={(hours) => {
                  setAvailabilityHours(hours);
                }}
              />
            </V2Main>
          )}

          {/* Experience Level Selection */}
          {step === "experience" && (
            <V2Main
              stepClassName="v2-main-centered"
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onBack: () => transitionToStep(getPreviousSection("roles"), "back"),
                onNext: () => {
                  if (experienceLevel) {
                    completeSection("roles");
                  }
                },
                nextDisabled: !experienceLevel,
                nextLabel: "Continue",
                showBack: true,
              }}
            >
              <div className="v2-step-header">
                <h1 className="type-tagline">
                  What experience level are you looking for?
                </h1>
                <p className="type-prompt-question v2-step-subtitle">
                  Based on shifts completed on Reflex and other retail experience.
                </p>
              </div>

              <div className="v2-experience-slider">
                <div className="v2-slider-markers">
                  <button
                    type="button"
                    className="v2-slider-marker"
                    onClick={() => setExperienceLevel("all")}
                  >
                    <span className={`v2-slider-label ${experienceLevel === "all" ? 'active' : ''}`}>
                      Show me all
                    </span>
                    <span className={`v2-slider-sublabel ${experienceLevel === "all" ? 'active' : ''}`}>
                      All experience<br />levels
                    </span>
                    <div className="v2-slider-tick" />
                  </button>
                  <button
                    type="button"
                    className="v2-slider-marker"
                    onClick={() => setExperienceLevel("new")}
                  >
                    <span className={`v2-slider-label ${experienceLevel === "new" ? 'active' : ''}`}>
                      Rising talent
                    </span>
                    <span className={`v2-slider-sublabel ${experienceLevel === "new" ? 'active' : ''}`}>
                      Under 6 mos in retail<br />or up to 20 Flexes
                    </span>
                    <div className="v2-slider-tick" />
                  </button>
                  <button
                    type="button"
                    className="v2-slider-marker"
                    onClick={() => setExperienceLevel("rising")}
                  >
                    <span className={`v2-slider-label ${experienceLevel === "rising" ? 'active' : ''}`}>
                      Experienced
                    </span>
                    <span className={`v2-slider-sublabel ${experienceLevel === "rising" ? 'active' : ''}`}>
                      6 mos – 2 yrs in retail<br />or up to 50 Flexes
                    </span>
                    <div className="v2-slider-tick" />
                  </button>
                  <button
                    type="button"
                    className="v2-slider-marker"
                    onClick={() => setExperienceLevel("seasoned")}
                  >
                    <span className={`v2-slider-label ${experienceLevel === "seasoned" ? 'active' : ''}`}>
                      Seasoned pro
                    </span>
                    <span className={`v2-slider-sublabel ${experienceLevel === "seasoned" ? 'active' : ''}`}>
                      2+ yrs in retail<br />or 50+ Flexes
                    </span>
                    <div className="v2-slider-tick" />
                  </button>
                  <button
                    type="button"
                    className="v2-slider-marker"
                    onClick={() => setExperienceLevel("management")}
                  >
                    <span className={`v2-slider-label ${experienceLevel === "management" ? 'active' : ''}`}>
                      Proven leader
                    </span>
                    <span className={`v2-slider-sublabel ${experienceLevel === "management" ? 'active' : ''}`}>
                      Has managed<br />a team or store
                    </span>
                    <div className="v2-slider-tick" />
                  </button>
                </div>
                <div className="v2-slider-track-container v2-experience-track">
                  <div className="v2-slider-track-wrapper">
                    <div
                      className="v2-slider-fill"
                      style={{
                        width: experienceLevel === "all" ? "10%"
                          : experienceLevel === "new" ? "30%"
                          : experienceLevel === "rising" ? "50%"
                          : experienceLevel === "seasoned" ? "70%"
                          : experienceLevel === "management" ? "90%"
                          : "10%"
                      }}
                    />
                    <div
                      className="v2-experience-thumb"
                      style={{
                        left: experienceLevel === "all" ? "10%"
                          : experienceLevel === "new" ? "30%"
                          : experienceLevel === "rising" ? "50%"
                          : experienceLevel === "seasoned" ? "70%"
                          : experienceLevel === "management" ? "90%"
                          : "10%"
                      }}
                    />
                  </div>
                </div>
              </div>
            </V2Main>
          )}

          {/* Brand Selection */}
          {step === "brands" && (
            <V2Main
              stepClassName=""
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onBack: () => transitionToStep(getPreviousSection("brands"), "back"),
                onNext: () => {
                  if (uniqueSelectedBrandCount > 0) {
                    completeSection("brands");
                  }
                },
                nextDisabled: uniqueSelectedBrandCount === 0,
                nextLabel:
                  uniqueSelectedBrandCount > 0
                    ? `Continue (${uniqueSelectedBrandCount})`
                    : "Continue",
                showBack: true,
              }}
            >
              <div className="v2-step-header">
                  <h1 className="type-tagline">
                    Which brands do you like to recruit from?
                  </h1>
                  <p className="type-prompt-question">
                    Select brands that attract the kind of people you'd want on your team. We'll find Reflexers with experience there or at similar brands.
                  </p>
                </div>

                {/* Popular picks */}
                <div className="v2-popular-brands">
                  <span className="v2-popular-label">Popular picks:</span>
                  <div className="v2-popular-chips">
                    {POPULAR_BRANDS.map((brand) => (
                      <button
                        key={brand.id}
                        className={`v2-popular-chip ${isBrandTileSelected(brand.id) ? "selected" : ""}`}
                        onClick={() => toggleBrand(brand.id)}
                      >
                        {brand.name}
                        {isBrandTileSelected(brand.id) ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="v2-brand-grid-header">
                  <div className="v2-brand-search">
                    <div className="v2-search-input-wrapper">
                      <Search size={16} className="v2-search-icon" />
                      <input
                        type="text"
                        placeholder="Search brands..."
                        value={brandSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="v2-search-input"
                      />
                      {brandSearch && (
                        <button
                          className="v2-search-clear"
                          onClick={() => setBrandSearch("")}
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {brandSearch && (
                      <span
                        className={`v2-search-results ${searchResults && searchResults.length === 0 ? "no-results" : ""}`}
                      >
                        {searchResults && searchResults.length === 0
                          ? "No results found"
                          : `${searchResults?.length} brand${searchResults?.length === 1 ? "" : "s"} found`}
                      </span>
                    )}
                  </div>
                  <div className="v2-brand-grid-actions">
                    <button
                      className="v2-clear-all"
                      onClick={() => setSelectedBrands([])}
                      disabled={uniqueSelectedBrandCount === 0}
                    >
                      Clear all
                    </button>
                  </div>
                </div>

              <div className="v2-step-content-scroll">
                <div
                  className={`v2-brand-grid ${!sidebarOpen ? "expanded" : ""}`}
                >
                  {BRAND_LOGOS.map((brand) => (
                    <button
                      key={brand.id}
                      ref={(el) => {
                        brandRefs.current[brand.id] = el;
                      }}
                      className={`v2-brand-tile ${isBrandTileSelected(brand.id) ? "selected" : ""}${searchResults && searchResults.some((r) => r.id === brand.id) ? " search-match" : ""}`}
                      onClick={() => toggleBrand(brand.id)}
                    >
                      <img src={brand.logo} alt="" className="v2-brand-logo" />
                      {isBrandTileSelected(brand.id) && (
                        <div className="v2-brand-check">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </V2Main>
          )}

          {/* Results - Enhanced Meet Your Matches */}
          {step === "results" && (
            <V2Main
              stepClassName="v2-results-step"
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              hideFooter
            >
              <div className="v2-results-header">
                <div className="v2-results-icon">
                  <Sparkles size={32} />
                </div>
                <h1 className="type-tagline">
                  {filteredWorkers.length > 0
                    ? `We found ${filteredWorkers.length} amazing ${filteredWorkers.length === 1 ? "match" : "matches"} in ${MARKETS.find(m => m.id === selectedLocation)?.name || selectedLocation}!`
                    : "No matches found"}
                </h1>
                <div className="v2-search-summary">
                  {experienceLevel && (
                    <div className="v2-summary-group">
                      <span className="v2-summary-label">Experience level</span>
                      <span className="tag tag-lite-gray tag-sm">
                        <span className="tag-text">
                          {experienceLevel === 'all' ? 'All levels'
                            : experienceLevel === 'new' ? 'Rising talent'
                            : experienceLevel === 'rising' ? 'Experienced'
                            : experienceLevel === 'seasoned' ? 'Seasoned pro'
                            : experienceLevel === 'management' ? 'Proven leader'
                            : experienceLevel}
                        </span>
                      </span>
                    </div>
                  )}
                  {selectedBrands.length > 0 && (
                    <div className="v2-summary-group">
                      <span className="v2-summary-label">Brand experience</span>
                      {selectedBrands.map(b => (
                        <span key={b} className="tag tag-lite-gray tag-sm">
                          <span className="tag-text">{b.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <hr className="v2-results-divider" />
              {/* Action buttons */}
              <div className="v2-results-topbar">
                <div className="v2-results-actions">
                  <button className="v2-action-btn v2-action-primary v2-connect-all-btn" onClick={async () => {
                    const existingIds = new Set(workerConnections.map(c => c.worker_id));
                    const newWorkers = filteredWorkers.filter(w => !existingIds.has(w.id));
                    if (newWorkers.length === 0) return;

                    // Optimistic local update
                    const newConns: WorkerConnectionWithWorker[] = newWorkers.map(w => ({
                      id: crypto.randomUUID(),
                      worker_id: w.id,
                      market: typeof w.market === 'string' ? w.market : w.market[0],
                      chat_id: null,
                      status: 'invited' as const,
                      invited: true,
                      connected: true,
                      chat_open: false,
                      shift_booked: false,
                      shift_scheduled: false,
                      saved_for_later: false,
                      image_url: w.gender ? getWorkerPhotoFromPool(w.gender, w.id) : null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      worker: null,
                    }));
                    setWorkerConnections(prev => [...newConns, ...prev]);
                    setConnectionsDirty(true);

                    // Persist to DB
                    try {
                      await bulkInsertWorkerConnections(
                        newWorkers.map(w => ({
                          worker_id: w.id,
                          market: typeof w.market === 'string' ? w.market : w.market[0],
                          status: 'invited' as const,
                          connected: true,
                          saved_for_later: false,
                          image_url: w.gender ? getWorkerPhotoFromPool(w.gender, w.id) : null,
                        })),
                      );
                      setConnectionsDirty(true);
                    } catch (err) {
                      console.error('Failed to save connections:', err);
                    }
                  }}>
                    <UserPlus size={18} />
                    {filteredWorkers.length === 1
                      ? "Connect"
                      : `Connect with all ${filteredWorkers.length}`}
                  </button>
                  <button className="v2-action-btn v2-action-primary" onClick={async () => {
                    const existingIds = new Set(workerConnections.map(c => c.worker_id));
                    const newWorkers = filteredWorkers.filter(w => !existingIds.has(w.id));
                    if (newWorkers.length === 0) return;

                    // Optimistic local update
                    const newConns: WorkerConnectionWithWorker[] = newWorkers.map(w => ({
                      id: crypto.randomUUID(),
                      worker_id: w.id,
                      market: typeof w.market === 'string' ? w.market : w.market[0],
                      chat_id: null,
                      status: 'liked' as const,
                      invited: false,
                      connected: false,
                      chat_open: false,
                      shift_booked: false,
                      shift_scheduled: false,
                      saved_for_later: true,
                      image_url: w.gender ? getWorkerPhotoFromPool(w.gender, w.id) : null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      worker: null,
                    }));
                    setWorkerConnections(prev => [...newConns, ...prev]);
                    setConnectionsDirty(true);

                    // Persist to DB
                    try {
                      await bulkInsertWorkerConnections(
                        newWorkers.map(w => ({
                          worker_id: w.id,
                          market: typeof w.market === 'string' ? w.market : w.market[0],
                          status: 'liked' as const,
                          connected: false,
                          saved_for_later: true,
                          image_url: w.gender ? getWorkerPhotoFromPool(w.gender, w.id) : null,
                        })),
                      );
                      setConnectionsDirty(true);
                    } catch (err) {
                      console.error('Failed to save connections:', err);
                    }
                  }}>
                    Save all
                  </button>
                  <button className="v2-action-btn v2-action-secondary" onClick={() => {
                    setSelectedLocation(null);
                    setSelectedBrands([]);
                    setExperienceLevel(null);
                    setSelectedWorker(null);
                    setDetailSidebarOpen(false);
                    setStep('location');
                  }}>
                    Start New Search
                  </button>
                </div>
              </div>

              {/* Worker Card Grid - using WorkerCardFull */}
              <div className={`v2-worker-card-grid v2-grid-full ${detailSidebarOpen ? "sidebar-open" : ""}`}>
                {filteredWorkers.map((worker) => (
                  <div key={worker.id} className="v2-grid-full-card">
                    <WorkerCardFull
                      worker={worker}
                      showActions
                      isConnected={workerConnections.some(c => c.worker_id === worker.id && c.connected)}
                      isLiked={workerConnections.some(c => c.worker_id === worker.id && c.saved_for_later)}
                      onConnect={async () => {
                        const existing = workerConnections.find(c => c.worker_id === worker.id);
                        if (existing) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === worker.id ? { ...c, status: 'invited' as const, connected: true, saved_for_later: false } : c));
                        } else {
                          const mkt = MARKETS.find(m => m.id === selectedLocation)?.name || (typeof worker.market === 'string' ? worker.market : worker.market[0]);
                          const newConn: WorkerConnectionWithWorker = { id: crypto.randomUUID(), worker_id: worker.id, market: mkt, chat_id: null, status: 'invited', invited: true, connected: true, chat_open: false, shift_booked: false, shift_scheduled: false, saved_for_later: false, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), worker: null };
                          setWorkerConnections(prev => [newConn, ...prev]);
                          try { await bulkInsertWorkerConnections([{ worker_id: worker.id, market: mkt, status: 'invited', connected: true, saved_for_later: false }]); } catch {}
                        }
                      }}
                      onDisconnect={async () => {
                        const conn = workerConnections.find(c => c.worker_id === worker.id);
                        if (conn?.saved_for_later) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === worker.id ? { ...c, connected: false, status: 'liked' as const } : c));
                          try { await bulkInsertWorkerConnections([{ worker_id: worker.id, market: conn.market, status: 'liked', connected: false, saved_for_later: true }]); } catch {}
                        } else {
                          setWorkerConnections(prev => prev.filter(c => c.worker_id !== worker.id));
                          try { await deleteWorkerConnection(worker.id); } catch {}
                        }
                      }}
                      onLike={async () => {
                        const existing = workerConnections.find(c => c.worker_id === worker.id);
                        if (existing) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === worker.id ? { ...c, status: 'liked' as const, connected: false, saved_for_later: true } : c));
                        } else {
                          const mkt = MARKETS.find(m => m.id === selectedLocation)?.name || (typeof worker.market === 'string' ? worker.market : worker.market[0]);
                          const newConn: WorkerConnectionWithWorker = { id: crypto.randomUUID(), worker_id: worker.id, market: mkt, chat_id: null, status: 'liked', invited: false, connected: false, chat_open: false, shift_booked: false, shift_scheduled: false, saved_for_later: true, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), worker: null };
                          setWorkerConnections(prev => [newConn, ...prev]);
                          try { await bulkInsertWorkerConnections([{ worker_id: worker.id, market: mkt, status: 'liked', connected: false, saved_for_later: true }]); } catch {}
                        }
                      }}
                      onUnlike={async () => {
                        const conn = workerConnections.find(c => c.worker_id === worker.id);
                        if (conn?.connected) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === worker.id ? { ...c, saved_for_later: false } : c));
                          try { await bulkInsertWorkerConnections([{ worker_id: worker.id, market: conn.market, status: conn.status, connected: true, saved_for_later: false }]); } catch {}
                        } else {
                          setWorkerConnections(prev => prev.filter(c => c.worker_id !== worker.id));
                          try { await deleteWorkerConnection(worker.id); } catch {}
                        }
                      }}
                    />
                  </div>
                ))}
              </div>

                          </V2Main>
          )}

          {/* Selected Worker Full Card Sidebar */}
          {step === "results" && selectedWorker && (
            <div className={`v2-worker-detail-sidebar${detailSidebarOpen ? "" : " collapsed"}`}>
              <button
                className="v2-sidebar-toggle"
                onClick={() => setDetailSidebarOpen(!detailSidebarOpen)}
                aria-label={detailSidebarOpen ? "Collapse panel" : "Expand panel"}
              >
                {detailSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
              <div className="v2-detail-scroll">
                <WorkerCardFull worker={selectedWorker} />
              </div>
              <div className="v2-detail-actions">
                <button
                  className="v2-action-btn v2-action-primary"
                  onClick={async () => {
                    const alreadyConnected = workerConnections.some(c => c.worker_id === selectedWorker.id);
                    if (!alreadyConnected) {
                      const imgUrl = selectedWorker.gender ? getWorkerPhotoFromPool(selectedWorker.gender, selectedWorker.id) : null;
                      const newConnection: WorkerConnectionWithWorker = {
                        id: crypto.randomUUID(),
                        worker_id: selectedWorker.id,
                        market: MARKETS.find(m => m.id === selectedLocation)?.name || (typeof selectedWorker.market === 'string' ? selectedWorker.market : selectedWorker.market[0]),
                        chat_id: null,
                        status: 'invited',
                        invited: true,
                        connected: true,
                        chat_open: false,
                        shift_booked: false,
                        shift_scheduled: false,
                        saved_for_later: false,
                        image_url: imgUrl,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        worker: {
                          id: selectedWorker.id,
                          name: selectedWorker.name,
                          photo: selectedWorker.photo || null,
                          gender: selectedWorker.gender || null,
                          market: typeof selectedWorker.market === 'string' ? selectedWorker.market : selectedWorker.market[0],
                          shift_verified: selectedWorker.shiftVerified,
                          actively_looking: selectedWorker.activelyLooking,
                          shifts_on_reflex: selectedWorker.shiftsOnReflex,
                          unique_store_count: selectedWorker.uniqueStoreCount ?? null,
                          store_favorite_count: selectedWorker.storeFavoriteCount ?? null,
                          brands_worked: selectedWorker.brandsWorked || [],
                          invited_back_stores: selectedWorker.invitedBackStores,
                          tardy_ratio: selectedWorker.tardyRatio || null,
                          tardy_percent: selectedWorker.tardyPercent ?? null,
                          urgent_cancel_ratio: selectedWorker.urgentCancelRatio || null,
                          urgent_cancel_percent: selectedWorker.urgentCancelPercent ?? null,
                          current_tier: selectedWorker.currentTier || null,
                          experience_level: selectedWorker.experienceLevel || null,
                        } as any,
                      };
                      setWorkerConnections(prev => [newConnection, ...prev]);
                      try {
                        await bulkInsertWorkerConnections([{
                          worker_id: selectedWorker.id,
                          market: MARKETS.find(m => m.id === selectedLocation)?.name || (typeof selectedWorker.market === 'string' ? selectedWorker.market : selectedWorker.market[0]),
                          status: 'invited',
                          connected: true,
                          saved_for_later: false,
                          image_url: imgUrl,
                        }]);
                      } catch (err) { console.error('Failed to save connection:', err); }
                    }
                    setActiveTab('connections');
                  }}
                >
                  <Link size={18} />
                  Connect with {selectedWorker.name.split(' ')[0]}
                </button>
                <button
                  className="v2-action-btn v2-action-stroke"
                  onClick={async () => {
                    const existing = workerConnections.find(c => c.worker_id === selectedWorker.id);
                    if (existing) {
                      setWorkerConnections(prev => prev.map(c =>
                        c.worker_id === selectedWorker.id ? { ...c, saved_for_later: true } : c
                      ));
                    } else {
                      const imgUrl = selectedWorker.gender ? getWorkerPhotoFromPool(selectedWorker.gender, selectedWorker.id) : null;
                      const newConn: WorkerConnectionWithWorker = {
                        id: crypto.randomUUID(),
                        worker_id: selectedWorker.id,
                        market: MARKETS.find(m => m.id === selectedLocation)?.name || (typeof selectedWorker.market === 'string' ? selectedWorker.market : selectedWorker.market[0]),
                        chat_id: null,
                        status: 'liked',
                        invited: false,
                        connected: false,
                        chat_open: false,
                        shift_booked: false,
                        shift_scheduled: false,
                        saved_for_later: true,
                        image_url: imgUrl,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        worker: null,
                      };
                      setWorkerConnections(prev => [newConn, ...prev]);
                      try {
                        await bulkInsertWorkerConnections([{
                          worker_id: selectedWorker.id,
                          market: MARKETS.find(m => m.id === selectedLocation)?.name || (typeof selectedWorker.market === 'string' ? selectedWorker.market : selectedWorker.market[0]),
                          status: 'liked',
                          connected: false,
                          saved_for_later: true,
                          image_url: imgUrl,
                        }]);
                      } catch (err) { console.error('Failed to save connection:', err); }
                    }
                  }}
                >
                  <Heart size={18} />
                  Save for future opportunities
                </button>
              </div>
            </div>
          )}

          {/* Sidebar with worker cards - shown on location (when selected and NOT on market confirmation), brands, experience steps */}
          {((["brands", "experience"].includes(step) ||
            (step === "location" && selectedLocation && (persona !== "individual" || pickingDifferentMarket)))) && (
            <V2WorkerSidebar
              workers={["brands", "experience"].includes(step) ? filteredWorkers : marketWorkers}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              title={`${MARKETS.find(m => m.id === selectedLocation)?.name || "Market"} Talent`}
              showCount={true}
              onWorkerClick={() => {}}
              emptyMessage={
                step === "location"
                  ? "No Reflexers in this market yet. Try selecting a different market."
                  : step === "experience"
                  ? "No matches yet. Try selecting a different experience level."
                  : undefined
              }
              isLoading={isLoadingWorkers}
              isWorkerConnected={(id) => workerConnections.some(c => c.worker_id === id && c.connected)}
              isWorkerLiked={(id) => workerConnections.some(c => c.worker_id === id && c.saved_for_later)}
              onWorkerConnect={async (w) => {
                const existing = workerConnections.find(c => c.worker_id === w.id);
                if (existing) {
                  setWorkerConnections(prev => prev.map(c => c.worker_id === w.id ? { ...c, status: 'invited' as const, connected: true, saved_for_later: false } : c));
                } else {
                  const mkt = MARKETS.find(m => m.id === selectedLocation)?.name || (typeof w.market === 'string' ? w.market : w.market[0]);
                  const newConn: WorkerConnectionWithWorker = { id: crypto.randomUUID(), worker_id: w.id, market: mkt, chat_id: null, status: 'invited', invited: true, connected: true, chat_open: false, shift_booked: false, shift_scheduled: false, saved_for_later: false, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), worker: null };
                  setWorkerConnections(prev => [newConn, ...prev]);
                  try { await bulkInsertWorkerConnections([{ worker_id: w.id, market: mkt, status: 'invited', connected: true, saved_for_later: false }]); } catch {}
                }
              }}
              onWorkerDisconnect={async (w) => {
                const conn = workerConnections.find(c => c.worker_id === w.id);
                if (conn?.saved_for_later) {
                  setWorkerConnections(prev => prev.map(c => c.worker_id === w.id ? { ...c, connected: false, status: 'liked' as const } : c));
                  try { await bulkInsertWorkerConnections([{ worker_id: w.id, market: conn.market, status: 'liked', connected: false, saved_for_later: true }]); } catch {}
                } else {
                  setWorkerConnections(prev => prev.filter(c => c.worker_id !== w.id));
                  try { await deleteWorkerConnection(w.id); } catch {}
                }
              }}
              onWorkerLike={async (w) => {
                const existing = workerConnections.find(c => c.worker_id === w.id);
                if (existing) {
                  setWorkerConnections(prev => prev.map(c => c.worker_id === w.id ? { ...c, status: 'liked' as const, connected: false, saved_for_later: true } : c));
                } else {
                  const mkt = MARKETS.find(m => m.id === selectedLocation)?.name || (typeof w.market === 'string' ? w.market : w.market[0]);
                  const newConn: WorkerConnectionWithWorker = { id: crypto.randomUUID(), worker_id: w.id, market: mkt, chat_id: null, status: 'liked', invited: false, connected: false, chat_open: false, shift_booked: false, shift_scheduled: false, saved_for_later: true, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), worker: null };
                  setWorkerConnections(prev => [newConn, ...prev]);
                  try { await bulkInsertWorkerConnections([{ worker_id: w.id, market: mkt, status: 'liked', connected: false, saved_for_later: true }]); } catch {}
                }
              }}
              onWorkerUnlike={async (w) => {
                const conn = workerConnections.find(c => c.worker_id === w.id);
                if (conn?.connected) {
                  setWorkerConnections(prev => prev.map(c => c.worker_id === w.id ? { ...c, saved_for_later: false } : c));
                  try { await bulkInsertWorkerConnections([{ worker_id: w.id, market: conn.market, status: conn.status, connected: true, saved_for_later: false }]); } catch {}
                } else {
                  setWorkerConnections(prev => prev.filter(c => c.worker_id !== w.id));
                  try { await deleteWorkerConnection(w.id); } catch {}
                }
              }}
            />
          )}
        </div>
      )}

      {/* Connections Tab - Shows workers from worker_connections table */}
      {activeTab === "connections" && (() => {
        // Status icons and labels based on new schema
        const statusIcons: Record<string, React.ReactNode> = {
          liked: <Heart size={14} />,
          invited: <UserPlus size={14} />,
          accepted: <Link size={14} />,
          worker_declined: <XCircle size={14} />,
          not_interested: <XCircle size={14} />, // Legacy support
          removed: <XCircle size={14} />,
        };

        const statusLabels: Record<string, string> = {
          liked: "Saved",
          invited: "Invited",
          accepted: "Connected",
          worker_declined: "Worker Declined",
          not_interested: "Worker Declined", // Legacy support
          removed: "Removed",
        };

        // Use memoized values from above
        const markets = connectionStats.markets;
        const statusCounts = connectionStats.counts;

        // Helper to get initials
        const getInitials = (name: string) => {
          const parts = name.split(" ");
          return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
        };

        // Helper to format name with last initial (e.g., "Patricia S.")
        const formatDisplayName = (name: string) => {
          const parts = name.split(" ");
          if (parts.length > 1) {
            return `${parts[0]} ${parts[parts.length - 1][0]}.`;
          }
          return parts[0];
        };

        return (
          <div className="v2-connections-wrapper">
          <div className={`v2-connections-container ${selectedConnectionWorker && connDetailOpen ? 'with-sidebar' : ''}`}>
            <div className="v2-connections-header">
              <h2 className="type-section-header-lg">Your Connections</h2>
              <div className="v2-conn-filter-row">
                <div className="v2-conn-market-dropdown">
                  <Users size={14} />
                  <select
                    value={connectionsStatusFilter || ''}
                    onChange={(e) => setConnectionsStatusFilter(e.target.value || null)}
                  >
                    <option value="">All ({statusCounts.all})</option>
                    <option value="chat_open">All Connections ({statusCounts.chat_open})</option>
                    <option value="shift_scheduled">Flex Booked ({statusCounts.shift_scheduled})</option>
                    <option value="shift_booked">Flex Requested ({statusCounts.shift_booked})</option>
                    <option value="saved_for_later">Saved ({statusCounts.saved_for_later})</option>
                    <option value="worker_declined">Worker Declined ({statusCounts.worker_declined})</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
                <div className="v2-conn-market-dropdown">
                  <MapPin size={14} />
                  <select
                    value={connectionsMarketFilter || ''}
                    onChange={(e) => setConnectionsMarketFilter(e.target.value || null)}
                  >
                    <option value="">All Markets ({workerConnections.length})</option>
                    {markets.map(market => {
                      const count = workerConnections.filter(c => c.market === market).length;
                      return <option key={market} value={market}>{market} ({count})</option>;
                    })}
                  </select>
                  <ChevronDown size={16} />
                </div>
                <div className="v2-connections-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search workers..."
                    value={connectionsSearch}
                    onChange={(e) => setConnectionsSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {isLoadingConnections ? (
              <div className="v2-connections-loading">Loading connections...</div>
            ) : (
              <>
                {/* Column Headers — uses same structure as card rows for perfect alignment */}
                <div className="v2-conn-row v2-conn-header-row">
                  <div className="v2-conn-top">
                    <div className="v2-conn-col-1"><span className="v2-conn-hdr">Worker</span></div>
                    <div className="v2-conn-col-2"><span className="v2-conn-hdr">Achievements</span></div>
                    <div className="v2-conn-col-3"><span className="v2-conn-hdr" style={{ whiteSpace: 'nowrap' }}>Date Added</span></div>
                    <div className="v2-conn-col-4"><span className="v2-conn-hdr">Status</span></div>
                  </div>
                </div>

                {/* Connections List */}
                <div className="v2-connections-list">
                  {filteredConnections.length === 0 ? (
                    <div className="v2-connections-empty">No connections found matching your filters.</div>
                  ) : (
                    filteredConnections.map((connection) => {
                      const worker = connection.worker;
                      const name = worker?.name || "Unknown Worker";
                      const initials = getInitials(name);
                      const isNotInterested = connection.status === "not_interested" || connection.status === "removed";
                      const d = new Date(connection.created_at);
                      const dateAdded = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
                      const isSelected = selectedConnectionWorker?.id === connection.id;

                      type AchievementChip = { text: string; icon: React.ReactNode; variant: string };
                      const ac: AchievementChip[] = [];
                      if ((worker?.store_favorite_count ?? 0) > 1) ac.push({ text: 'Your Store Favorite', icon: <Heart size={12} color="var(--pink-500)" fill="var(--pink-500)" />, variant: 'tag-pink-stroke' });
                      const tp = worker?.tardy_percent ?? 100; const tr = worker?.tardy_ratio || '';
                      if (tr.startsWith('0 /') || tr.startsWith('0/') || tp === 0 || (worker?.tardy_percent != null && (100 - tp) > 85)) ac.push({ text: 'Consistently On-Time', icon: <ClockCheck size={12} />, variant: 'tag-stroke' });
                      const cr = worker?.urgent_cancel_ratio || ''; const cp = worker?.urgent_cancel_percent ?? 100;
                      if (cr.startsWith('0 /') || cr.startsWith('0/') || cp === 0) ac.push({ text: 'Never Called Out', icon: <Trophy size={12} />, variant: 'tag-stroke' });
                      const sfc = worker?.store_favorite_count || 0; const us = worker?.unique_store_count || 0;
                      if (us > 0 && Math.min((sfc / us) * 100, 100) >= 85) ac.push({ text: 'Strong Store Favorite', icon: <HeartPlus size={12} />, variant: 'tag-stroke' });
                      const ib = worker?.invited_back_stores ?? 0;
                      if (us > 0 && ib > 0 && Math.min((ib / us) * 100, 100) >= 94) ac.push({ text: 'Invite Back Standout', icon: <UserStar size={12} />, variant: 'tag-stroke' });

                      const handleClick = async () => {
                        setSelectedConnectionWorker(connection);
                        setConnDetailOpen(true);
                        setSelectedConnectionFullWorker(null);
                        const wid = connection.worker?.id;
                        if (wid) { setIsLoadingConnectionWorker(true); try { setSelectedConnectionFullWorker(await fetchWorkerById(wid)); } catch {} finally { setIsLoadingConnectionWorker(false); } }
                      };

                      // Status tag — used inline with name
                      const statusTag = connection.shift_scheduled ? (
                        <span className="tag tag-blue tag-sm"><span className="tag-icon"><CalendarDays size={12} /></span><span className="tag-text">Flex Booked</span></span>
                      ) : connection.shift_booked ? (
                        <span className="tag tag-blue-light tag-sm"><span className="tag-icon"><CalendarClock size={12} /></span><span className="tag-text">Flex Requested</span></span>
                      ) : connection.status === "accepted" ? (
                        <span className="tag tag-green tag-sm"><span className="tag-icon"><Link size={12} /></span><span className="tag-text">Connected</span></span>
                      ) : connection.status === "invited" ? (
                        <span className="tag tag-green-light tag-sm"><span className="tag-icon"><UserPlus size={12} /></span><span className="tag-text">Invited</span></span>
                      ) : connection.status === "liked" || connection.saved_for_later ? (
                        <span className="tag tag-lite-gray tag-sm"><span className="tag-icon"><Heart size={12} /></span><span className="tag-text">Saved</span></span>
                      ) : connection.status === "not_interested" ? (
                        <span className="tag tag-lite-gray tag-sm"><span className="tag-icon"><XCircle size={12} /></span><span className="tag-text">Declined</span></span>
                      ) : null;

                      // Status border color for left stripe — matches the status tag bg color
                      const statusBorder = connection.shift_scheduled ? 'var(--accent-blue-light)'
                        : connection.shift_booked ? 'var(--background-blue)'
                        : connection.status === "accepted" ? 'var(--accent-green-light)'
                        : connection.status === "invited"
                        ? 'var(--background-green)'
                        : connection.status === "liked" || connection.saved_for_later
                        ? 'var(--gray-200)'
                        : 'var(--gray-200)';

                      const chatOk = connection.status === "accepted" || connection.shift_scheduled || connection.shift_booked;
                      const chatBtn = chatOk ? (
                        <button type="button" className="v2-conn-chat-btn enabled" onClick={(e) => { e.stopPropagation(); setActiveChatId(`chat-${connection.worker_id}`); setActiveTab("chat"); }}>
                          <MessageSquare size={14} /> Chat
                        </button>
                      ) : (
                        <button type="button" className="v2-conn-chat-btn disabled" disabled>
                          <MessageSquareOff size={14} /> Chat
                        </button>
                      );

                      return (
                        <div
                          key={connection.id}
                          className={`v2-conn-row${isNotInterested ? ' not-interested' : ''}${isSelected ? ' selected' : ''}`}
                          onClick={handleClick}
                          style={{ cursor: 'pointer', borderLeftColor: statusBorder }}
                        >
                          <div className="v2-conn-top">
                            <div className="v2-conn-col-1">
                              <div className="v2-connection-avatar" style={{ width: 64, height: 64 }}>
                                {(() => {
                                  const photo = (worker?.gender ? getWorkerPhotoFromPool(worker.gender, worker.id) : null) || worker?.photo || connection.image_url;
                                  return photo ? <img src={photo} alt={name} /> : <span>{initials}</span>;
                                })()}
                                {worker?.shift_verified && (
                                  <span className="v2-conn-verified-badge"><BadgeCheck size={14} /></span>
                                )}
                              </div>
                              <div className="v2-conn-name-stack">
                                <span className="v2-conn-name">{formatDisplayName(name)}</span>
                                {worker?.actively_looking && (
                                  <span className="tag tag-blue-light tag-xs" style={{ alignSelf: 'flex-start' }}><span className="tag-icon"><Search size={10} /></span><span className="tag-text">Actively Looking</span></span>
                                )}
                                <div className="v2-conn-meta">
                                  <MapPin size={12} />
                                  <span>{connection.market}</span>
                                </div>
                              </div>
                            </div>
                            <div className="v2-conn-col-2">
                              <div className="v2-conn-stats-row">
                                <span className="tag tag-stroke tag-sm"><span className="tag-counter">{worker?.shifts_on_reflex || 0}</span><span className="tag-text">Shifts</span></span>
                                {us > 0 && <span className="tag tag-stroke tag-sm"><span className="tag-counter">{us}</span><span className="tag-text">Stores</span></span>}
                              </div>
                              <div className="v2-conn-achievements-row">
                                {ac.slice(0, 3).map((c, i) => <span key={i} className="tag tag-stroke tag-sm"><span className="tag-icon">{c.icon}</span><span className="tag-text">{c.text}</span></span>)}
                              </div>
                            </div>
                            <div className="v2-conn-col-3">
                              <span className="v2-conn-date-value">{dateAdded}</span>
                            </div>
                            <div className="v2-conn-col-4">
                              {statusTag}
                              {chatBtn}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Selected Connection Worker Full Card Sidebar */}
          {selectedConnectionWorker && (
            <div className={`v2-worker-detail-sidebar${connDetailOpen ? '' : ' collapsed'}`}>
              <button
                className="v2-sidebar-toggle"
                onClick={() => setConnDetailOpen(!connDetailOpen)}
                aria-label={connDetailOpen ? "Collapse panel" : "Expand panel"}
              >
                {connDetailOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
              <div className="v2-detail-scroll">
                {isLoadingConnectionWorker ? (
                  <div className="v2-connections-loading">Loading worker details...</div>
                ) : selectedConnectionFullWorker ? (
                  <>
                    <WorkerCardFull
                      showActions
                      isConnected={workerConnections.some(c => c.worker_id === selectedConnectionWorker.worker_id && c.connected)}
                      isLiked={workerConnections.some(c => c.worker_id === selectedConnectionWorker.worker_id && c.saved_for_later)}
                      onConnect={async () => {
                        const wid = selectedConnectionWorker.worker_id;
                        const existing = workerConnections.find(c => c.worker_id === wid);
                        if (existing) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === wid ? { ...c, status: 'invited' as const, connected: true, saved_for_later: false } : c));
                        } else {
                          const mkt = selectedConnectionWorker.market;
                          const newConn: WorkerConnectionWithWorker = { id: crypto.randomUUID(), worker_id: wid, market: mkt, chat_id: null, status: 'invited', invited: true, connected: true, chat_open: false, shift_booked: false, shift_scheduled: false, saved_for_later: false, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), worker: null };
                          setWorkerConnections(prev => [newConn, ...prev]);
                        }
                        try { await bulkInsertWorkerConnections([{ worker_id: wid, market: selectedConnectionWorker.market, status: 'invited', connected: true, saved_for_later: false }]); } catch {}
                      }}
                      onDisconnect={async () => {
                        const wid = selectedConnectionWorker.worker_id;
                        const conn = workerConnections.find(c => c.worker_id === wid);
                        if (conn?.saved_for_later) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === wid ? { ...c, connected: false, status: 'liked' as const } : c));
                          try { await bulkInsertWorkerConnections([{ worker_id: wid, market: conn.market, status: 'liked', connected: false, saved_for_later: true }]); } catch {}
                        } else {
                          setWorkerConnections(prev => prev.filter(c => c.worker_id !== wid));
                          try { await deleteWorkerConnection(wid); } catch {}
                        }
                      }}
                      onLike={async () => {
                        const wid = selectedConnectionWorker.worker_id;
                        const existing = workerConnections.find(c => c.worker_id === wid);
                        if (existing) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === wid ? { ...c, status: 'liked' as const, connected: false, saved_for_later: true } : c));
                        } else {
                          const mkt = selectedConnectionWorker.market;
                          const newConn: WorkerConnectionWithWorker = { id: crypto.randomUUID(), worker_id: wid, market: mkt, chat_id: null, status: 'liked', invited: false, connected: false, chat_open: false, shift_booked: false, shift_scheduled: false, saved_for_later: true, image_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), worker: null };
                          setWorkerConnections(prev => [newConn, ...prev]);
                        }
                        try { await bulkInsertWorkerConnections([{ worker_id: wid, market: selectedConnectionWorker.market, status: 'liked', connected: false, saved_for_later: true }]); } catch {}
                      }}
                      onUnlike={async () => {
                        const wid = selectedConnectionWorker.worker_id;
                        const conn = workerConnections.find(c => c.worker_id === wid);
                        if (conn?.connected) {
                          setWorkerConnections(prev => prev.map(c => c.worker_id === wid ? { ...c, saved_for_later: false } : c));
                          try { await bulkInsertWorkerConnections([{ worker_id: wid, market: conn.market, status: conn.status, connected: true, saved_for_later: false }]); } catch {}
                        } else {
                          setWorkerConnections(prev => prev.filter(c => c.worker_id !== wid));
                          try { await deleteWorkerConnection(wid); } catch {}
                        }
                      }}
                      worker={{
                        id: selectedConnectionWorker?.worker?.id || selectedConnectionFullWorker.id,
                        name: selectedConnectionFullWorker.name,
                        photo: (() => {
                          const w = selectedConnectionWorker?.worker;
                          return w?.photo || (w?.gender ? getWorkerPhotoFromPool(w.gender, w.id) : null) || selectedConnectionWorker?.image_url || selectedConnectionFullWorker.photo || undefined;
                        })(),
                        gender: selectedConnectionWorker?.worker?.gender || selectedConnectionFullWorker.gender || 'female',
                        market: selectedConnectionFullWorker.market || '',
                        activelyLooking: selectedConnectionFullWorker.actively_looking || false,
                        shiftVerified: selectedConnectionFullWorker.shift_verified || false,
                        marketFavorite: selectedConnectionFullWorker.market_favorite || false,
                        favoritedByBrands: selectedConnectionFullWorker.favorited_by_brands ?? undefined,
                        shiftsOnReflex: selectedConnectionFullWorker.shifts_on_reflex || 0,
                        uniqueStoreCount: selectedConnectionFullWorker.unique_store_count || 0,
                        brandsWorked: selectedConnectionFullWorker.brands_worked || [],
                        endorsementCounts: selectedConnectionFullWorker.endorsement_counts || {},
                        shiftExperience: selectedConnectionFullWorker.shift_experience || {},
                        invitedBackStores: selectedConnectionFullWorker.invited_back_stores || 0,
                        aboutMe: selectedConnectionFullWorker.about_me || '',
                        previousExperience: selectedConnectionFullWorker.previous_experience || [],
                        storeFavoriteCount: selectedConnectionFullWorker.store_favorite_count ?? null,
                        reflexActivity: selectedConnectionFullWorker.reflex_activity
                          ? {
                              shiftsByTier: selectedConnectionFullWorker.reflex_activity.shiftsByTier ?? { luxury: 0, elevated: 0, mid: 0 },
                              longestRelationship: selectedConnectionFullWorker.reflex_activity.longestRelationship ?? null,
                              tierProgression: (selectedConnectionFullWorker.reflex_activity.tierProgression === 'upward' ? 'upward' : 'stable') as 'upward' | 'stable',
                            }
                          : null,
                        retailerQuotes: selectedConnectionFullWorker.retailer_quotes || [],
                        retailerSummary: selectedConnectionFullWorker.retailer_summary || '',
                        currentTier: selectedConnectionFullWorker.current_tier || '',
                        tardyRatio: selectedConnectionFullWorker.tardy_ratio || '',
                        tardyPercent: selectedConnectionFullWorker.tardy_percent || 0,
                        urgentCancelRatio: selectedConnectionFullWorker.urgent_cancel_ratio || '',
                        urgentCancelPercent: selectedConnectionFullWorker.urgent_cancel_percent || 0,
                        matchScore: 0,
                        matchReasons: [],
                      }}
                      onClose={() => {
                        setSelectedConnectionWorker(null);
                        setSelectedConnectionFullWorker(null);
                      }}
                    />
                  </>
                ) : null}
              </div>
            </div>
          )}
          </div>
        );
      })()}

      {/* Chat Tab - SMS-style messaging interface */}
      {activeTab === "chat" && (() => {
        // Get worker photos from workerConnections for chat avatars
        const getWorkerPhoto = (chatId: string) => {
          const workerId = chatId.replace('chat-', '');
          const connection = workerConnections.find(c => c.worker_id === workerId);
          const worker = connection?.worker;
          return (worker?.gender ? getWorkerPhotoFromPool(worker.gender, worker.id) : null) || worker?.photo || connection?.image_url;
        };

        // Format name as "First L."
        const formatName = (fullName: string) => {
          const parts = fullName.split(" ");
          if (parts.length > 1) {
            return `${parts[0]} ${parts[parts.length - 1][0]}.`;
          }
          return parts[0];
        };

        // Get initials from name
        const getInitials = (name: string) => {
          const parts = name.split(" ");
          return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
        };

        // Message templates — reused across connected workers
        const MESSAGE_TEMPLATES = [
          // 1. Shift booked - coordinated a shift
          {
            id: "chat-jasmin",
            fullName: "Jasmin Zamora",
            time: "2m ago",
            isOnline: true,
            hasUnread: true,
            badge: "booked" as const,
            messages: [
              { type: "outgoing" as const, text: "Hi Jasmin! We loved having you on your last shift. We're looking for someone permanent for our weekend team.", time: "10:15 AM" },
              { type: "incoming" as const, text: "Hi! That's so nice to hear. I really enjoyed working there too. What kind of hours are you thinking?", time: "10:22 AM" },
              { type: "outgoing" as const, text: "We're looking at Saturdays and Sundays, 10am-6pm. $19/hr to start with room to grow. Would that work for you?", time: "10:25 AM" },
              { type: "incoming" as const, text: "That actually sounds perfect! Weekends work great for my school schedule.", time: "10:31 AM" },
              { type: "outgoing" as const, text: "Amazing! I just booked you for a trial shift this Saturday at 10am. We can see how it goes and talk more about the permanent role.", time: "10:33 AM" },
              { type: "incoming" as const, text: "Perfect! See you Saturday at 10!", time: "10:35 AM" },
            ],
          },
          // 2. Just introducing themselves
          {
            id: "chat-marcus",
            fullName: "Marcus Thompson",
            time: "15m ago",
            isOnline: true,
            hasUnread: true,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Marcus! Your profile caught our eye - love seeing someone with experience at both Nike and Foot Locker. We're hiring for a sales associate role.", time: "11:42 AM" },
              { type: "incoming" as const, text: "Hey! Thanks for reaching out. I've been looking for something more stable than gig work.", time: "11:45 AM" },
            ],
          },
          // 3. Not interested in full-time right now
          {
            id: "chat-sofia",
            fullName: "Sofia Rodriguez",
            time: "1h ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Sofia! We've been really impressed with your work on Reflex shifts. Would you be interested in a permanent position with us?", time: "9:00 AM" },
              { type: "incoming" as const, text: "Thank you! I appreciate the offer. Can I ask what the schedule would look like?", time: "9:15 AM" },
              { type: "outgoing" as const, text: "We're pretty flexible! Could be anywhere from 25-40 hours depending on what works for you. Mix of weekdays and weekends.", time: "9:18 AM" },
              { type: "incoming" as const, text: "I really appreciate you thinking of me, but I'm actually in nursing school right now and the flex schedule is what makes Reflex work for me.", time: "9:25 AM" },
              { type: "outgoing" as const, text: "Totally understand! School comes first. We'd love to have you back for shifts whenever you're available.", time: "9:28 AM" },
              { type: "incoming" as const, text: "For sure! I'll definitely keep booking shifts when I can. Thanks for being so understanding!", time: "9:30 AM" },
            ],
          },
          // 4. Negotiating higher hourly rate
          {
            id: "chat-devon",
            fullName: "Devon Williams",
            time: "2h ago",
            isOnline: false,
            hasUnread: true,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Devon! Your track record on Reflex is exceptional - 47 shifts with a 100% on-time rating. We'd love to bring you on full-time.", time: "Yesterday 4:30 PM" },
              { type: "incoming" as const, text: "I'm definitely interested! What's the compensation looking like?", time: "Yesterday 4:45 PM" },
              { type: "outgoing" as const, text: "We're offering $17/hr for the Sales Associate role, with benefits after 90 days including health insurance and 401k.", time: "Yesterday 4:48 PM" },
              { type: "incoming" as const, text: "I appreciate the offer. With my experience level - I've been doing retail for 4 years and have keyholder experience - I was hoping for something closer to $20/hr.", time: "Yesterday 5:02 PM" },
              { type: "outgoing" as const, text: "That's fair feedback. Let me talk to my district manager and see what we can do. Your experience definitely warrants a conversation about that.", time: "Yesterday 5:10 PM" },
              { type: "incoming" as const, text: "I appreciate you going to bat for me. I'm really interested in the role - the team seems great and the location is perfect for me.", time: "Yesterday 5:15 PM" },
              { type: "outgoing" as const, text: "Good news! We can do $19/hr given your experience, and there's a clear path to $21 after 6 months with a performance review.", time: "Today 9:00 AM" },
              { type: "incoming" as const, text: "That works for me! When can we make it official?", time: "Today 9:15 AM" },
            ],
          },
          // 5. Shift scheduled - all set
          {
            id: "chat-jade",
            fullName: "Jade Bishop",
            time: "3h ago",
            isOnline: false,
            hasUnread: false,
            badge: "scheduled" as const,
            messages: [
              { type: "outgoing" as const, text: "Hi Jade! Following up on our chat last week - we're excited to have you join the team!", time: "Mon 2:00 PM" },
              { type: "incoming" as const, text: "So excited! Can't wait to get started.", time: "Mon 2:15 PM" },
              { type: "outgoing" as const, text: "Your first official shift is scheduled for this Thursday at 9am. Come to the back entrance and ask for Mike - he'll get you set up with your uniform and do orientation.", time: "Mon 2:20 PM" },
              { type: "incoming" as const, text: "Perfect! Should I bring anything specific?", time: "Mon 2:25 PM" },
              { type: "outgoing" as const, text: "Just your ID for paperwork and comfortable shoes. We'll provide everything else!", time: "Mon 2:28 PM" },
              { type: "incoming" as const, text: "Got it. See you Thursday!", time: "Mon 2:30 PM" },
            ],
          },
          // 6. Discussing schedule flexibility
          {
            id: "chat-karina",
            fullName: "Karina Gamboa",
            time: "4h ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Karina! We noticed you've been picking up a lot of shifts with us. Interested in making it permanent?", time: "Yesterday 11:00 AM" },
              { type: "incoming" as const, text: "Maybe! My main concern is flexibility. I have a 4-year-old and daycare pickup is at 5:30.", time: "Yesterday 11:30 AM" },
              { type: "outgoing" as const, text: "We can definitely work with that! We could schedule you for morning shifts - 8am to 4:30pm would get you out in plenty of time.", time: "Yesterday 11:35 AM" },
              { type: "incoming" as const, text: "That would be amazing actually. What about when she's sick or has doctor appointments?", time: "Yesterday 11:42 AM" },
              { type: "outgoing" as const, text: "We have a pretty understanding team. As long as you give us notice, we can usually find coverage. Life happens!", time: "Yesterday 11:45 AM" },
              { type: "incoming" as const, text: "This sounds really promising. Can I think about it and let you know by Friday?", time: "Yesterday 11:50 AM" },
              { type: "outgoing" as const, text: "Absolutely! Take your time. Feel free to message me if you have any other questions.", time: "Yesterday 11:52 AM" },
            ],
          },
          // 7. Asking about benefits
          {
            id: "chat-amira",
            fullName: "Amira Talib",
            time: "5h ago",
            isOnline: false,
            hasUnread: false,
            badge: "booked" as const,
            messages: [
              { type: "outgoing" as const, text: "Amira! We'd love to have you join us permanently. You've been one of our most requested workers on Reflex.", time: "Yesterday 2:00 PM" },
              { type: "incoming" as const, text: "That means a lot! I do have some questions about benefits though.", time: "Yesterday 2:30 PM" },
              { type: "outgoing" as const, text: "Of course! What would you like to know?", time: "Yesterday 2:32 PM" },
              { type: "incoming" as const, text: "Mainly health insurance - is it available for part-time or only full-time? And how long until it kicks in?", time: "Yesterday 2:40 PM" },
              { type: "outgoing" as const, text: "Great questions. Health insurance is available at 30+ hours/week and kicks in after 60 days. We also offer dental and vision.", time: "Yesterday 2:45 PM" },
              { type: "incoming" as const, text: "What about PTO?", time: "Yesterday 2:48 PM" },
              { type: "outgoing" as const, text: "You'd start accruing PTO immediately - works out to about 2 weeks per year for full-time. Plus you get your birthday off!", time: "Yesterday 2:52 PM" },
              { type: "incoming" as const, text: "Birthday off is a nice touch! I'm interested. Let me book a shift so we can talk more in person.", time: "Yesterday 3:00 PM" },
            ],
          },
          // 8. Short intro - just started chatting
          {
            id: "chat-teresa",
            fullName: "Teresa Nguyen",
            time: "Yesterday",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Teresa! Love your experience at Nordstrom. We're looking for someone with that elevated customer service background.", time: "Yesterday 10:00 AM" },
            ],
          },
          // 9. Enthusiastic candidate asking lots of questions
          {
            id: "chat-alex",
            fullName: "Alexandria Calzada",
            time: "Yesterday",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Alexandria! We're building out our team and your profile really stood out.", time: "Mon 9:00 AM" },
              { type: "incoming" as const, text: "Oh wow, thank you! I've been hoping to find something permanent. Tell me everything!", time: "Mon 9:30 AM" },
              { type: "outgoing" as const, text: "Haha I love the enthusiasm! It's a Sales Associate role, $18/hr, mix of floor and cash register duties.", time: "Mon 9:35 AM" },
              { type: "incoming" as const, text: "What's the team like? How many people work a typical shift?", time: "Mon 9:40 AM" },
              { type: "outgoing" as const, text: "Usually 3-4 people on the floor plus a manager. Really collaborative team - we do a lot of cross-training.", time: "Mon 9:45 AM" },
              { type: "incoming" as const, text: "And growth opportunities? I eventually want to move into management.", time: "Mon 9:48 AM" },
              { type: "outgoing" as const, text: "Definitely! We promote from within. Our current assistant manager started as a seasonal hire 2 years ago.", time: "Mon 9:52 AM" },
              { type: "incoming" as const, text: "This sounds perfect. What's the next step?", time: "Mon 9:55 AM" },
              { type: "outgoing" as const, text: "Let's get you in for a shift so you can meet the team and see if it's a good fit. Can you book one this week?", time: "Mon 10:00 AM" },
              { type: "incoming" as const, text: "On it!", time: "Mon 10:02 AM" },
            ],
          },
          // 10. Discussing commute concerns
          {
            id: "chat-olivia",
            fullName: "Olivia Little",
            time: "Yesterday",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Olivia! We have an opening at our Domain location - thought you might be interested!", time: "Sun 3:00 PM" },
              { type: "incoming" as const, text: "Hi! I might be, but I live down south. How far is the Domain from downtown?", time: "Sun 4:15 PM" },
              { type: "outgoing" as const, text: "It's about 20-25 minutes from downtown, less if you're coming from the Mueller area. We do have a South Lamar location too if that's closer?", time: "Sun 4:20 PM" },
              { type: "incoming" as const, text: "Oh I didn't know you had one there! That would be way better for me. Is that store hiring too?", time: "Sun 4:30 PM" },
              { type: "outgoing" as const, text: "Let me check... yes! They need weekend help. Want me to connect you with that store manager?", time: "Sun 4:35 PM" },
              { type: "incoming" as const, text: "That would be great, thank you!", time: "Sun 4:40 PM" },
            ],
          },
          // 11. Former employee returning
          {
            id: "chat-paige",
            fullName: "Paige Lemon",
            time: "Yesterday",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Paige! Didn't you used to work for us a couple years ago?", time: "Sat 11:00 AM" },
              { type: "incoming" as const, text: "Yes! At the old Barton Creek location before it closed. I loved working there.", time: "Sat 11:30 AM" },
              { type: "outgoing" as const, text: "Well we'd love to have you back! We're at Domain now. Any interest in rejoining?", time: "Sat 11:35 AM" },
              { type: "incoming" as const, text: "Honestly yes. I tried a desk job and missed retail. What's changed since I left?", time: "Sat 11:45 AM" },
              { type: "outgoing" as const, text: "We revamped the scheduling system - it's way more flexible now. Pay went up too. And we finally got that inventory system you always complained about replaced!", time: "Sat 11:50 AM" },
              { type: "incoming" as const, text: "Haha that inventory system was the WORST. Good to know! Let me think about it.", time: "Sat 12:00 PM" },
            ],
          },
          // 12. Management candidate
          {
            id: "chat-katie",
            fullName: "Katie Angell",
            time: "Yesterday",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Katie, your keyholder experience caught my attention. We're actually looking for an assistant manager.", time: "Fri 2:00 PM" },
              { type: "incoming" as const, text: "Really? I've been hoping to move up. What does the role involve?", time: "Fri 2:45 PM" },
              { type: "outgoing" as const, text: "Opening/closing, managing the schedule, handling escalations, and you'd be backup for the store manager. Salary position.", time: "Fri 2:50 PM" },
              { type: "incoming" as const, text: "What's the salary range?", time: "Fri 2:55 PM" },
              { type: "outgoing" as const, text: "Starting at $52k with quarterly bonuses based on store performance. Plus full benefits package.", time: "Fri 3:00 PM" },
              { type: "incoming" as const, text: "That's competitive. I'd like to learn more. Do you have time for a call?", time: "Fri 3:10 PM" },
            ],
          },
          // 13. Quick yes
          {
            id: "chat-maya",
            fullName: "Maya Brooks",
            time: "2 days ago",
            isOnline: false,
            hasUnread: false,
            badge: "scheduled" as const,
            messages: [
              { type: "outgoing" as const, text: "Maya! We're hiring and you'd be perfect. Interested?", time: "Wed 4:00 PM" },
              { type: "incoming" as const, text: "YES! When do I start?", time: "Wed 4:05 PM" },
              { type: "outgoing" as const, text: "Haha love the energy! Let's get you scheduled for orientation next Monday. Can you do 9am?", time: "Wed 4:10 PM" },
              { type: "incoming" as const, text: "I'll be there!", time: "Wed 4:12 PM" },
            ],
          },
          // 14. Comparing to another offer
          {
            id: "chat-jordan",
            fullName: "Jordan Park",
            time: "2 days ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Jordan! Following up on our conversation about the full-time role. Any thoughts?", time: "Tue 10:00 AM" },
              { type: "incoming" as const, text: "I'm actually weighing a couple options right now. Can you tell me more about what sets you apart?", time: "Tue 11:30 AM" },
              { type: "outgoing" as const, text: "Fair question! We're known for our culture - very team-oriented, lots of cross-training opportunities. Our employee retention rate is one of the highest in the district.", time: "Tue 11:35 AM" },
              { type: "incoming" as const, text: "What about schedule flexibility? The other place is offering set hours.", time: "Tue 11:40 AM" },
              { type: "outgoing" as const, text: "We do rotating schedules, but you can set preferences. Many people like the variety, but I understand if you prefer consistency.", time: "Tue 11:45 AM" },
              { type: "incoming" as const, text: "I'll factor that in. Appreciate the transparency!", time: "Tue 11:50 AM" },
            ],
          },
          // 15. Seasonal to permanent conversion
          {
            id: "chat-riley",
            fullName: "Riley Kim",
            time: "2 days ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Riley! Holiday season is ending but we'd love to keep you on permanently. You've been amazing.", time: "Mon 1:00 PM" },
              { type: "incoming" as const, text: "Aw thank you! I wasn't sure if that was an option.", time: "Mon 1:30 PM" },
              { type: "outgoing" as const, text: "Definitely an option - we only convert about 20% of seasonal hires to permanent, and you made the cut!", time: "Mon 1:35 PM" },
              { type: "incoming" as const, text: "That's so nice to hear. What would the hours look like after the holidays?", time: "Mon 1:40 PM" },
              { type: "outgoing" as const, text: "It does slow down in January, so probably 25-30 hours initially, picking back up to 35+ by March.", time: "Mon 1:45 PM" },
              { type: "incoming" as const, text: "That works for me. I'm in!", time: "Mon 1:50 PM" },
            ],
          },
          // 16. Asking about dress code
          {
            id: "chat-sam",
            fullName: "Sam Martinez",
            time: "3 days ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Sam! Thanks for your interest in the role. Any questions I can answer?", time: "Sun 2:00 PM" },
              { type: "incoming" as const, text: "Yes actually - what's the dress code like?", time: "Sun 3:00 PM" },
              { type: "outgoing" as const, text: "Business casual. We provide branded polos, you just need khakis or dark jeans. Closed-toe shoes required.", time: "Sun 3:05 PM" },
              { type: "incoming" as const, text: "Are visible tattoos okay?", time: "Sun 3:10 PM" },
              { type: "outgoing" as const, text: "Totally fine! We're pretty relaxed about that. Hair color too - express yourself.", time: "Sun 3:12 PM" },
              { type: "incoming" as const, text: "Great to know. Thanks!", time: "Sun 3:15 PM" },
            ],
          },
          // 17. Part-time student
          {
            id: "chat-taylor",
            fullName: "Taylor Okonkwo",
            time: "3 days ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Taylor, noticed you're at UT. We have a few student employees - would you be interested in part-time?", time: "Sat 10:00 AM" },
              { type: "incoming" as const, text: "That could work! My classes are all morning M/W/F.", time: "Sat 12:00 PM" },
              { type: "outgoing" as const, text: "We could schedule you afternoons and weekends then. Usually 15-20 hours work for students.", time: "Sat 12:05 PM" },
              { type: "incoming" as const, text: "And during finals weeks?", time: "Sat 12:10 PM" },
              { type: "outgoing" as const, text: "We're flexible! Just give us a heads up and we can reduce your hours. Education first.", time: "Sat 12:15 PM" },
              { type: "incoming" as const, text: "That's really understanding. I'd like to try a shift.", time: "Sat 12:20 PM" },
            ],
          },
          // 18. Already working elsewhere, exploring options
          {
            id: "chat-chris",
            fullName: "Chris Anderson",
            time: "4 days ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Hi Chris! Your Reflex profile is impressive. Ever thought about going permanent somewhere?", time: "Fri 4:00 PM" },
              { type: "incoming" as const, text: "I actually have a job, but honestly I'm not super happy there. What are you offering?", time: "Fri 5:30 PM" },
              { type: "outgoing" as const, text: "Full-time Sales Associate, $18.50/hr, benefits after 60 days, and a team that actually supports each other.", time: "Fri 5:35 PM" },
              { type: "incoming" as const, text: "What makes you different from where I am now?", time: "Fri 5:45 PM" },
              { type: "outgoing" as const, text: "Hard to say without knowing your current situation, but our turnover is really low. People stay because they like it here.", time: "Fri 5:50 PM" },
              { type: "incoming" as const, text: "That's actually my problem - constant new people, no consistency. Let me think about it.", time: "Fri 6:00 PM" },
            ],
          },
          // 19. Short follow-up
          {
            id: "chat-morgan",
            fullName: "Morgan Ellis",
            time: "1 week ago",
            isOnline: false,
            hasUnread: false,
            badge: null,
            messages: [
              { type: "outgoing" as const, text: "Morgan, circling back - still thinking about the role?", time: "Last Mon" },
              { type: "incoming" as const, text: "Yes! Sorry for the delay. Can we chat next week?", time: "Last Mon" },
              { type: "outgoing" as const, text: "Of course! Just message me when you're ready.", time: "Last Mon" },
            ],
          },
        ];

        // Build CHAT_CONVERSATIONS from connected workers (chat_open = true)
        const chatConnections = workerConnections.filter(c => c.chat_open || c.status === 'accepted');
        const CHAT_CONVERSATIONS = chatConnections.map((conn, idx) => {
          const template = MESSAGE_TEMPLATES[idx % MESSAGE_TEMPLATES.length];
          const workerName = conn.worker?.name || 'Unknown';
          const firstName = workerName.split(' ')[0];
          // Replace first names in messages with actual worker name
          const oldFirstName = template.fullName.split(' ')[0];
          const messages = template.messages.map(m => ({
            ...m,
            text: m.text.replace(new RegExp(oldFirstName, 'g'), firstName),
          }));
          return {
            ...template,
            id: `chat-${conn.worker_id}`,
            fullName: workerName,
            badge: conn.shift_scheduled ? 'scheduled' as const : conn.shift_booked ? 'booked' as const : null,
            messages,
          };
        });

        // Find active conversation or default to first
        const activeConversation = CHAT_CONVERSATIONS.find(c => c.id === activeChatId) || CHAT_CONVERSATIONS[0];
        const unreadCount = CHAT_CONVERSATIONS.filter(c => c.hasUnread).length;

        return (
          <div className="v2-chat-tab-container">
            {/* Chat Sidebar - Conversation List */}
            <div className="v2-chat-sidebar">
              <div className="v2-chat-sidebar-header">
                <h3>Messages</h3>
                {unreadCount > 0 && (
                  <span className="v2-chat-unread-badge">{unreadCount}</span>
                )}
              </div>
              <div className="v2-chat-list">
                {CHAT_CONVERSATIONS.map((conversation) => {
                  const photo = getWorkerPhoto(conversation.id);
                  const displayName = formatName(conversation.fullName);
                  const lastMessage = conversation.messages[conversation.messages.length - 1];

                  return (
                    <div
                      key={conversation.id}
                      className={`v2-chat-item ${activeChatId === conversation.id ? 'active' : ''}`}
                      onClick={() => setActiveChatId(conversation.id)}
                    >
                      <div className="v2-chat-item-avatar">
                        {photo ? (
                          <img src={photo} alt={conversation.fullName} />
                        ) : (
                          <span>{getInitials(conversation.fullName)}</span>
                        )}
                        {conversation.isOnline && <div className="v2-chat-online-dot" />}
                      </div>
                      <div className="v2-chat-item-info">
                        <div className="v2-chat-item-header">
                          <span className="v2-chat-item-name">{displayName}</span>
                          <span className="v2-chat-item-time">{conversation.time}</span>
                        </div>
                        <p className="v2-chat-item-preview">
                          {lastMessage.text.length > 50 ? lastMessage.text.slice(0, 50) + "..." : lastMessage.text}
                        </p>
                        {/* Status badges */}
                        {conversation.badge === "scheduled" && (
                          <span className="v2-chat-status-badge scheduled">Flex Booked</span>
                        )}
                        {conversation.badge === "booked" && (
                          <span className="v2-chat-status-badge booked">Flex Requested</span>
                        )}
                      </div>
                      {conversation.hasUnread && <div className="v2-chat-unread-dot" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Main Area */}
            <div className="v2-chat-main">
              {/* Chat Header */}
              <div className="v2-chat-header">
                <div className="v2-chat-header-info">
                  <div className="v2-chat-header-avatar">
                    {getWorkerPhoto(activeConversation.id) ? (
                      <img src={getWorkerPhoto(activeConversation.id)!} alt={activeConversation.fullName} />
                    ) : (
                      <span>{getInitials(activeConversation.fullName)}</span>
                    )}
                    {activeConversation.isOnline && <div className="v2-chat-online-dot" />}
                  </div>
                  <div className="v2-chat-header-details">
                    <span className="v2-chat-header-name">{formatName(activeConversation.fullName)}</span>
                    <span className="v2-chat-header-status">{activeConversation.isOnline ? "Online" : `Last active ${activeConversation.time}`}</span>
                  </div>
                </div>
                <div className="v2-chat-header-actions">
                  <button className="v2-chat-header-btn">
                    <CalendarDays size={18} />
                    Schedule Shift
                  </button>
                  <button className="v2-chat-header-btn">
                    <Briefcase size={18} />
                    View Profile
                  </button>
                </div>
              </div>

              {/* Chat Messages - iMessage style */}
              <div className="v2-chat-messages">
                {activeConversation.messages.map((message, index) => (
                  <div key={index} className={`v2-chat-message ${message.type}`}>
                    <div className="v2-chat-bubble">
                      <p>{message.text}</p>
                    </div>
                    <span className="v2-chat-message-time">{message.time}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="v2-chat-input-area">
                <input
                  type="text"
                  placeholder="iMessage"
                  className="v2-chat-input"
                  value={chatInputValue}
                  onChange={(e) => setChatInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInputValue.trim()) {
                      setChatInputValue("");
                    }
                  }}
                />
                <button
                  className="v2-chat-send"
                  onClick={() => {
                    if (chatInputValue.trim()) {
                      setChatInputValue("");
                    }
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default V2TalentCentric;

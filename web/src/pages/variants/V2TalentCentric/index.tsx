import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Check,
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
  Clock,
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
  BadgeCheck,
  Eye,
  UserPlus,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { SAMPLE_WORKERS } from "../../../data/workers";
import { V2Main } from "./V2Main";
import { V2EmploymentSelector } from "./V2EmploymentSelector";
import { V2WorkerSidebar } from "./V2WorkerSidebar";
import { WorkerCard } from "../../../components/Workers/WorkerCard";
import { WorkerAchievementChips } from "../../../components/Workers/WorkerAchievementChips";
import type { EmploymentType, AvailabilityHours } from "./V2EmploymentSelector";
import type { MatchedWorker, ChatMessage, WorkerProfile } from "../../../types";
import { createFreshV2GeminiService, V2GeminiService } from "./V2GeminiService";
import { fetchWorkersByMarketAsProfiles, fetchRetailers } from "../../../services/supabase";
import type { Retailer } from "../../../services/supabase";
import ReactMarkdown from "react-markdown";
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
import logoDeckers from "../../../../../assets/brand-logos/deckers.png";
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
import logoMeem from "../../../../../assets/brand-logos/meem.png";
import logoMichaelKors from "../../../../../assets/brand-logos/michael-kors.png";
import logoMizzenMain from "../../../../../assets/brand-logos/mizzenmain.png";
import logoNeimanMarcus from "../../../../../assets/brand-logos/neiman-marcus.png";
import logoNike from "../../../../../assets/brand-logos/nike.png";
import logoNordstrom from "../../../../../assets/brand-logos/nordstrom.png";
import logoNorthFace from "../../../../../assets/brand-logos/north-face.png";
import logoOldNavy from "../../../../../assets/brand-logos/old-navy.png";
import logoPacsun from "../../../../../assets/brand-logos/pacsun.png";
import logoPatagonia from "../../../../../assets/brand-logos/patagonia.png";
import logoPoloRalphLauren from "../../../../../assets/brand-logos/polo-ralph-lauren.png";
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
import logoUrbn from "../../../../../assets/brand-logos/urbn.png";
import logoVans from "../../../../../assets/brand-logos/vans.png";
import logoVeraBradley from "../../../../../assets/brand-logos/vera-bradley.png";
import logoVeraWang from "../../../../../assets/brand-logos/vera-wang.png";
import logoVictoriasSecret from "../../../../../assets/brand-logos/victorias-secret.png";
import logoWarbyParker from "../../../../../assets/brand-logos/warby-parker.png";
import logoWolfAndShephard from "../../../../../assets/brand-logos/wolf-and-shephard.png";
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
  { id: "polo-ralph-lauren", name: "Ralph Lauren" },
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
  { id: "deckers", logo: logoDeckers },
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
  { id: "meem", logo: logoMeem },
  { id: "michael-kors", logo: logoMichaelKors },
  { id: "mizzen-main", logo: logoMizzenMain },
  { id: "neiman-marcus", logo: logoNeimanMarcus },
  { id: "nike", logo: logoNike },
  { id: "nordstrom", logo: logoNordstrom },
  { id: "north-face", logo: logoNorthFace },
  { id: "old-navy", logo: logoOldNavy },
  { id: "pacsun", logo: logoPacsun },
  { id: "patagonia", logo: logoPatagonia },
  { id: "polo-ralph-lauren", logo: logoPoloRalphLauren },
  { id: "puma", logo: logoPuma },
  { id: "rag-and-bone", logo: logoRagAndBone },
  { id: "reclectic", logo: logoReclectic },
  { id: "reiss", logo: logoReiss },
  { id: "rhone", logo: logoRhone },
  { id: "sabah", logo: logoSabah },
  { id: "saks", logo: logoSaks },
  { id: "sephora", logo: logoSephora },
  { id: "sezane", logo: logoSezane },
  { id: "shinola", logo: logoShinola },
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
  { id: "urbn", logo: logoUrbn },
  { id: "vans", logo: logoVans },
  { id: "vera-bradley", logo: logoVeraBradley },
  { id: "vera-wang", logo: logoVeraWang },
  { id: "victorias-secret", logo: logoVictoriasSecret },
  { id: "warby-parker", logo: logoWarbyParker },
  { id: "wolf-and-shephard", logo: logoWolfAndShephard },
  { id: "zara", logo: logoZara },
];

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
type ExperienceLevel = "new" | "rising" | "seasoned" | "management";

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
  { id: "uptown-park", name: "Uptown Park", marketId: "san-marcos-tx" },
  { id: "cherry-creek", name: "Cherry Creek", marketId: "denver-co" },
  { id: "la-cantera", name: "La Cantera", marketId: "san-antonio-tx" },
  { id: "town-square", name: "Town Square", marketId: "los-angeles-ca" },
];

// All available markets for city search (from Oz table - 58 live markets)
const MARKETS = [
  // AZ
  { id: "phoenix-az", name: "Phoenix", state: "AZ" },
  // CA
  { id: "bakersfield-ca", name: "Bakersfield", state: "CA" },
  { id: "cabazon-ca", name: "Cabazon", state: "CA" },
  { id: "fresno-ca", name: "Fresno", state: "CA" },
  { id: "los-angeles-ca", name: "Los Angeles", state: "CA" },
  { id: "sacramento-ca", name: "Sacramento", state: "CA" },
  { id: "san-diego-ca", name: "San Diego", state: "CA" },
  { id: "san-francisco-ca", name: "San Francisco", state: "CA" },
  { id: "san-jose-ca", name: "San Jose", state: "CA" },
  // CO
  { id: "boulder-co", name: "Boulder", state: "CO" },
  { id: "denver-co", name: "Denver", state: "CO" },
  // CT
  { id: "westport-ct", name: "Westport", state: "CT" },
  // D.C.
  { id: "washington-dc", name: "Washington", state: "D.C." },
  // DE
  { id: "wilmington-de", name: "Wilmington", state: "DE" },
  // FL
  { id: "fort-myers-fl", name: "Fort Myers", state: "FL" },
  { id: "fort-walton-beach-fl", name: "Fort Walton Beach", state: "FL" },
  { id: "miami-fl", name: "Miami", state: "FL" },
  { id: "orlando-fl", name: "Orlando", state: "FL" },
  { id: "tampa-fl", name: "Tampa", state: "FL" },
  // GA
  { id: "atlanta-ga", name: "Atlanta", state: "GA" },
  { id: "savannah-ga", name: "Savannah", state: "GA" },
  // IL
  { id: "chicago-il", name: "Chicago", state: "IL" },
  // IN
  { id: "indianapolis-in", name: "Indianapolis", state: "IN" },
  // LA
  { id: "baton-rouge-la", name: "Baton Rouge", state: "LA" },
  { id: "new-orleans-la", name: "New Orleans", state: "LA" },
  // MA
  { id: "boston-ma", name: "Boston", state: "MA" },
  // MI
  { id: "detroit-mi", name: "Detroit", state: "MI" },
  // MN
  { id: "minneapolis-mn", name: "Minneapolis", state: "MN" },
  // MO
  { id: "st-louis-mo", name: "St. Louis", state: "MO" },
  // MS
  { id: "biloxi-ms", name: "Biloxi", state: "MS" },
  // NC
  { id: "charlotte-nc", name: "Charlotte", state: "NC" },
  { id: "raleigh-durham-nc", name: "Raleigh-Durham", state: "NC" },
  // NE
  { id: "omaha-ne", name: "Omaha", state: "NE" },
  // NH
  { id: "merrimack-nh", name: "Merrimack", state: "NH" },
  // NJ
  { id: "central-new-jersey-nj", name: "Central New Jersey", state: "NJ" },
  { id: "northern-new-jersey-nj", name: "Northern New Jersey", state: "NJ" },
  // NV
  { id: "las-vegas-nv", name: "Las Vegas", state: "NV" },
  // NY
  { id: "long-island-east-ny", name: "Long Island East", state: "NY" },
  { id: "long-island-west-ny", name: "Long Island West", state: "NY" },
  { id: "new-york-ny", name: "New York City", state: "NY" },
  { id: "westchester-ny", name: "Westchester", state: "NY" },
  { id: "woodbury-ny", name: "Woodbury", state: "NY" },
  // OH
  { id: "cincinnati-oh", name: "Cincinnati", state: "OH" },
  { id: "columbus-oh", name: "Columbus", state: "OH" },
  // OK
  { id: "tulsa-ok", name: "Tulsa", state: "OK" },
  // OR
  { id: "portland-or", name: "Portland", state: "OR" },
  // PA
  { id: "king-of-prussia-pa", name: "King of Prussia", state: "PA" },
  // SC
  { id: "charleston-sc", name: "Charleston", state: "SC" },
  // TN
  { id: "knoxville-tn", name: "Knoxville", state: "TN" },
  { id: "memphis-tn", name: "Memphis", state: "TN" },
  { id: "nashville-tn", name: "Nashville", state: "TN" },
  { id: "pigeon-forge-tn", name: "Pigeon Forge", state: "TN" },
  // TX
  { id: "austin-tx", name: "Austin", state: "TX" },
  { id: "dallas-tx", name: "Dallas", state: "TX" },
  { id: "houston-tx", name: "Houston", state: "TX" },
  { id: "san-antonio-tx", name: "San Antonio", state: "TX" },
  // UT
  { id: "salt-lake-city-ut", name: "Salt Lake City", state: "UT" },
  // WA
  { id: "seattle-wa", name: "Seattle", state: "WA" },
  // WI
  { id: "milwaukee-wi", name: "Milwaukee", state: "WI" },
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
  const [fallbackUserName] = useState(() => getRandomUserName());
  const userName = propUserName || fallbackUserName;
  const brandRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  // Toggle brand selection
  const toggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName],
    );
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

      const responseText = await service.sendMessage(message);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: responseText,
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

      const responseText = await service.sendMessage(message);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: responseText,
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
    fetchWorkersByMarketAsProfiles(selectedMarket.name)
      .then((workers) => {
        setSupabaseWorkers(workers);
      })
      .catch((error) => {
        console.error("Error fetching workers:", error);
        setSupabaseWorkers([]);
      })
      .finally(() => {
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

  // Helper to normalize brand names for comparison (kebab-case to lowercase, spaces removed)
  const normalizeBrand = (name: string) =>
    name.toLowerCase().replace(/[\s&'.-]+/g, "");

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
      const normalizedSelected = selectedBrands.map((id) => normalizeBrand(id));

      // Find classifications of selected brands from retailers table
      const selectedClassifications = new Set<string>();
      selectedBrands.forEach((brandId) => {
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
        const hasDirectBrandMatch = w.brandsWorked.some((b) =>
          normalizedSelected.some(
            (sel) =>
              normalizeBrand(b.name).includes(sel) ||
              sel.includes(normalizeBrand(b.name)),
          ),
        );
        // Check previousExperience against selected brands (direct match)
        const hasDirectExpMatch = w.previousExperience?.some((exp) =>
          normalizedSelected.some(
            (sel) =>
              normalizeBrand(exp.company).includes(sel) ||
              sel.includes(normalizeBrand(exp.company)),
          ),
        );

        // Check brandsWorked against related brands (same classification)
        const hasRelatedBrandMatch = w.brandsWorked.some((b) =>
          relatedBrandNames.some(
            (related) =>
              normalizeBrand(b.name).includes(related) ||
              related.includes(normalizeBrand(b.name)),
          ),
        );
        // Check previousExperience against related brands (same classification)
        const hasRelatedExpMatch = w.previousExperience?.some((exp) =>
          relatedBrandNames.some(
            (related) =>
              normalizeBrand(exp.company).includes(related) ||
              related.includes(normalizeBrand(exp.company)),
          ),
        );

        return hasDirectBrandMatch || hasDirectExpMatch || hasRelatedBrandMatch || hasRelatedExpMatch;
      });
    }

    // Filter by employment type (from V2EmploymentSelector)
    if (employmentType) {
      if (employmentType === "full-time") {
        workers = workers.filter(
          (w) => w.preference === "FT" || w.preference === "Both",
        );
      } else if (employmentType === "part-time") {
        workers = workers.filter(
          (w) => w.preference === "PT" || w.preference === "Both",
        );
      }
      // 'flex' and 'help' options don't filter - they show all workers
    }

    // Filter by experience level (Logic Tree specs)
    if (experienceLevel) {
      if (experienceLevel === "new") {
        // 0-5 shifts
        workers = workers.filter(
          (w) => w.shiftsOnReflex >= 0 && w.shiftsOnReflex <= 5,
        );
      } else if (experienceLevel === "rising") {
        // 5-30 shifts
        workers = workers.filter(
          (w) => w.shiftsOnReflex > 5 && w.shiftsOnReflex <= 30,
        );
      } else if (experienceLevel === "seasoned") {
        // 30+ shifts
        workers = workers.filter((w) => w.shiftsOnReflex > 30);
      } else if (experienceLevel === "management") {
        // Has management role in history - check previousExperience for management titles
        workers = workers.filter((w) => {
          const mgmtTitles = [
            "manager",
            "supervisor",
            "lead",
            "coordinator",
            "director",
            "assistant manager",
          ];
          return w.previousExperience?.some((exp) =>
            exp.roles?.some((role) =>
              mgmtTitles.some((title) => role.toLowerCase().includes(title)),
            ),
          );
        });
      }
    }

    // Score workers
    const scored: MatchedWorker[] = workers.map((w) => {
      let score = 50;

      // Brand match bonus
      const brandMatches = w.brandsWorked.filter((b) =>
        selectedBrands.includes(b.name),
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

    // Sort by score
    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedBrands, selectedLocation, employmentType, experienceLevel, supabaseWorkers, retailers]);

  // Get brands the filtered workers have in common
  const commonBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    filteredWorkers.forEach((w) => {
      w.brandsWorked.forEach((b) => {
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
              stepClassName={(persona === "individual" && !pickingDifferentMarket) || persona === "multi-store" ? "v2-main-centered" : ""}
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
                      Which location are you hiring for?
                    </h1>
                  </div>
                  <div className="v2-location-store-chips">
                    {STORE_LOCATIONS.map((store) => {
                      const market = MARKETS.find(m => m.id === store.marketId);
                      const isSelected = selectedLocation === store.marketId;
                      return (
                        <button
                          key={store.id}
                          className={`v2-chat-followup-chip${isSelected ? " active" : ""}`}
                          onClick={() => setSelectedLocation(isSelected ? null : store.marketId)}
                        >
                          <CornerDownRight size={16} className="v2-chip-icon-left" />
                          <span>
                            {store.name}
                            {market && ` · ${market.name}, ${market.state}`}
                          </span>
                          {isSelected && <Check size={16} className="v2-chip-icon-right" />}
                        </button>
                      );
                    })}
                    <button
                      className="v2-chat-followup-chip"
                      onClick={() => {
                        setPersona("field");
                        setSelectedLocation(null);
                      }}
                    >
                      <CornerDownRight size={16} className="v2-chip-icon-left" />
                      <span>Hire in a different market</span>
                    </button>
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
                        <option value="">Select a location</option>
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
                      if (!completedSections.has("employment")) {
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
                      }
                    }}
                    disabled={completedSections.has("employment")}
                  >
                    <div className="journey-card-header">
                      <div className="journey-card-icon">
                        <CalendarFold size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="journey-card-title">Type of employment</h3>
                    </div>
                    <div className="journey-card-footer">
                      <p className="journey-card-description">Full-time, part-time, or open to both?</p>
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
                      if (!completedSections.has("brands")) {
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
                      }
                    }}
                    disabled={completedSections.has("brands")}
                  >
                    <div className="journey-card-header">
                      <div className="journey-card-icon">
                        <Blend size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="journey-card-title">Brand affinity</h3>
                    </div>
                    <div className="journey-card-footer">
                      <p className="journey-card-description">Whose talent do you trust?</p>
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
                      if (!completedSections.has("roles")) {
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
                      }
                    }}
                    disabled={completedSections.has("roles")}
                  >
                    <div className="journey-card-header">
                      <div className="journey-card-icon">
                        <ChartNoAxesGantt size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="journey-card-title">Experience level</h3>
                    </div>
                    <div className="journey-card-footer">
                      <p className="journey-card-description">Where are they in their career?</p>
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
                      <div className="v2-chat-messages v2-focus-chat-messages">
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

                    {/* Input - always visible */}
                    <div className="v2-chat-prompt">
                      <textarea
                        placeholder="Or share more detailed information"
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
              <div className="v2-step-header-chips">
                <div className="v2-step-header">
                  <h1 className="type-tagline">
                    What experience level are you looking for?
                  </h1>
                  <p className="type-prompt-question v2-step-subtitle">
                    Based on shifts completed on Reflex
                  </p>
                </div>

                <div className="v2-experience-track">
                  <div className="v2-experience-labels">
                    <div
                      className={`v2-experience-label ${experienceLevel === "new" ? "active" : ""}`}
                      onClick={() => setExperienceLevel("new")}
                    >
                      <span className="v2-experience-label-title">New to Reflex</span>
                      <span className="v2-experience-label-subtitle">0-5 shifts</span>
                    </div>
                    <div
                      className={`v2-experience-label ${experienceLevel === "rising" ? "active" : ""}`}
                      onClick={() => setExperienceLevel("rising")}
                    >
                      <span className="v2-experience-label-title">Rising talent</span>
                      <span className="v2-experience-label-subtitle">5-30 shifts</span>
                    </div>
                    <div
                      className={`v2-experience-label ${experienceLevel === "seasoned" ? "active" : ""}`}
                      onClick={() => setExperienceLevel("seasoned")}
                    >
                      <span className="v2-experience-label-title">Seasoned pro</span>
                      <span className="v2-experience-label-subtitle">30+ shifts</span>
                    </div>
                    <div
                      className={`v2-experience-label ${experienceLevel === "management" ? "active" : ""}`}
                      onClick={() => setExperienceLevel("management")}
                    >
                      <span className="v2-experience-label-title">Management ready</span>
                      <span className="v2-experience-label-subtitle">Leadership exp.</span>
                    </div>
                  </div>
                  <div className="v2-experience-track-line">
                    <div className="v2-experience-tick" style={{ left: "0%" }} />
                    <div className="v2-experience-tick" style={{ left: "33.33%" }} />
                    <div className="v2-experience-tick" style={{ left: "66.66%" }} />
                    <div className="v2-experience-tick" style={{ left: "100%" }} />
                    <div
                      className="v2-experience-thumb"
                      style={{
                        left: experienceLevel === "new" ? "0%"
                          : experienceLevel === "rising" ? "33.33%"
                          : experienceLevel === "seasoned" ? "66.66%"
                          : experienceLevel === "management" ? "100%"
                          : "0%"
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
                  if (selectedBrands.length > 0) {
                    completeSection("brands");
                  }
                },
                nextDisabled: selectedBrands.length === 0,
                nextLabel:
                  selectedBrands.length > 0
                    ? `Continue (${selectedBrands.length})`
                    : "Continue",
                showBack: true,
              }}
            >
              <div className="v2-step-header">
                  <h1 className="type-tagline">
                    Whose talent do you trust?
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
                        className={`v2-popular-chip ${selectedBrands.includes(brand.id) ? "selected" : ""}`}
                        onClick={() => toggleBrand(brand.id)}
                      >
                        {brand.name}
                        {selectedBrands.includes(brand.id) ? <Check size={16} /> : <Plus size={16} />}
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
                      disabled={selectedBrands.length === 0}
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
                      className={`v2-brand-tile ${selectedBrands.includes(brand.id) ? "selected" : ""}${searchResults && searchResults.some((r) => r.id === brand.id) ? " search-match" : ""}`}
                      onClick={() => toggleBrand(brand.id)}
                    >
                      <img src={brand.logo} alt="" className="v2-brand-logo" />
                      {selectedBrands.includes(brand.id) && (
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
                    ? `We found ${filteredWorkers.length} amazing matches!`
                    : "No matches found"}
                </h1>
                <p className="v2-step-subtitle">
                  {filteredWorkers.length > 0
                    ? "These Reflexers match your criteria and are ready to connect. Click on a worker to see their full profile."
                    : "Try adjusting your filters to find more candidates."}
                </p>
              </div>

              {commonBrands.length > 0 && (
                <div className="v2-common-brands">
                  <span className="v2-common-brands-label">Experience at:</span>
                  <div className="v2-common-brands-list">
                    {commonBrands.map((brand) => (
                      <span key={brand} className="tag tag-stroke tag-sm">
                        <span className="tag-text">{brand}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Worker Teaser Grid */}
              <div className="v2-worker-teaser-grid">
                {filteredWorkers.slice(0, 12).map((worker) => {
                  const firstName = worker.name.split(' ')[0];
                  return (
                    <div
                      key={worker.id}
                      className={`v2-worker-teaser ${selectedWorker?.id === worker.id ? 'selected' : ''}`}
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <div className="v2-teaser-header">
                        <div className="v2-teaser-avatar">
                          {worker.photo ? (
                            <img src={worker.photo} alt={worker.name} />
                          ) : (
                            <span>{worker.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                          )}
                        </div>
                        <div className="v2-teaser-info">
                          <div className="v2-teaser-name-row">
                            <span className="v2-teaser-name">{worker.name}</span>
                            {worker.shiftVerified && (
                              <BadgeCheck size={16} className="v2-teaser-verified" />
                            )}
                          </div>
                          <span className="v2-teaser-market">{worker.market}</span>
                        </div>
                      </div>
                      <div className="v2-teaser-stats">
                        <span className="v2-teaser-stat">
                          <strong>{worker.shiftsOnReflex}</strong> shifts
                        </span>
                        <span className="v2-teaser-stat">
                          <strong>{worker.uniqueStoreCount || 0}</strong> stores
                        </span>
                      </div>
                      <WorkerAchievementChips worker={worker} />
                      {worker.retailerSummary && (
                        <p className="v2-teaser-summary">
                          {worker.retailerSummary.slice(0, 100)}...
                        </p>
                      )}
                      <button
                        className="v2-teaser-connect"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorker(worker);
                        }}
                      >
                        <UserPlus size={16} />
                        Connect with {firstName}
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredWorkers.length > 12 && (
                <p className="v2-results-more">
                  + {filteredWorkers.length - 12} more matches in the sidebar
                </p>
              )}

              <div className="v2-results-actions">
                <button className="v2-action-btn v2-action-primary">
                  <UserPlus size={18} />
                  Connect with all {filteredWorkers.length}
                </button>
                <button
                  className="v2-action-btn v2-action-secondary"
                  onClick={() => {
                    setStep("welcome");
                    setSelectedBrands([]);
                    setEmploymentType(null);
                    setAvailabilityHours(null);
                    setExperienceLevel(null);
                    setCompletedSections(new Set());
                    setStartingFocusArea(null);
                    setSelectedWorker(null);
                  }}
                >
                  Start over
                </button>
              </div>
            </V2Main>
          )}

          {/* Selected Worker Full Card Sidebar */}
          {step === "results" && selectedWorker && (
            <div className="v2-worker-detail-sidebar">
              <button
                className="v2-detail-close"
                onClick={() => setSelectedWorker(null)}
              >
                <X size={20} />
              </button>
              <div className="v2-detail-scroll">
                <WorkerCard worker={selectedWorker} />
                <div className="v2-detail-actions">
                  <button className="v2-action-btn v2-action-primary">
                    <UserPlus size={18} />
                    Connect with {selectedWorker.name.split(' ')[0]}
                  </button>
                  <button className="v2-action-btn v2-action-secondary">
                    <CalendarDays size={18} />
                    Invite to shift
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar with worker cards - shown on location (when selected), employment, brands, experience steps. On results, only show if no worker selected */}
          {((["employment", "brands", "experience"].includes(step) ||
            (step === "results" && !selectedWorker) ||
            (step === "location" && selectedLocation && (persona === "field" || persona === "recruiter" || (persona === "individual" && pickingDifferentMarket))))) && (
            <V2WorkerSidebar
              workers={["employment", "brands", "experience", "results"].includes(step) ? filteredWorkers : marketWorkers}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              title={`${MARKETS.find(m => m.id === selectedLocation)?.name || "Market"} Talent`}
              showCount={step !== "results"}
              onWorkerClick={(worker) => {
                if (step === "results") {
                  setSelectedWorker(worker);
                }
              }}
              emptyMessage={
                step === "location"
                  ? "No Reflexers in this market yet. Try selecting a different market."
                  : undefined
              }
              isLoading={isLoadingWorkers}
            />
          )}
        </div>
      )}

      {/* Connections Tab - Shows workers from worker_connections table */}
      {activeTab === "connections" && (
        <div className="v2-connections-container">
          <div className="v2-connections-header">
            <h2 className="type-section-header-lg">Your Connections</h2>
            <p className="v2-connections-subtitle">
              Track workers you've viewed, liked, invited, or connected with
            </p>
          </div>

          {/* Connection Status Filter Pills */}
          <div className="v2-connection-filters">
            <button className="v2-filter-pill active">
              All <span className="v2-filter-count">8</span>
            </button>
            <button className="v2-filter-pill">
              <Eye size={14} /> Viewed <span className="v2-filter-count">2</span>
            </button>
            <button className="v2-filter-pill">
              <ThumbsUp size={14} /> Liked <span className="v2-filter-count">2</span>
            </button>
            <button className="v2-filter-pill">
              <UserPlus size={14} /> Invited <span className="v2-filter-count">2</span>
            </button>
            <button className="v2-filter-pill">
              <Link size={14} /> Connected <span className="v2-filter-count">1</span>
            </button>
            <button className="v2-filter-pill">
              <XCircle size={14} /> Not Interested <span className="v2-filter-count">1</span>
            </button>
          </div>

          {/* Connections List */}
          <div className="v2-connections-list">
            {/* Sample connection cards - hardcoded for demo */}
            <div className="v2-connection-card">
              <div className="v2-connection-avatar">
                <span>MJ</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">Maria Johnson</span>
                  <BadgeCheck size={16} className="v2-teaser-verified" />
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>47 shifts</span>
                  <span>12 stores</span>
                </div>
              </div>
              <div className="v2-connection-status connected">
                <Link size={14} /> Connected
              </div>
              <button className="v2-connection-action">
                <MessageCircle size={16} /> Chat
              </button>
            </div>

            <div className="v2-connection-card">
              <div className="v2-connection-avatar">
                <span>JD</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">James Davis</span>
                  <BadgeCheck size={16} className="v2-teaser-verified" />
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>32 shifts</span>
                  <span>8 stores</span>
                </div>
              </div>
              <div className="v2-connection-status invited">
                <UserPlus size={14} /> Invited
              </div>
              <button className="v2-connection-action">
                <MessageCircle size={16} /> Message
              </button>
            </div>

            <div className="v2-connection-card">
              <div className="v2-connection-avatar">
                <span>SK</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">Sarah Kim</span>
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>18 shifts</span>
                  <span>5 stores</span>
                </div>
              </div>
              <div className="v2-connection-status invited">
                <UserPlus size={14} /> Invited
              </div>
              <button className="v2-connection-action">
                <MessageCircle size={16} /> Message
              </button>
            </div>

            <div className="v2-connection-card">
              <div className="v2-connection-avatar">
                <span>TR</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">Tyler Rodriguez</span>
                  <BadgeCheck size={16} className="v2-teaser-verified" />
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>56 shifts</span>
                  <span>15 stores</span>
                </div>
              </div>
              <div className="v2-connection-status liked">
                <ThumbsUp size={14} /> Liked
              </div>
              <button className="v2-connection-action">
                <UserPlus size={16} /> Invite
              </button>
            </div>

            <div className="v2-connection-card">
              <div className="v2-connection-avatar">
                <span>AM</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">Ashley Miller</span>
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>24 shifts</span>
                  <span>7 stores</span>
                </div>
              </div>
              <div className="v2-connection-status liked">
                <ThumbsUp size={14} /> Liked
              </div>
              <button className="v2-connection-action">
                <UserPlus size={16} /> Invite
              </button>
            </div>

            <div className="v2-connection-card">
              <div className="v2-connection-avatar">
                <span>CW</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">Chris Wilson</span>
                  <BadgeCheck size={16} className="v2-teaser-verified" />
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>41 shifts</span>
                  <span>11 stores</span>
                </div>
              </div>
              <div className="v2-connection-status viewed">
                <Eye size={14} /> Viewed
              </div>
              <button className="v2-connection-action">
                <ThumbsUp size={16} /> Like
              </button>
            </div>

            <div className="v2-connection-card">
              <div className="v2-connection-avatar">
                <span>EB</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">Emma Brown</span>
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>12 shifts</span>
                  <span>4 stores</span>
                </div>
              </div>
              <div className="v2-connection-status viewed">
                <Eye size={14} /> Viewed
              </div>
              <button className="v2-connection-action">
                <ThumbsUp size={16} /> Like
              </button>
            </div>

            <div className="v2-connection-card not-interested">
              <div className="v2-connection-avatar">
                <span>DL</span>
              </div>
              <div className="v2-connection-info">
                <div className="v2-connection-name-row">
                  <span className="v2-connection-name">David Lee</span>
                </div>
                <span className="v2-connection-market">Austin, TX</span>
                <div className="v2-connection-stats">
                  <span>8 shifts</span>
                  <span>3 stores</span>
                </div>
              </div>
              <div className="v2-connection-status not-interested">
                <XCircle size={14} /> Not Interested
              </div>
              <button className="v2-connection-action secondary">
                Undo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Tab - SMS-style messaging interface */}
      {activeTab === "chat" && (
        <div className="v2-chat-container">
          {/* Chat Sidebar - Conversation List */}
          <div className="v2-chat-sidebar">
            <div className="v2-chat-sidebar-header">
              <h3>Messages</h3>
              <span className="v2-chat-unread-badge">3</span>
            </div>
            <div className="v2-chat-list">
              {/* Active conversation */}
              <div className="v2-chat-item active">
                <div className="v2-chat-item-avatar">
                  <span>MJ</span>
                  <div className="v2-chat-online-dot" />
                </div>
                <div className="v2-chat-item-info">
                  <div className="v2-chat-item-header">
                    <span className="v2-chat-item-name">Maria Johnson</span>
                    <span className="v2-chat-item-time">2m ago</span>
                  </div>
                  <p className="v2-chat-item-preview">
                    Yes! I'd love to book a shift this weekend.
                  </p>
                </div>
                <div className="v2-chat-unread-dot" />
              </div>

              <div className="v2-chat-item">
                <div className="v2-chat-item-avatar">
                  <span>JD</span>
                </div>
                <div className="v2-chat-item-info">
                  <div className="v2-chat-item-header">
                    <span className="v2-chat-item-name">James Davis</span>
                    <span className="v2-chat-item-time">1h ago</span>
                  </div>
                  <p className="v2-chat-item-preview">
                    What's the hourly rate for the position?
                  </p>
                </div>
                <div className="v2-chat-unread-dot" />
              </div>

              <div className="v2-chat-item">
                <div className="v2-chat-item-avatar">
                  <span>SK</span>
                </div>
                <div className="v2-chat-item-info">
                  <div className="v2-chat-item-header">
                    <span className="v2-chat-item-name">Sarah Kim</span>
                    <span className="v2-chat-item-time">3h ago</span>
                  </div>
                  <p className="v2-chat-item-preview">
                    I'm available for an interview next Tuesday
                  </p>
                </div>
                <div className="v2-chat-unread-dot" />
              </div>

              <div className="v2-chat-item">
                <div className="v2-chat-item-avatar">
                  <span>TR</span>
                </div>
                <div className="v2-chat-item-info">
                  <div className="v2-chat-item-header">
                    <span className="v2-chat-item-name">Tyler Rodriguez</span>
                    <span className="v2-chat-item-time">Yesterday</span>
                  </div>
                  <p className="v2-chat-item-preview">
                    Thanks for reaching out! I'll think about it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Main Area */}
          <div className="v2-chat-main">
            {/* Chat Header */}
            <div className="v2-chat-header">
              <div className="v2-chat-header-info">
                <div className="v2-chat-header-avatar">
                  <span>MJ</span>
                  <div className="v2-chat-online-dot" />
                </div>
                <div className="v2-chat-header-details">
                  <span className="v2-chat-header-name">Maria Johnson</span>
                  <span className="v2-chat-header-status">Online</span>
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

            {/* Chat Messages */}
            <div className="v2-chat-messages">
              {/* Date divider */}
              <div className="v2-chat-date-divider">
                <span>Today</span>
              </div>

              {/* Outgoing message */}
              <div className="v2-chat-message outgoing">
                <div className="v2-chat-bubble">
                  <p>Hi Maria! We loved your profile and wanted to see if you'd be interested in a permanent position at our Domain Northside location.</p>
                  <span className="v2-chat-time">10:30 AM</span>
                </div>
              </div>

              {/* Incoming message */}
              <div className="v2-chat-message incoming">
                <div className="v2-chat-bubble">
                  <p>Hi! Thank you so much for reaching out. I've really enjoyed my shifts at your store. What does the role entail?</p>
                  <span className="v2-chat-time">10:45 AM</span>
                </div>
              </div>

              {/* Outgoing message */}
              <div className="v2-chat-message outgoing">
                <div className="v2-chat-bubble">
                  <p>It's a full-time Sales Associate position. You'd be working 35-40 hours per week, mostly evenings and weekends. The pay starts at $18/hr with benefits.</p>
                  <span className="v2-chat-time">11:00 AM</span>
                </div>
              </div>

              {/* Incoming message */}
              <div className="v2-chat-message incoming">
                <div className="v2-chat-bubble">
                  <p>That sounds great! I'm definitely interested. When would be a good time to discuss further?</p>
                  <span className="v2-chat-time">11:15 AM</span>
                </div>
              </div>

              {/* Outgoing message */}
              <div className="v2-chat-message outgoing">
                <div className="v2-chat-bubble">
                  <p>Would you like to come in for a trial shift this weekend? It would give you a chance to see if it's a good fit.</p>
                  <span className="v2-chat-time">11:30 AM</span>
                </div>
              </div>

              {/* Incoming message with enthusiasm */}
              <div className="v2-chat-message incoming">
                <div className="v2-chat-bubble">
                  <p>Yes! I'd love to book a shift this weekend. Saturday works best for me if you have availability.</p>
                  <span className="v2-chat-time">11:32 AM</span>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="v2-chat-input-area">
              <input
                type="text"
                placeholder="Type a message..."
                className="v2-chat-input"
              />
              <button className="v2-chat-send">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default V2TalentCentric;

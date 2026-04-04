import { useState, useMemo, useRef, useCallback } from "react";
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
  Building2,
  MapPin,
  UserCircle,
} from "lucide-react";
import { SAMPLE_WORKERS } from "../../../data/workers";
import { V2Main } from "./V2Main";
import { V2EmploymentSelector } from "./V2EmploymentSelector";
import { V2WorkerSidebar } from "./V2WorkerSidebar";
import type { EmploymentType } from "./V2EmploymentSelector";
import type { MatchedWorker } from "../../../types";
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

type TabId = "discover" | "saved" | "connected";

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
  { id: "newark-nj", name: "Newark", state: "NJ" },
  // NV
  { id: "las-vegas-nv", name: "Las Vegas", state: "NV" },
  // NY
  { id: "long-island-east-ny", name: "Long Island East", state: "NY" },
  { id: "long-island-west-ny", name: "Long Island West", state: "NY" },
  { id: "new-york-ny", name: "New York", state: "NY" },
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
  // TX
  { id: "austin-tx", name: "Austin", state: "TX" },
  { id: "dallas-tx", name: "Dallas", state: "TX" },
  { id: "houston-tx", name: "Houston", state: "TX" },
  { id: "san-antonio-tx", name: "San Antonio", state: "TX" },
  { id: "san-marcos-tx", name: "San Marcos", state: "TX" },
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
  const [locationSearch, setLocationSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fallbackUserName] = useState(() => getRandomUserName());
  const userName = propUserName || fallbackUserName;
  const brandRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // New flow state
  const [focusArea, setFocusArea] = useState<FocusArea | null>(null);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(null);

  // Persona and location flow
  const [persona, setPersona] = useState<PersonaType | null>(null);

  // Experience level for preference shaping
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);

  // Track which preference sections have been completed (for CYOA flow)
  const [completedSections, setCompletedSections] = useState<Set<FocusArea>>(
    new Set(),
  );

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

  // CYOA flow: Get next incomplete preference section
  const getNextIncompleteSection = (current: FocusArea): FocusArea | null => {
    const sections: FocusArea[] = ["employment", "brands", "roles"];
    const currentIndex = sections.indexOf(current);

    // Check sections after current, then wrap around
    for (let i = 1; i <= sections.length; i++) {
      const nextIndex = (currentIndex + i) % sections.length;
      const nextSection = sections[nextIndex];
      if (!completedSections.has(nextSection)) {
        return nextSection;
      }
    }
    return null; // All sections complete
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
  const transitionToStep = (
    newStep: Step,
    direction: "forward" | "back" = "forward",
  ) => {
    setTransitionDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 200);
  };

  // Helper to normalize brand names for comparison (kebab-case to lowercase, spaces removed)
  const normalizeBrand = (name: string) =>
    name.toLowerCase().replace(/[\s&'.-]+/g, "");

  // Filter and score workers based on selections
  const filteredWorkers = useMemo(() => {
    let workers = [...SAMPLE_WORKERS]; // Start with all 40 workers

    // Filter by selected location
    if (selectedLocation) {
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
    if (selectedBrands.length > 0) {
      const normalizedSelected = selectedBrands.map((id) => normalizeBrand(id));
      workers = workers.filter((w) => {
        // Check brandsWorked
        const hasBrandMatch = w.brandsWorked.some((b) =>
          normalizedSelected.some(
            (sel) =>
              normalizeBrand(b.name).includes(sel) ||
              sel.includes(normalizeBrand(b.name)),
          ),
        );
        // Check previousExperience
        const hasExpMatch = w.previousExperience?.some((exp) =>
          normalizedSelected.some(
            (sel) =>
              normalizeBrand(exp.company).includes(sel) ||
              sel.includes(normalizeBrand(exp.company)),
          ),
        );
        return hasBrandMatch || hasExpMatch;
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
  }, [selectedBrands, selectedLocation, employmentType, experienceLevel]);

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
            className={`tab ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            Connections
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
                onBack: () => transitionToStep("welcome", "back"),
                onNext: () => {},
                showBack: true,
                nextDisabled: true,
                nextLabel: "Continue",
              }}
            >
              <div className="v2-step-header-chips">
                <div className="v2-step-header">
                  <h1 className="type-tagline">Tell us about yourself.</h1>
                </div>

                <div className="v2-focus-chips">
                  <button
                    className={`welcome-card ${persona === "individual" ? "active" : ""}`}
                    onClick={() => {
                      setPersona("individual");
                      // For single store, auto-set location and go to focus
                      setSelectedLocation("austin-tx"); // Default market for MVP
                      transitionToStep("focus", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "individual" ? (
                        <Check size={24} />
                      ) : (
                        <Store size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Single-Store Manager
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Managing a team at one location
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${persona === "multi-store" ? "active" : ""}`}
                    onClick={() => {
                      setPersona("multi-store");
                      transitionToStep("location", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "multi-store" ? (
                        <Check size={24} />
                      ) : (
                        <Building2 size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Multi-Store Manager
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Managing multiple locations in same market
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${persona === "field" ? "active" : ""}`}
                    onClick={() => {
                      setPersona("field");
                      transitionToStep("location", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "field" ? (
                        <Check size={24} />
                      ) : (
                        <MapPin size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Field / Multi-Market
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Overseeing stores across region(s)
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${persona === "recruiter" ? "active" : ""}`}
                    onClick={() => {
                      setPersona("recruiter");
                      transitionToStep("location", "forward");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {persona === "recruiter" ? (
                        <Check size={24} />
                      ) : (
                        <UserCircle size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Recruiter
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Centralized hiring function
                    </p>
                    </div>
                  </button>
                </div>
              </div>
            </V2Main>
          )}

          {/* Step 2: Location Selection */}
          {step === "location" && (
            <V2Main
              stepClassName=""
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                showBack: true,
                onBack: () => transitionToStep("persona", "back"),
                onNext: () => transitionToStep("focus", "forward"),
                nextDisabled: !selectedLocation,
              }}
            >
              <div className="v2-step-header">
                  <h1 className="type-tagline">What city are you hiring in?</h1>
                  <p className="type-prompt-question v2-step-subtitle">
                    {persona === "multi-store"
                      ? "Which location are you hiring for?"
                      : "Select a market or search for a city"}
                  </p>
                </div>

                <div className="v2-location-controls">
                  <div className="v2-location-dropdown">
                    <select
                      value={
                        STORE_LOCATIONS.find(
                          (s) => s.marketId === selectedLocation,
                        )?.id || ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          const store = STORE_LOCATIONS.find(
                            (s) => s.id === e.target.value,
                          );
                          if (store) {
                            setSelectedLocation(store.marketId);
                          }
                        } else {
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
                      placeholder="Search cities..."
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
                className={`v2-location-grid ${selectedLocation && sidebarOpen ? "sidebar-open" : ""}`}
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
                        onClick={() =>
                          setSelectedLocation(
                            selectedLocation === market.id ? null : market.id,
                          )
                        }
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
            </V2Main>
          )}

          {/* Step 3: Focus Area Selection (CYOA - Pick starting point) */}
          {step === "focus" && (
            <V2Main
              stepClassName="v2-main-centered"
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onBack: () =>
                  transitionToStep(
                    persona === "individual" ? "persona" : "location",
                    "back",
                  ),
                onNext: () => {},
                showBack: true,
                nextDisabled: true,
                nextLabel: "Continue",
              }}
            >
              <div className="v2-step-header-chips">
                <div className="v2-step-header">
                  <h1 className="type-tagline">
                    Where would you like to start?
                  </h1>
                </div>

                <div className="v2-focus-chips v2-focus-chips-3col">
                  <button
                    className={`welcome-card ${completedSections.has("employment") ? "completed" : focusArea === "employment" ? "active" : ""}`}
                    onClick={() => {
                      if (!completedSections.has("employment")) {
                        setFocusArea("employment");
                        transitionToStep("employment", "forward");
                      }
                    }}
                    disabled={completedSections.has("employment")}
                  >
                    <div className="welcome-card-icon">
                      {completedSections.has("employment") ? (
                        <Check size={24} />
                      ) : (
                        <Clock size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Type of employment
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Full-time, part-time, or open to both
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${completedSections.has("brands") ? "completed" : focusArea === "brands" ? "active" : ""}`}
                    onClick={() => {
                      if (!completedSections.has("brands")) {
                        setFocusArea("brands");
                        transitionToStep("brands", "forward");
                      }
                    }}
                    disabled={completedSections.has("brands")}
                  >
                    <div className="welcome-card-icon">
                      {completedSections.has("brands") ? (
                        <Check size={24} />
                      ) : (
                        <Store size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Brand affinity
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Whose talent would you trust?
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${completedSections.has("roles") ? "completed" : focusArea === "roles" ? "active" : ""}`}
                    onClick={() => {
                      if (!completedSections.has("roles")) {
                        setFocusArea("roles");
                        transitionToStep("experience", "forward");
                      }
                    }}
                    disabled={completedSections.has("roles")}
                  >
                    <div className="welcome-card-icon">
                      {completedSections.has("roles") ? (
                        <Check size={24} />
                      ) : (
                        <Briefcase size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Experience level
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Where are they in their career?
                    </p>
                    </div>
                  </button>
                </div>
              </div>
            </V2Main>
          )}

          {/* Employment Type Selection */}
          {step === "employment" && (
            <V2Main
              stepClassName=""
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onBack: () => transitionToStep("focus", "back"),
                showBack: true,
              }}
            >
              <V2EmploymentSelector
                value={employmentType}
                onChange={(type) => {
                  setEmploymentType(type);
                  completeSection("employment");
                }}
              />
            </V2Main>
          )}

          {/* Experience Level Selection */}
          {step === "experience" && (
            <V2Main
              stepClassName=""
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              footer={{
                onBack: () => transitionToStep("focus", "back"),
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

                <div className="v2-focus-chips">
                  <button
                    className={`welcome-card ${experienceLevel === "new" ? "active" : ""}`}
                    onClick={() => {
                      setExperienceLevel("new");
                      completeSection("roles");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {experienceLevel === "new" ? (
                        <Check size={24} />
                      ) : (
                        <Users size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      New to Reflex
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      0-5 shifts completed
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${experienceLevel === "rising" ? "active" : ""}`}
                    onClick={() => {
                      setExperienceLevel("rising");
                      completeSection("roles");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {experienceLevel === "rising" ? (
                        <Check size={24} />
                      ) : (
                        <Sparkles size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Rising talent
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      5-30 shifts, building momentum
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${experienceLevel === "seasoned" ? "active" : ""}`}
                    onClick={() => {
                      setExperienceLevel("seasoned");
                      completeSection("roles");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {experienceLevel === "seasoned" ? (
                        <Check size={24} />
                      ) : (
                        <ShieldCheck size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Seasoned pro
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      30+ shifts, proven reliability
                    </p>
                    </div>
                  </button>
                  <button
                    className={`welcome-card ${experienceLevel === "management" ? "active" : ""}`}
                    onClick={() => {
                      setExperienceLevel("management");
                      completeSection("roles");
                    }}
                  >
                    <div className="welcome-card-icon">
                      {experienceLevel === "management" ? (
                        <Check size={24} />
                      ) : (
                        <Briefcase size={24} />
                      )}
                    </div>
                    <div className="v2-welcome-card-text">
                    <h3 className="welcome-card-title type-chip-header-lg">
                      Management ready
                    </h3>
                    <p className="welcome-card-description type-body-md">
                      Leadership role experience
                    </p>
                    </div>
                  </button>
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
                onBack: () => transitionToStep("focus", "back"),
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
                    What brand experience do you trust?
                  </h1>
                  <p className="type-prompt-question">
                    Select the brands whose talent you would want on your team.
                    We'll show you Reflexers with experience there.
                  </p>
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
                  <button
                    className="v2-clear-all"
                    onClick={() => setSelectedBrands([])}
                    disabled={selectedBrands.length === 0}
                  >
                    Clear all
                  </button>
                </div>

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
            </V2Main>
          )}

          {/* Results */}
          {step === "results" && (
            <V2Main
              stepClassName=""
              isTransitioning={isTransitioning}
              transitionDirection={transitionDirection}
              hideFooter
            >
              <div className="v2-step-header">
                <div className="v2-results-icon">
                  <Sparkles size={32} />
                </div>
                <h1 className="type-tagline">Meet your matches</h1>
                <p className="v2-step-subtitle">
                  {filteredWorkers.length} Reflexers match your criteria.
                  Connect to learn more or book a shift.
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

              <div className="v2-results-actions">
                <button className="v2-action-btn v2-action-primary">
                  Connect with all {filteredWorkers.length}
                </button>
                <button
                  className="v2-action-btn v2-action-secondary"
                  onClick={() => {
                    setStep("welcome");
                    setSelectedBrands([]);
                    setEmploymentType(null);
                    setExperienceLevel(null);
                    setCompletedSections(new Set());
                  }}
                >
                  Start over
                </button>
              </div>
            </V2Main>
          )}

          {/* Sidebar with worker cards - shown on brands, experience, and results steps */}
          {["brands", "experience", "results"].includes(step) && (
            <V2WorkerSidebar
              workers={filteredWorkers}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              title={
                step === "brands"
                  ? "Shift Verified Reflexers"
                  : step === "experience"
                    ? "Matching talent"
                    : step === "results"
                      ? `${filteredWorkers.length} matches`
                      : "Reflexers"
              }
              showCount={step !== "results"}
              onWorkerClick={() => {
                /* TODO: open full card */
              }}
            />
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="tab-empty-state">
          <div className="empty-state-content">
            <Heart size={32} strokeWidth={1.5} />
            <p>No saved workers yet</p>
          </div>
        </div>
      )}

      {activeTab === "connected" && (
        <div className="tab-empty-state">
          <div className="empty-state-content">
            <Link size={32} strokeWidth={1.5} />
            <p>No connections yet</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default V2TalentCentric;

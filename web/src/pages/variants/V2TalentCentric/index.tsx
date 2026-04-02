import { useState, useMemo, useRef, useCallback } from 'react';
import { Check, ChevronRight, ChevronLeft, Sparkles, Link, Heart, Search, X, Users, ShieldCheck, Unlock, MapPin } from 'lucide-react';
import { SAMPLE_WORKERS } from '../../../data/workers';
import { WorkerCardTeaser } from '../../../components/Workers/WorkerCardTeaser';
import type { MatchedWorker } from '../../../types';
import './styles.css';

// Import all brand logos
import logo7ForAllMankind from '../../../../../assets/brand-logos/7-for-all-mankind.png';
import logoAbercrombie from '../../../../../assets/brand-logos/abercrombie-and-fitch.png';
import logoAldo from '../../../../../assets/brand-logos/aldo.png';
import logoAllbirds from '../../../../../assets/brand-logos/allbirds.png';
import logoAllsaints from '../../../../../assets/brand-logos/allsaints.png';
import logoAloYoga from '../../../../../assets/brand-logos/alo-yoga.png';
import logoAnnTaylor from '../../../../../assets/brand-logos/ann-taylor.png';
import logoAnthropologie from '../../../../../assets/brand-logos/anthropologie.png';
import logoAriat from '../../../../../assets/brand-logos/ariat.png';
import logoArmaniExchange from '../../../../../assets/brand-logos/armani-exchange.png';
import logoBananaRepublic from '../../../../../assets/brand-logos/banana-republic.png';
import logoBurberry from '../../../../../assets/brand-logos/burberry.png';
import logoCalvinKlein from '../../../../../assets/brand-logos/calvin-klein.png';
import logoChanel from '../../../../../assets/brand-logos/chanel.png';
import logoCosmeticsCompanyStore from '../../../../../assets/brand-logos/cosmetics-company-store.png';
import logoDeckers from '../../../../../assets/brand-logos/deckers.png';
import logoDkny from '../../../../../assets/brand-logos/dkny.png';
import logoEberjey from '../../../../../assets/brand-logos/eberjey.png';
import logoElysewalker from '../../../../../assets/brand-logos/elysewalker.png';
import logoEsteeLauder from '../../../../../assets/brand-logos/estee-lauder.png';
import logoEverlane from '../../../../../assets/brand-logos/everlane.png';
import logoFossil from '../../../../../assets/brand-logos/fossil.png';
import logoFreePeople from '../../../../../assets/brand-logos/free-people.png';
import logoGap from '../../../../../assets/brand-logos/gap.png';
import logoGoldenGoose from '../../../../../assets/brand-logos/golden-goose.png';
import logoGuess from '../../../../../assets/brand-logos/guess.png';
import logoHoka from '../../../../../assets/brand-logos/hoka.png';
import logoHuckberry from '../../../../../assets/brand-logos/huckberry.png';
import logoJCrew from '../../../../../assets/brand-logos/j-crew.png';
import logoKarlLagerfeld from '../../../../../assets/brand-logos/karl-lagerfeld.png';
import logoKateSpade from '../../../../../assets/brand-logos/kate-spade.png';
import logoKuhnRikon from '../../../../../assets/brand-logos/kuhn-rikon.png';
import logoLevis from '../../../../../assets/brand-logos/levis.png';
import logoLively from '../../../../../assets/brand-logos/lively.png';
import logoLongchamp from '../../../../../assets/brand-logos/longchamp.png';
import logoLuckyBrand from '../../../../../assets/brand-logos/lucky-brand.png';
import logoMac from '../../../../../assets/brand-logos/mac.png';
import logoMackage from '../../../../../assets/brand-logos/mackage.png';
import logoMadewell from '../../../../../assets/brand-logos/madewell.png';
import logoMarcJacobs from '../../../../../assets/brand-logos/marc-jacobs.png';
import logoMavi from '../../../../../assets/brand-logos/mavi.png';
import logoMcm from '../../../../../assets/brand-logos/mcm.png';
import logoMeem from '../../../../../assets/brand-logos/meem.png';
import logoMichaelKors from '../../../../../assets/brand-logos/michael-kors.png';
import logoMizzenMain from '../../../../../assets/brand-logos/mizzenmain.png';
import logoNeimanMarcus from '../../../../../assets/brand-logos/neiman-marcus.png';
import logoNike from '../../../../../assets/brand-logos/nike.png';
import logoNordstrom from '../../../../../assets/brand-logos/nordstrom.png';
import logoNorthFace from '../../../../../assets/brand-logos/north-face.png';
import logoOldNavy from '../../../../../assets/brand-logos/old-navy.png';
import logoPacsun from '../../../../../assets/brand-logos/pacsun.png';
import logoPatagonia from '../../../../../assets/brand-logos/patagonia.png';
import logoPoloRalphLauren from '../../../../../assets/brand-logos/polo-ralph-lauren.png';
import logoPuma from '../../../../../assets/brand-logos/puma.png';
import logoRagAndBone from '../../../../../assets/brand-logos/rag-and-bone.png';
import logoReclectic from '../../../../../assets/brand-logos/reclectic.png';
import logoReiss from '../../../../../assets/brand-logos/reiss.png';
import logoRhone from '../../../../../assets/brand-logos/rhone.png';
import logoSabah from '../../../../../assets/brand-logos/sabah.png';
import logoSaks from '../../../../../assets/brand-logos/saks-fifth-avenue.png';
import logoSephora from '../../../../../assets/brand-logos/sephora.png';
import logoSezane from '../../../../../assets/brand-logos/sezane.png';
import logoShinola from '../../../../../assets/brand-logos/shinola.png';
import logoSplendid from '../../../../../assets/brand-logos/splendid.png';
import logoSteveMadden from '../../../../../assets/brand-logos/steve-madden.png';
import logoTecovas from '../../../../../assets/brand-logos/tecovas.png';
import logoTheory from '../../../../../assets/brand-logos/theory.png';
import logoTommyJohn from '../../../../../assets/brand-logos/tommy-john.png';
import logoTrueClassic from '../../../../../assets/brand-logos/true-classic.png';
import logoUgg from '../../../../../assets/brand-logos/ugg.png';
import logoUltaBeauty from '../../../../../assets/brand-logos/ulta-beauty.png';
import logoUnderArmour from '../../../../../assets/brand-logos/under-armour.png';
import logoUniqlo from '../../../../../assets/brand-logos/uniqlo.png';
import logoUrbanOutfitters from '../../../../../assets/brand-logos/urban-outfitters.png';
import logoUrbn from '../../../../../assets/brand-logos/urbn.png';
import logoVans from '../../../../../assets/brand-logos/vans.png';
import logoVeraBradley from '../../../../../assets/brand-logos/vera-bradley.png';
import logoVeraWang from '../../../../../assets/brand-logos/vera-wang.png';
import logoVictoriasSecret from '../../../../../assets/brand-logos/victorias-secret.png';
import logoWarbyParker from '../../../../../assets/brand-logos/warby-parker.png';
import logoWolfAndShephard from '../../../../../assets/brand-logos/wolf-and-shephard.png';
import logoZara from '../../../../../assets/brand-logos/zara.png';

type TabId = 'discover' | 'saved' | 'connected';

// Names for the greeting - shared with V1
const GREETING_NAMES = [
  'Mike', 'Trevor', 'Shannon', 'Nate', 'Micah', 'Katherine', 'Cayley',
  'Evan', 'Juan', 'Julie', 'Ashlee', 'Jeremy', 'Sam', 'Jasmine',
  'Emily', 'Olivia', 'Mary', 'Hans', 'Hadley', 'Leigh Ann',
];
const getRandomUserName = () => GREETING_NAMES[Math.floor(Math.random() * GREETING_NAMES.length)];

// Brand logos array - edit this to add/remove brands
const BRAND_LOGOS: { id: string; logo: string }[] = [
  { id: '7-for-all-mankind', logo: logo7ForAllMankind },
  { id: 'abercrombie', logo: logoAbercrombie },
  { id: 'aldo', logo: logoAldo },
  { id: 'allbirds', logo: logoAllbirds },
  { id: 'allsaints', logo: logoAllsaints },
  { id: 'alo-yoga', logo: logoAloYoga },
  { id: 'ann-taylor', logo: logoAnnTaylor },
  { id: 'anthropologie', logo: logoAnthropologie },
  { id: 'ariat', logo: logoAriat },
  { id: 'armani-exchange', logo: logoArmaniExchange },
  { id: 'banana-republic', logo: logoBananaRepublic },
  { id: 'burberry', logo: logoBurberry },
  { id: 'calvin-klein', logo: logoCalvinKlein },
  { id: 'chanel', logo: logoChanel },
  { id: 'cosmetics-company-store', logo: logoCosmeticsCompanyStore },
  { id: 'deckers', logo: logoDeckers },
  { id: 'dkny', logo: logoDkny },
  { id: 'eberjey', logo: logoEberjey },
  { id: 'elysewalker', logo: logoElysewalker },
  { id: 'estee-lauder', logo: logoEsteeLauder },
  { id: 'everlane', logo: logoEverlane },
  { id: 'fossil', logo: logoFossil },
  { id: 'free-people', logo: logoFreePeople },
  { id: 'gap', logo: logoGap },
  { id: 'golden-goose', logo: logoGoldenGoose },
  { id: 'guess', logo: logoGuess },
  { id: 'hoka', logo: logoHoka },
  { id: 'huckberry', logo: logoHuckberry },
  { id: 'j-crew', logo: logoJCrew },
  { id: 'karl-lagerfeld', logo: logoKarlLagerfeld },
  { id: 'kate-spade', logo: logoKateSpade },
  { id: 'kuhn-rikon', logo: logoKuhnRikon },
  { id: 'levis', logo: logoLevis },
  { id: 'lively', logo: logoLively },
  { id: 'longchamp', logo: logoLongchamp },
  { id: 'lucky-brand', logo: logoLuckyBrand },
  { id: 'mac', logo: logoMac },
  { id: 'mackage', logo: logoMackage },
  { id: 'madewell', logo: logoMadewell },
  { id: 'marc-jacobs', logo: logoMarcJacobs },
  { id: 'mavi', logo: logoMavi },
  { id: 'mcm', logo: logoMcm },
  { id: 'meem', logo: logoMeem },
  { id: 'michael-kors', logo: logoMichaelKors },
  { id: 'mizzen-main', logo: logoMizzenMain },
  { id: 'neiman-marcus', logo: logoNeimanMarcus },
  { id: 'nike', logo: logoNike },
  { id: 'nordstrom', logo: logoNordstrom },
  { id: 'north-face', logo: logoNorthFace },
  { id: 'old-navy', logo: logoOldNavy },
  { id: 'pacsun', logo: logoPacsun },
  { id: 'patagonia', logo: logoPatagonia },
  { id: 'polo-ralph-lauren', logo: logoPoloRalphLauren },
  { id: 'puma', logo: logoPuma },
  { id: 'rag-and-bone', logo: logoRagAndBone },
  { id: 'reclectic', logo: logoReclectic },
  { id: 'reiss', logo: logoReiss },
  { id: 'rhone', logo: logoRhone },
  { id: 'sabah', logo: logoSabah },
  { id: 'saks', logo: logoSaks },
  { id: 'sephora', logo: logoSephora },
  { id: 'sezane', logo: logoSezane },
  { id: 'shinola', logo: logoShinola },
  { id: 'splendid', logo: logoSplendid },
  { id: 'steve-madden', logo: logoSteveMadden },
  { id: 'tecovas', logo: logoTecovas },
  { id: 'theory', logo: logoTheory },
  { id: 'tommy-john', logo: logoTommyJohn },
  { id: 'true-classic', logo: logoTrueClassic },
  { id: 'ugg', logo: logoUgg },
  { id: 'ulta-beauty', logo: logoUltaBeauty },
  { id: 'under-armour', logo: logoUnderArmour },
  { id: 'uniqlo', logo: logoUniqlo },
  { id: 'urban-outfitters', logo: logoUrbanOutfitters },
  { id: 'urbn', logo: logoUrbn },
  { id: 'vans', logo: logoVans },
  { id: 'vera-bradley', logo: logoVeraBradley },
  { id: 'vera-wang', logo: logoVeraWang },
  { id: 'victorias-secret', logo: logoVictoriasSecret },
  { id: 'warby-parker', logo: logoWarbyParker },
  { id: 'wolf-and-shephard', logo: logoWolfAndShephard },
  { id: 'zara', logo: logoZara },
];

// This-or-that questions
interface ThisOrThatQuestion {
  id: string;
  question: string;
  optionA: { label: string; value: string };
  optionB: { label: string; value: string };
}

const QUESTIONS: ThisOrThatQuestion[] = [
  {
    id: 'employment',
    question: 'What type of role?',
    optionA: { label: 'Full-time', value: 'FT' },
    optionB: { label: 'Part-time', value: 'PT' },
  },
  {
    id: 'experience',
    question: 'Experience level?',
    optionA: { label: 'Seasoned pro', value: 'experienced' },
    optionB: { label: 'Rising talent', value: 'newer' },
  },
  {
    id: 'style',
    question: 'Work style?',
    optionA: { label: 'Self-starter', value: 'independent' },
    optionB: { label: 'Team player', value: 'collaborative' },
  },
  {
    id: 'availability',
    question: 'Availability?',
    optionA: { label: 'Weekends', value: 'weekends' },
    optionB: { label: 'Weekdays', value: 'weekdays' },
  },
];

type Step = 'welcome' | 'location' | 'focus' | 'employment' | 'roles' | 'brands' | 'questions' | 'results';

type FocusArea = 'employment' | 'brands' | 'roles';

// Store locations (retailer's locations they have permission to hire for)
const STORE_LOCATIONS = [
  { id: 'domain-northside', name: 'Domain Northside', marketId: 'austin-tx' },
  { id: 'market-town-center', name: 'The Market at Town Center', marketId: 'phoenix-az' },
  { id: 'south-congress', name: 'South Congress', marketId: 'dallas-tx' },
  { id: 'waterview-plaza', name: 'Waterview Plaza', marketId: 'dallas-tx' },
  { id: 'main-street-shops', name: 'Main Street Shops', marketId: 'houston-tx' },
  { id: 'lakeline-mall', name: 'Lakeline Mall', marketId: 'fresno-ca' },
  { id: 'milton-creek-square', name: 'Milton Creek Square', marketId: 'san-antonio-tx' },
  { id: 'hill-country-galleria', name: 'Hill Country Galleria', marketId: 'austin-tx' },
  { id: 'the-arboretum', name: 'The Arboretum', marketId: 'baton-rouge-la' },
  { id: 'sunset-valley-village', name: 'Sunset Valley Village', marketId: 'las-vegas-nv' },
  // 5 more southwest locations
  { id: 'scottsdale-fashion', name: 'Scottsdale Fashion Square', marketId: 'phoenix-az' },
  { id: 'uptown-park', name: 'Uptown Park', marketId: 'san-marcos-tx' },
  { id: 'cherry-creek', name: 'Cherry Creek', marketId: 'denver-co' },
  { id: 'la-cantera', name: 'La Cantera', marketId: 'san-antonio-tx' },
  { id: 'town-square', name: 'Town Square', marketId: 'los-angeles-ca' },
];

// All available markets for city search (from Oz table - 58 live markets)
const MARKETS = [
  // AZ
  { id: 'phoenix-az', name: 'Phoenix', state: 'AZ' },
  // CA
  { id: 'bakersfield-ca', name: 'Bakersfield', state: 'CA' },
  { id: 'cabazon-ca', name: 'Cabazon', state: 'CA' },
  { id: 'fresno-ca', name: 'Fresno', state: 'CA' },
  { id: 'los-angeles-ca', name: 'Los Angeles', state: 'CA' },
  { id: 'sacramento-ca', name: 'Sacramento', state: 'CA' },
  { id: 'san-diego-ca', name: 'San Diego', state: 'CA' },
  { id: 'san-francisco-ca', name: 'San Francisco', state: 'CA' },
  { id: 'san-jose-ca', name: 'San Jose', state: 'CA' },
  // CO
  { id: 'boulder-co', name: 'Boulder', state: 'CO' },
  { id: 'denver-co', name: 'Denver', state: 'CO' },
  // CT
  { id: 'westport-ct', name: 'Westport', state: 'CT' },
  // D.C.
  { id: 'washington-dc', name: 'Washington', state: 'D.C.' },
  // DE
  { id: 'wilmington-de', name: 'Wilmington', state: 'DE' },
  // FL
  { id: 'fort-myers-fl', name: 'Fort Myers', state: 'FL' },
  { id: 'fort-walton-beach-fl', name: 'Fort Walton Beach', state: 'FL' },
  { id: 'miami-fl', name: 'Miami', state: 'FL' },
  { id: 'orlando-fl', name: 'Orlando', state: 'FL' },
  { id: 'tampa-fl', name: 'Tampa', state: 'FL' },
  // GA
  { id: 'atlanta-ga', name: 'Atlanta', state: 'GA' },
  { id: 'savannah-ga', name: 'Savannah', state: 'GA' },
  // IL
  { id: 'chicago-il', name: 'Chicago', state: 'IL' },
  // IN
  { id: 'indianapolis-in', name: 'Indianapolis', state: 'IN' },
  // LA
  { id: 'baton-rouge-la', name: 'Baton Rouge', state: 'LA' },
  { id: 'new-orleans-la', name: 'New Orleans', state: 'LA' },
  // MA
  { id: 'boston-ma', name: 'Boston', state: 'MA' },
  // MI
  { id: 'detroit-mi', name: 'Detroit', state: 'MI' },
  // MN
  { id: 'minneapolis-mn', name: 'Minneapolis', state: 'MN' },
  // MO
  { id: 'st-louis-mo', name: 'St. Louis', state: 'MO' },
  // MS
  { id: 'biloxi-ms', name: 'Biloxi', state: 'MS' },
  // NC
  { id: 'charlotte-nc', name: 'Charlotte', state: 'NC' },
  { id: 'raleigh-durham-nc', name: 'Raleigh-Durham', state: 'NC' },
  // NE
  { id: 'omaha-ne', name: 'Omaha', state: 'NE' },
  // NH
  { id: 'merrimack-nh', name: 'Merrimack', state: 'NH' },
  // NJ
  { id: 'newark-nj', name: 'Newark', state: 'NJ' },
  // NV
  { id: 'las-vegas-nv', name: 'Las Vegas', state: 'NV' },
  // NY
  { id: 'long-island-east-ny', name: 'Long Island East', state: 'NY' },
  { id: 'long-island-west-ny', name: 'Long Island West', state: 'NY' },
  { id: 'new-york-ny', name: 'New York', state: 'NY' },
  { id: 'westchester-ny', name: 'Westchester', state: 'NY' },
  { id: 'woodbury-ny', name: 'Woodbury', state: 'NY' },
  // OH
  { id: 'cincinnati-oh', name: 'Cincinnati', state: 'OH' },
  { id: 'columbus-oh', name: 'Columbus', state: 'OH' },
  // OK
  { id: 'tulsa-ok', name: 'Tulsa', state: 'OK' },
  // OR
  { id: 'portland-or', name: 'Portland', state: 'OR' },
  // PA
  { id: 'king-of-prussia-pa', name: 'King of Prussia', state: 'PA' },
  // SC
  { id: 'charleston-sc', name: 'Charleston', state: 'SC' },
  // TN
  { id: 'knoxville-tn', name: 'Knoxville', state: 'TN' },
  { id: 'memphis-tn', name: 'Memphis', state: 'TN' },
  { id: 'nashville-tn', name: 'Nashville', state: 'TN' },
  // TX
  { id: 'austin-tx', name: 'Austin', state: 'TX' },
  { id: 'dallas-tx', name: 'Dallas', state: 'TX' },
  { id: 'houston-tx', name: 'Houston', state: 'TX' },
  { id: 'san-antonio-tx', name: 'San Antonio', state: 'TX' },
  { id: 'san-marcos-tx', name: 'San Marcos', state: 'TX' },
  // UT
  { id: 'salt-lake-city-ut', name: 'Salt Lake City', state: 'UT' },
  // WA
  { id: 'seattle-wa', name: 'Seattle', state: 'WA' },
  // WI
  { id: 'milwaukee-wi', name: 'Milwaukee', state: 'WI' },
];

// Job roles by category
const JOB_ROLES = {
  salesFloor: {
    label: 'Sales Floor',
    roles: [
      { title: 'Sales Associate / Retail Associate', description: 'Customer service, sales floor support, POS transactions' },
      { title: 'Store Associate', description: 'General sales floor support and customer assistance' },
      { title: 'Brand Representative', description: 'Brand ambassador, product expertise, customer engagement' },
    ],
  },
  salesSupport: {
    label: 'Sales Support',
    roles: [
      { title: 'Sales Assistant', description: 'Support sales team, customer service backup' },
      { title: 'Cashier', description: 'Checkout operations, handling payments' },
      { title: 'Fitting Room Attendant', description: 'Managing dressing rooms, returning items to floor' },
      { title: 'Team Member', description: 'General retail support, multi-functional role' },
      { title: 'Retail Customer Service', description: 'Customer inquiries, returns, service desk' },
    ],
  },
  backOfHouse: {
    label: 'Back of House',
    roles: [
      { title: 'Stock Associate / Stocker', description: 'Receiving, organizing, replenishing inventory' },
      { title: 'Inventory Associate', description: 'Inventory management, cycle counts, stock accuracy' },
      { title: 'Operations Associate', description: 'Store operations, logistics, back-office support' },
    ],
  },
  specialized: {
    label: 'Specialized',
    roles: [
      { title: 'Beauty Advisor / Cosmetics Associate', description: 'Product expertise, demos (Sephora, Ulta, department stores)' },
      { title: 'Stylist', description: 'Personal styling, outfit consultation, clienteling' },
      { title: 'Visual Merchandiser', description: 'Displays, store layout, product presentation' },
      { title: 'Pop Up', description: 'Temporary retail events, brand activations' },
    ],
  },
  management: {
    label: 'Management',
    roles: [
      { title: 'Store Team Leader', description: 'Team leadership, shift coordination' },
      { title: 'Supervisor', description: 'Floor supervision, team oversight' },
      { title: 'Key Holder / Lead Associate', description: 'Opening/closing, shift supervision' },
      { title: 'Department Supervisor', description: 'Oversees specific section (shoes, menswear, etc.)' },
      { title: 'Assistant Store Manager', description: 'Operations support, staff scheduling' },
      { title: 'Store Manager', description: 'Full P&L responsibility, hiring, performance' },
      { title: 'District / Area Manager', description: 'Multi-store oversight' },
    ],
  },
};

interface V2TalentCentricProps {
  userName?: string;
}

export function V2TalentCentric({ userName: propUserName }: V2TalentCentricProps) {
  const [activeTab, setActiveTab] = useState<TabId>('discover');
  const [step, setStep] = useState<Step>('welcome');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back'>('forward');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [brandSearch, setBrandSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fallbackUserName] = useState(() => getRandomUserName());
  const userName = propUserName || fallbackUserName;
  const brandRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // New flow state
  const [focusArea, setFocusArea] = useState<FocusArea | null>(null);
  const [employmentType, setEmploymentType] = useState<'full-time' | 'part-time' | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');

  // Search matching brands - only match from start of name
  const searchResults = useMemo(() => {
    if (!brandSearch.trim()) return null;
    const query = brandSearch.toLowerCase().replace(/[\s&'.-]+/g, '');
    return BRAND_LOGOS.filter(brand => {
      const normalized = brand.id.toLowerCase().replace(/[\s&'.-]+/g, '');
      return normalized.startsWith(query);
    });
  }, [brandSearch]);

  // Scroll to first matching brand
  const handleSearch = useCallback((value: string) => {
    setBrandSearch(value);
    if (value.trim()) {
      const query = value.toLowerCase().replace(/[\s&'.-]+/g, '');
      const match = BRAND_LOGOS.find(brand => {
        const normalized = brand.id.toLowerCase().replace(/[\s&'.-]+/g, '');
        return normalized.startsWith(query);
      });
      if (match && brandRefs.current[match.id]) {
        brandRefs.current[match.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  // Toggle brand selection
  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandName)
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
  };

  // Transition to a new step with animation
  const transitionToStep = (newStep: Step, direction: 'forward' | 'back' = 'forward') => {
    setTransitionDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 200);
  };

  // Handle this-or-that answer
  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    // Auto-advance to next question or results
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 300);
    } else {
      setTimeout(() => transitionToStep('results', 'forward'), 300);
    }
  };

  // Helper to normalize brand names for comparison (kebab-case to lowercase, spaces removed)
  const normalizeBrand = (name: string) => name.toLowerCase().replace(/[\s&'.-]+/g, '');

  // Filter and score workers based on selections
  const filteredWorkers = useMemo(() => {
    let workers = [...SAMPLE_WORKERS]; // Start with all 40 workers

    // Filter by selected location
    if (selectedLocation) {
      const selectedMarket = MARKETS.find(m => m.id === selectedLocation);
      if (selectedMarket) {
        workers = workers.filter(w =>
          w.market.toLowerCase().includes(selectedMarket.name.toLowerCase()) ||
          selectedMarket.name.toLowerCase().includes(w.market.toLowerCase())
        );
      }
    }

    // Filter by selected brands - check brandsWorked and previousExperience
    if (selectedBrands.length > 0) {
      const normalizedSelected = selectedBrands.map(id => normalizeBrand(id));
      workers = workers.filter(w => {
        // Check brandsWorked
        const hasBrandMatch = w.brandsWorked.some(b =>
          normalizedSelected.some(sel => normalizeBrand(b.name).includes(sel) || sel.includes(normalizeBrand(b.name)))
        );
        // Check previousExperience
        const hasExpMatch = w.previousExperience?.some(exp =>
          normalizedSelected.some(sel => normalizeBrand(exp.company).includes(sel) || sel.includes(normalizeBrand(exp.company)))
        );
        return hasBrandMatch || hasExpMatch;
      });
    }

    // Apply question filters
    if (answers.employment) {
      workers = workers.filter(w =>
        w.preference === 'Both' || w.preference === answers.employment
      );
    }

    if (answers.experience === 'experienced') {
      workers = workers.filter(w => w.shiftsOnReflex >= 30);
    } else if (answers.experience === 'newer') {
      workers = workers.filter(w => w.shiftsOnReflex < 30);
    }

    if (answers.style === 'independent') {
      workers = workers.filter(w =>
        w.endorsements.includes('self-starter') || w.workStyle.traits.includes('Self-directed')
      );
    } else if (answers.style === 'collaborative') {
      workers = workers.filter(w => w.endorsements.includes('team-player'));
    }

    if (answers.availability === 'weekends') {
      workers = workers.filter(w => w.availability.weekends);
    }

    // Score workers
    const scored: MatchedWorker[] = workers.map(w => {
      let score = 50;

      // Brand match bonus
      const brandMatches = w.brandsWorked.filter(b => selectedBrands.includes(b.name)).length;
      score += brandMatches * 10;

      // Shifts bonus
      score += Math.min(w.shiftsOnReflex, 50);

      // Reliability bonus
      if (w.onTimeRating === 'Exceptional') score += 15;
      if (w.commitmentScore === 'Exceptional') score += 10;

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
  }, [selectedBrands, answers, selectedLocation]);

  // Get brands the filtered workers have in common
  const commonBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    filteredWorkers.forEach(w => {
      w.brandsWorked.forEach(b => {
        brandCounts[b.name] = (brandCounts[b.name] || 0) + 1;
      });
    });
    return Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
  }, [filteredWorkers]);

  const handleContinue = () => {
    if (step === 'brands' && selectedBrands.length > 0) {
      setStep('questions');
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = step === 'welcome' ? 0 : step === 'brands' ? 25 : step === 'questions' ? 25 + ((currentQuestionIndex + 1) / QUESTIONS.length) * 50 : 100;

  return (
    <div className={`v2-page ${step === 'welcome' ? 'v2-page-welcome' : ''}`}>
      <div className={`v2-page-header-wrapper ${step === 'welcome' ? 'v2-header-welcome' : ''}`}>
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
            className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>
          <button
            className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Connections
          </button>
        </nav>
      </div>

      {activeTab === 'discover' && (
        <div className={`v2-container ${step === 'welcome' ? 'v2-container-welcome' : ''}`}>
          {step === 'welcome' && <div className="gradient-wash" />}
          {/* Main content area */}
          <div className="v2-main">
            {/* Progress bar - hidden on welcome, location, focus, employment, roles */}
            {!['welcome', 'location', 'focus', 'employment', 'roles'].includes(step) && (
            <div className="v2-progress">
              <div className="v2-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            )}

          {/* Step 0: Welcome */}
          {step === 'welcome' && (
            <div className={`v2-welcome-step v2-step-content ${isTransitioning ? (transitionDirection === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}>
              <div className="v2-welcome-illustration">
                <div className="v2-illustration-circle"></div>
                <div className="v2-illustration-cards">
                  <div className="v2-illustration-card v2-illustration-card-1">
                    <div className="v2-card-avatar">
                      <Users size={24} strokeWidth={2} />
                      <div className="v2-avatar-badge"><Sparkles size={14} strokeWidth={2.5} /></div>
                    </div>
                    <div className="v2-card-lines">
                      <div className="v2-card-line v2-card-line-long"></div>
                      <div className="v2-card-line v2-card-line-short"></div>
                    </div>
                  </div>
                  <div className="v2-illustration-card v2-illustration-card-2">
                    <div className="v2-card-avatar">
                      <Users size={24} strokeWidth={2} />
                      <div className="v2-avatar-badge"><ShieldCheck size={14} strokeWidth={2.5} /></div>
                    </div>
                    <div className="v2-card-lines">
                      <div className="v2-card-line v2-card-line-long"></div>
                      <div className="v2-card-line v2-card-line-short"></div>
                    </div>
                  </div>
                  <div className="v2-illustration-card v2-illustration-card-3">
                    <div className="v2-card-avatar">
                      <Users size={24} strokeWidth={2} />
                      <div className="v2-avatar-badge"><Unlock size={14} strokeWidth={2.5} /></div>
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
                Find shift-verified Reflexers with experience at brands you trust.
              </p>
              <button
                className="v2-get-started-btn"
                onClick={() => transitionToStep('location', 'forward')}
              >
                Get started
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Step 1: Location Selection */}
          {step === 'location' && (
            <div className={`v2-location-step v2-step-content ${isTransitioning ? (transitionDirection === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in-right'}`}>
              <div className="v2-step-header">
                <h1 className="type-tagline">First, let's establish what city you're looking to hire in.</h1>
                <p className="type-prompt-question v2-step-subtitle">Select a location or search for a city</p>
              </div>

              <div className="v2-location-controls">
                <div className="v2-location-dropdown">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const store = STORE_LOCATIONS.find(s => s.id === e.target.value);
                        if (store) {
                          setSelectedLocation(store.marketId);
                        }
                      }
                    }}
                    className="v2-location-select"
                  >
                    <option value="">Select a location</option>
                    {STORE_LOCATIONS.map(location => (
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
                      onClick={() => setLocationSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="v2-location-grid">
                {[...MARKETS]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .filter(m => {
                    if (!locationSearch.trim()) return true;
                    const search = locationSearch.toLowerCase();
                    return m.name.toLowerCase().includes(search) || m.state.toLowerCase().includes(search);
                  })
                  .map(market => (
                    <button
                      key={market.id}
                      className={`v2-location-chip ${selectedLocation === market.id ? 'selected' : ''}`}
                      onClick={() => setSelectedLocation(selectedLocation === market.id ? null : market.id)}
                    >
                      <span className="v2-chip-text">{market.name}, <strong>{market.state}</strong></span>
                      <span className="v2-chip-icon">
                        {selectedLocation === market.id && <Check size={14} />}
                      </span>
                    </button>
                  ))}
              </div>

              <div className="v2-location-buttons">
                <button
                  className="v2-btn-back"
                  onClick={() => transitionToStep('welcome', 'back')}
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <button
                  className="v2-btn-next"
                  onClick={() => transitionToStep('focus', 'forward')}
                  disabled={!selectedLocation}
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Focus Area Selection */}
          {step === 'focus' && (
            <div className={`v2-focus-step v2-step-content ${isTransitioning ? (transitionDirection === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in-right'}`}>
              <div className="v2-step-header">
                <h1 className="type-tagline">What's a key area you want to establish for a new hire?</h1>
              </div>

              <div className="v2-focus-chips">
                <button
                  className={`v2-focus-chip ${focusArea === 'employment' ? 'selected' : ''}`}
                  onClick={() => {
                    setFocusArea('employment');
                    transitionToStep('employment', 'forward');
                  }}
                >
                  <span className="v2-focus-chip-title">Type of employment</span>
                  <span className="v2-focus-chip-subtitle">Part-time or Full-time</span>
                </button>
                <button
                  className={`v2-focus-chip ${focusArea === 'brands' ? 'selected' : ''}`}
                  onClick={() => {
                    setFocusArea('brands');
                    transitionToStep('brands', 'forward');
                  }}
                >
                  <span className="v2-focus-chip-title">Previous brand experience</span>
                </button>
                <button
                  className={`v2-focus-chip ${focusArea === 'roles' ? 'selected' : ''}`}
                  onClick={() => {
                    setFocusArea('roles');
                    transitionToStep('roles', 'forward');
                  }}
                >
                  <span className="v2-focus-chip-title">Previous role experience</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2a: Employment Type Selection */}
          {step === 'employment' && (
            <div className={`v2-employment-step v2-step-content ${isTransitioning ? (transitionDirection === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in-right'}`}>
              <div className="v2-step-header">
                <h1 className="type-tagline">What type of employment?</h1>
              </div>

              <div className="v2-employment-chips">
                <button
                  className={`v2-employment-chip ${employmentType === 'full-time' ? 'selected' : ''}`}
                  onClick={() => {
                    setEmploymentType('full-time');
                    transitionToStep('brands', 'forward');
                  }}
                >
                  Full-time
                </button>
                <button
                  className={`v2-employment-chip ${employmentType === 'part-time' ? 'selected' : ''}`}
                  onClick={() => {
                    setEmploymentType('part-time');
                    transitionToStep('brands', 'forward');
                  }}
                >
                  Part-time
                </button>
              </div>
            </div>
          )}

          {/* Step 2b: Role Selection */}
          {step === 'roles' && (
            <div className={`v2-roles-step v2-step-content ${isTransitioning ? (transitionDirection === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in-right'}`}>
              <div className="v2-step-header">
                <h1 className="type-tagline">What role experience are you looking for?</h1>
              </div>

              <div className="v2-role-search-wrapper">
                <div className="v2-search-input-wrapper">
                  <Search size={16} className="v2-search-icon" />
                  <input
                    type="text"
                    placeholder="Type a role..."
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    className="v2-search-input"
                  />
                  {roleSearch && (
                    <button
                      className="v2-search-clear"
                      onClick={() => setRoleSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {roleSearch.trim() && (
                  <button
                    className="v2-role-search-submit"
                    onClick={() => {
                      setSelectedRole(roleSearch.trim());
                      transitionToStep('brands', 'forward');
                    }}
                  >
                    Use "{roleSearch.trim()}"
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>

              <p className="v2-role-divider-text">Or select from below</p>

              <div className="v2-role-categories">
                {Object.entries(JOB_ROLES).map(([key, category]) => (
                  <div key={key} className="v2-role-category">
                    <h3 className="v2-role-category-header">{category.label}</h3>
                    <div className="v2-role-chips">
                      {category.roles.map(role => (
                        <button
                          key={role.title}
                          className={`v2-role-chip ${selectedRole === role.title ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedRole(role.title);
                            transitionToStep('brands', 'forward');
                          }}
                        >
                          {role.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Brand Selection */}
        {step === 'brands' && (
          <div className={`v2-brands-step v2-step-content ${isTransitioning ? (transitionDirection === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in-right'}`}>
            <div className="v2-step-header">
              <h1 className="type-tagline">What brand experience do you trust?</h1>
              <p className="type-prompt-question">
                Select the brands whose talent you would want on your team. We'll show you Reflexers with experience there.
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
                      onClick={() => setBrandSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {brandSearch && (
                  <span className={`v2-search-results ${searchResults && searchResults.length === 0 ? 'no-results' : ''}`}>
                    {searchResults && searchResults.length === 0
                      ? 'No results found'
                      : `${searchResults?.length} brand${searchResults?.length === 1 ? '' : 's'} found`}
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

            <div className={`v2-brand-grid ${!sidebarOpen ? 'expanded' : ''}`}>
              {BRAND_LOGOS.map(brand => (
                <button
                  key={brand.id}
                  ref={(el) => { brandRefs.current[brand.id] = el; }}
                  className={`v2-brand-tile ${selectedBrands.includes(brand.id) ? 'selected' : ''}${searchResults && searchResults.some(r => r.id === brand.id) ? ' search-match' : ''}`}
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

            <div className="v2-step-footer">
              <button
                className="v2-continue-btn"
                disabled={selectedBrands.length === 0}
                onClick={handleContinue}
              >
                Continue
                <ChevronRight size={20} />
              </button>
              {selectedBrands.length > 0 && (
                <span className="v2-selection-count">{selectedBrands.length} selected</span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: This or That Questions */}
        {step === 'questions' && currentQuestion && (
          <div className="v2-questions-step">
            <div className="v2-step-header">
              <span className="v2-question-count">Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
              <h1 className="type-tagline">{currentQuestion.question}</h1>
            </div>

            <div className="v2-this-or-that">
              <button
                className={`v2-choice-btn ${answers[currentQuestion.id] === currentQuestion.optionA.value ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, currentQuestion.optionA.value)}
              >
                <span className="v2-choice-label">{currentQuestion.optionA.label}</span>
                {answers[currentQuestion.id] === currentQuestion.optionA.value && (
                  <Check size={24} className="v2-choice-check" />
                )}
              </button>

              <span className="v2-or-divider">or</span>

              <button
                className={`v2-choice-btn ${answers[currentQuestion.id] === currentQuestion.optionB.value ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, currentQuestion.optionB.value)}
              >
                <span className="v2-choice-label">{currentQuestion.optionB.label}</span>
                {answers[currentQuestion.id] === currentQuestion.optionB.value && (
                  <Check size={24} className="v2-choice-check" />
                )}
              </button>
            </div>

            <div className="v2-question-dots">
              {QUESTIONS.map((q, idx) => (
                <span
                  key={q.id}
                  className={`v2-dot ${idx === currentQuestionIndex ? 'active' : ''} ${idx < currentQuestionIndex ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="v2-results-step">
            <div className="v2-step-header">
              <div className="v2-results-icon">
                <Sparkles size={32} />
              </div>
              <h1 className="type-tagline">Meet your matches</h1>
              <p className="v2-step-subtitle">
                {filteredWorkers.length} Reflexers match your criteria. Connect to learn more or book a shift.
              </p>
            </div>

            {commonBrands.length > 0 && (
              <div className="v2-common-brands">
                <span className="v2-common-brands-label">Experience at:</span>
                <div className="v2-common-brands-list">
                  {commonBrands.map(brand => (
                    <span key={brand} className="pill pill-stroke pill-sm">
                      <span className="pill-text">{brand}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="v2-results-actions">
              <button className="v2-action-btn v2-action-primary">
                Connect with all {filteredWorkers.length}
              </button>
              <button className="v2-action-btn v2-action-secondary" onClick={() => {
                setStep('brands');
                setCurrentQuestionIndex(0);
                setAnswers({});
                setSelectedBrands([]);
              }}>
                Start over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar with worker cards - hidden on welcome, shown on location when city selected */}
      {(step !== 'welcome' && (step !== 'location' || selectedLocation)) && (
      <div className={`v2-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <button
          className="v2-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close panel' : 'Open panel'}
        >
          {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="v2-sidebar-header">
          <h2 className="type-section-header-md">
            {step === 'location' && selectedLocation && `${MARKETS.find(m => m.id === selectedLocation)?.name} Reflexers`}
            {step === 'focus' && 'All Reflexers'}
            {step === 'employment' && 'All Reflexers'}
            {step === 'roles' && 'All Reflexers'}
            {step === 'brands' && 'Shift Verified Reflexers'}
            {step === 'questions' && 'Matching talent'}
            {step === 'results' && `${filteredWorkers.length} matches`}
          </h2>
          {filteredWorkers.length > 0 && step !== 'results' && (
            <span className="v2-sidebar-count">{filteredWorkers.length} found</span>
          )}
        </div>

        <div className="v2-sidebar-cards">
          {filteredWorkers.length === 0 ? (
            <div className="v2-no-matches">
              <p>No matches yet. Try selecting different brands or criteria.</p>
            </div>
          ) : (
            filteredWorkers.map(worker => (
              <WorkerCardTeaser
                key={worker.id}
                worker={worker}
                onClick={() => {/* TODO: open full card */}}
              />
            ))
          )}
        </div>
      </div>
      )}
    </div>
      )}

      {activeTab === 'saved' && (
        <div className="tab-empty-state">
          <div className="empty-state-content">
            <Heart size={32} strokeWidth={1.5} />
            <p>No saved workers yet</p>
          </div>
        </div>
      )}

      {activeTab === 'connected' && (
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

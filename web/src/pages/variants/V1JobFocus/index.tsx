import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, FileText, Pencil, X, Plus, ChevronDown, Search, ChevronLeft, ChevronRight, Check, Info, Loader2, Clipboard, CircleMinus } from 'lucide-react';
import { ChatInterface } from '../../../components/Chat';
import { ScrapeModal, type ScrapeConfig } from '../../../components/ScrapeModal';
import { ScrapeProgressModal, type ScrapeProgressData } from '../../../components/ScrapeProgressModal';
import { UnmatchedRolesModal } from '../../../components/UnmatchedRolesModal';
import { WorkerCardCompact, WorkerCardFull } from '../../../components/Workers';
import { GeminiService } from '../../../services/gemini';
import { matchWorkers } from '../../../services/workerMatching';
import {
  fetchMarkets,
  fetchRoles,
  fetchRetailers,
  fetchRetailersLive,
  fetchJobPostings,
  fetchPublishedJobs,
  createPublishedJob,
  syncMarkets,
  syncRoles,
  syncRetailers,
  saveScrapedJobs,
  addRole,
  addKeywordToRole,
  type Market,
  type Role,
  type Retailer,
  type RetailerLive,
  type ScrapedJob,
  type JobPosting,
} from '../../../services/supabase';
import { fetchWorkersAsProfiles, fetchWorkersByMarketAsProfiles } from '../../../services/supabase';
import { SAMPLE_RETAILER } from '../../../data/retailer';
import type { ChatMessage, MatchedWorker, JobSpec, PublishedJob } from '../../../types';
import { PublishedJobCard } from '../../../components/Jobs';
import './styles.css';

/** Map UI messages to Gemini `startChat` history (user/model turns). */
function chatMessagesToGeminiHistory(
  msgs: ChatMessage[]
): { role: 'user' | 'model'; content: string }[] {
  return msgs.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    content: m.content,
  }));
}

type TabId = 'ask-reflex' | 'published-jobs' | 'reflex-talent' | 'oz';

// Names for the greeting - shared with ChatInterface
const GREETING_NAMES = [
  'Mike', 'Trevor', 'Shannon', 'Nate', 'Micah', 'Katherine', 'Cayley',
  'Evan', 'Juan', 'Julie', 'Ashlee', 'Jeremy', 'Sam', 'Jasmine',
  'Emily', 'Olivia', 'Mary', 'Hans', 'Hadley', 'Leigh Ann',
];
const getRandomUserName = () => GREETING_NAMES[Math.floor(Math.random() * GREETING_NAMES.length)];

// All job roles flattened for the Oz admin
const ALL_ROLES = [
  // Sales Floor
  'Sales Associate / Retail Associate',
  'Store Associate',
  'Brand Representative',
  // Sales Support
  'Sales Assistant',
  'Cashier',
  'Fitting Room Attendant',
  'Team Member',
  'Retail Customer Service',
  // Back of House
  'Stock Associate / Stocker',
  'Inventory Associate',
  'Operations Associate',
  // Specialized
  'Beauty Advisor / Cosmetics Associate',
  'Stylist',
  'Visual Merchandiser',
  'Pop Up',
  // Management
  'Store Team Leader',
  'Supervisor',
  'Key Holder / Lead Associate',
  'Department Supervisor',
  'Assistant Store Manager',
  'Store Manager',
  'District / Area Manager',
];

// Job roles by category with descriptions
const JOB_ROLES = {
  salesFloor: [
    { title: 'Sales Associate / Retail Associate', description: 'Customer service, sales floor support, POS transactions' },
    { title: 'Store Associate', description: 'General sales floor support and customer assistance' },
    { title: 'Brand Representative', description: 'Brand ambassador, product expertise, customer engagement' },
  ],
  salesSupport: [
    { title: 'Sales Assistant', description: 'Support sales team, customer service backup' },
    { title: 'Cashier', description: 'Checkout operations, handling payments' },
    { title: 'Fitting Room Attendant', description: 'Managing dressing rooms, returning items to floor' },
    { title: 'Team Member', description: 'General retail support, multi-functional role' },
    { title: 'Retail Customer Service', description: 'Customer inquiries, returns, service desk' },
  ],
  backOfHouse: [
    { title: 'Stock Associate / Stocker', description: 'Receiving, organizing, replenishing inventory' },
    { title: 'Inventory Associate', description: 'Inventory management, cycle counts, stock accuracy' },
    { title: 'Operations Associate', description: 'Store operations, logistics, back-office support' },
  ],
  specialized: [
    { title: 'Beauty Advisor / Cosmetics Associate', description: 'Product expertise, demos (Sephora, Ulta, department stores)' },
    { title: 'Stylist', description: 'Personal styling, outfit consultation, clienteling' },
    { title: 'Visual Merchandiser', description: 'Displays, store layout, product presentation' },
    { title: 'Pop Up', description: 'Temporary retail events, brand activations' },
  ],
  management: [
    { title: 'Store Team Leader', description: 'Team leadership, shift coordination' },
    { title: 'Supervisor', description: 'Floor supervision, team oversight' },
    { title: 'Key Holder / Lead Associate', description: 'Opening/closing, shift supervision' },
    { title: 'Department Supervisor', description: 'Oversees specific section (shoes, menswear, etc.)' },
    { title: 'Assistant Store Manager', description: 'Operations support, staff scheduling' },
    { title: 'Store Manager', description: 'Full P&L responsibility, hiring, performance' },
    { title: 'District / Area Manager', description: 'Multi-store oversight' },
  ],
};

// Retailers by classification
const RETAILERS: { name: string; classification: 'Luxury' | 'Specialty' | 'Big Box' }[] = [
  // Luxury
  { name: '7 For All Mankind', classification: 'Luxury' },
  { name: 'Aerin', classification: 'Luxury' },
  { name: 'AG Jeans', classification: 'Luxury' },
  { name: 'ALEX AND ANI', classification: 'Luxury' },
  { name: 'Alice + Olivia', classification: 'Luxury' },
  { name: 'Allsaints', classification: 'Luxury' },
  { name: 'Anne Fontaine', classification: 'Luxury' },
  { name: 'Anvil+Aura', classification: 'Luxury' },
  { name: 'Ariat', classification: 'Luxury' },
  { name: 'Aritzia', classification: 'Luxury' },
  { name: 'Armani', classification: 'Luxury' },
  { name: 'Armani Exchange', classification: 'Luxury' },
  { name: 'Armani Jeans', classification: 'Luxury' },
  { name: 'Avara', classification: 'Luxury' },
  { name: 'Aviator Nation', classification: 'Luxury' },
  { name: 'Balmain', classification: 'Luxury' },
  { name: 'BCBGMaxazria', classification: 'Luxury' },
  { name: 'Bebe', classification: 'Luxury' },
  { name: 'Billy Reid', classification: 'Luxury' },
  { name: 'Bloomingdale\'s', classification: 'Luxury' },
  { name: 'Bonobos', classification: 'Luxury' },
  { name: 'Bottega Veneta', classification: 'Luxury' },
  { name: 'Brooks Brothers', classification: 'Luxury' },
  { name: 'Brookstone', classification: 'Luxury' },
  { name: 'Brunello Cucinelli', classification: 'Luxury' },
  { name: 'Buck Mason', classification: 'Luxury' },
  { name: 'Burberry', classification: 'Luxury' },
  { name: 'ByGeorge', classification: 'Luxury' },
  { name: 'Calvin Klein', classification: 'Luxury' },
  { name: 'Canada Goose', classification: 'Luxury' },
  { name: 'Carolina Herrera', classification: 'Luxury' },
  { name: 'Cartier', classification: 'Luxury' },
  { name: 'Celine', classification: 'Luxury' },
  { name: 'Chanel', classification: 'Luxury' },
  { name: 'Chloe', classification: 'Luxury' },
  { name: 'Christian Louboutin', classification: 'Luxury' },
  { name: 'Club Monaco', classification: 'Luxury' },
  { name: 'Cole Haan', classification: 'Luxury' },
  { name: 'COS', classification: 'Luxury' },
  { name: 'David Yurman', classification: 'Luxury' },
  { name: 'Desigual', classification: 'Luxury' },
  { name: 'Diesel', classification: 'Luxury' },
  { name: 'Dior', classification: 'Luxury' },
  { name: 'Dolce & Gabbana', classification: 'Luxury' },
  { name: 'Draper James', classification: 'Luxury' },
  { name: 'DVF', classification: 'Luxury' },
  { name: 'Eberjey', classification: 'Luxury' },
  { name: 'Eileen Fisher', classification: 'Luxury' },
  { name: 'Elie Tahari', classification: 'Luxury' },
  { name: 'Equinox', classification: 'Luxury' },
  { name: 'Estee Lauder', classification: 'Luxury' },
  { name: 'Evereve', classification: 'Luxury' },
  { name: 'Faherty', classification: 'Luxury' },
  { name: 'Fendi', classification: 'Luxury' },
  { name: 'Ferragamo', classification: 'Luxury' },
  { name: 'Filson', classification: 'Luxury' },
  { name: 'FORLOH', classification: 'Luxury' },
  { name: 'Frederic Malle', classification: 'Luxury' },
  { name: 'Free People', classification: 'Luxury' },
  { name: 'Free People Movement', classification: 'Luxury' },
  { name: 'Frye', classification: 'Luxury' },
  { name: 'Ganni', classification: 'Luxury' },
  { name: 'Giorgio Armani', classification: 'Luxury' },
  { name: 'Givenchy', classification: 'Luxury' },
  { name: 'Glamglow', classification: 'Luxury' },
  { name: 'Golden Goose', classification: 'Luxury' },
  { name: 'Gucci', classification: 'Luxury' },
  { name: 'GUESS', classification: 'Luxury' },
  { name: 'harpersage', classification: 'Luxury' },
  { name: 'Hermes', classification: 'Luxury' },
  { name: 'Hublot', classification: 'Luxury' },
  { name: 'HUGO BOSS', classification: 'Luxury' },
  { name: 'Indochino', classification: 'Luxury' },
  { name: 'J. Crew', classification: 'Luxury' },
  { name: 'Jo Malone', classification: 'Luxury' },
  { name: 'Johnny Was', classification: 'Luxury' },
  { name: 'Julian Gold', classification: 'Luxury' },
  { name: 'Kick Pleat', classification: 'Luxury' },
  { name: 'Lacoste', classification: 'Luxury' },
  { name: 'Le Labo', classification: 'Luxury' },
  { name: 'League of Rebels', classification: 'Luxury' },
  { name: 'Lego', classification: 'Luxury' },
  { name: 'Lilly Pulitzer', classification: 'Luxury' },
  { name: 'L\'Occitane', classification: 'Luxury' },
  { name: 'Longchamp', classification: 'Luxury' },
  { name: 'Louis Vuitton', classification: 'Luxury' },
  { name: 'Lucchese', classification: 'Luxury' },
  { name: 'MAARIBU', classification: 'Luxury' },
  { name: 'Mackage', classification: 'Luxury' },
  { name: 'Maje', classification: 'Luxury' },
  { name: 'Marc Jacobs', classification: 'Luxury' },
  { name: 'Marine Layer', classification: 'Luxury' },
  { name: 'Marissa Webb', classification: 'Luxury' },
  { name: 'Mavi Jeans', classification: 'Luxury' },
  { name: 'MCM', classification: 'Luxury' },
  { name: 'ME+EM', classification: 'Luxury' },
  { name: 'Michael Kors', classification: 'Luxury' },
  { name: 'Miumiu', classification: 'Luxury' },
  { name: 'Mizzen+Main', classification: 'Luxury' },
  { name: 'Moncler', classification: 'Luxury' },
  { name: 'MontBlanc', classification: 'Luxury' },
  { name: 'Nicole Miller', classification: 'Luxury' },
  { name: 'Nili Lotan', classification: 'Luxury' },
  { name: 'Oliver Peoples', classification: 'Luxury' },
  { name: 'Origins', classification: 'Luxury' },
  { name: 'Outdoor Voices', classification: 'Luxury' },
  { name: 'Paige', classification: 'Luxury' },
  { name: 'Parachute', classification: 'Luxury' },
  { name: 'Peloton', classification: 'Luxury' },
  { name: 'Peter Millar', classification: 'Luxury' },
  { name: 'Prada', classification: 'Luxury' },
  { name: 'Rag & Bone', classification: 'Luxury' },
  { name: 'Ralph Lauren', classification: 'Luxury' },
  { name: 'Reiss', classification: 'Luxury' },
  { name: 'Rhone', classification: 'Luxury' },
  { name: 'Robert Graham', classification: 'Luxury' },
  { name: 'Roberto Cavalli', classification: 'Luxury' },
  { name: 'Room and Board', classification: 'Luxury' },
  { name: 'Rothy\'s', classification: 'Luxury' },
  { name: 'Sabah Shoes', classification: 'Luxury' },
  { name: 'Saks Fifth Avenue', classification: 'Luxury' },
  { name: 'Sandro', classification: 'Luxury' },
  { name: 'Scotch and Soda', classification: 'Luxury' },
  { name: 'Sezane', classification: 'Luxury' },
  { name: 'Shinola', classification: 'Luxury' },
  { name: 'Showfields', classification: 'Luxury' },
  { name: 'Smashbox', classification: 'Luxury' },
  { name: 'Soludos', classification: 'Luxury' },
  { name: 'St. John', classification: 'Luxury' },
  { name: 'Stuart Weitzman', classification: 'Luxury' },
  { name: 'Tecovas', classification: 'Luxury' },
  { name: 'Ted Baker', classification: 'Luxury' },
  { name: 'The Store', classification: 'Luxury' },
  { name: 'Theory', classification: 'Luxury' },
  { name: 'Tiffany & Co', classification: 'Luxury' },
  { name: 'Tom Ford', classification: 'Luxury' },
  { name: 'Tommy Bahama', classification: 'Luxury' },
  { name: 'Tommy Hilfiger', classification: 'Luxury' },
  { name: 'Tory Burch', classification: 'Luxury' },
  { name: 'Tourneau', classification: 'Luxury' },
  { name: 'Travis Mathew', classification: 'Luxury' },
  { name: 'Tumi', classification: 'Luxury' },
  { name: 'Unbridaled', classification: 'Luxury' },
  { name: 'Untuckit', classification: 'Luxury' },
  { name: 'Valentino', classification: 'Luxury' },
  { name: 'Vera Wang', classification: 'Luxury' },
  { name: 'Versace', classification: 'Luxury' },
  { name: 'Vilebrequin', classification: 'Luxury' },
  { name: 'Vince', classification: 'Luxury' },
  { name: 'Warby Parker', classification: 'Luxury' },
  { name: 'Williams-Sonoma', classification: 'Luxury' },
  { name: 'Y-3', classification: 'Luxury' },
  { name: 'Yonex', classification: 'Luxury' },
  { name: 'Zadig & Voltaire', classification: 'Luxury' },
  // Specialty
  { name: 'Abercrombie & Fitch', classification: 'Specialty' },
  { name: 'Adidas', classification: 'Specialty' },
  { name: 'Aerie', classification: 'Specialty' },
  { name: 'Aeropostale', classification: 'Specialty' },
  { name: 'Aldo', classification: 'Specialty' },
  { name: 'Allbirds', classification: 'Specialty' },
  { name: 'Alo Yoga', classification: 'Specialty' },
  { name: 'Altar\'d State', classification: 'Specialty' },
  { name: 'American Eagle', classification: 'Specialty' },
  { name: 'Ann Taylor', classification: 'Specialty' },
  { name: 'Anthropologie', classification: 'Specialty' },
  { name: 'Apple', classification: 'Specialty' },
  { name: 'Athleta', classification: 'Specialty' },
  { name: 'Aveda', classification: 'Specialty' },
  { name: 'Banana Republic', classification: 'Specialty' },
  { name: 'Bare Minerals', classification: 'Specialty' },
  { name: 'Bath & Body Works', classification: 'Specialty' },
  { name: 'Belk', classification: 'Specialty' },
  { name: 'Beyond Yoga', classification: 'Specialty' },
  { name: 'Bobbi Brown', classification: 'Specialty' },
  { name: 'Brighton', classification: 'Specialty' },
  { name: 'Buckle', classification: 'Specialty' },
  { name: 'Buffalo Exchange', classification: 'Specialty' },
  { name: 'Build-A-Bear Workshop', classification: 'Specialty' },
  { name: 'Burlington', classification: 'Specialty' },
  { name: 'Carter\'s', classification: 'Specialty' },
  { name: 'Cato', classification: 'Specialty' },
  { name: 'Cavender\'s', classification: 'Specialty' },
  { name: 'Charlotte Russe', classification: 'Specialty' },
  { name: 'Chico\'s', classification: 'Specialty' },
  { name: 'Claire\'s', classification: 'Specialty' },
  { name: 'Clarks', classification: 'Specialty' },
  { name: 'Clinique', classification: 'Specialty' },
  { name: 'Coach', classification: 'Specialty' },
  { name: 'Columbia', classification: 'Specialty' },
  { name: 'Converse', classification: 'Specialty' },
  { name: 'Cotton On', classification: 'Specialty' },
  { name: 'Crate & Barrel', classification: 'Specialty' },
  { name: 'Crocs', classification: 'Specialty' },
  { name: 'David\'s Bridal', classification: 'Specialty' },
  { name: 'Dillard\'s', classification: 'Specialty' },
  { name: 'DKNY', classification: 'Specialty' },
  { name: 'DSW', classification: 'Specialty' },
  { name: 'Easy Spirit', classification: 'Specialty' },
  { name: 'Ecco', classification: 'Specialty' },
  { name: 'Eddie Bauer', classification: 'Specialty' },
  { name: 'Everlane', classification: 'Specialty' },
  { name: 'Express', classification: 'Specialty' },
  { name: 'Fabletics', classification: 'Specialty' },
  { name: 'Finish Line', classification: 'Specialty' },
  { name: 'Foot Locker', classification: 'Specialty' },
  { name: 'Forever 21', classification: 'Specialty' },
  { name: 'Fossil', classification: 'Specialty' },
  { name: 'Francesca\'s', classification: 'Specialty' },
  { name: 'Gap', classification: 'Specialty' },
  { name: 'Glossier', classification: 'Specialty' },
  { name: 'Gorjana', classification: 'Specialty' },
  { name: 'H&M', classification: 'Specialty' },
  { name: 'Hallmark', classification: 'Specialty' },
  { name: 'Hobby Lobby', classification: 'Specialty' },
  { name: 'Hollister', classification: 'Specialty' },
  { name: 'Hot Topic', classification: 'Specialty' },
  { name: 'J. Crew Factory', classification: 'Specialty' },
  { name: 'J. Jill', classification: 'Specialty' },
  { name: 'James Avery', classification: 'Specialty' },
  { name: 'Janie and Jack', classification: 'Specialty' },
  { name: 'Jared Jewelry', classification: 'Specialty' },
  { name: 'JCPenney', classification: 'Specialty' },
  { name: 'Johnston & Murphy', classification: 'Specialty' },
  { name: 'Jos. A. Bank', classification: 'Specialty' },
  { name: 'Journey\'s', classification: 'Specialty' },
  { name: 'Justice', classification: 'Specialty' },
  { name: 'Kate Spade', classification: 'Specialty' },
  { name: 'Kendra Scott', classification: 'Specialty' },
  { name: 'L.L.Bean', classification: 'Specialty' },
  { name: 'La Mer', classification: 'Specialty' },
  { name: 'Lane Bryant', classification: 'Specialty' },
  { name: 'LensCrafters', classification: 'Specialty' },
  { name: 'Levi\'s', classification: 'Specialty' },
  { name: 'Lids', classification: 'Specialty' },
  { name: 'LOFT', classification: 'Specialty' },
  { name: 'Lord & Taylor', classification: 'Specialty' },
  { name: 'Lucky Brand', classification: 'Specialty' },
  { name: 'Lululemon', classification: 'Specialty' },
  { name: 'LUSH Cosmetics', classification: 'Specialty' },
  { name: 'MAC Cosmetics', classification: 'Specialty' },
  { name: 'Macy\'s', classification: 'Specialty' },
  { name: 'Madewell', classification: 'Specialty' },
  { name: 'Mango', classification: 'Specialty' },
  { name: 'Maurices', classification: 'Specialty' },
  { name: 'Men\'s Wearhouse', classification: 'Specialty' },
  { name: 'Neiman Marcus', classification: 'Specialty' },
  { name: 'New Balance', classification: 'Specialty' },
  { name: 'New York & Company', classification: 'Specialty' },
  { name: 'Nike', classification: 'Specialty' },
  { name: 'Nordstrom', classification: 'Specialty' },
  { name: 'Nordstrom Rack', classification: 'Specialty' },
  { name: 'North Face', classification: 'Specialty' },
  { name: 'Oakley', classification: 'Specialty' },
  { name: 'Old Navy', classification: 'Specialty' },
  { name: 'OshKosh B\'gosh', classification: 'Specialty' },
  { name: 'PacSun', classification: 'Specialty' },
  { name: 'Pandora', classification: 'Specialty' },
  { name: 'Patagonia', classification: 'Specialty' },
  { name: 'Perry Ellis', classification: 'Specialty' },
  { name: 'PINK', classification: 'Specialty' },
  { name: 'Plato\'s Closet', classification: 'Specialty' },
  { name: 'Pottery Barn', classification: 'Specialty' },
  { name: 'Puma', classification: 'Specialty' },
  { name: 'Quay', classification: 'Specialty' },
  { name: 'Ray Ban', classification: 'Specialty' },
  { name: 'Reebok', classification: 'Specialty' },
  { name: 'Reformation', classification: 'Specialty' },
  { name: 'REI', classification: 'Specialty' },
  { name: 'Restoration Hardware', classification: 'Specialty' },
  { name: 'Rue 21', classification: 'Specialty' },
  { name: 'Sally Beauty', classification: 'Specialty' },
  { name: 'Sephora', classification: 'Specialty' },
  { name: 'Shoe Carnival', classification: 'Specialty' },
  { name: 'Skechers', classification: 'Specialty' },
  { name: 'SKIMS', classification: 'Specialty' },
  { name: 'Soma', classification: 'Specialty' },
  { name: 'Sperry', classification: 'Specialty' },
  { name: 'Steve Madden', classification: 'Specialty' },
  { name: 'Stitch Fix', classification: 'Specialty' },
  { name: 'Sunglass Hut', classification: 'Specialty' },
  { name: 'Swarovski', classification: 'Specialty' },
  { name: 'Talbots', classification: 'Specialty' },
  { name: 'The Children\'s Place', classification: 'Specialty' },
  { name: 'The Container Store', classification: 'Specialty' },
  { name: 'The RealReal', classification: 'Specialty' },
  { name: 'Tilly\'s', classification: 'Specialty' },
  { name: 'Timberland', classification: 'Specialty' },
  { name: 'Tommy John', classification: 'Specialty' },
  { name: 'Too Faced Cosmetics', classification: 'Specialty' },
  { name: 'True Religion Apparel', classification: 'Specialty' },
  { name: 'UGG', classification: 'Specialty' },
  { name: 'Ulta Beauty', classification: 'Specialty' },
  { name: 'Under Armour', classification: 'Specialty' },
  { name: 'UNIQLO', classification: 'Specialty' },
  { name: 'Urban Outfitters', classification: 'Specialty' },
  { name: 'Vans', classification: 'Specialty' },
  { name: 'Vera Bradley', classification: 'Specialty' },
  { name: 'Victoria\'s Secret', classification: 'Specialty' },
  { name: 'Vineyard Vines', classification: 'Specialty' },
  { name: 'Vuori', classification: 'Specialty' },
  { name: 'White House Black Market', classification: 'Specialty' },
  { name: 'World Market', classification: 'Specialty' },
  { name: 'Yankee Candle', classification: 'Specialty' },
  { name: 'Zara', classification: 'Specialty' },
  { name: 'Zumiez', classification: 'Specialty' },
  // Big Box
  { name: 'Academy Sports + Outdoors', classification: 'Big Box' },
  { name: 'Amazon', classification: 'Big Box' },
  { name: 'Barnes and Noble', classification: 'Big Box' },
  { name: 'Bass Pro Shops', classification: 'Big Box' },
  { name: 'Bed Bath & Beyond', classification: 'Big Box' },
  { name: 'Best Buy', classification: 'Big Box' },
  { name: 'Big Lots', classification: 'Big Box' },
  { name: 'BJ\'s Wholesale Club', classification: 'Big Box' },
  { name: 'Boot Barn', classification: 'Big Box' },
  { name: 'Cabela\'s', classification: 'Big Box' },
  { name: 'Champs Sports', classification: 'Big Box' },
  { name: 'Costco', classification: 'Big Box' },
  { name: 'Dick\'s Sporting Goods', classification: 'Big Box' },
  { name: 'Disney Store', classification: 'Big Box' },
  { name: 'Dollar General', classification: 'Big Box' },
  { name: 'Family Dollar', classification: 'Big Box' },
  { name: 'Famous Footwear', classification: 'Big Box' },
  { name: 'Five Below', classification: 'Big Box' },
  { name: 'GameStop', classification: 'Big Box' },
  { name: 'GNC', classification: 'Big Box' },
  { name: 'Goodwill', classification: 'Big Box' },
  { name: 'Home Depot', classification: 'Big Box' },
  { name: 'HomeGoods', classification: 'Big Box' },
  { name: 'Kay Jewelers', classification: 'Big Box' },
  { name: 'Kirkland\'s', classification: 'Big Box' },
  { name: 'Kohl\'s', classification: 'Big Box' },
  { name: 'Kroger', classification: 'Big Box' },
  { name: 'Linens N Things', classification: 'Big Box' },
  { name: 'Lowes', classification: 'Big Box' },
  { name: 'Marshalls', classification: 'Big Box' },
  { name: 'Michaels', classification: 'Big Box' },
  { name: 'Party City', classification: 'Big Box' },
  { name: 'Payless', classification: 'Big Box' },
  { name: 'Pier 1 Imports', classification: 'Big Box' },
  { name: 'Ross', classification: 'Big Box' },
  { name: 'Sears', classification: 'Big Box' },
  { name: 'Spencer\'s', classification: 'Big Box' },
  { name: 'Spirit Halloween', classification: 'Big Box' },
  { name: 'Staples', classification: 'Big Box' },
  { name: 'Target', classification: 'Big Box' },
  { name: 'Thrift Giant', classification: 'Big Box' },
  { name: 'TJ Maxx', classification: 'Big Box' },
  { name: 'Trader Joe\'s', classification: 'Big Box' },
  { name: 'Walgreens', classification: 'Big Box' },
  { name: 'Walmart', classification: 'Big Box' },
  { name: 'Whole Foods', classification: 'Big Box' },
  { name: 'Zales', classification: 'Big Box' },
];

// All available markets - sorted by state then city
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
  // DC
  { id: 'washington-dc', name: 'Washington', state: 'DC' },
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


const JOB_SITES = {
  general: [
    { name: 'Indeed', description: 'Largest job board, strong for hourly/retail roles, salary data' },
    { name: 'Glassdoor', description: 'Job listings with company reviews and salary data', protected: true },
    { name: 'ZipRecruiter', description: 'AI matching, good retail coverage', protected: true },
    { name: 'LinkedIn', description: 'Better for management/supervisor roles', protected: true },
    { name: 'CareerBuilder', description: 'General board with retail category' },
  ],
  retailSpecific: [
    { name: 'AllRetailJobs.com', description: 'Dedicated retail job board' },
    { name: 'RetailJobsWeb.com', description: 'Retail-focused, management + hourly' },
    { name: 'RetailCareersNow', description: 'Retail industry specific' },
  ],
};

// Filter dropdown component with search and multi-select
interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (values: string[]) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

function FilterDropdown({ label, options, selected, onSelect, searchValue, onSearchChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onSelect(selected.filter(v => v !== value));
    } else {
      onSelect([...selected, value]);
    }
    setIsOpen(false);
  };

  const handleShowAll = () => {
    onSelect([]);
    setIsOpen(false);
  };

  const displayText = selected.length === 0 ? 'Show All' : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className="oz-filter" ref={dropdownRef}>
      <label className="oz-filter-label">{label}</label>
      <button
        className="oz-filter-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="oz-filter-text">{displayText}</span>
        <ChevronDown size={16} className={`oz-filter-chevron ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="oz-filter-dropdown">
          <div className="oz-filter-dropdown-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
            />
            {searchValue && (
              <button onClick={() => onSearchChange('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="oz-filter-dropdown-options">
            <button
              className={`oz-filter-option ${selected.length === 0 ? 'selected' : ''}`}
              onClick={handleShowAll}
            >
              <span className="oz-filter-option-check">
                {selected.length === 0 && <Check size={14} />}
              </span>
              Show All
            </button>
            {filteredOptions.map(option => (
              <button
                key={option}
                className={`oz-filter-option ${selected.includes(option) ? 'selected' : ''}`}
                onClick={() => handleToggle(option)}
              >
                <span className="oz-filter-option-check">
                  {selected.includes(option) && <Check size={14} />}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRetailerDisplayName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/\s*([+&])\s*/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    .split(' ')
    .map(part => {
      if (part === '+' || part === '&') return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

import type { VariantProps } from '../../PermanentHiring';

export function V1JobFocus({ agentActive, showOz: _showOz }: VariantProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ask-reflex');

  const [showJobSitesInfo, setShowJobSitesInfo] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);

  // Oz tab state - data from Supabase
  const jobSitesInfoRef = useRef<HTMLDivElement>(null);
  const [ozMarkets, setOzMarkets] = useState<{ id?: string; name: string; state: string }[]>([]);
  const [ozRoles, setOzRoles] = useState<{ id?: string; title: string; category?: string; match_keywords?: string[] | null }[]>([]);
  const [ozRetailers, setOzRetailers] = useState<{ id?: string; name: string; classification: 'Luxury' | 'Specialty' | 'Big Box'; created_at?: string; updated_at?: string }[]>([]);
  const [newMarketState, setNewMarketState] = useState('');

  // Loading and saving states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Backup state for edit cancellation
  const [backupMarkets, setBackupMarkets] = useState<typeof ozMarkets | null>(null);
  const [backupRoles, setBackupRoles] = useState<typeof ozRoles | null>(null);
  const [backupRetailers, setBackupRetailers] = useState<typeof ozRetailers | null>(null);

  // Retailers Live (from Supabase retailers_live table)
  const [retailersLive, setRetailersLive] = useState<RetailerLive[]>([]);

  // Reflex Talent tab state - lazy loading
  const [talentDisplayCount, setTalentDisplayCount] = useState(6);
  const talentLoadMoreRef = useRef<HTMLDivElement>(null);
  const [allTalentWorkers, setAllTalentWorkers] = useState<MatchedWorker[]>([]);
  const [_workersLoading, setWorkersLoading] = useState(true);
  const [selectedTalentWorker, setSelectedTalentWorker] = useState<MatchedWorker | null>(null);
  const workerCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [talentMarketFilter, setTalentMarketFilter] = useState('Austin');

  // Fetch data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [marketsData, rolesData, retailersData, retailersLiveData] = await Promise.all([
          fetchMarkets(),
          fetchRoles(),
          fetchRetailers(),
          fetchRetailersLive(),
        ]);

        // Transform markets data
        setOzMarkets(marketsData.map((m: Market) => ({
          id: m.id,
          name: m.name,
          state: m.state,
        })));

        // Transform roles data
        setOzRoles(rolesData.map((r: Role) => ({
          id: r.id,
          title: r.title,
          category: r.category,
        })));

        // Transform retailers data
        setOzRetailers(retailersData.map((r: Retailer) => ({
          id: r.id,
          name: r.name,
          classification: r.classification,
        })));

        // Set retailers live data
        setRetailersLive(retailersLiveData);

        // Workers are now fetched separately by market filter
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
        // Fall back to local data
        setOzMarkets(MARKETS.map(m => ({ name: m.name, state: m.state })));
        setOzRoles(ALL_ROLES.map(r => ({ title: r })));
        setOzRetailers(RETAILERS);
      }
      setIsLoadingData(false);
    }
    loadData();
  }, []);

  // Group ozMarkets by state for display
  const ozMarketsByState = useMemo(() => {
    const grouped = ozMarkets.reduce((acc, market) => {
      if (!acc[market.state]) acc[market.state] = [];
      acc[market.state].push(market.name);
      return acc;
    }, {} as Record<string, string[]>);
    return grouped;
  }, [ozMarkets]);

  const ozSortedStates = useMemo(() => Object.keys(ozMarketsByState).sort(), [ozMarketsByState]);
  const [editingSection, setEditingSection] = useState<'markets' | 'roles' | 'retailers' | null>(null);
  const [newItemInput, setNewItemInput] = useState('');
  const [newRetailerClass, setNewRetailerClass] = useState<'Luxury' | 'Specialty' | 'Big Box'>('Specialty');
  const [newRoleCategory, setNewRoleCategory] = useState<'Sales Floor' | 'Sales Support' | 'Back of House' | 'Specialized' | 'Management'>('Sales Floor');

  // Search state for each section
  const [marketsSearch, setMarketsSearch] = useState('');
  const [marketsMatchIndex, setMarketsMatchIndex] = useState(0);
  const [rolesSearch, setRolesSearch] = useState('');
  const [rolesMatchIndex, setRolesMatchIndex] = useState(0);
  const [retailersSearch, setRetailersSearch] = useState('');
  const [retailersMatchIndex, setRetailersMatchIndex] = useState(0);

  // Compute matches for each section
  const marketsMatches = useMemo(() => {
    if (!marketsSearch.trim()) return [];
    const search = marketsSearch.toLowerCase();
    return ozMarkets
      .map((m, idx) => ({ ...m, idx }))
      .filter(m => m.name.toLowerCase().includes(search) || m.state.toLowerCase().includes(search));
  }, [ozMarkets, marketsSearch]);

  const rolesMatches = useMemo(() => {
    if (!rolesSearch.trim()) return [];
    const search = rolesSearch.toLowerCase();
    return ozRoles
      .map((r, idx) => ({ ...r, idx }))
      .filter(r => r.title.toLowerCase().includes(search));
  }, [ozRoles, rolesSearch]);

  const retailersMatches = useMemo(() => {
    if (!retailersSearch.trim()) return [];
    const search = retailersSearch.toLowerCase();
    return ozRetailers
      .map((r, idx) => ({ ...r, idx }))
      .filter(r => r.name.toLowerCase().includes(search));
  }, [ozRetailers, retailersSearch]);

  // Reset match index when search changes
  useEffect(() => { setMarketsMatchIndex(0); }, [marketsSearch]);
  useEffect(() => { setRolesMatchIndex(0); }, [rolesSearch]);
  useEffect(() => { setRetailersMatchIndex(0); }, [retailersSearch]);

  // Close job sites info bubble when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (jobSitesInfoRef.current && !jobSitesInfoRef.current.contains(event.target as Node)) {
        setShowJobSitesInfo(false);
      }
    }
    if (showJobSitesInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showJobSitesInfo]);

  // Scroll to current match when index changes
  useEffect(() => {
    if (marketsMatches.length > 0) {
      const el = document.querySelector('.oz-markets-by-state .oz-search-current');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [marketsMatchIndex, marketsMatches.length]);

  useEffect(() => {
    if (rolesMatches.length > 0) {
      const el = document.querySelector('.oz-chips-display .oz-search-current');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [rolesMatchIndex, rolesMatches.length]);

  useEffect(() => {
    if (retailersMatches.length > 0) {
      const el = document.querySelector('.oz-retailers-grid .oz-search-current');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [retailersMatchIndex, retailersMatches.length]);

  // Reflex Talent - fetch workers when market filter changes
  useEffect(() => {
    async function loadWorkersForMarket() {
      setWorkersLoading(true);
      try {
        const workersData = await fetchWorkersByMarketAsProfiles(talentMarketFilter);
        setAllTalentWorkers(workersData.map(w => ({ ...w, matchScore: 0, matchReasons: [] })));
        setTalentDisplayCount(6); // Reset pagination
      } catch (error) {
        console.error('Error fetching workers for market:', error);
      }
      setWorkersLoading(false);
    }
    loadWorkersForMarket();
  }, [talentMarketFilter]);

  // Reflex Talent lazy load - intersection observer
  useEffect(() => {
    if (activeTab !== 'reflex-talent') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && talentDisplayCount < allTalentWorkers.length) {
          setTalentDisplayCount((prev) => Math.min(prev + 6, allTalentWorkers.length));
        }
      },
      { threshold: 0.1 }
    );
    if (talentLoadMoreRef.current) {
      observer.observe(talentLoadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [activeTab, talentDisplayCount, allTalentWorkers.length]);

  // Navigation helpers
  const navigateMatch = (
    direction: 'prev' | 'next',
    matches: unknown[],
    currentIndex: number,
    setIndex: (n: number) => void
  ) => {
    if (matches.length === 0) return;
    if (direction === 'next') {
      setIndex((currentIndex + 1) % matches.length);
    } else {
      setIndex((currentIndex - 1 + matches.length) % matches.length);
    }
  };

  // Start editing a section (backup current state)
  const startEditing = (section: 'markets' | 'roles' | 'retailers') => {
    if (section === 'markets') setBackupMarkets([...ozMarkets]);
    if (section === 'roles') setBackupRoles([...ozRoles]);
    if (section === 'retailers') setBackupRetailers([...ozRetailers]);
    setEditingSection(section);
    setNewItemInput('');
    setNewMarketState('');
  };

  // Cancel editing (restore backup)
  const cancelEditing = () => {
    if (editingSection === 'markets' && backupMarkets) setOzMarkets(backupMarkets);
    if (editingSection === 'roles' && backupRoles) setOzRoles(backupRoles);
    if (editingSection === 'retailers' && backupRetailers) setOzRetailers(backupRetailers);
    setEditingSection(null);
    setNewItemInput('');
    setNewMarketState('');
    setSaveError(null);
  };

  // Save markets to Supabase
  const saveMarkets = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await syncMarkets(ozMarkets.map(m => ({ name: m.name, state: m.state })));
      setEditingSection(null);
      setBackupMarkets(null);
    } catch (error) {
      console.error('Failed to save markets:', error);
      setSaveError('Failed to save markets. Please try again.');
    }
    setIsSaving(false);
  };

  // Save roles to Supabase
  const saveRoles = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await syncRoles(ozRoles.map(r => ({ title: r.title, category: r.category })));
      setEditingSection(null);
      setBackupRoles(null);
    } catch (error) {
      console.error('Failed to save roles:', error);
      setSaveError('Failed to save roles. Please try again.');
    }
    setIsSaving(false);
  };

  // Save retailers to Supabase
  const saveRetailers = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await syncRetailers(ozRetailers.map(r => ({ name: r.name, classification: r.classification })));
      setEditingSection(null);
      setBackupRetailers(null);
    } catch (error) {
      console.error('Failed to save retailers:', error);
      setSaveError('Failed to save retailers. Please try again.');
    }
    setIsSaving(false);
  };

  // Job postings filters
  const [jpMarketFilter, setJpMarketFilter] = useState<string[]>([]);
  const [jpRoleFilter, setJpRoleFilter] = useState<string[]>([]);
  const [jpRetailerFilter, setJpRetailerFilter] = useState<string[]>([]);
  const [jpClassFilter, setJpClassFilter] = useState<string[]>([]);

  // Filter search state
  const [marketFilterSearch, setMarketFilterSearch] = useState('');
  const [roleFilterSearch, setRoleFilterSearch] = useState('');
  const [retailerFilterSearch, setRetailerFilterSearch] = useState('');
  const [classFilterSearch, setClassFilterSearch] = useState('');

  // Sorting state for jobs table
  const [jobSortColumn, setJobSortColumn] = useState<'source' | 'market' | 'retailer' | 'role' | 'salary' | 'employment_type'>('market');
  const [jobSortDirection, setJobSortDirection] = useState<'asc' | 'desc'>('asc');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName] = useState(getRandomUserName);
  const [, setMatchedWorkers] = useState<MatchedWorker[]>([]);
  const [, setJobSpec] = useState<JobSpec | null>(null);

  // Published jobs state - fetched from Supabase
  const [publishedJobs, setPublishedJobs] = useState<PublishedJob[]>([]);
  const [_publishedJobsLoading, setPublishedJobsLoading] = useState(true);

  // Fetch published jobs from Supabase on mount
  useEffect(() => {
    async function loadPublishedJobs() {
      try {
        const jobs = await fetchPublishedJobs();
        // Convert DB format to UI format
        const uiJobs: PublishedJob[] = jobs
          .filter(job => !job.unpublished_at) // Only show active jobs
          .map(job => ({
            id: job.job_id,
            role: job.job_title,
            employmentType: job.job_type === 'Either' ? 'Open to either' : job.job_type,
            market: job.job_market,
            pay: job.pay_range,
            traits: [], // Traits stored separately or not used yet
            benefits: job.benefits || [],
            publishedAt: new Date(job.created_at),
            status: 'active' as const,
            engagement: { views: 0, likes: 0, applications: 0 }, // Will come from separate table later
            candidates: [], // Will come from separate table later
          }));
        setPublishedJobs(uiJobs);
      } catch (error) {
        console.error('Failed to load published jobs:', error);
      } finally {
        setPublishedJobsLoading(false);
      }
    }
    loadPublishedJobs();
  }, []);

  // Handle job actions (pause/resume/close)
  const handleJobAction = useCallback((jobId: string, action: 'pause' | 'resume' | 'close') => {
    setPublishedJobs(prev => prev.map(job => {
      if (job.id !== jobId) return job;
      const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'closed';
      return { ...job, status: newStatus };
    }));
  }, []);

  // Publish a new job from chat
  const publishJob = useCallback(async (jobData: { role: string; employmentType: string; market: string; pay: string; traits: string[]; benefits: string[] }) => {
    // Map employment type to DB format
    const jobTypeMap: Record<string, 'Part-time' | 'Full-time' | 'Either'> = {
      'Full-time': 'Full-time',
      'Part-time': 'Part-time',
      'Open to either': 'Either',
    };
    const jobType = jobTypeMap[jobData.employmentType] || 'Either';

    // Determine pay type from pay string (contains "hr" or "/hour" = hourly, otherwise salary)
    const payType: 'hourly' | 'salary' = jobData.pay.toLowerCase().includes('hr') || jobData.pay.toLowerCase().includes('hour') ? 'hourly' : 'salary';

    try {
      // Save to Supabase
      const dbJob = await createPublishedJob({
        job_id: Date.now().toString(),
        job_title: jobData.role,
        job_type: jobType,
        job_market: jobData.market,
        pay_type: payType,
        pay_range: jobData.pay,
        benefits: jobData.benefits,
      });

      // Add to local state
      const newJob: PublishedJob = {
        id: dbJob.job_id,
        role: dbJob.job_title,
        employmentType: jobData.employmentType as 'Full-time' | 'Part-time' | 'Open to either',
        market: dbJob.job_market,
        pay: dbJob.pay_range,
        traits: jobData.traits,
        benefits: dbJob.benefits || [],
        publishedAt: new Date(dbJob.created_at),
        status: 'active',
        engagement: { views: 0, likes: 0, applications: 0 },
        candidates: [],
      };
      setPublishedJobs(prev => [newJob, ...prev]);
    } catch (error) {
      console.error('Failed to publish job:', error);
      // Still add to local state as fallback
      const newJob: PublishedJob = {
        id: Date.now().toString(),
        role: jobData.role,
        employmentType: jobData.employmentType as 'Full-time' | 'Part-time' | 'Open to either',
        market: jobData.market,
        pay: jobData.pay,
        traits: jobData.traits,
        benefits: jobData.benefits,
        publishedAt: new Date(),
        status: 'active',
        engagement: { views: 0, likes: 0, applications: 0 },
        candidates: [],
      };
      setPublishedJobs(prev => [newJob, ...prev]);
    }
    // Don't auto-navigate - stay in chat so user can see success banner and optionally view candidates
  }, []);
  const [geminiService] = useState(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('VITE_GEMINI_API_KEY is not set!');
    }
    return new GeminiService(apiKey || '');
  });
  const chatStartedRef = useRef(false);


  // Handle branching from a previous message - clear everything after and start new path
  const handleBranchFromMessage = (messageId: string, newMessage: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const branchBaseMessages = messages.slice(0, messageIndex + 1);
    setMessages(branchBaseMessages);

    // Re-seed the model with the kept transcript so a lone role title is not treated as a fresh flow
    chatStartedRef.current = false;

    setTimeout(() => {
      handleSendMessage(newMessage, { branchBaseMessages });
    }, 50);
  };

  const handleSendMessage = async (
    content: string,
    options?: { branchBaseMessages?: ChatMessage[] }
  ) => {
    // Special internal trigger - don't show as user message
    const isInternalTrigger = content === '__auto_location__';

    if (!isInternalTrigger) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }
    setIsLoading(true);

    // If agent is off, use mock response to save API usage
    if (!agentActive) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      const mockMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "[Agent OFF - API calls disabled] This is a mock response for prototyping. Turn on the agent to get real AI responses.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mockMessage]);
      setIsLoading(false);
      return;
    }

    try {
      // Initialize chat session on first message
      if (!chatStartedRef.current) {
        const classificationMap: Record<string, 'Luxury' | 'Specialty' | 'Big Box'> = {
          luxury: 'Luxury',
          elevated: 'Specialty',
          mid: 'Big Box',
        };
        const historySource =
          options?.branchBaseMessages !== undefined
            ? options.branchBaseMessages
            : messages;
        const existingHistory = chatMessagesToGeminiHistory(historySource);
        await geminiService.startChat(
          userName,
          SAMPLE_RETAILER.name,
          classificationMap[SAMPLE_RETAILER.brandTier] || 'Specialty',
          'Austin', // market
          existingHistory.length > 0 ? existingHistory : undefined
        );
        chatStartedRef.current = true;
      }

      const response = await geminiService.sendMessage(content);

      // Add the assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If there's a followUp, auto-send it after a short delay
      if (response.followUp) {
        setIsLoading(true);
        // Small delay for visual separation
        await new Promise(resolve => setTimeout(resolve, 500));
        const followUpResponse = await geminiService.sendMessage(response.followUp);
        const followUpMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: followUpResponse.text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, followUpMessage]);
      }

      if (response.jobSpec) {
        const spec = { ...response.jobSpec, retailerName: SAMPLE_RETAILER.name } as any;
        setJobSpec(spec);
        // Use fetched workers for matching (extract WorkerProfile from MatchedWorker)
        const workerProfiles = allTalentWorkers.map(({ matchScore: _ms, matchReasons: _mr, ...w }) => w);
        const matches = matchWorkers(workerProfiles, spec);
        setMatchedWorkers(matches);

        // Publish the job when spec is received
        // Map the Gemini response format to our PublishedJob format
        const empType = spec.employmentType || spec.preference;
        publishJob({
          role: spec.title,
          employmentType: empType === 'FT' || empType === 'Full-time' ? 'Full-time' : empType === 'PT' || empType === 'Part-time' ? 'Part-time' : 'Open to either',
          market: spec.market || 'Austin',
          pay: spec.salaryRange || spec.description?.match(/\$[\d,]+-?[\d,]*\/?(?:hr|hour|year)?/i)?.[0] || 'Competitive',
          traits: spec.idealTraits || [],
          benefits: spec.benefits || [],
        });
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

  // Scrape state (will be used for UI feedback)
  const [isScraping, setIsScraping] = useState(false);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [unmatchedRoles, setUnmatchedRoles] = useState<{ title: string; company: string; count: number; jobs: any[] }[]>([]);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);

  // Load job postings from Supabase
  const loadJobPostings = async () => {
    try {
      const jobs = await fetchJobPostings();
      setJobPostings(jobs);
    } catch (err) {
      console.error('Error loading job postings:', err);
    }
  };

  // Load job postings on mount
  useEffect(() => {
    loadJobPostings();
  }, []);

  // Get filter options from actual job data
  const jobFilterOptions = useMemo(() => {
    const markets = new Set<string>();
    const retailers = new Set<string>();
    const roles = new Set<string>();
    const classes = new Set<string>();

    jobPostings.forEach(job => {
      if (job.market_name) markets.add(job.market_name);
      if (job.company) {
        retailers.add(job.company);
        // Find retailer classification from ozRetailers
        const retailer = ozRetailers.find(r => r.name.toLowerCase() === job.company?.toLowerCase());
        if (retailer) classes.add(retailer.classification);
      }
      // Find role title from ozRoles using role_id
      const role = ozRoles.find(r => r.id === job.role_id);
      if (role) roles.add(role.title);
    });

    return {
      markets: Array.from(markets).sort(),
      retailers: Array.from(retailers).sort(),
      roles: Array.from(roles).sort(),
      classes: Array.from(classes).sort(),
    };
  }, [jobPostings, ozRetailers, ozRoles]);

  // Filter and sort job postings
  const filteredJobPostings = useMemo(() => {
    let filtered = jobPostings.filter(job => {
      // Market filter
      if (jpMarketFilter.length > 0 && !jpMarketFilter.includes(job.market_name || '')) {
        return false;
      }
      // Retailer filter
      if (jpRetailerFilter.length > 0 && !jpRetailerFilter.includes(job.company || '')) {
        return false;
      }
      // Role filter - match against role title from ozRoles
      if (jpRoleFilter.length > 0) {
        const role = ozRoles.find(r => r.id === job.role_id);
        if (!role || !jpRoleFilter.includes(role.title)) {
          return false;
        }
      }
      // Class filter - get classification from ozRetailers
      if (jpClassFilter.length > 0) {
        const retailer = ozRetailers.find(r => r.name.toLowerCase() === job.company?.toLowerCase());
        if (!retailer || !jpClassFilter.includes(retailer.classification)) {
          return false;
        }
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';

      switch (jobSortColumn) {
        case 'source':
          aVal = a.source || '';
          bVal = b.source || '';
          break;
        case 'market':
          aVal = a.market_name || '';
          bVal = b.market_name || '';
          break;
        case 'retailer':
          aVal = a.company || '';
          bVal = b.company || '';
          break;
        case 'role':
          const roleA = ozRoles.find(r => r.id === a.role_id);
          const roleB = ozRoles.find(r => r.id === b.role_id);
          aVal = roleA?.title || '';
          bVal = roleB?.title || '';
          break;
        case 'salary':
          aVal = a.salary || '';
          bVal = b.salary || '';
          break;
        case 'employment_type':
          aVal = a.employment_type || '';
          bVal = b.employment_type || '';
          break;
      }

      const cmp = aVal.localeCompare(bVal);
      return jobSortDirection === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [jobPostings, jpMarketFilter, jpRetailerFilter, jpRoleFilter, jpClassFilter, jobSortColumn, jobSortDirection, ozRoles, ozRetailers]);

  // Handle column header click for sorting
  const handleJobSort = (column: typeof jobSortColumn) => {
    if (jobSortColumn === column) {
      setJobSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setJobSortColumn(column);
      setJobSortDirection('asc');
    }
  };

  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgressData | null>(null);
  const [showScrapeProgressModal, setShowScrapeProgressModal] = useState(false);
  const scrapeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrapeProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrapeAbortRef = useRef<AbortController | null>(null);
  const scrapeStartTimeRef = useRef<number>(0);

  // Cancel scrape handler
  const handleCancelScrape = async () => {
    if (scrapeAbortRef.current) {
      scrapeAbortRef.current.abort();
    }
    if (scrapeTimerRef.current) {
      clearInterval(scrapeTimerRef.current);
    }
    if (scrapeProgressIntervalRef.current) {
      clearInterval(scrapeProgressIntervalRef.current);
    }
    setIsScraping(false);
    setScrapeProgress(null);
    setShowScrapeProgressModal(false);

    // Reload job postings to show any jobs that were saved before cancel
    await loadJobPostings();

    // Show unmatched roles modal if there are any unmatched roles collected so far
    if (unmatchedRoles.length > 0) {
      setShowUnmatchedModal(true);
    }
  };

  // Handle scrape configuration
  const handleRunScrape = async (config: ScrapeConfig) => {
    console.log('Running scrape with config:', config);

    // Get the actual market/role/retailer objects for the selected IDs
    const selectedMarketObjects = ozMarkets.filter(m => m.id && config.markets.includes(m.id));
    const selectedRoleObjects = ozRoles.filter(r => r.id && config.roles.includes(r.id));
    const selectedRetailerObjects = ozRetailers.filter(r => r.id && config.retailers.includes(r.id));

    // Also include retailers matching selected classifications
    const classificationRetailers = ozRetailers.filter(r =>
      config.retailerClassifications.includes(r.classification)
    );

    // Combine and dedupe retailers
    const allSelectedRetailers = [
      ...selectedRetailerObjects,
      ...classificationRetailers.filter(r => !selectedRetailerObjects.some(sr => sr.id === r.id))
    ];

    // If no retailers selected, include all
    const retailersToFilter = allSelectedRetailers.length > 0 ? allSelectedRetailers : ozRetailers;

    console.log('Markets to scrape:', selectedMarketObjects.map(m => `${m.name}, ${m.state}`));
    console.log('Roles to search:', selectedRoleObjects.map(r => r.title));
    console.log('Retailers to filter:', retailersToFilter.map(r => r.name));

    setIsScraping(true);
    setShowScrapeModal(false);
    setShowScrapeProgressModal(true);

    // Initialize progress tracking
    const totalMarkets = selectedMarketObjects.length;
    const totalRoles = selectedRoleObjects.length;
    const firstMarket = selectedMarketObjects[0];
    const firstRole = selectedRoleObjects[0];

    scrapeStartTimeRef.current = Date.now();

    // Set initial progress
    setScrapeProgress({
      phase: 'initializing',
      currentMarket: firstMarket ? `${firstMarket.name}, ${firstMarket.state}` : '',
      currentRole: firstRole?.title || '',
      currentPage: 0,
      totalPages: 0,
      marketsCompleted: 0,
      totalMarkets,
      rolesCompleted: 0,
      totalRoles,
      jobsFound: 0,
      jobsMatched: 0,
      elapsedSeconds: 0,
    });

    // Start timer that updates elapsed time
    scrapeTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - scrapeStartTimeRef.current) / 1000);
      setScrapeProgress(prev => prev ? { ...prev, elapsedSeconds: elapsed } : prev);
    }, 1000);

    // Simulate phase progression while waiting for API response
    // Phase 1: Initializing (immediate)
    // Phase 2: Launching browser (after 1s)
    setTimeout(() => {
      setScrapeProgress(prev => prev ? { ...prev, phase: 'launching' } : prev);
    }, 1000);

    // Phase 3: Navigating (after 3s)
    setTimeout(() => {
      setScrapeProgress(prev => prev ? { ...prev, phase: 'navigating', currentPage: 1, totalPages: 5 } : prev);
    }, 3000);

    // Phase 4: Scraping (after 5s)
    setTimeout(() => {
      setScrapeProgress(prev => prev ? { ...prev, phase: 'scraping' } : prev);
    }, 5000);

    // No simulated counters - just show elapsed time and phase
    // Real job counts will come from the API response

    // Create abort controller
    scrapeAbortRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:3001/api/scrape', {
        signal: scrapeAbortRef.current.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobSites: config.jobSites,
          markets: selectedMarketObjects.map(m => ({ id: m.id, name: m.name, state: m.state })),
          roles: selectedRoleObjects.map(r => ({ id: r.id, title: r.title, match_keywords: r.match_keywords })),
          retailers: retailersToFilter.map(r => ({ name: r.name, classification: r.classification })),
        }),
      });

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let finalData: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));

                if (eventData.type === 'progress') {
                  // Update progress in real-time
                  // marketIndex is current market (0-based), display as "X of Y" where X = marketIndex + 1
                  setScrapeProgress(prev => prev ? {
                    ...prev,
                    currentMarket: eventData.currentMarket,
                    jobsFound: eventData.jobsFound,
                    matchedRetailers: eventData.matchedRetailers,
                    matchedJobs: eventData.matchedJobs,
                    // Show current market number (1-based) - this is "working on market X"
                    marketsCompleted: typeof eventData.marketIndex === 'number' ? eventData.marketIndex : prev.marketsCompleted,
                    totalMarkets: eventData.totalMarkets,
                    currentPass: eventData.pass,
                    totalPasses: eventData.totalPasses,
                    statusMessage: eventData.statusMessage,
                  } : prev);
                } else if (eventData.type === 'pass_start') {
                  // Update UI to show new pass starting
                  console.log(`Starting pass ${eventData.pass}/${eventData.totalPasses}`);
                  setScrapeProgress(prev => prev ? {
                    ...prev,
                    currentPass: eventData.pass,
                    totalPasses: eventData.totalPasses,
                    jobsFound: eventData.jobsFound ?? prev.jobsFound,
                    matchedJobs: eventData.totalMatchedJobs ?? prev.matchedJobs,
                    jobsSavedThisPass: 0,
                    // Don't reset newJobsThisPass - it should accumulate across passes
                    marketsCompleted: 0,
                  } : prev);
                } else if (eventData.type === 'pass_complete') {
                  // Save jobs from this pass to database
                  console.log(`Pass ${eventData.pass} complete: ${eventData.newJobsThisPass} new jobs`);
                  // Accumulate newJobsThisPass across all passes
                  setScrapeProgress(prev => prev ? {
                    ...prev,
                    newJobsThisPass: (prev.newJobsThisPass || 0) + (eventData.newJobsThisPass || 0),
                    currentPass: eventData.pass,
                    totalPasses: eventData.totalPasses,
                    jobsFound: eventData.jobsFound ?? prev.jobsFound,
                    matchedJobs: eventData.totalMatchedJobs,
                  } : prev);
                  if (eventData.passJobs && eventData.passJobs.length > 0) {
                    const retailersWithIds = ozRetailers.filter((r): r is Retailer => !!r.id);
                    try {
                      const saveResult = await saveScrapedJobs(eventData.passJobs as ScrapedJob[], retailersWithIds);
                      console.log(`Saved ${saveResult.saved} jobs from pass ${eventData.pass}`);
                      setScrapeProgress(prev => prev ? {
                        ...prev,
                        jobsSavedThisPass: saveResult.saved,
                      } : prev);
                    } catch (saveErr) {
                      console.error(`Error saving jobs from pass ${eventData.pass}:`, saveErr);
                    }
                  }
                } else if (eventData.type === 'market_complete') {
                  // Save this market's jobs immediately to the database
                  const marketJobs = eventData.marketJobs || eventData.jobs || [];
                  let newJobsSaved = 0;
                  if (marketJobs.length > 0) {
                    const retailersWithIds = ozRetailers.filter((r): r is Retailer => !!r.id);
                    try {
                      const saveResult = await saveScrapedJobs(marketJobs as ScrapedJob[], retailersWithIds);
                      newJobsSaved = saveResult.saved;
                      console.log(`Saved ${saveResult.saved} NEW jobs from ${eventData.market} (${saveResult.skipped} duplicates skipped)`);
                    } catch (saveErr) {
                      console.error(`Error saving jobs from ${eventData.market}:`, saveErr);
                    }
                  }
                  // Track unmatched roles as they come in (for cancel handling)
                  if (eventData.unmatchedRoles && eventData.unmatchedRoles.length > 0) {
                    setUnmatchedRoles(eventData.unmatchedRoles);
                  }
                  // Update progress to show market completed
                  // marketIndex is 0-based, modal displays marketsCompleted + 1
                  setScrapeProgress(prev => prev ? {
                    ...prev,
                    currentMarket: eventData.market,
                    marketsCompleted: eventData.marketIndex,
                    totalMarkets: eventData.totalMarkets,
                    jobsFound: eventData.jobsFound,
                    matchedRetailers: eventData.matchedRetailers,
                    matchedJobs: eventData.matchedJobs,
                    // Accumulate new jobs saved
                    newJobsThisPass: (prev.newJobsThisPass || 0) + newJobsSaved,
                  } : prev);
                } else if (eventData.type === 'complete') {
                  finalData = eventData;
                } else if (eventData.type === 'error') {
                  throw new Error(eventData.error);
                }
              } catch (parseErr) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }

      if (finalData?.success) {
        console.log(`Scrape complete: ${finalData.jobCount} jobs found`);

        // Jobs are already saved during pass_complete events
        // Just reload from Supabase to show the latest
        await loadJobPostings();

        // Check for unmatched roles
        if (finalData.unmatchedRoles && finalData.unmatchedRoles.length > 0) {
          console.log(`Found ${finalData.unmatchedRoles.length} unmatched role titles`);
          setUnmatchedRoles(finalData.unmatchedRoles);
          setShowUnmatchedModal(true);
        } else {
          alert(`Scrape complete!\n\nFound ${finalData.jobCount} jobs from tracked retailers.`);
        }
      } else if (!finalData) {
        console.error('Scrape failed: No response received');
        alert('Scrape failed: No response received');
      } else {
        console.error('Scrape failed:', finalData.error);
        alert(`Scrape failed: ${finalData.error}`);
      }
    } catch (err: any) {
      console.error('Scrape error:', err);
      if (err.name !== 'AbortError') {
        alert(`Scrape error: ${err.message}`);
      }
    } finally {
      // Clean up timers
      if (scrapeTimerRef.current) {
        clearInterval(scrapeTimerRef.current);
        scrapeTimerRef.current = null;
      }
      if (scrapeProgressIntervalRef.current) {
        clearInterval(scrapeProgressIntervalRef.current);
        scrapeProgressIntervalRef.current = null;
      }
      setIsScraping(false);
      setShowScrapeProgressModal(false);
      setScrapeProgress(null);
    }
  };

  return (
    <div className="permanent-hiring-page">
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
          className={`tab ${activeTab === 'ask-reflex' ? 'active' : ''}`}
          onClick={() => setActiveTab('ask-reflex')}
        >
          Ask Reflex
        </button>
        <button
          className={`tab ${activeTab === 'published-jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('published-jobs')}
        >
          Published Jobs
        </button>
        <button
          className={`tab ${activeTab === 'reflex-talent' ? 'active' : ''}`}
          onClick={() => setActiveTab('reflex-talent')}
        >
          Reflex Talent
        </button>
      </nav>

      {activeTab === 'ask-reflex' && (
        <div className={`hiring-content${messages.length > 0 ? ' conversation-mode' : ''}`}>
          <div className="chat-column">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onBranchFromMessage={handleBranchFromMessage}
              isLoading={isLoading}
              userName={userName}
              workers={allTalentWorkers}
            />
          </div>
        </div>
      )}

      {activeTab === 'published-jobs' && (
        <div className="published-jobs-content">
          {publishedJobs.length === 0 ? (
            <div className="tab-empty-state">
              <div className="placeholder-content">
                <FileText size={48} strokeWidth={1} />
                <h3>No published jobs yet</h3>
                <p>
                  Jobs you publish will appear here for workers to discover
                </p>
              </div>
            </div>
          ) : (
            <div className="published-jobs-list">
              {publishedJobs.map(job => (
                <PublishedJobCard
                  key={job.id}
                  job={job}
                  onJobAction={handleJobAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reflex-talent' && (() => {
        const shiftVerifiedWorkers = allTalentWorkers.filter(w => w.shiftVerified);
        const communityWorkers = allTalentWorkers.filter(w => !w.shiftVerified);
        // Get unique markets from ozMarkets for the dropdown
        const uniqueMarkets = [...new Set(ozMarkets.map(m => m.name))].sort();
        return (
          <div className={`reflex-talent-content${selectedTalentWorker ? ' has-detail-panel' : ''}`}>
            <div className="reflex-talent-main">
              <div className="reflex-talent-header-row">
                <p className="reflex-talent-header type-prompt-question">
                  Explore Reflex talent in
                </p>
                <select
                  className="reflex-talent-market-select"
                  value={talentMarketFilter}
                  onChange={(e) => setTalentMarketFilter(e.target.value)}
                >
                  {uniqueMarkets.map((market) => (
                    <option key={market} value={market}>{market}</option>
                  ))}
                </select>
              </div>

              {/* Shift Verified Workers */}
              {shiftVerifiedWorkers.length > 0 && (
                <div className="reflex-talent-group">
                  <h3 className="reflex-talent-subheader">Shift Verified</h3>
                  <div className="reflex-talent-grid">
                    {shiftVerifiedWorkers.map((worker) => (
                      <div
                        key={worker.id}
                        ref={(el) => { workerCardRefs.current[worker.id] = el; }}
                      >
                        <WorkerCardCompact
                          worker={worker}
                          onClick={() => {
                            setSelectedTalentWorker(worker);
                            // Scroll card into view after panel opens
                            setTimeout(() => {
                              workerCardRefs.current[worker.id]?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }, 50);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Broader Worker Community */}
              {communityWorkers.length > 0 && (
                <div className="reflex-talent-group">
                  <div className="reflex-talent-divider"></div>
                  <h3 className="reflex-talent-subheader">Broader worker community</h3>
                  <div className="reflex-talent-grid">
                    {communityWorkers.map((worker) => (
                      <div
                        key={worker.id}
                        ref={(el) => { workerCardRefs.current[worker.id] = el; }}
                      >
                        <WorkerCardCompact
                          worker={worker}
                          onClick={() => {
                            setSelectedTalentWorker(worker);
                            // Scroll card into view after panel opens
                            setTimeout(() => {
                              workerCardRefs.current[worker.id]?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }, 50);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {talentDisplayCount < allTalentWorkers.length && (
                <div ref={talentLoadMoreRef} className="reflex-talent-load-more">
                  <Loader2 size={24} className="oz-spinner" />
                  <span>Loading more...</span>
                </div>
              )}
            </div>
            {selectedTalentWorker && (
              <WorkerCardFull
                worker={selectedTalentWorker}
                onClose={() => setSelectedTalentWorker(null)}
              />
            )}
          </div>
        );
      })()}

      {/* Oz Panel is now rendered globally in PermanentHiring.tsx */}

      {/* Scrape Config Modal */}
      <ScrapeModal
        isOpen={showScrapeModal}
        onClose={() => setShowScrapeModal(false)}
        markets={ozMarkets.filter((m): m is Market => !!m.id) as Market[]}
        roles={ozRoles.filter((r): r is Role => !!r.id) as Role[]}
        retailers={ozRetailers.filter((r): r is Retailer => !!r.id) as Retailer[]}
        onRunScrape={handleRunScrape}
      />

      {/* Scrape Progress Modal */}
      <ScrapeProgressModal
        isOpen={showScrapeProgressModal}
        onClose={() => setShowScrapeProgressModal(false)}
        onCancel={handleCancelScrape}
        progress={scrapeProgress}
      />

      <UnmatchedRolesModal
        isOpen={showUnmatchedModal}
        onClose={() => {
          setShowUnmatchedModal(false);
          setUnmatchedRoles([]);
        }}
        unmatchedRoles={unmatchedRoles}
        existingRoles={ozRoles.filter((r): r is { id: string; title: string; category: string } =>
          !!r.id && !!r.category
        )}
        onAddRoles={async (newRoles, originalTitles) => {
          // Add new roles to Supabase and state, then save associated jobs
          console.log('Adding new roles:', newRoles, 'Original titles:', originalTitles);
          for (let i = 0; i < newRoles.length; i++) {
            const role = newRoles[i];
            const originalTitle = originalTitles?.[i] || role.title;
            try {
              const savedRole = await addRole(role.title, role.category);
              setOzRoles(prev => [...prev, savedRole]);

              // Find the unmatched role entry to get the jobs
              const unmatchedEntry = unmatchedRoles.find(
                ur => ur.title.toLowerCase() === originalTitle.toLowerCase()
              );

              if (unmatchedEntry && unmatchedEntry.jobs && unmatchedEntry.jobs.length > 0) {
                // Add role info to each job and save
                const jobsToSave = unmatchedEntry.jobs.map(job => ({
                  ...job,
                  role: savedRole.title,
                  roleId: savedRole.id,
                }));
                console.log(`Saving ${jobsToSave.length} jobs for new role "${savedRole.title}"`);
                const retailersWithIds = ozRetailers.filter((r): r is Retailer => !!r.id);
                await saveScrapedJobs(jobsToSave, retailersWithIds);
                await loadJobPostings();
              }
            } catch (err) {
              console.error('Failed to add role:', role.title, err);
            }
          }
        }}
        onMapRoles={async (mappings) => {
          // Add keywords to existing roles and save associated jobs
          console.log('Mapping roles:', mappings);
          for (const mapping of mappings) {
            try {
              await addKeywordToRole(mapping.existingRoleId, mapping.unmatchedTitle);

              // Find the unmatched role entry to get the jobs
              const unmatchedEntry = unmatchedRoles.find(
                ur => ur.title.toLowerCase() === mapping.unmatchedTitle.toLowerCase()
              );

              if (unmatchedEntry && unmatchedEntry.jobs && unmatchedEntry.jobs.length > 0) {
                // Find the existing role to get its title
                const existingRole = ozRoles.find(r => r.id === mapping.existingRoleId);
                if (existingRole) {
                  // Add role info to each job and save
                  const jobsToSave = unmatchedEntry.jobs.map(job => ({
                    ...job,
                    role: existingRole.title,
                    roleId: existingRole.id,
                  }));
                  console.log(`Saving ${jobsToSave.length} jobs mapped to role "${existingRole.title}"`);
                  const retailersWithIds = ozRetailers.filter((r): r is Retailer => !!r.id);
                  await saveScrapedJobs(jobsToSave, retailersWithIds);
                  await loadJobPostings();
                }
              }

              // Refresh roles to get updated keywords
              const updatedRoles = await fetchRoles();
              setOzRoles(updatedRoles);
            } catch (err) {
              console.error('Failed to add keyword:', mapping.unmatchedTitle, err);
            }
          }
        }}
        onIgnoreRoles={(titles) => {
          // Just log ignored roles for now
          console.log('Ignored roles:', titles);
        }}
      />


    </div>
  );
}

export default V1JobFocus;

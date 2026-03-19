import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Briefcase, Link, FileText, Pencil, X, Plus, ChevronDown, Search, ChevronLeft, ChevronRight, Play, Check, Info, Loader2 } from 'lucide-react';
import { ChatInterface } from '../components/Chat';
import { WorkerGrid } from '../components/Workers';
import { MockGeminiService } from '../services/gemini';
import { matchWorkers } from '../services/matching';
import {
  fetchMarkets,
  fetchRoles,
  fetchRetailers,
  syncMarkets,
  syncRoles,
  syncRetailers,
  type Market,
  type Role,
  type Retailer,
} from '../services/supabase';
import { SAMPLE_WORKERS } from '../data/workers';
import { SAMPLE_RETAILER } from '../data/retailer';
import type { ChatMessage, MatchedWorker, JobSpec } from '../types';
import './PermanentHiring.css';

type TabId = 'ask-reflex' | 'published-jobs' | 'oz';

// All job roles flattened for the Oz admin
const ALL_ROLES = [
  'Sales Associate / Retail Associate',
  'Cashier',
  'Stock Associate / Stocker',
  'Fitting Room Attendant',
  'Visual Merchandiser',
  'Inventory Specialist',
  'Beauty Advisor / Cosmetics Associate',
  'Key Holder / Lead Associate',
  'Department Supervisor',
  'Assistant Store Manager',
  'Store Manager',
  'District / Area Manager',
  'Holiday Seasonal Associate',
  'Weekend Associate',
  'Early Morning Stocker',
];

// Job roles by category with descriptions
const JOB_ROLES = {
  entryLevel: [
    { title: 'Sales Associate / Retail Associate', description: 'Customer service, sales floor support, POS transactions' },
    { title: 'Cashier', description: 'Checkout operations, handling payments' },
    { title: 'Stock Associate / Stocker', description: 'Receiving, organizing, replenishing inventory' },
    { title: 'Fitting Room Attendant', description: 'Managing dressing rooms, returning items to floor' },
  ],
  specialized: [
    { title: 'Visual Merchandiser', description: 'Displays, store layout, product presentation' },
    { title: 'Inventory Specialist', description: 'Stock counts, inventory management systems' },
    { title: 'Beauty Advisor / Cosmetics Associate', description: 'Product expertise, demos (Sephora, Ulta, department stores)' },
  ],
  management: [
    { title: 'Key Holder / Lead Associate', description: 'Opening/closing, shift supervision' },
    { title: 'Department Supervisor', description: 'Oversees specific section (shoes, menswear, etc.)' },
    { title: 'Assistant Store Manager', description: 'Operations support, staff scheduling' },
    { title: 'Store Manager', description: 'Full P&L responsibility, hiring, performance' },
    { title: 'District / Area Manager', description: 'Multi-store oversight' },
  ],
  seasonal: [
    { title: 'Holiday Seasonal Associate', description: 'Temp positions for peak seasons' },
    { title: 'Weekend Associate', description: 'Dedicated weekend availability' },
    { title: 'Early Morning Stocker', description: 'Pre-open inventory work' },
  ],
};

// Retailers by classification
const RETAILERS: { name: string; classification: 'Luxury' | 'Mid' | 'Big Box' }[] = [
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
  // Mid
  { name: 'Abercrombie & Fitch', classification: 'Mid' },
  { name: 'Adidas', classification: 'Mid' },
  { name: 'Aerie', classification: 'Mid' },
  { name: 'Aeropostale', classification: 'Mid' },
  { name: 'Aldo', classification: 'Mid' },
  { name: 'Allbirds', classification: 'Mid' },
  { name: 'Alo Yoga', classification: 'Mid' },
  { name: 'Altar\'d State', classification: 'Mid' },
  { name: 'American Eagle', classification: 'Mid' },
  { name: 'Ann Taylor', classification: 'Mid' },
  { name: 'Anthropologie', classification: 'Mid' },
  { name: 'Apple', classification: 'Mid' },
  { name: 'Athleta', classification: 'Mid' },
  { name: 'Aveda', classification: 'Mid' },
  { name: 'Banana Republic', classification: 'Mid' },
  { name: 'Bare Minerals', classification: 'Mid' },
  { name: 'Bath & Body Works', classification: 'Mid' },
  { name: 'Belk', classification: 'Mid' },
  { name: 'Beyond Yoga', classification: 'Mid' },
  { name: 'Bobbi Brown', classification: 'Mid' },
  { name: 'Brighton', classification: 'Mid' },
  { name: 'Buckle', classification: 'Mid' },
  { name: 'Buffalo Exchange', classification: 'Mid' },
  { name: 'Build-A-Bear Workshop', classification: 'Mid' },
  { name: 'Burlington', classification: 'Mid' },
  { name: 'Carter\'s', classification: 'Mid' },
  { name: 'Cato', classification: 'Mid' },
  { name: 'Cavender\'s', classification: 'Mid' },
  { name: 'Charlotte Russe', classification: 'Mid' },
  { name: 'Chico\'s', classification: 'Mid' },
  { name: 'Claire\'s', classification: 'Mid' },
  { name: 'Clarks', classification: 'Mid' },
  { name: 'Clinique', classification: 'Mid' },
  { name: 'Coach', classification: 'Mid' },
  { name: 'Columbia', classification: 'Mid' },
  { name: 'Converse', classification: 'Mid' },
  { name: 'Cotton On', classification: 'Mid' },
  { name: 'Crate & Barrel', classification: 'Mid' },
  { name: 'Crocs', classification: 'Mid' },
  { name: 'David\'s Bridal', classification: 'Mid' },
  { name: 'Dillard\'s', classification: 'Mid' },
  { name: 'DKNY', classification: 'Mid' },
  { name: 'DSW', classification: 'Mid' },
  { name: 'Easy Spirit', classification: 'Mid' },
  { name: 'Ecco', classification: 'Mid' },
  { name: 'Eddie Bauer', classification: 'Mid' },
  { name: 'Everlane', classification: 'Mid' },
  { name: 'Express', classification: 'Mid' },
  { name: 'Fabletics', classification: 'Mid' },
  { name: 'Finish Line', classification: 'Mid' },
  { name: 'Foot Locker', classification: 'Mid' },
  { name: 'Forever 21', classification: 'Mid' },
  { name: 'Fossil', classification: 'Mid' },
  { name: 'Francesca\'s', classification: 'Mid' },
  { name: 'Gap', classification: 'Mid' },
  { name: 'Glossier', classification: 'Mid' },
  { name: 'Gorjana', classification: 'Mid' },
  { name: 'H&M', classification: 'Mid' },
  { name: 'Hallmark', classification: 'Mid' },
  { name: 'Hobby Lobby', classification: 'Mid' },
  { name: 'Hollister', classification: 'Mid' },
  { name: 'Hot Topic', classification: 'Mid' },
  { name: 'J. Crew Factory', classification: 'Mid' },
  { name: 'J. Jill', classification: 'Mid' },
  { name: 'James Avery', classification: 'Mid' },
  { name: 'Janie and Jack', classification: 'Mid' },
  { name: 'Jared Jewelry', classification: 'Mid' },
  { name: 'JCPenney', classification: 'Mid' },
  { name: 'Johnston & Murphy', classification: 'Mid' },
  { name: 'Jos. A. Bank', classification: 'Mid' },
  { name: 'Journey\'s', classification: 'Mid' },
  { name: 'Justice', classification: 'Mid' },
  { name: 'Kate Spade', classification: 'Mid' },
  { name: 'Kendra Scott', classification: 'Mid' },
  { name: 'L.L.Bean', classification: 'Mid' },
  { name: 'La Mer', classification: 'Mid' },
  { name: 'Lane Bryant', classification: 'Mid' },
  { name: 'LensCrafters', classification: 'Mid' },
  { name: 'Levi\'s', classification: 'Mid' },
  { name: 'Lids', classification: 'Mid' },
  { name: 'LOFT', classification: 'Mid' },
  { name: 'Lord & Taylor', classification: 'Mid' },
  { name: 'Lucky Brand', classification: 'Mid' },
  { name: 'Lululemon', classification: 'Mid' },
  { name: 'LUSH Cosmetics', classification: 'Mid' },
  { name: 'MAC Cosmetics', classification: 'Mid' },
  { name: 'Macy\'s', classification: 'Mid' },
  { name: 'Madewell', classification: 'Mid' },
  { name: 'Mango', classification: 'Mid' },
  { name: 'Maurices', classification: 'Mid' },
  { name: 'Men\'s Wearhouse', classification: 'Mid' },
  { name: 'Neiman Marcus', classification: 'Mid' },
  { name: 'New Balance', classification: 'Mid' },
  { name: 'New York & Company', classification: 'Mid' },
  { name: 'Nike', classification: 'Mid' },
  { name: 'Nordstrom', classification: 'Mid' },
  { name: 'Nordstrom Rack', classification: 'Mid' },
  { name: 'North Face', classification: 'Mid' },
  { name: 'Oakley', classification: 'Mid' },
  { name: 'Old Navy', classification: 'Mid' },
  { name: 'OshKosh B\'gosh', classification: 'Mid' },
  { name: 'PacSun', classification: 'Mid' },
  { name: 'Pandora', classification: 'Mid' },
  { name: 'Patagonia', classification: 'Mid' },
  { name: 'Perry Ellis', classification: 'Mid' },
  { name: 'PINK', classification: 'Mid' },
  { name: 'Plato\'s Closet', classification: 'Mid' },
  { name: 'Pottery Barn', classification: 'Mid' },
  { name: 'Puma', classification: 'Mid' },
  { name: 'Quay', classification: 'Mid' },
  { name: 'Ray Ban', classification: 'Mid' },
  { name: 'Reebok', classification: 'Mid' },
  { name: 'Reformation', classification: 'Mid' },
  { name: 'REI', classification: 'Mid' },
  { name: 'Restoration Hardware', classification: 'Mid' },
  { name: 'Rue 21', classification: 'Mid' },
  { name: 'Sally Beauty', classification: 'Mid' },
  { name: 'Sephora', classification: 'Mid' },
  { name: 'Shoe Carnival', classification: 'Mid' },
  { name: 'Skechers', classification: 'Mid' },
  { name: 'SKIMS', classification: 'Mid' },
  { name: 'Soma', classification: 'Mid' },
  { name: 'Sperry', classification: 'Mid' },
  { name: 'Steve Madden', classification: 'Mid' },
  { name: 'Stitch Fix', classification: 'Mid' },
  { name: 'Sunglass Hut', classification: 'Mid' },
  { name: 'Swarovski', classification: 'Mid' },
  { name: 'Talbots', classification: 'Mid' },
  { name: 'The Children\'s Place', classification: 'Mid' },
  { name: 'The Container Store', classification: 'Mid' },
  { name: 'The RealReal', classification: 'Mid' },
  { name: 'Tilly\'s', classification: 'Mid' },
  { name: 'Timberland', classification: 'Mid' },
  { name: 'Tommy John', classification: 'Mid' },
  { name: 'Too Faced Cosmetics', classification: 'Mid' },
  { name: 'True Religion Apparel', classification: 'Mid' },
  { name: 'UGG', classification: 'Mid' },
  { name: 'Ulta Beauty', classification: 'Mid' },
  { name: 'Under Armour', classification: 'Mid' },
  { name: 'UNIQLO', classification: 'Mid' },
  { name: 'Urban Outfitters', classification: 'Mid' },
  { name: 'Vans', classification: 'Mid' },
  { name: 'Vera Bradley', classification: 'Mid' },
  { name: 'Victoria\'s Secret', classification: 'Mid' },
  { name: 'Vineyard Vines', classification: 'Mid' },
  { name: 'Vuori', classification: 'Mid' },
  { name: 'White House Black Market', classification: 'Mid' },
  { name: 'World Market', classification: 'Mid' },
  { name: 'Yankee Candle', classification: 'Mid' },
  { name: 'Zara', classification: 'Mid' },
  { name: 'Zumiez', classification: 'Mid' },
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

// State abbreviation to full name mapping
const STATE_NAMES: Record<string, string> = {
  'AZ': 'Arizona',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DC': 'Washington DC',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'LA': 'Louisiana',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MO': 'Missouri',
  'MS': 'Mississippi',
  'NC': 'North Carolina',
  'NE': 'Nebraska',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NV': 'Nevada',
  'NY': 'New York',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'SC': 'South Carolina',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'WA': 'Washington',
  'WI': 'Wisconsin',
};

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
    { name: 'Indeed + Glassdoor', description: 'Largest job board, strong for hourly/retail roles, salary data' },
    { name: 'ZipRecruiter', description: 'AI matching, good retail coverage' },
    { name: 'LinkedIn', description: 'Better for management/supervisor roles' },
    { name: 'CareerBuilder', description: 'General board with retail category' },
  ],
  retailSpecific: [
    { name: 'AllRetailJobs.com', description: 'Dedicated retail job board' },
    { name: 'RetailJobsWeb.com', description: 'Retail-focused, management + hourly' },
    { name: 'RetailCareersNow', description: 'Retail industry specific' },
  ],
  hourlyShift: [
    { name: 'Snagajob', description: 'Built for hourly work, pre-screens availability' },
    { name: 'Wonolo', description: 'On-demand staffing, retail/warehouse' },
    { name: 'Instawork', description: 'Gig-style retail/hospitality shifts' },
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

export function PermanentHiring() {
  const [activeTab, setActiveTab] = useState<TabId>('ask-reflex');
  const [chatStarted, setChatStarted] = useState(false);
  const [showJobSitesInfo, setShowJobSitesInfo] = useState(false);

  // Oz tab state - data from Supabase
  const jobSitesInfoRef = useRef<HTMLDivElement>(null);
  const [ozMarkets, setOzMarkets] = useState<{ id?: string; name: string; state: string }[]>([]);
  const [ozRoles, setOzRoles] = useState<{ id?: string; title: string; category?: string }[]>([]);
  const [ozRetailers, setOzRetailers] = useState<{ id?: string; name: string; classification: 'Luxury' | 'Mid' | 'Big Box' }[]>([]);
  const [newMarketState, setNewMarketState] = useState('');

  // Loading and saving states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Backup state for edit cancellation
  const [backupMarkets, setBackupMarkets] = useState<typeof ozMarkets | null>(null);
  const [backupRoles, setBackupRoles] = useState<typeof ozRoles | null>(null);
  const [backupRetailers, setBackupRetailers] = useState<typeof ozRetailers | null>(null);

  // Fetch data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [marketsData, rolesData, retailersData] = await Promise.all([
          fetchMarkets(),
          fetchRoles(),
          fetchRetailers(),
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
  const [newRetailerClass, setNewRetailerClass] = useState<'Luxury' | 'Mid' | 'Big Box'>('Mid');
  const [newRoleCategory, setNewRoleCategory] = useState<'Entry-Level' | 'Specialized' | 'Management'>('Entry-Level');

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
  const [jpSourceFilter, setJpSourceFilter] = useState<string[]>([]);

  // Filter search state
  const [marketFilterSearch, setMarketFilterSearch] = useState('');
  const [roleFilterSearch, setRoleFilterSearch] = useState('');
  const [retailerFilterSearch, setRetailerFilterSearch] = useState('');
  const [classFilterSearch, setClassFilterSearch] = useState('');
  const [sourceFilterSearch, setSourceFilterSearch] = useState('');

  // Available job sources
  const JOB_SOURCES = ['Indeed + Glassdoor'];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedWorkers, setMatchedWorkers] = useState<MatchedWorker[]>([]);
  const [jobSpec, setJobSpec] = useState<JobSpec | null>(null);
  const [geminiService] = useState(() => {
    // TODO: Re-enable GeminiService once quota resets or billing is enabled
    // const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // if (apiKey) {
    //   return new GeminiService(apiKey);
    // }
    console.log('Using mock service (Gemini quota exceeded)');
    return new MockGeminiService();
  });

  const startConversation = useCallback(async () => {
    if (chatStarted) return;
    setChatStarted(true);
    setIsLoading(true);
    try {
      const response = await geminiService.startChat(
        SAMPLE_RETAILER.name,
        SAMPLE_RETAILER.brandTier
      );
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to start chat:', error);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hi! I'm here to help you create a job posting for a permanent hire. What type of role are you looking to fill?",
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  }, [geminiService, chatStarted]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.jobSpec) {
        const spec = { ...response.jobSpec, retailerName: SAMPLE_RETAILER.name };
        setJobSpec(spec);
        const matches = matchWorkers(SAMPLE_WORKERS, spec);
        setMatchedWorkers(matches);
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
          className={`tab tab-right ${activeTab === 'oz' ? 'active' : ''}`}
          onClick={() => setActiveTab('oz')}
        >
          Oz
        </button>
        <button className="tab-play-btn" onClick={startConversation} title="Start conversation">
          <Play size={16} />
        </button>
      </nav>

      {activeTab === 'ask-reflex' && (
        <div className="hiring-content">
          <div className="chat-column">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>

          <div className="results-column">
            {matchedWorkers.length > 0 ? (
              <WorkerGrid
                workers={matchedWorkers}
                title={jobSpec?.title ? `Matches for "${jobSpec.title}"` : 'Matched Workers'}
              />
            ) : (
              <div className="results-placeholder">
                <div className="placeholder-content">
                  <Briefcase size={48} strokeWidth={1} />
                  <h3>Worker matches will appear here</h3>
                  <p>
                    Complete the conversation to see workers that match your job requirements
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'published-jobs' && (
        <div className="tab-empty-state">
          <div className="placeholder-content">
            <FileText size={48} strokeWidth={1} />
            <h3>No published jobs yet</h3>
            <p>
              Jobs you publish will appear here for workers to discover
            </p>
          </div>
        </div>
      )}

      {activeTab === 'oz' && (
        <div className="oz-content">
          {isLoadingData ? (
            <div className="oz-loading">
              <Loader2 size={32} className="oz-spinner" />
              <p>Loading data from Supabase...</p>
            </div>
          ) : (
          <>
          {/* Markets Section */}
          <section className="oz-section oz-section-markets">
            <div className={`oz-section-header${editingSection === 'markets' ? ' oz-section-header--editing' : ''}`}>
              <h2 className="section-title">Markets (Live Only)</h2>
              <div className="oz-section-actions">
                <div className="oz-search-control">
                  <Search size={18} className="oz-search-icon" />
                  <input
                    type="text"
                    className="oz-search-input"
                    placeholder="Search..."
                    value={marketsSearch}
                    onChange={(e) => setMarketsSearch(e.target.value)}
                  />
                  {marketsSearch && (
                    <>
                      <button
                        className="oz-search-clear"
                        onClick={() => setMarketsSearch('')}
                      >
                        <X size={18} />
                      </button>
                      <div className="oz-search-nav">
                        <button
                          className="oz-search-nav-btn"
                          onClick={() => navigateMatch('prev', marketsMatches, marketsMatchIndex, setMarketsMatchIndex)}
                          disabled={marketsMatches.length === 0}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="oz-search-count">
                          {marketsMatches.length > 0 ? `${marketsMatchIndex + 1}/${marketsMatches.length}` : '0'}
                        </span>
                        <button
                          className="oz-search-nav-btn"
                          onClick={() => navigateMatch('next', marketsMatches, marketsMatchIndex, setMarketsMatchIndex)}
                          disabled={marketsMatches.length === 0}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {editingSection === 'markets' && <span className="oz-section-divider" />}
                {editingSection === 'markets' ? (
                  <>
                    <input
                      type="text"
                      className="oz-header-input oz-city-input"
                      placeholder="City"
                      value={newItemInput}
                      onChange={(e) => setNewItemInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newItemInput.trim() && newMarketState.trim()) {
                          setOzMarkets([...ozMarkets, { name: newItemInput.trim(), state: newMarketState.trim().toUpperCase() }]);
                          setNewItemInput('');
                          setNewMarketState('');
                        }
                      }}
                    />
                    <input
                      type="text"
                      className="oz-header-input oz-state-input"
                      placeholder="State"
                      value={newMarketState}
                      onChange={(e) => setNewMarketState(e.target.value)}
                      maxLength={4}
                    />
                    <button
                      className="oz-header-add-btn"
                      onClick={() => {
                        if (newItemInput.trim() && newMarketState.trim()) {
                          setOzMarkets([...ozMarkets, { name: newItemInput.trim(), state: newMarketState.trim().toUpperCase() }]);
                          setNewItemInput('');
                          setNewMarketState('');
                        }
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    <button
                      className="oz-save-btn"
                      onClick={saveMarkets}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 size={14} className="oz-spinner" /> : null}
                      {isSaving ? 'Saving...' : 'Save to Database'}
                    </button>
                    <button
                      className="oz-cancel-btn"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="oz-edit-btn"
                    onClick={() => startEditing('markets')}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                )}
              </div>
            </div>
            {saveError && editingSection === 'markets' && (
              <p className="oz-save-error">{saveError}</p>
            )}
            <p className="oz-header-footnotes">
              *Need to determine how to handle regions like Central New Jersey<br />
              *Need to determine how to handle not live markets
            </p>
            <div className="oz-section-body">
              <div className="oz-markets-by-state">
                {ozSortedStates.map(state => (
                  <div key={state} className="oz-state-group">
                    <h3 className="oz-state-header">{state}</h3>
                    <div className="oz-state-cities">
                      {ozMarketsByState[state].map((city, idx) => {
                        const marketIdx = ozMarkets.findIndex(m => m.name === city && m.state === state);
                        const matchIdx = marketsMatches.findIndex(m => m.idx === marketIdx);
                        const isMatch = matchIdx !== -1;
                        const isCurrentMatch = isMatch && matchIdx === marketsMatchIndex;
                        return editingSection === 'markets' ? (
                          <span
                            key={idx}
                            className="oz-chip oz-chip-inline"
                          >
                            {city}
                            <button
                              className="oz-chip-remove"
                              onClick={() => setOzMarkets(ozMarkets.filter((_, i) => i !== marketIdx))}
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ) : (
                          <span
                            key={idx}
                            className={`oz-city-item${isMatch ? ' oz-search-match' : ''}${isCurrentMatch ? ' oz-search-current' : ''}`}
                          >
                            {city}
                          </span>
                        );
                      })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </section>

          {/* Roles Section */}
          <section className="oz-section">
            <div className={`oz-section-header${editingSection === 'roles' ? ' oz-section-header--editing' : ''}`}>
              <h2 className="section-title">Roles</h2>
              <div className="oz-section-actions">
                <div className="oz-search-control">
                  <Search size={18} className="oz-search-icon" />
                  <input
                    type="text"
                    className="oz-search-input"
                    placeholder="Search..."
                    value={rolesSearch}
                    onChange={(e) => setRolesSearch(e.target.value)}
                  />
                  {rolesSearch && (
                    <>
                      <button
                        className="oz-search-clear"
                        onClick={() => setRolesSearch('')}
                      >
                        <X size={18} />
                      </button>
                      <div className="oz-search-nav">
                        <button
                          className="oz-search-nav-btn"
                          onClick={() => navigateMatch('prev', rolesMatches, rolesMatchIndex, setRolesMatchIndex)}
                          disabled={rolesMatches.length === 0}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="oz-search-count">
                          {rolesMatches.length > 0 ? `${rolesMatchIndex + 1}/${rolesMatches.length}` : '0'}
                        </span>
                        <button
                          className="oz-search-nav-btn"
                          onClick={() => navigateMatch('next', rolesMatches, rolesMatchIndex, setRolesMatchIndex)}
                          disabled={rolesMatches.length === 0}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {editingSection === 'roles' && <span className="oz-section-divider" />}
                {editingSection === 'roles' ? (
                  <>
                    <input
                      type="text"
                      className="oz-header-input oz-role-input"
                      placeholder="Role name"
                      value={newItemInput}
                      onChange={(e) => setNewItemInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newItemInput.trim()) {
                          setOzRoles([...ozRoles, { title: newItemInput.trim(), category: newRoleCategory }]);
                          setNewItemInput('');
                        }
                      }}
                    />
                    <select
                      className="oz-header-select"
                      value={newRoleCategory}
                      onChange={(e) => setNewRoleCategory(e.target.value as 'Entry-Level' | 'Specialized' | 'Management')}
                    >
                      <option value="Entry-Level">Entry-Level</option>
                      <option value="Specialized">Specialized</option>
                      <option value="Management">Management</option>
                    </select>
                    <button
                      className="oz-header-add-btn"
                      onClick={() => {
                        if (newItemInput.trim()) {
                          setOzRoles([...ozRoles, { title: newItemInput.trim(), category: newRoleCategory }]);
                          setNewItemInput('');
                        }
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    <button
                      className="oz-save-btn"
                      onClick={saveRoles}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 size={14} className="oz-spinner" /> : null}
                      {isSaving ? 'Saving...' : 'Save to Database'}
                    </button>
                    <button
                      className="oz-cancel-btn"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="oz-edit-btn"
                    onClick={() => startEditing('roles')}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                )}
              </div>
            </div>
            {saveError && editingSection === 'roles' && (
              <p className="oz-save-error">{saveError}</p>
            )}
            <div className="oz-section-body oz-section-body-auto">
              <div className="oz-chips-list oz-chips-display">
                {ozRoles.map((role, idx) => {
                  const matchIdx = rolesMatches.findIndex(m => m.idx === idx);
                  const isMatch = matchIdx !== -1;
                  const isCurrentMatch = isMatch && matchIdx === rolesMatchIndex;
                  return editingSection === 'roles' ? (
                    <span key={idx} className="oz-chip">
                      {role.title}
                      <button
                        className="oz-chip-remove"
                        onClick={() => setOzRoles(ozRoles.filter((_, i) => i !== idx))}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ) : (
                    <span
                      key={idx}
                      className={`oz-chip oz-chip-display${isMatch ? ' oz-search-match' : ''}${isCurrentMatch ? ' oz-search-current' : ''}`}
                    >
                      {role.title}
                    </span>
                  );
                })}
              </div>
              <div className="oz-job-roles-grid">
                  <div className="oz-job-roles-category">
                    <h4 className="oz-category-title">Entry Level</h4>
                    <div className="oz-job-roles-list">
                      {JOB_ROLES.entryLevel.map((role, idx) => (
                        <div key={idx} className="oz-job-role-item">
                          <span className="oz-job-role-title">{role.title}</span>
                          <span className="oz-job-role-desc">{role.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="oz-job-roles-category">
                    <h4 className="oz-category-title">Specialized</h4>
                    <div className="oz-job-roles-list">
                      {JOB_ROLES.specialized.map((role, idx) => (
                        <div key={idx} className="oz-job-role-item">
                          <span className="oz-job-role-title">{role.title}</span>
                          <span className="oz-job-role-desc">{role.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="oz-job-roles-category">
                    <h4 className="oz-category-title">Management</h4>
                    <div className="oz-job-roles-list">
                      {JOB_ROLES.management.map((role, idx) => (
                        <div key={idx} className="oz-job-role-item">
                          <span className="oz-job-role-title">{role.title}</span>
                          <span className="oz-job-role-desc">{role.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="oz-job-roles-category">
                    <h4 className="oz-category-title">Seasonal / Part-Time</h4>
                    <div className="oz-job-roles-list">
                      {JOB_ROLES.seasonal.map((role, idx) => (
                        <div key={idx} className="oz-job-role-item">
                          <span className="oz-job-role-title">{role.title}</span>
                          <span className="oz-job-role-desc">{role.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </section>

          {/* Retailers Section */}
          <section className="oz-section">
            <div className={`oz-section-header${editingSection === 'retailers' ? ' oz-section-header--editing' : ''}`}>
              <h2 className="section-title">Retailers</h2>
              <div className="oz-section-actions">
                <div className="oz-search-control">
                  <Search size={18} className="oz-search-icon" />
                  <input
                    type="text"
                    className="oz-search-input"
                    placeholder="Search..."
                    value={retailersSearch}
                    onChange={(e) => setRetailersSearch(e.target.value)}
                  />
                  {retailersSearch && (
                    <>
                      <button
                        className="oz-search-clear"
                        onClick={() => setRetailersSearch('')}
                      >
                        <X size={18} />
                      </button>
                      <div className="oz-search-nav">
                        <button
                          className="oz-search-nav-btn"
                          onClick={() => navigateMatch('prev', retailersMatches, retailersMatchIndex, setRetailersMatchIndex)}
                          disabled={retailersMatches.length === 0}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="oz-search-count">
                          {retailersMatches.length > 0 ? `${retailersMatchIndex + 1}/${retailersMatches.length}` : '0'}
                        </span>
                        <button
                          className="oz-search-nav-btn"
                          onClick={() => navigateMatch('next', retailersMatches, retailersMatchIndex, setRetailersMatchIndex)}
                          disabled={retailersMatches.length === 0}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {editingSection === 'retailers' && <span className="oz-section-divider" />}
                {editingSection === 'retailers' ? (
                  <>
                    <input
                      type="text"
                      className="oz-header-input oz-retailer-input"
                      placeholder="Retailer name"
                      value={newItemInput}
                      onChange={(e) => setNewItemInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newItemInput.trim()) {
                          setOzRetailers([...ozRetailers, { name: newItemInput.trim(), classification: newRetailerClass }]);
                          setNewItemInput('');
                        }
                      }}
                    />
                    <select
                      className="oz-header-select"
                      value={newRetailerClass}
                      onChange={(e) => setNewRetailerClass(e.target.value as 'Luxury' | 'Mid' | 'Big Box')}
                    >
                      <option value="Luxury">Luxury</option>
                      <option value="Mid">Mid</option>
                      <option value="Big Box">Big Box</option>
                    </select>
                    <button
                      className="oz-header-add-btn"
                      onClick={() => {
                        if (newItemInput.trim()) {
                          setOzRetailers([...ozRetailers, { name: newItemInput.trim(), classification: newRetailerClass }]);
                          setNewItemInput('');
                        }
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                    <button
                      className="oz-save-btn"
                      onClick={saveRetailers}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 size={14} className="oz-spinner" /> : null}
                      {isSaving ? 'Saving...' : 'Save to Database'}
                    </button>
                    <button
                      className="oz-cancel-btn"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="oz-edit-btn"
                    onClick={() => startEditing('retailers')}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                )}
              </div>
            </div>
            {saveError && editingSection === 'retailers' && (
              <p className="oz-save-error">{saveError}</p>
            )}
            <div className="oz-section-body">
              <div className="oz-retailers-grid">
                {(['Luxury', 'Mid', 'Big Box'] as const).map(classification => {
                  const shorthand = classification === 'Luxury' ? 'R' : classification === 'Mid' ? 'G' : 'N';
                  const retailers = ozRetailers
                    .filter(r => r.classification === classification)
                    .sort((a, b) => a.name.localeCompare(b.name));
                  return (
                    <div key={classification} className="oz-retailer-group">
                      <h3 className="oz-retailer-group-title">{classification} ({shorthand}) ({retailers.length})</h3>
                      <div className="oz-retailer-list">
                        {retailers.map((retailer, idx) => {
                          const globalIdx = ozRetailers.findIndex(r => r.name === retailer.name && r.classification === retailer.classification);
                          const matchIdx = retailersMatches.findIndex(m => m.idx === globalIdx);
                          const isMatch = matchIdx !== -1;
                          const isCurrentMatch = isMatch && matchIdx === retailersMatchIndex;
                          return editingSection === 'retailers' ? (
                            <span
                              key={idx}
                              className="oz-retailer-edit-item"
                            >
                              <span className="oz-retailer-name">{formatRetailerDisplayName(retailer.name)}</span>
                              <div className="oz-class-segment">
                                <button
                                  className={`oz-segment-btn ${retailer.classification === 'Luxury' ? 'active' : ''}`}
                                  onClick={() => {
                                    const updated = [...ozRetailers];
                                    updated[globalIdx] = { ...retailer, classification: 'Luxury' };
                                    setOzRetailers(updated);
                                  }}
                                >
                                  R
                                </button>
                                <button
                                  className={`oz-segment-btn ${retailer.classification === 'Mid' ? 'active' : ''}`}
                                  onClick={() => {
                                    const updated = [...ozRetailers];
                                    updated[globalIdx] = { ...retailer, classification: 'Mid' };
                                    setOzRetailers(updated);
                                  }}
                                >
                                  G
                                </button>
                                <button
                                  className={`oz-segment-btn ${retailer.classification === 'Big Box' ? 'active' : ''}`}
                                  onClick={() => {
                                    const updated = [...ozRetailers];
                                    updated[globalIdx] = { ...retailer, classification: 'Big Box' };
                                    setOzRetailers(updated);
                                  }}
                                >
                                  N
                                </button>
                              </div>
                              <button
                                className="oz-chip-remove"
                                onClick={() => setOzRetailers(ozRetailers.filter((_, i) => i !== globalIdx))}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ) : (
                            <span
                              key={idx}
                              className={`oz-retailer-item${isMatch ? ' oz-search-match' : ''}${isCurrentMatch ? ' oz-search-current' : ''}`}
                            >
                              {formatRetailerDisplayName(retailer.name)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Jobs Database Section */}
          <section className="oz-section">
            <div className="oz-section-header">
              <div className="oz-title-with-info">
                <h2 className="section-title">Jobs Database</h2>
                <div className="oz-info-wrapper" ref={jobSitesInfoRef}>
                  <button
                    className="oz-info-btn"
                    onClick={() => setShowJobSitesInfo(!showJobSitesInfo)}
                    title="Job Sites Info"
                  >
                    <Info size={18} />
                  </button>
                  {showJobSitesInfo && (
                    <div className="oz-info-bubble">
                      <div className="oz-info-bubble-header">
                        <h3>Job Sites</h3>
                        <button onClick={() => setShowJobSitesInfo(false)}>
                          <X size={16} />
                        </button>
                      </div>
                      <div className="oz-job-sites">
                        <div className="oz-job-sites-group">
                          <h4 className="oz-job-sites-group-title">General Job Boards</h4>
                          <div className="oz-job-sites-list">
                            {JOB_SITES.general.map((site, idx) => (
                              <div key={idx} className="oz-job-site-item">
                                <span className="oz-job-site-name">
                                  {site.name}
                                  {site.name === 'Indeed + Glassdoor' && (
                                    <span className="oz-connected-badge">
                                      <Link size={12} />
                                      Connected
                                    </span>
                                  )}
                                </span>
                                <span className="oz-job-site-desc">{site.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="oz-job-sites-group">
                          <h4 className="oz-job-sites-group-title">Retail-Specific</h4>
                          <div className="oz-job-sites-list">
                            {JOB_SITES.retailSpecific.map((site, idx) => (
                              <div key={idx} className="oz-job-site-item">
                                <span className="oz-job-site-name">{site.name}</span>
                                <span className="oz-job-site-desc">{site.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="oz-job-sites-group">
                          <h4 className="oz-job-sites-group-title">Hourly/Shift-Based</h4>
                          <div className="oz-job-sites-list">
                            {JOB_SITES.hourlyShift.map((site, idx) => (
                              <div key={idx} className="oz-job-site-item">
                                <span className="oz-job-site-name">{site.name}</span>
                                <span className="oz-job-site-desc">{site.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="oz-section-actions">
              </div>
            </div>
            <div className="oz-filters-row">
              <FilterDropdown
                label="Market"
                options={[...ozMarkets]
                  .sort((a, b) => a.name.localeCompare(b.name) || a.state.localeCompare(b.state))
                  .map(m => `${m.name}, ${m.state}`)}
                selected={jpMarketFilter}
                onSelect={setJpMarketFilter}
                searchValue={marketFilterSearch}
                onSearchChange={setMarketFilterSearch}
              />
              <FilterDropdown
                label="Role"
                options={[...ozRoles]
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map(r => r.title)}
                selected={jpRoleFilter}
                onSelect={setJpRoleFilter}
                searchValue={roleFilterSearch}
                onSearchChange={setRoleFilterSearch}
              />
              <FilterDropdown
                label="Retailer"
                options={ozRetailers.map(r => r.name)}
                selected={jpRetailerFilter}
                onSelect={setJpRetailerFilter}
                searchValue={retailerFilterSearch}
                onSearchChange={setRetailerFilterSearch}
              />
              <FilterDropdown
                label="Retailer Class"
                options={['Luxury', 'Mid', 'Big Box']}
                selected={jpClassFilter}
                onSelect={setJpClassFilter}
                searchValue={classFilterSearch}
                onSearchChange={setClassFilterSearch}
              />
              <FilterDropdown
                label="Job Site"
                options={JOB_SOURCES}
                selected={jpSourceFilter}
                onSelect={setJpSourceFilter}
                searchValue={sourceFilterSearch}
                onSearchChange={setSourceFilterSearch}
              />
            </div>
            {/* Filter chips */}
            {(jpMarketFilter.length > 0 || jpRoleFilter.length > 0 || jpRetailerFilter.length > 0 || jpClassFilter.length > 0 || jpSourceFilter.length > 0) && (
              <div className="oz-filter-chips">
                {jpMarketFilter.map(v => (
                  <span key={`market-${v}`} className="oz-filter-chip">
                    {v}
                    <button onClick={() => setJpMarketFilter(jpMarketFilter.filter(x => x !== v))}><X size={12} /></button>
                  </span>
                ))}
                {jpRoleFilter.map(v => (
                  <span key={`role-${v}`} className="oz-filter-chip">
                    {v}
                    <button onClick={() => setJpRoleFilter(jpRoleFilter.filter(x => x !== v))}><X size={12} /></button>
                  </span>
                ))}
                {jpRetailerFilter.map(v => (
                  <span key={`retailer-${v}`} className="oz-filter-chip">
                    {v}
                    <button onClick={() => setJpRetailerFilter(jpRetailerFilter.filter(x => x !== v))}><X size={12} /></button>
                  </span>
                ))}
                {jpClassFilter.map(v => (
                  <span key={`class-${v}`} className="oz-filter-chip">
                    {v}
                    <button onClick={() => setJpClassFilter(jpClassFilter.filter(x => x !== v))}><X size={12} /></button>
                  </span>
                ))}
                {jpSourceFilter.map(v => (
                  <span key={`source-${v}`} className="oz-filter-chip">
                    {v}
                    <button onClick={() => setJpSourceFilter(jpSourceFilter.filter(x => x !== v))}><X size={12} /></button>
                  </span>
                ))}
                <button
                  className="oz-clear-all-btn"
                  onClick={() => {
                    setJpMarketFilter([]);
                    setJpRoleFilter([]);
                    setJpRetailerFilter([]);
                    setJpClassFilter([]);
                    setJpSourceFilter([]);
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
            <div className="oz-job-postings-placeholder">
              <p>Job postings will appear here once connected to Supabase</p>
            </div>
          </section>

          </>
          )}
        </div>
      )}
    </div>
  );
}

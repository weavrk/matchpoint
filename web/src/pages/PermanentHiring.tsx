import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, FileText, Pencil, X, Plus, ChevronDown, Search, ChevronLeft, ChevronRight, Check, Info, Loader2, Clipboard, CircleMinus, BotOff, BotMessageSquare, UserStar, Database } from 'lucide-react';
import { ChatInterface } from '../components/Chat';
import { ScrapeModal, type ScrapeConfig } from '../components/ScrapeModal';
import { ScrapeProgressModal, type ScrapeProgressData } from '../components/ScrapeProgressModal';
import { UnmatchedRolesModal } from '../components/UnmatchedRolesModal';
import { WorkerCard } from '../components/Workers/WorkerCard';
import { GeminiService, MockGeminiService } from '../services/gemini';
import { matchWorkers } from '../services/workerMatching';
import {
  fetchMarkets,
  fetchRoles,
  fetchRetailers,
  fetchRetailersLive,
  fetchJobPostings,
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
} from '../services/supabase';
import { SAMPLE_WORKERS } from '../data/workers';
import { SAMPLE_RETAILER } from '../data/retailer';
import type { ChatMessage, MatchedWorker, JobSpec, PublishedJob } from '../types';
import { PublishedJobCard } from '../components/Jobs';
import './PermanentHiring.css';

type TabId = 'ask-reflex' | 'published-jobs' | 'reflex-talent' | 'oz';

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

export function PermanentHiring() {
  const [activeTab, setActiveTab] = useState<TabId>('ask-reflex');
  const [agentActive, setAgentActive] = useState(false); // Agent on/off state (resets on page refresh)
  const [showDevMenu, setShowDevMenu] = useState(false); // Floating dev menu

  const [showJobSitesInfo, setShowJobSitesInfo] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);

  // Dev menu ref for click-outside
  const devMenuRef = useRef<HTMLDivElement>(null);

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
  const allTalentWorkers: MatchedWorker[] = useMemo(() =>
    SAMPLE_WORKERS.map(w => ({ ...w, matchScore: 0, matchReasons: [] })),
    []
  );

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

  // Close dev menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (devMenuRef.current && !devMenuRef.current.contains(event.target as Node)) {
        setShowDevMenu(false);
      }
    }
    if (showDevMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDevMenu]);

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
  const [, setMatchedWorkers] = useState<MatchedWorker[]>([]);
  const [, setJobSpec] = useState<JobSpec | null>(null);

  // Published jobs state with sample data
  const [publishedJobs, setPublishedJobs] = useState<PublishedJob[]>([
    {
      id: '1',
      role: 'Brand Representative',
      employmentType: 'Part-time',
      market: 'Austin',
      pay: '$18-20/hr',
      traits: ['Customer Engagement', 'Self-Starter'],
      benefits: ['Employee discount', 'Flexible scheduling'],
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'active',
      engagement: { views: 47, likes: 12, applications: 6 },
      candidates: [
        { workerId: 'w1', workerName: 'Sofia M.', shiftVerified: true, shiftsOnReflex: 47, status: 'applied', statusDate: new Date(), matchScore: 94, topEndorsements: ['Customer Engagement', 'Positive Attitude'] },
        { workerId: 'w2', workerName: 'Marcus T.', shiftVerified: true, shiftsOnReflex: 32, status: 'applied', statusDate: new Date(), matchScore: 89, topEndorsements: ['Self-Starter', 'Work Pace'] },
        { workerId: 'w3', workerName: 'Elena R.', shiftVerified: true, shiftsOnReflex: 28, status: 'interested', statusDate: new Date(), matchScore: 87, topEndorsements: ['Team Player', 'Adaptable'] },
        { workerId: 'w4', workerName: 'James K.', shiftVerified: false, shiftsOnReflex: 15, status: 'viewed', statusDate: new Date(), matchScore: 82, topEndorsements: ['Preparedness'] },
        { workerId: 'w5', workerName: 'Priya S.', shiftVerified: true, shiftsOnReflex: 51, status: 'applied', statusDate: new Date(), matchScore: 96, topEndorsements: ['Customer Engagement', 'Self-Starter'] },
        { workerId: 'w6', workerName: 'David L.', shiftVerified: true, shiftsOnReflex: 22, status: 'invited', statusDate: new Date(), matchScore: 78, topEndorsements: ['Work Pace'] },
      ],
    },
    {
      id: '2',
      role: 'Sales Associate',
      employmentType: 'Full-time',
      market: 'Austin',
      pay: '$17-19/hr',
      traits: ['Team Player', 'Positive Attitude', 'Adaptable'],
      benefits: ['Health insurance', '401(k) matching', 'Paid time off'],
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'active',
      engagement: { views: 89, likes: 24, applications: 11 },
      candidates: [
        { workerId: 'w7', workerName: 'Jordan F.', shiftVerified: true, shiftsOnReflex: 63, status: 'applied', statusDate: new Date(), matchScore: 92, topEndorsements: ['Team Player', 'Positive Attitude'] },
        { workerId: 'w8', workerName: 'Ashley N.', shiftVerified: true, shiftsOnReflex: 41, status: 'applied', statusDate: new Date(), matchScore: 88, topEndorsements: ['Adaptable', 'Customer Engagement'] },
        { workerId: 'w9', workerName: 'Chris W.', shiftVerified: true, shiftsOnReflex: 35, status: 'interested', statusDate: new Date(), matchScore: 85, topEndorsements: ['Self-Starter'] },
      ],
    },
  ]);

  // Handle job actions (pause/resume/close)
  const handleJobAction = useCallback((jobId: string, action: 'pause' | 'resume' | 'close') => {
    setPublishedJobs(prev => prev.map(job => {
      if (job.id !== jobId) return job;
      const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'closed';
      return { ...job, status: newStatus };
    }));
  }, []);

  // Publish a new job from chat
  const publishJob = useCallback((jobData: { role: string; employmentType: string; market: string; pay: string; traits: string[]; benefits: string[] }) => {
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
    // Don't auto-navigate - stay in chat so user can see success banner and optionally view candidates
  }, []);
  const [geminiService] = useState(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      console.log('Using real Gemini service');
      return new GeminiService(apiKey);
    }
    console.log('No API key found, using mock service');
    return new MockGeminiService();
  });
  const chatStartedRef = useRef(false);

  // Toggle agent on/off - just toggles state for API usage control (no layout changes)
  const toggleAgent = useCallback(() => {
    setAgentActive(prev => !prev);
  }, []);


  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
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
        await geminiService.startChat(
          'Mike', // userName
          SAMPLE_RETAILER.name,
          classificationMap[SAMPLE_RETAILER.brandTier] || 'Specialty',
          'Austin' // market
        );
        chatStartedRef.current = true;
      }

      const response = await geminiService.sendMessage(content);

      // Check if response contains worker cards AND follow-up text (compensation question)
      // If so, split into two separate messages
      const workerCardsMatch = response.text.match(/---WORKER_CARDS_START---([\s\S]*?)---WORKER_CARDS_END---/);

      if (workerCardsMatch) {
        // Find text before and after worker cards
        const parts = response.text.split(/---WORKER_CARDS_END---/);
        const beforeAndCards = parts[0] + '---WORKER_CARDS_END---';
        const afterCards = parts[1]?.trim();

        // First message: text with worker cards (up to and including the cards)
        const workerCardsMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: beforeAndCards,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, workerCardsMessage]);

        // If there's follow-up text after the cards, add it as a second message after a delay
        if (afterCards && afterCards.length > 10) {
          // Add a small delay to make it feel like two separate responses
          await new Promise(resolve => setTimeout(resolve, 800));

          const followUpMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: afterCards,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, followUpMessage]);
        }
      } else {
        // No worker cards, just add the message normally
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      if (response.jobSpec) {
        const spec = { ...response.jobSpec, retailerName: SAMPLE_RETAILER.name } as any;
        setJobSpec(spec);
        const matches = matchWorkers(SAMPLE_WORKERS, spec);
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
      </nav>

      {activeTab === 'ask-reflex' && (
        <div className={`hiring-content${messages.length > 0 ? ' conversation-mode' : ''}`}>
          <div className="chat-column">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
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

      {activeTab === 'reflex-talent' && (
        <div className="reflex-talent-content">
          <div className="reflex-talent-grid">
            {allTalentWorkers.slice(0, talentDisplayCount).map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
          {talentDisplayCount < allTalentWorkers.length && (
            <div ref={talentLoadMoreRef} className="reflex-talent-load-more">
              <Loader2 size={24} className="oz-spinner" />
              <span>Loading more...</span>
            </div>
          )}
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
              <h2 className="section-title">Markets ({ozMarkets.length}) <span className="section-title-sub">Live Only</span></h2>
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
              <h2 className="section-title">Roles ({ozRoles.length})</h2>
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
                      onChange={(e) => setNewRoleCategory(e.target.value as 'Sales Floor' | 'Sales Support' | 'Back of House' | 'Specialized' | 'Management')}
                    >
                      <option value="Sales Floor">Sales Floor</option>
                      <option value="Sales Support">Sales Support</option>
                      <option value="Back of House">Back of House</option>
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
                    <h4 className="oz-category-title">Sales Floor</h4>
                    <div className="oz-job-roles-list">
                      {JOB_ROLES.salesFloor.map((role, idx) => (
                        <div key={idx} className="oz-job-role-item">
                          <span className="oz-job-role-title">{role.title}</span>
                          <span className="oz-job-role-desc">{role.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="oz-job-roles-category">
                    <h4 className="oz-category-title">Sales Support</h4>
                    <div className="oz-job-roles-list">
                      {JOB_ROLES.salesSupport.map((role, idx) => (
                        <div key={idx} className="oz-job-role-item">
                          <span className="oz-job-role-title">{role.title}</span>
                          <span className="oz-job-role-desc">{role.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="oz-job-roles-category">
                    <h4 className="oz-category-title">Back of House</h4>
                    <div className="oz-job-roles-list">
                      {JOB_ROLES.backOfHouse.map((role, idx) => (
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
                </div>
              </div>
          </section>

          {/* Retailers Live Section */}
          <section className="oz-section">
            <div className="oz-section-header">
              <h2 className="section-title">Retailers ({retailersLive.length}) <span className="section-title-sub">Live on Reflex</span></h2>
            </div>
            {retailersLive.length === 0 ? (
              <div className="oz-retailers-live-placeholder">
                <span className="oz-placeholder-text">No retailers found in <code>retailers_live</code> table</span>
              </div>
            ) : (
              <div className="oz-tag-grid">
                {retailersLive.map((r) => (
                  <span key={r.id} className="oz-tag oz-tag--readonly">
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Retailers National Database Section */}
          <section className="oz-section">
            <div className={`oz-section-header${editingSection === 'retailers' ? ' oz-section-header--editing' : ''}`}>
              <h2 className="section-title">Retailers ({ozRetailers.length}) <span className="section-title-sub">National Database</span></h2>
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
                      onChange={(e) => setNewRetailerClass(e.target.value as 'Luxury' | 'Specialty' | 'Big Box')}
                    >
                      <option value="Luxury">Luxury</option>
                      <option value="Specialty">Specialty</option>
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
                {(['Luxury', 'Specialty', 'Big Box'] as const).map(classification => {
                  const shorthand = classification === 'Luxury' ? 'R' : classification === 'Specialty' ? 'G' : 'N';
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
                                  className={`oz-segment-btn ${retailer.classification === 'Specialty' ? 'active' : ''}`}
                                  onClick={() => {
                                    const updated = [...ozRetailers];
                                    updated[globalIdx] = { ...retailer, classification: 'Specialty' };
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
                <h2 className="section-title">Jobs Database ({filteredJobPostings.length})</h2>
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
                                  {site.name === 'Indeed' && (
                                    <span className="oz-connected-badge">
                                      <Link size={12} />
                                      Connected
                                    </span>
                                  )}
                                  {site.protected && (
                                    <span className="oz-protected-badge">
                                      <CircleMinus size={12} />
                                      Heavily Protected
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="oz-section-actions">
                {!isScraping ? (
                  <button
                    className="oz-run-scrape-btn"
                    onClick={() => setShowScrapeModal(true)}
                  >
                    Run Scrape
                  </button>
                ) : (
                  <button
                    className="oz-run-scrape-btn oz-run-scrape-btn--in-progress"
                    onClick={() => setShowScrapeProgressModal(true)}
                  >
                    <Loader2 size={14} className="oz-spinner" />
                    Scraping...
                  </button>
                )}
              </div>
            </div>
            <div className="oz-filters-row">
              <FilterDropdown
                label="Market"
                options={jobFilterOptions.markets}
                selected={jpMarketFilter}
                onSelect={setJpMarketFilter}
                searchValue={marketFilterSearch}
                onSearchChange={setMarketFilterSearch}
              />
              <FilterDropdown
                label="Retailer"
                options={jobFilterOptions.retailers}
                selected={jpRetailerFilter}
                onSelect={setJpRetailerFilter}
                searchValue={retailerFilterSearch}
                onSearchChange={setRetailerFilterSearch}
              />
              <FilterDropdown
                label="Retailer Class"
                options={jobFilterOptions.classes}
                selected={jpClassFilter}
                onSelect={setJpClassFilter}
                searchValue={classFilterSearch}
                onSearchChange={setClassFilterSearch}
              />
              <FilterDropdown
                label="Role"
                options={jobFilterOptions.roles}
                selected={jpRoleFilter}
                onSelect={setJpRoleFilter}
                searchValue={roleFilterSearch}
                onSearchChange={setRoleFilterSearch}
              />
            </div>
            {/* Filter chips */}
            {(jpMarketFilter.length > 0 || jpRoleFilter.length > 0 || jpRetailerFilter.length > 0 || jpClassFilter.length > 0) && (
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
                <button
                  className="oz-clear-all-btn"
                  onClick={() => {
                    setJpMarketFilter([]);
                    setJpRoleFilter([]);
                    setJpRetailerFilter([]);
                    setJpClassFilter([]);
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
            {jobPostings.length === 0 ? (
              <div className="oz-job-postings-placeholder">
                <p>Job postings will appear here once you run a scrape</p>
              </div>
            ) : (
              <div className="oz-jobs-table-container">
                <table className="oz-jobs-table">
                  <thead>
                    <tr>
                      <th className="oz-sortable-header" onClick={() => handleJobSort('source')}>
                        Source {jobSortColumn === 'source' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="oz-sortable-header" onClick={() => handleJobSort('market')}>
                        Market {jobSortColumn === 'market' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="oz-sortable-header" onClick={() => handleJobSort('retailer')}>
                        Retailer {jobSortColumn === 'retailer' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="oz-sortable-header" onClick={() => handleJobSort('role')}>
                        Role {jobSortColumn === 'role' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="oz-sortable-header" onClick={() => handleJobSort('salary')}>
                        Salary {jobSortColumn === 'salary' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="oz-sortable-header" onClick={() => handleJobSort('employment_type')}>
                        Employment Type {jobSortColumn === 'employment_type' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobPostings.map(job => {
                      const role = ozRoles.find(r => r.id === job.role_id);
                      return (
                        <tr key={job.id}>
                          <td className="oz-job-source">
                            {job.source || '—'}
                            {job.source_url && (
                              <button
                                className="oz-job-source-link"
                                onClick={() => {
                                  navigator.clipboard.writeText(job.source_url!);
                                }}
                                title="Copy URL to clipboard"
                              >
                                <Clipboard size={14} />
                              </button>
                            )}
                          </td>
                          <td>{job.market_name || '—'}</td>
                          <td>{job.company || '—'}</td>
                          <td>{role?.title || '—'}</td>
                          <td>{job.salary || '—'}</td>
                          <td>{job.employment_type || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          </>
          )}
        </div>
      )}

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

      {/* Floating Dev Menu */}
      <div className="dev-menu-container" ref={devMenuRef}>
        <button
          className="dev-menu-trigger"
          onClick={() => setShowDevMenu(!showDevMenu)}
          title="Dev Tools"
        />
        {showDevMenu && (
          <div className="dev-menu-dropdown">
            <button
              className={`dev-menu-item dev-menu-item-bot${agentActive ? ' bot-on' : ''}`}
              onClick={() => {
                toggleAgent();
                setShowDevMenu(false);
              }}
            >
              <span className="dev-menu-icon">
                {agentActive ? <BotMessageSquare size={16} /> : <BotOff size={16} />}
              </span>
              <span className="dev-menu-label">Good Bot {agentActive ? 'On' : 'Off'}</span>
            </button>
            <button
              className={`dev-menu-item${activeTab === 'reflex-talent' ? ' active' : ''}`}
              onClick={() => {
                setActiveTab('reflex-talent');
                setShowDevMenu(false);
              }}
            >
              <span className="dev-menu-icon">
                <UserStar size={16} />
              </span>
              <span className="dev-menu-label">Reflex Talent</span>
            </button>
            <button
              className={`dev-menu-item${activeTab === 'oz' ? ' active' : ''}`}
              onClick={() => {
                setActiveTab('oz');
                setShowDevMenu(false);
              }}
            >
              <span className="dev-menu-icon">
                <Database size={16} />
              </span>
              <span className="dev-menu-label">Oz</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export type BrandTier = 'mid' | 'elevated' | 'luxury';

export type Endorsement =
  | 'customer-engagement'
  | 'self-starter'
  | 'preparedness'
  | 'perfect-attire'
  | 'work-pace'
  | 'productivity'
  | 'attention-to-detail'
  | 'team-player'
  | 'positive-attitude'
  | 'adaptable';

export interface WorkerProfile {
  id: string;
  name: string;
  photo?: string;
  shiftVerified: boolean;
  shiftsOnReflex: number;
  brandsWorked: { name: string; tier: BrandTier }[];
  market: string;
  preference: 'FT' | 'PT' | 'Both';
  endorsements: Endorsement[];
  onTimeRating: 'Exceptional' | null;
  commitmentScore: 'Exceptional' | null;
  invitedBackStores: number;
  about: string;
  previousExperience: {
    company: string;
    duration: string;
    roles: string[];
  }[];
  workStyle: {
    rolePreferences: string[];
    traits: string[];
  };
}

export interface JobSpec {
  title: string;
  market: string;
  brandTier: BrandTier[];
  preference: 'FT' | 'PT' | 'Both';
  requirements: string[];
  description: string;
  retailerName: string;
}

export interface RetailerProfile {
  id: string;
  name: string;
  market: string;
  brandTier: BrandTier;
  classification: 'Luxury' | 'Specialty' | 'Big Box';
  about: string;
  starRating: number;
  wouldWorkAgainPct: number;
  totalFlexesWorked: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MatchedWorker extends WorkerProfile {
  matchScore: number;
  matchReasons: string[];
}

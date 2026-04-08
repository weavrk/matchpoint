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

export interface WorkerReliability {
  cancellations: number;
  noShows: number;
  lastMinuteFills: number;
}

export interface WorkerAvailability {
  weekends: boolean;
  openingShifts: boolean;
  closingShifts: boolean;
}

export interface WorkerReflexActivity {
  shiftsByTier: { luxury: number; elevated: number; mid: number };
  longestRelationship: { brand: string; flexCount: number } | null;
  tierProgression: 'upward' | 'stable';
}

export interface RetailerQuote {
  quote: string;
  role: string;
  brand: string;
  reviewerName?: string;
}

export interface RetailerFeedback {
  summary: string;
  quotes: RetailerQuote[];
}

export interface InterviewTranscriptEntry {
  question: string;
  answer: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  photo?: string;
  gender?: 'male' | 'female';
  shiftVerified: boolean;
  shiftsOnReflex: number;
  brandsWorked: { name: string; tier: BrandTier }[];
  market: string;
  endorsementCounts?: Record<string, number> | null;
  invitedBackStores: number;
  aboutMe?: string | null;
  previousExperience: {
    company: string;
    duration: string;
    roles: string[];
  }[];
  reflexActivity: WorkerReflexActivity | null;
  activelyLooking: boolean;
  retailerQuotes?: RetailerQuote[];
  retailerSummary?: string;
  // Reliability metrics
  onTimeRating?: string | null;
  commitmentScore?: string | null;
  tardyRatio?: string | null;
  tardyPercent?: number | null;
  urgentCancelRatio?: string | null;
  urgentCancelPercent?: number | null;
  // Tier and IDs
  currentTier?: string | null;
  workerUuid?: string | null;
  workerId?: number | null;
  // Interview data
  interviewTranscript?: InterviewTranscriptEntry[] | Record<string, unknown> | null;
  // Shift experience (separate from endorsements - task/skill based tags)
  shiftExperience?: Record<string, number> | null;
  // Unique store locations worked
  uniqueStoreCount?: number | null;
  /** Number of stores that favorited this worker (from workers.store_favorite_count column). */
  storeFavoriteCount?: number | null;
  // Market favorite (legacy DB flag)
  marketFavorite?: boolean;
  /** Brand names that favorited this worker in-market (from workers.favorited_by_brands). */
  favoritedByBrands?: string[] | null;
  // Experience level for filtering (not displayed on card)
  experienceLevel?: 'rising' | 'experienced' | 'seasoned' | 'proven_leader' | null;
  // Legacy fields from sample workers (for compatibility)
  preference?: 'FT' | 'PT' | 'Both';
  endorsements?: Endorsement[];
  about?: string;
  workStyle?: {
    rolePreferences: string[];
    traits: string[];
  };
  reliability?: WorkerReliability | null;
  availability?: WorkerAvailability | null;
  targetBrands?: string[] | null;
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

export type FocusRoute = 'employment' | 'brands' | 'experience';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedRoute?: FocusRoute;
  /** V2 location chat: optional assistant action below the bubble */
  locationCta?: {
    variant: 'select_market' | 'browse_markets';
    marketId?: string;
    marketLabel?: string;
  };
}

export interface MatchedWorker extends WorkerProfile {
  matchScore: number;
  matchReasons: string[];
}

// Candidate response status for published jobs
// Flow: invited → viewed → interested → applied → (Reflex coordinates shortlist)
export type CandidateStatus = 'invited' | 'viewed' | 'interested' | 'applied';

// A candidate who has been invited or responded to a job
export interface JobCandidate {
  workerId: string;
  workerName: string;
  workerPhoto?: string;
  shiftVerified: boolean;
  shiftsOnReflex: number;
  status: CandidateStatus;
  statusDate: Date;
  matchScore: number;
  topEndorsements: string[];
}

// Engagement metrics for a published job
export interface JobEngagement {
  views: number;        // Eye icon - workers who viewed
  likes: number;        // Heart icon - workers who liked/saved
  applications: number; // Briefcase icon - workers who applied
}

// A published job posting
export interface PublishedJob {
  id: string;
  role: string;
  employmentType: 'Full-time' | 'Part-time' | 'Open to either';
  market: string;
  pay: string;
  traits: string[];
  benefits: string[];
  publishedAt: Date;
  status: 'active' | 'paused' | 'closed';
  engagement: JobEngagement;
  candidates: JobCandidate[];
}

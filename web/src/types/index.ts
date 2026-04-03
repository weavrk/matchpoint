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
  storeFavoriteCount: number | null;
}

export interface RetailerQuote {
  quote: string;
  role: string;
  brand: string;
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
  shiftVerified: boolean;
  shiftsOnReflex: number;
  brandsWorked: { name: string; tier: BrandTier }[];
  market: string;
  endorsementCounts: Record<string, number> | null;
  invitedBackStores: number;
  aboutMe: string | null;
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

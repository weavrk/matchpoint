export type ExperienceType =
  | 'footwear'
  | 'apparel'
  | 'electronics'
  | 'beauty'
  | 'grocery'
  | 'sporting goods'
  | 'home'
  | 'general retail';

export type WorkerPreference = 'Full-Time' | 'Part-Time' | 'Part-Time, Full-Time';
export type RatingValue = 'Exceptional' | null;

export interface RetailerEndorsements {
  customerEngagement?: number;
  selfStarter?: number;
  preparedness?: number;
  perfectAttire?: number;
  workPace?: number;
  productivity?: number;
  attentionToDetail?: number;
  teamPlayer?: number;
  positiveAttitude?: number;
  adaptable?: number;
}

export interface PreviousExperience {
  company: string;
  duration: string;
  roles: string[];
}

export interface WorkStyle {
  rolePreferences: string[];
  traits: {
    selfDirected: boolean;
    comfortableWithTaskSwitching: boolean;
    prefersFastPacedEnvironment: boolean;
    prefersIndependentFocus: boolean;
    needsDetailedDirection: boolean;
    physicallyActive: boolean;
  };
}

export interface WorkerProfile {
  id: string;
  name: string;
  market: string;
  brandsWorked: string[];
  experienceTypes: ExperienceType[];
  shiftsOnReflex: number;
  shiftVerified: boolean;
  preference: WorkerPreference;
  retailerEndorsements: RetailerEndorsements;
  onTimeRating: RatingValue;
  commitmentScore: RatingValue;
  invitedBackStores: number;
  about: string;
  interviewTranscript: string;
  previousRetailExperience: PreviousExperience[];
  workStyle: WorkStyle;
}

export interface JobSpec {
  title: string;
  market: string;
  experienceTypes: string[];
  brands: string[];
  preference: 'FT' | 'PT' | 'Both';
  requirements: string[];
  description: string;
  retailerName: string;
  payRange: string | null;
  schedule: string | null;
}

export interface RetailerProfile {
  id: string;
  name: string;
  logo: string;
  market: string;
  location: string;
  storeType: ExperienceType[];
  about: string;
  currentOpening?: {
    role: string;
    employmentType: string;
    hourlyRate: string;
    benefits: string[];
    schedule: string;
  };
  starRating: number;
  wouldWorkAgainPct: number;
  totalFlexesAtStore: number;
  activeJobPostings: number;
}

export interface MatchedWorker extends WorkerProfile {
  matchScore: number;
  matchReasons: string[];
}

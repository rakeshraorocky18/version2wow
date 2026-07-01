export type MatchTab = 'suggestions' | 'search' | 'shortlist' | 'interests';

export interface MatchInterest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  compatibilityScore?: number;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
  senderProfile?: MatchProfile | null;
  receiverProfile?: MatchProfile | null;
  partnerProfile?: MatchProfile | null;
  partnerUserId?: string | null;
}

export type InterestSubTab = 'received' | 'sent' | 'accepted';

export interface MatchFilters {
  gender: string;
  religion: string;
  caste: string;
  minAge: string;
  maxAge: string;
  horoscopeAvailable: boolean;
}

export interface CompatibilityInfo {
  score: number;
  breakdown: Record<string, number>;
  highlights: string[];
  engine: string;
}

export interface MatchProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  age?: number;
  height?: number;
  city?: string;
  state?: string;
  country?: string;
  religion?: string;
  caste?: string;
  subCaste?: string;
  maritalStatus?: string;
  occupation?: string;
  education?: string;
  bio?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  onlineStatus?: boolean;
  photos?: string[];
  wizardProfile?: { profilePhoto?: string };
  compatibilityScore?: number;
  compatibility?: CompatibilityInfo;
}

export const EMPTY_FILTERS: MatchFilters = {
  gender: '',
  religion: '',
  caste: '',
  minAge: '',
  maxAge: '',
  horoscopeAvailable: false,
};

export interface MatchProfile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  religion?: string;
  bio?: string;
  age?: number;
  dateOfBirth?: string;
  isVerified?: boolean;
  profilePhoto?: string;
  photos?: string[];
  compatibilityScore?: number;
  compatibility?: { score?: number; breakdown?: Record<string, number>; highlights?: string[] };
  wizardProfile?: {
    profilePhoto?: string;
    expressYourself?: { aboutMe?: string };
    personalDetails?: { firstName?: string; lastName?: string };
  };
  expressYourself?: { aboutMe?: string };
  interestStatus?: string;
}

export interface MatchInterest {
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
  partnerUserId?: string;
  receiverId?: string;
  senderId?: string;
  partnerProfile?: MatchProfile | null;
  receiverProfile?: MatchProfile | null;
  senderProfile?: MatchProfile | null;
  compatibilityScore?: number;
}

export interface MatchFilters {
  gender?: string;
  minAge?: number;
  maxAge?: number;
  city?: string;
  state?: string;
  country?: string;
  religion?: string;
}

export const EMPTY_FILTERS: MatchFilters = {};

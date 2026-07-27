import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
// import { useMyMatchProfile } from './useMatchmaking';
import { usePlannerPlans } from './usePlanner';
import {
  apiProfileToForm,
  profileCompletion,
  getMissingBySection,
  isSectionValid,
  EDIT_SECTIONS,
  type ProfileForm,
} from '../lib/profileEditValidation';
import { getMainProfilePhoto, getPhotoUrl } from '../lib/profileUtils';
import type { BudgetCategory } from '../components/dashboard/BudgetCard';
import type { PlannerTask } from '../components/dashboard/PlannerTimeline';
import type { VendorItem } from '../components/dashboard/VendorCarousel';
import type { ActivityItem } from '../components/dashboard/RecentActivity';
import type { WeddingMilestone } from '../components/dashboard/ProgressCard';
import type { PlannerTimeline as PlannerTimelineData } from '../types/planner';
import { EMPTY_FILTERS, type MatchInterest, type MatchProfile } from '../types/matchmaking';

interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  remaining: number;
}

interface BudgetItem {
  id: string;
  category: string;
  itemName: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
}

interface BudgetSummaryResponse {
  items: BudgetItem[];
  summary: BudgetSummary;
}

interface VendorSearchResult {
  _id: string;
  businessName: string;
  category: string;
  location?: { city?: string; state?: string };
  pricing?: { startingPrice?: number };
  rating?: { average: number };
}

interface VendorsSearchResponse {
  vendors: VendorSearchResult[];
  total: number;
}

interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  status?: string;
}

export interface DashboardProfileCardData {
  id: string;
  userId?: string;
  name: string;
  firstName: string;
  age?: number;
  city?: string;
  location?: string;
  profession?: string;
  compatibilityScore: number;
  photoUrl: string;
  isVerified: boolean;
  highlights: string[];
  compatibilityInsights: DashboardCompatibilityInsight[];
  profilePath: string;
  chatPath?: string;
}

export interface DashboardCompatibilityInsight {
  label: string;
  score: number;
}

export interface DashboardOwnProfileCardData {
  id?: string;
  name: string;
  firstName: string;
  age?: number;
  location?: string;
  profession?: string;
  photoUrl: string;
  isVerified: boolean;
  completionPercent: number;
  interests: string[];
  sectionProgress: DashboardCompatibilityInsight[];
  aboutPoints: string[];
}

export interface DashboardRecentMoment {
  id: string;
  emoji: string;
  text: string;
  time: string;
  to: string;
  accent: 'rose' | 'gold' | 'mint' | 'lavender';
}

export interface DashboardJourneyStep {
  label: string;
  state: 'complete' | 'current' | 'upcoming';
}

export interface DashboardActiveConnection {
  id: string;
  name: string;
  firstName: string;
  photoUrl: string;
  compatibilityScore: number;
  profilePath: string;
  chatPath: string;
  location?: string;
  lastMessage: string;
  timeLabel: string;
}

export interface DashboardVisitor {
  id: string;
  name: string;
  photoUrl: string;
  profilePath: string;
  timeLabel: string;
}

export interface DashboardPipelineStage {
  label: string;
  value: number;
}

const CATEGORY_COLORS = [
  'bg-[#f4196d]',
  'bg-[#ff90b5]',
  'bg-[#535a60]',
  'bg-[#f4c95d]',
  'bg-[#10b981]',
];

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatWeddingDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLocationValue(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function getAge(profile: Partial<MatchProfile>): number | undefined {
  if (profile.age) return profile.age;
  if (!profile.dateOfBirth) return undefined;
  const today = new Date();
  const dob = new Date(profile.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age > 0 ? age : undefined;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const timestamp = new Date(dateStr).getTime();
  if (Number.isNaN(timestamp)) return 'Recently';

  const diffMs = timestamp - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second');
  if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  return rtf.format(Math.round(diffSeconds / 86400), 'day');
}

function getOwnProfileInterests(
  profile: Record<string, unknown> | null | undefined,
  form: ProfileForm,
): string[] {
  const wizard = (profile?.wizardProfile as Record<string, unknown>) || {};
  const religion = (wizard.religion as Record<string, unknown>) || {};
  const signals = [
    form.occupation || profile?.occupation || profile?.education,
    religion.religion || profile?.religion,
    profile?.maritalStatus,
    form.gender ? capitalizeFirst(String(form.gender)) : profile?.gender,
    profile?.city ? `${profile.city} lifestyle` : null,
  ].filter(Boolean) as string[];

  return Array.from(new Set(signals.map((value) => String(value).trim()))).slice(0, 4);
}

function getOwnProfileAboutPoints(
  form: ProfileForm,
): string[] {
  const bio = String(form.bio ?? '').trim();
  if (bio) {
    return bio
      .split(/[.!?]\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  const points = [
    form.occupation ? `Works as ${form.occupation}` : null,
    form.religion ? `${form.religion} background` : null,
    form.city ? `Based in ${form.city}` : null,
    form.maritalStatus ? `${form.maritalStatus}` : null,
  ].filter(Boolean) as string[];

  return points.slice(0, 4);
}

function buildOwnProfileSectionProgress(form: ProfileForm): DashboardCompatibilityInsight[] {
  const sectionLabels: Record<string, string> = {
    'Personal Details': 'Personal Details',
    'Religion Details': 'Religion/Culture',
    'Family Background': 'Family Values',
    'Partner Preferences': 'Partner Preferences',
    Lifestyle: 'Lifestyle',
  };

  return EDIT_SECTIONS.filter((section) => sectionLabels[section])
    .map((section) => {
      const sectionIndex = EDIT_SECTIONS.indexOf(section);
      const isComplete = isSectionValid(sectionIndex, form);
      return {
        label: sectionLabels[section],
        score: isComplete ? 100 : 45,
      };
    })
    .slice(0, 4);
}

function mapOwnProfileCardData(
  profile: Record<string, unknown> | null | undefined,
  completionPercent: number,
  photoUrl: string,
): DashboardOwnProfileCardData | null {
  if (!profile) return null;

  const form = apiProfileToForm(profile);
  const wizard = (profile.wizardProfile as Record<string, unknown>) || {};
  const pd = (wizard.personalDetails as Record<string, unknown>) || {};
  const firstName = String(pd.firstName || profile.firstName || 'Member').trim();
  const lastName = String(pd.lastName || profile.lastName || '').trim();
  const location = [pd.city || profile.city, pd.state || profile.state]
    .filter(Boolean)
    .join(', ');

  return {
    id: String(profile.id || profile.userId || ''),
    name: [firstName, lastName].filter(Boolean).join(' ').trim(),
    firstName,
    age: getAge(profile as Partial<MatchProfile>),
    location,
    profession:
      String(form.occupation || profile.occupation || profile.education || '').trim() ||
      'Add your profession',
    photoUrl,
    isVerified: Boolean(profile.isVerified),
    completionPercent,
    interests: getOwnProfileInterests(profile, form),
    sectionProgress: buildOwnProfileSectionProgress(form),
    aboutPoints: getOwnProfileAboutPoints(form),
  };
}

function getProfileHighlights(profile: Partial<MatchProfile>): string[] {
  const compatibilityHighlights = profile.compatibility?.highlights?.filter(Boolean) ?? [];
  if (compatibilityHighlights.length > 0) return compatibilityHighlights.slice(0, 4);

  const fallbackSignals = [
    profile.occupation,
    profile.education,
    profile.city ? `${profile.city} lifestyle` : null,
    profile.religion ? `${profile.religion} values` : null,
    'Long-term intentions',
  ].filter(Boolean) as string[];

  return Array.from(new Set(fallbackSignals)).slice(0, 4);
}

function mapProfileCardData(
  profile: Partial<MatchProfile> | null | undefined,
  scoreOverride?: number,
): DashboardProfileCardData | null {
  if (!profile) return null;

  const viewId = profile.id || profile.userId;
  if (!viewId) return null;

  const firstName = profile.firstName?.trim() || 'Member';
  const lastName = profile.lastName?.trim() || '';
  const age = getAge(profile);
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const compatibilityScore = clampScore(
    scoreOverride ??
      profile.compatibility?.score ??
      profile.compatibilityScore ??
      91,
  );

  return {
    id: viewId,
    userId: profile.userId,
    name: [firstName, lastName].filter(Boolean).join(' ').trim(),
    firstName,
    age,
    city: profile.city,
    location,
    profession: profile.occupation || profile.education || 'Profile awaiting details',
    compatibilityScore,
    photoUrl: getPhotoUrl(getMainProfilePhoto(profile)),
    isVerified: Boolean(profile.isVerified),
    highlights: getProfileHighlights(profile),
    compatibilityInsights: buildCompatibilityInsights(profile, compatibilityScore).slice(0, 4),
    profilePath: `/app/matches/${viewId}`,
    chatPath: profile.userId ? `/app/chat?userId=${profile.userId}` : undefined,
  };
}

function mapInterestToProfileCard(match: MatchInterest): DashboardProfileCardData | null {
  const profile =
    match.partnerProfile ??
    match.senderProfile ??
    match.receiverProfile;
  return mapProfileCardData(profile, match.compatibilityScore);
}

function fallbackCompatibilityInsights(overall: number): DashboardCompatibilityInsight[] {
  const base = overall || 91;
  return [
    { label: 'Family Values', score: clampScore(base + 1) },
    { label: 'Lifestyle Match', score: clampScore(base - 4) },
    { label: 'Education Match', score: clampScore(base - 1) },
    { label: 'Career Goals', score: clampScore(base - 7) },
    { label: 'Interests', score: clampScore(base + 3) },
    { label: 'Communication Style', score: clampScore(base) },
    { label: 'Marriage Intentions', score: clampScore(base + 2) },
  ];
}

function buildCompatibilityInsights(
  profile: Partial<MatchProfile> | null | undefined,
  overall: number,
): DashboardCompatibilityInsight[] {
  const breakdown = profile?.compatibility?.breakdown;
  if (!breakdown) return fallbackCompatibilityInsights(overall);

  const entries = Object.entries(breakdown)
    .map(([label, score]) => ({
      label: titleCase(label),
      score: clampScore(Number(score) || overall),
    }))
    .filter((item) => item.score > 0);

  if (entries.length >= 4) return entries.slice(0, 7);
  return fallbackCompatibilityInsights(overall);
}

function buildJourneySteps({
  hasProfile,
  hasPreferences,
  hasPhoto,
  newMatchesCount,
  sentPending,
  acceptedCount,
  hasActivePlan,
}: {
  hasProfile: boolean;
  hasPreferences: boolean;
  hasPhoto: boolean;
  newMatchesCount: number;
  sentPending: number;
  acceptedCount: number;
  hasActivePlan: boolean;
}): DashboardJourneyStep[] {
  const completed = [
    hasProfile,
    hasPreferences,
    hasPhoto,
    newMatchesCount > 0 || acceptedCount > 0,
    sentPending > 0 || acceptedCount > 0,
    acceptedCount > 0,
    hasActivePlan,
    false,
    hasActivePlan,
    false,
  ];

  const labels = [
    'Profile Created',
    'Preferences Added',
    'Photos Uploaded',
    'First Match Found',
    'Interest Sent',
    'Chat Started',
    'Families Connected',
    'Engagement',
    'Wedding Planning',
    'Marriage',
  ];

  const currentIndex = completed.findIndex((isDone) => !isDone);

  return labels.map((label, index) => ({
    label,
    state:
      completed[index]
        ? 'complete'
        : currentIndex === index
          ? 'current'
          : 'upcoming',
  }));
}

function buildRecentMoments(
  received: MatchInterest[],
  accepted: MatchInterest[],
  sent: MatchInterest[],
): DashboardRecentMoment[] {
  const moments: Array<DashboardRecentMoment & { ts: number }> = [];

  received.forEach((match) => {
    const card = mapInterestToProfileCard(match);
    if (!card) return;
    moments.push({
      id: `received-${match.id}`,
      emoji: '💕',
      text: `${card.firstName} sent an interest`,
      time: formatRelativeTime(match.createdAt || match.updatedAt),
      to: '/app/matches?tab=interests&interest=received',
      accent: 'rose',
      ts: new Date(match.createdAt || match.updatedAt || Date.now()).getTime(),
    });
  });

  accepted.forEach((match) => {
    const card = mapInterestToProfileCard(match);
    if (!card) return;
    moments.push({
      id: `accepted-${match.id}`,
      emoji: '💬',
      text: `${card.firstName} is ready to build a connection`,
      time: formatRelativeTime(match.updatedAt || match.createdAt),
      to: card.chatPath || '/app/chat',
      accent: 'mint',
      ts: new Date(match.updatedAt || match.createdAt || Date.now()).getTime(),
    });
  });

  sent.forEach((match) => {
    const card = mapInterestToProfileCard(match);
    if (!card) return;
    moments.push({
      id: `sent-${match.id}`,
      emoji: '💌',
      text: `Interest sent to ${card.firstName}`,
      time: formatRelativeTime(match.createdAt || match.updatedAt),
      to: '/app/matches?tab=interests&interest=sent',
      accent: 'gold',
      ts: new Date(match.createdAt || match.updatedAt || Date.now()).getTime(),
    });
  });

  return moments
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 4)
    .map(({ ts, ...moment }) => moment);
}

function mapBudgetCategories(items: BudgetItem[]): BudgetCategory[] {
  const byCategory = new Map<string, { spent: number; allocated: number }>();

  for (const item of items) {
    const key = item.category || 'Other';
    const current = byCategory.get(key) ?? { spent: 0, allocated: 0 };
    byCategory.set(key, {
      spent: current.spent + (item.paidAmount || item.actualCost || 0),
      allocated: current.allocated + (item.estimatedCost || 0),
    });
  }

  return Array.from(byCategory.entries()).map(([name, vals], i) => ({
    name,
    spent: vals.spent,
    allocated: vals.allocated || vals.spent,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
}

function mapPlannerTasks(timeline: PlannerTimelineData | null | undefined): PlannerTask[] {
  if (!timeline?.tasks?.length) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const withDates = timeline.tasks
    .filter((t) => t.dueDate && t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  return withDates.slice(0, 4).map((task) => {
    const due = new Date(task.dueDate!);
    due.setHours(0, 0, 0, 0);
    const isTomorrow = due.getTime() === tomorrow.getTime();
    const timeLabel = new Date(task.dueDate!).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      time: timeLabel,
      title: task.title,
      ...(isTomorrow ? { day: 'Tomorrow' } : {}),
    };
  });
}

function buildActiveConnections(accepted: MatchInterest[]): DashboardActiveConnection[] {
  const prompts = [
    'How was your weekend? I would love to hear more.',
    'I enjoyed our last conversation and would like to know you better.',
    'Your profile stayed on my mind today.',
    'Looking forward to continuing this conversation soon.',
  ];

  return accepted
    .map((match, index) => {
      const card = mapInterestToProfileCard(match);
      if (!card || !card.chatPath) return null;

      return {
        id: match.id,
        name: card.name,
        firstName: card.firstName,
        photoUrl: card.photoUrl,
        compatibilityScore: card.compatibilityScore,
        profilePath: card.profilePath,
        chatPath: card.chatPath,
        location: card.location,
        lastMessage: match.message || prompts[index % prompts.length],
        timeLabel: formatRelativeTime(match.updatedAt || match.createdAt),
      };
    })
    .filter(Boolean)
    .slice(0, 5) as DashboardActiveConnection[];
}

function buildProfileVisitors({
  receivedInterests,
  acceptedInterests,
  recommendedMatches,
}: {
  receivedInterests: MatchInterest[];
  acceptedInterests: MatchInterest[];
  recommendedMatches: DashboardProfileCardData[];
}): DashboardVisitor[] {
  const visitors = new Map<string, DashboardVisitor>();

  receivedInterests.forEach((match) => {
    const card = mapInterestToProfileCard(match);
    if (!card || visitors.has(card.id)) return;
    visitors.set(card.id, {
      id: card.id,
      name: card.firstName,
      photoUrl: card.photoUrl,
      profilePath: card.profilePath,
      timeLabel: formatRelativeTime(match.createdAt || match.updatedAt),
    });
  });

  acceptedInterests.forEach((match) => {
    const card = mapInterestToProfileCard(match);
    if (!card || visitors.has(card.id)) return;
    visitors.set(card.id, {
      id: card.id,
      name: card.firstName,
      photoUrl: card.photoUrl,
      profilePath: card.profilePath,
      timeLabel: formatRelativeTime(match.updatedAt || match.createdAt),
    });
  });

  recommendedMatches.forEach((card, index) => {
    if (visitors.has(card.id)) return;
    visitors.set(card.id, {
      id: card.id,
      name: card.firstName,
      photoUrl: card.photoUrl,
      profilePath: card.profilePath,
      timeLabel: index === 0 ? 'Recently' : `${index + 1}h ago`,
    });
  });

  return Array.from(visitors.values()).slice(0, 5);
}

function mapVendors(vendors: VendorSearchResult[]): VendorItem[] {
  return vendors.slice(0, 4).map((v) => ({
    id: v._id,
    name: v.businessName,
    category: v.category,
    rating: v.rating?.average ?? 4.5,
    price: v.pricing?.startingPrice
      ? `From ₹${v.pricing.startingPrice.toLocaleString('en-IN')}`
      : 'View pricing',
    image: `https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop`,
    location: [v.location?.city, v.location?.state].filter(Boolean).join(', '),
  }));
}

export function useDashboard() {
  const user = useAuthStore((state) => state.user);
  // const { data: myProfile } = useMyMatchProfile();
  // const { data: receivedInterests = [] } = useReceivedInterests();
  // const { data: sentInterests = [] } = useSentInterests();
  // const { data: acceptedInterests = [] } = useAcceptedInterests();
  // const { data: suggestionsData } = useMatchSuggestions(EMPTY_FILTERS);
  // const { data: shortlistData } = useShortlist();
  const { data: plannerPlans = [] } = usePlannerPlans();

  // Fallback values for commented hooks
  const myProfile = null;
  const receivedInterests: MatchInterest[] = [];
  const sentInterests: MatchInterest[] = [];
  const acceptedInterests: MatchInterest[] = [];
  const suggestionsData = null;
  const shortlistData = null;

  const activePlan = plannerPlans[0] ?? null;
  const activePlanId = activePlan?.id ?? '';

  const userCity = myProfile?.city?.trim() ?? '';
  const userState = myProfile?.state?.trim() ?? '';
  const userLocation = [userCity, userState].filter(Boolean).join(', ');

  const { data: plannerTimeline } = useQuery<PlannerTimelineData | null>({
    queryKey: ['planner-timeline', activePlanId],
    enabled: Boolean(activePlanId),
    queryFn: async () => {
      const { data } = await api.get<PlannerTimelineData>(
        `/planner/timeline?planId=${activePlanId}`,
      );
      return data;
    },
  });

  const { data: budgetData } = useQuery<BudgetSummaryResponse | null>({
    queryKey: ['finance-budget'],
    queryFn: async () => {
      try {
        const { data } = await api.get<BudgetSummaryResponse>('/finance/budget');
        return data;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) return null;
        throw error;
      }
    },
  });

  const { data: vendorsData } = useQuery<VendorsSearchResponse>({
    queryKey: ['dashboard-vendors', userCity, userState],
    queryFn: async () => {
      const params = new URLSearchParams({ includeExternal: 'true', limit: '8' });
      if (userCity) params.set('city', userCity);
      else if (userState) params.set('state', userState);
      const { data } = await api.get<VendorsSearchResponse>(`/vendors/search?${params}`);
      return data;
    },
  });

  const { data: events = [] } = useQuery<DashboardEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get<DashboardEvent[]>('/events');
      return data;
    },
  });

  const pendingRequests = receivedInterests.filter((m) => m.status === 'pending').length;
  const sentPending = sentInterests.filter((m) => m.status === 'pending').length;
  const acceptedCount = acceptedInterests.length;
  const activeConversationsCount = acceptedCount;
  const shortlistCount = shortlistData?.profiles?.length ?? 0;
  const suggestionProfiles = suggestionsData?.profiles ?? [];

  const rawName =
    myProfile?.firstName || (user?.email ? user.email.split('@')[0] : 'there');
  const userName = capitalizeFirst(rawName);

  const formSnapshot = myProfile ? apiProfileToForm(myProfile) : null;
  const completionPct = formSnapshot ? profileCompletion(formSnapshot) : 0;
  const missingSections = formSnapshot ? getMissingBySection(formSnapshot) : [];
  const mainPhoto = myProfile ? getMainProfilePhoto(myProfile) : '';
  const photoUrl = mainPhoto ? getPhotoUrl(mainPhoto) : '';

  const ownProfileCard = useMemo(
    () => mapOwnProfileCardData(myProfile, completionPct, photoUrl),
    [myProfile, completionPct, photoUrl],
  );

  const hasPreferences =
    completionPct >= 40 ||
    missingSections.every(
      (s) => s.section !== 'Personal Details' && s.section !== 'Location',
    );
  const hasMatchPreferences =
    completionPct >= 60 ||
    !missingSections.some((s) => s.section === 'Partner Preferences');

  const recommendedMatches = useMemo(
    () =>
      [...suggestionProfiles]
        .sort(
          (a, b) =>
            (b.compatibility?.score ?? b.compatibilityScore ?? 0) -
            (a.compatibility?.score ?? a.compatibilityScore ?? 0),
        )
        .map((profile) => mapProfileCardData(profile))
        .filter(Boolean)
        .slice(0, 6) as DashboardProfileCardData[],
    [suggestionProfiles],
  );

  const featuredMatches = useMemo(() => {
    const curated = recommendedMatches.slice(0, 3);
    if (curated.length > 0) return curated;

    return acceptedInterests
      .map(mapInterestToProfileCard)
      .filter(Boolean)
      .slice(0, 3) as DashboardProfileCardData[];
  }, [acceptedInterests, recommendedMatches]);

  const featuredMatch =
    featuredMatches[0] ??
    acceptedInterests
      .map(mapInterestToProfileCard)
      .find(Boolean) ??
    receivedInterests
      .map(mapInterestToProfileCard)
      .find(Boolean) ??
    null;

  const compatibilityScore = featuredMatch?.compatibilityScore ?? 91;
  const compatibilityInsights = buildCompatibilityInsights(
    suggestionProfiles[0],
    compatibilityScore,
  );
  const newMatchesCount = suggestionProfiles.length;
  const highestCompatibility = recommendedMatches.reduce(
    (highest, profile) => Math.max(highest, profile.compatibilityScore),
    0,
  );

  const recentMoments = buildRecentMoments(
    receivedInterests,
    acceptedInterests,
    sentInterests,
  );

  const milestones: WeddingMilestone[] = useMemo(
    () => [
      { label: 'Profile Completed', done: completionPct >= 20 || Boolean(photoUrl) },
      { label: 'Preferences Added', done: hasPreferences },
      { label: 'Match Preferences Set', done: hasMatchPreferences },
      { label: 'Budget Added', done: Boolean(budgetData?.summary?.totalBudget) },
      { label: 'Venue Shortlisted', done: false },
      { label: 'Photographer', done: false },
      { label: 'Catering', done: false },
      { label: 'Invitations', done: false },
    ],
    [completionPct, photoUrl, hasPreferences, hasMatchPreferences, budgetData],
  );

  const completedMilestones = milestones.filter((m) => m.done).length;
  const planningPercent =
    plannerTimeline?.progress?.percentage ??
    Math.round((completedMilestones / milestones.length) * 100);

  const weddingDateStr = activePlan?.weddingDate ?? '';
  const daysLeft = weddingDateStr ? daysUntil(weddingDateStr) : 0;
  const weddingDateLabel = weddingDateStr
    ? formatWeddingDateLabel(weddingDateStr)
    : 'Set your wedding date';
  const weddingDateSubtitle = activePlan?.partnerName
    ? `Planning with ${activePlan.partnerName}`
    : 'Create a plan in Wedding Planner';

  const nextTask =
    missingSections.length > 0
      ? `Complete ${missingSections[0].section}`
      : pendingRequests > 0
        ? 'Review interest requests'
        : plannerTimeline?.tasks?.find((t) => t.status !== 'completed')?.title ??
          'Continue wedding planning';

  const budget = useMemo(() => {
    if (budgetData?.summary) {
      const { summary, items } = budgetData;
      return {
        total: summary.totalBudget,
        spent: summary.totalPaid || summary.totalActual,
        remaining: summary.remaining,
        categories: mapBudgetCategories(items),
      };
    }

    // TODO: Replace these presentation placeholders with live finance defaults once
    // the backend returns budget summaries for accounts before setup is complete.
    return {
      total: 2500000,
      spent: 860000,
      remaining: 1640000,
      categories: [
        { name: 'Venue', spent: 320000, allocated: 700000, color: CATEGORY_COLORS[0] },
        { name: 'Photography', spent: 120000, allocated: 250000, color: CATEGORY_COLORS[1] },
        { name: 'Decor', spent: 180000, allocated: 350000, color: CATEGORY_COLORS[2] },
        { name: 'Catering', spent: 160000, allocated: 500000, color: CATEGORY_COLORS[3] },
        { name: 'Invitations', spent: 80000, allocated: 150000, color: CATEGORY_COLORS[4] },
      ] as BudgetCategory[],
    };
  }, [budgetData]);

  const budgetSpentPercent =
    budget.total > 0 ? Math.round((budget.spent / budget.total) * 100) : 0;

  const upcomingEventsCount = useMemo(() => {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return events.filter((e) => {
      const d = new Date(e.date);
      return d >= now && d <= monthEnd;
    }).length;
  }, [events]);

  const plannerTasks = mapPlannerTasks(plannerTimeline);
  const filteredVendorResults = useMemo(() => {
    const vendorResults = vendorsData?.vendors ?? [];

    if (userCity) {
      const normalizedUserCity = normalizeLocationValue(userCity);
      return vendorResults.filter(
        (vendor) => normalizeLocationValue(vendor.location?.city) === normalizedUserCity,
      );
    }

    if (userState) {
      const normalizedUserState = normalizeLocationValue(userState);
      return vendorResults.filter(
        (vendor) => normalizeLocationValue(vendor.location?.state) === normalizedUserState,
      );
    }

    return vendorResults;
  }, [vendorsData?.vendors, userCity, userState]);

  const vendors = mapVendors(filteredVendorResults);
  const journeySteps = buildJourneySteps({
    hasProfile: Boolean(myProfile),
    hasPreferences,
    hasPhoto: Boolean(photoUrl),
    newMatchesCount,
    sentPending,
    acceptedCount,
    hasActivePlan: Boolean(activePlan),
  });

  const activities: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    if (pendingRequests > 0) {
      items.push({
        icon: null,
        text: `${pendingRequests} new interest${pendingRequests > 1 ? 's' : ''} received`,
        time: 'Just now',
        color: 'text-[#f4196d] bg-[#ffeef1]',
      });
    }
    if (acceptedCount > 0) {
      items.push({
        icon: null,
        text: 'Match Accepted',
        time: 'Active',
        color: 'text-[#10b981] bg-[#ecfdf5]',
      });
    }
    if (shortlistCount > 0) {
      items.push({
        icon: null,
        text: `${shortlistCount} profile${shortlistCount > 1 ? 's' : ''} shortlisted`,
        time: 'Saved',
        color: 'text-[#f4196d] bg-[#ffeef1]',
      });
    }
    if (sentPending > 0) {
      items.push({
        icon: null,
        text: `${sentPending} interest${sentPending > 1 ? 's' : ''} awaiting reply`,
        time: 'Pending',
        color: 'text-[#f4c95d] bg-[#fffcef]',
      });
    }

    for (const act of plannerTimeline?.activities?.slice(0, 3) ?? []) {
      items.push({
        icon: null,
        text: act.taskTitle,
        time: act.createdAt
          ? new Date(act.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            })
          : 'Recent',
        color: 'text-[#ff90b5] bg-[#fff5f8]',
      });
    }

    return items;
  }, [
    pendingRequests,
    acceptedCount,
    shortlistCount,
    sentPending,
    plannerTimeline?.activities,
  ]);

  const sentInterestUserIds = useMemo(
    () =>
      new Set(
        sentInterests.flatMap((match) => [
          match.receiverId,
          match.receiverProfile?.id ?? '',
          match.receiverProfile?.userId ?? '',
        ]),
      ),
    [sentInterests],
  );

  const connectedUserIds = useMemo(
    () =>
      new Set(
        acceptedInterests.flatMap((match) => [
          match.partnerUserId ?? '',
          match.partnerProfile?.id ?? '',
          match.partnerProfile?.userId ?? '',
        ]),
      ),
    [acceptedInterests],
  );

  // TODO: Replace with live dashboard analytics once profile-view tracking lands in the API.
  const profileViewsCount = 18;
  const activeConnections = useMemo(
    () => buildActiveConnections(acceptedInterests),
    [acceptedInterests],
  );
  const profileVisitors = useMemo(
    () =>
      buildProfileVisitors({
        receivedInterests,
        acceptedInterests,
        recommendedMatches,
      }),
    [acceptedInterests, receivedInterests, recommendedMatches],
  );
  const relationshipPipeline = useMemo<DashboardPipelineStage[]>(
    () => [
      { label: 'Matches Found', value: Math.max(newMatchesCount, 0) },
      { label: 'Interests Sent', value: sentInterests.length },
      { label: 'Conversations', value: activeConversationsCount },
      { label: 'Serious Connections', value: acceptedCount },
      { label: 'Family Discussions', value: acceptedCount > 1 ? 2 : acceptedCount > 0 ? 1 : 0 },
      { label: 'Wedding Journey', value: activePlan ? 1 : 0 },
    ],
    [activeConversationsCount, acceptedCount, activePlan, newMatchesCount, sentInterests.length],
  );

  return {
    userName,
    photoUrl,
    myProfile,
    completionPct,
    missingSections: missingSections.map((s) => s.section),
    hasPhoto: Boolean(photoUrl),
    planningPercent,
    daysLeft,
    weddingDateLabel,
    weddingDateSubtitle,
    nextTask,
    pendingRequests,
    acceptedCount,
    shortlistCount,
    sentPending,
    newMatchesCount,
    highestCompatibility,
    profileViewsCount,
    budget,
    budgetSpentPercent,
    upcomingEventsCount,
    savedVendorsCount: vendorsData?.total ?? 0,
    plannerTasks,
    vendors,
    activities,
    receivedInterests,
    acceptedInterests,
    userLocation,
    userCity,
    recommendedMatches,
    featuredMatches,
    featuredMatch,
    ownProfileCard,
    activeConnections,
    profileVisitors,
    profileVisitorsGrowth: 12,
    relationshipPipeline,
    compatibilityScore,
    compatibilityInsights,
    recentMoments,
    journeySteps,
    sentInterestUserIds,
    connectedUserIds,
    hasPreferences,
    activeConversationsCount,
  };
}

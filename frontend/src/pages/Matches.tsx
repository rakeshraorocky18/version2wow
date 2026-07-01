import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Inbox, Search, Send, Sparkles, Star, UserCheck, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useMatchActions,
  useMatchSearch,
  useMatchSuggestions,
  useReceivedInterests,
  useSentInterests,
  useAcceptedInterests,
  useShortlist,
} from '../hooks/useMatchmaking';
import MatchProfileCard from '../components/matchmaking/MatchProfileCard';
import MatchFiltersPanel from '../components/matchmaking/MatchFiltersPanel';
import MatchTabsNav, { type MatchTabMeta } from '../components/matchmaking/MatchTabsNav';
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import { EMPTY_FILTERS, type InterestSubTab, type MatchFilters, type MatchInterest, type MatchProfile, type MatchTab } from '../types/matchmaking';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { formatMatchGenderLabel, resolveOppositeGenderLabel } from '../lib/matchGender';

const TABS: MatchTab[] = ['suggestions', 'search', 'shortlist', 'interests'];

const INTEREST_TABS: { id: InterestSubTab; label: string; icon: typeof Inbox }[] = [
  { id: 'received', label: 'Received', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'accepted', label: 'Accepted', icon: UserCheck },
];

function readTabFromUrl(params: URLSearchParams): MatchTab {
  const urlTab = params.get('tab') as MatchTab | null;
  return urlTab && TABS.includes(urlTab) ? urlTab : 'suggestions';
}

function collectSentIds(matches: MatchInterest[] | undefined) {
  const ids = new Set<string>();
  matches?.forEach((m) => {
    if (m.receiverProfile?.id) ids.add(m.receiverProfile.id);
    if (m.receiverProfile?.userId) ids.add(m.receiverProfile.userId);
    ids.add(m.receiverId);
  });
  return Array.from(ids);
}

function resolveProfileGender(profile: { gender?: string; wizardProfile?: { personalDetails?: { gender?: string } } }) {
  return profile.gender || profile.wizardProfile?.personalDetails?.gender;
}

function EmptyState({ tab }: { tab: MatchTab }) {
  const copy: Record<MatchTab, { title: string; body: string }> = {
    suggestions: {
      title: 'No suggested matches yet',
      body: 'Complete your profile and preferences, or try Search with filters cleared.',
    },
    search: {
      title: 'No profiles found',
      body: 'Try clearing filters or widening your age range.',
    },
    shortlist: {
      title: 'Shortlist is empty',
      body: 'Tap the star on a profile card to save it here.',
    },
    interests: {
      title: 'No interests yet',
      body: 'Send an interest from Suggested or Search to connect.',
    },
  };
  const { title, body } = copy[tab];
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5C8D5] bg-[#FFFBFC] px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0F5]">
        <Heart size={24} className="text-[#B66A8A]" />
      </div>
      <p className="font-display text-lg font-semibold text-[#5D2B44]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[#9A5776]">{body}</p>
    </div>
  );
}

export default function Matches() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<MatchTab>(() => readTabFromUrl(params));
  const [interestSubTab, setInterestSubTab] = useState<InterestSubTab>('received');
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [sentInterestIds, setSentInterestIds] = useState<string[]>([]);
  const user = useAuthStore((s) => s.user);

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile-for-match-filter'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    },
    retry: false,
  });

  const matchGenderLabel = formatMatchGenderLabel(
    resolveOppositeGenderLabel(myProfile?.gender, user?.role),
  );
  const targetGender = resolveOppositeGenderLabel(myProfile?.gender, user?.role);

  const queryClient = useQueryClient();
  const { sendInterest, acceptInterest, rejectInterest, toggleShortlist } = useMatchActions();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['matches-search'] });
    queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['matches-shortlist'] });
  }, [queryClient, targetGender]);

  useEffect(() => {
    if (!params.has('gender')) return;
    const next = new URLSearchParams(params);
    next.delete('gender');
    setParams(next, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTab(readTabFromUrl(params));
    const sub = params.get('interest') as InterestSubTab | null;
    if (sub && INTEREST_TABS.some((t) => t.id === sub)) {
      setInterestSubTab(sub);
    }
  }, [params]);

  useEffect(() => {
    const next = { ...EMPTY_FILTERS };
    (Object.keys(EMPTY_FILTERS) as Array<keyof MatchFilters>).forEach((key) => {
      const raw = params.get(key);
      if (raw === null) return;
      if (typeof EMPTY_FILTERS[key] === 'boolean') {
        (next[key] as boolean) = raw === 'true';
      } else {
        (next[key] as string) = raw;
      }
    });
    if (params.get('horoscopeAvailable') === 'true') {
      next.horoscopeMatch = true;
    }
    setFilters(next);
    setDebouncedFilters(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set('tab', tab);
    if (tab === 'interests') next.set('interest', interestSubTab);
    Object.entries(filters).forEach(([key, value]) => {
      if (value === '' || value === false || value === null || value === undefined) return;
      next.set(key, String(value));
    });
    setParams(next, { replace: true });
  }, [filters, tab, interestSubTab, setParams]);

  const suggestions = useMatchSuggestions(debouncedFilters, tab === 'suggestions');
  const search = useMatchSearch(debouncedFilters, tab === 'search');
  const shortlist = useShortlist();
  const received = useReceivedInterests();
  const sent = useSentInterests();
  const accepted = useAcceptedInterests();

  useEffect(() => {
    setSentInterestIds(collectSentIds(sent.data));
  }, [sent.data]);

  const shortlistedIds = useMemo(() => {
    const ids = new Set<string>();
    shortlist.data?.profiles?.forEach((p: { id?: string; userId?: string }) => {
      if (p.id) ids.add(p.id);
      if (p.userId) ids.add(p.userId);
    });
    return ids;
  }, [shortlist.data]);

  const activeData = useMemo(() => {
    if (tab === 'suggestions') return suggestions.data;
    if (tab === 'search') return search.data;
    if (tab === 'shortlist') return shortlist.data;
    return null;
  }, [tab, suggestions.data, search.data, shortlist.data]);

  const isLoading =
    (tab === 'suggestions' && suggestions.isLoading) ||
    (tab === 'search' && search.isLoading) ||
    (tab === 'shortlist' && shortlist.isLoading) ||
    (tab === 'interests' && (received.isLoading || sent.isLoading || accepted.isLoading));

  const profiles = useMemo(() => {
    const list = activeData?.profiles || [];
    if (!targetGender) return list;
    return list.filter((p: { gender?: string; wizardProfile?: { personalDetails?: { gender?: string } } }) => {
      const gender = resolveProfileGender(p);
      return !gender || gender === targetGender;
    });
  }, [activeData?.profiles, targetGender]);

  const pendingReceivedCount = received.data?.length ?? 0;
  const shortlistCount = shortlist.data?.profiles?.length ?? 0;
  const suggestionsCount = suggestions.data?.profiles?.length;
  const searchCount = search.data?.profiles?.length;

  const tabMeta: MatchTabMeta[] = useMemo(
    () => [
      {
        id: 'suggestions',
        label: 'Suggested',
        icon: Sparkles,
        count: tab === 'suggestions' ? profiles.length : suggestionsCount,
      },
      {
        id: 'search',
        label: 'Search',
        icon: Search,
        count: tab === 'search' ? profiles.length : searchCount,
      },
      {
        id: 'shortlist',
        label: 'Shortlist',
        icon: Star,
        count: shortlistCount,
      },
      {
        id: 'interests',
        label: 'Interests',
        icon: Users,
        badge: pendingReceivedCount,
      },
    ],
    [tab, profiles.length, suggestionsCount, searchCount, shortlistCount, pendingReceivedCount],
  );

  const handleInterest = async (profile: { id: string; userId: string }) => {
    try {
      await sendInterest.mutateAsync(profile.id);
      setSentInterestIds((prev) =>
        [...prev, profile.id, profile.userId].filter((id, i, arr) => arr.indexOf(id) === i),
      );
      toast.success('Interest sent successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not send interest');
    }
  };

  const handleShortlist = async (profile: { id: string }, shortlisted: boolean) => {
    try {
      await toggleShortlist.mutateAsync({ profileId: profile.id, shortlisted });
      toast.success(shortlisted ? 'Removed from shortlist' : 'Added to shortlist');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not update shortlist');
    }
  };

  const sectionSubtitles: Record<MatchTab, string> = {
    suggestions: 'Personalized picks ranked by compatibility',
    search: 'Browse and filter all available profiles',
    shortlist: 'Profiles you saved to review later',
    interests: 'Manage received, sent and accepted interests',
  };

  return (
    <div className="soft-fade-in mx-auto max-w-7xl space-y-5">
      {/* Page header */}
      <header className="overflow-hidden rounded-3xl border border-[#F2DFE8] bg-gradient-to-br from-[#FFF8FB] via-white to-[#F8F3FF] p-6 shadow-[0_10px_40px_rgba(174,94,129,0.1)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-semibold text-[#B66A8A]">
              <Sparkles size={12} /> Matchmaking
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-[#5D2B44] sm:text-4xl">Find Your Match</h1>
            <p className="mt-1.5 text-sm text-[#815A6D]">
              {matchGenderLabel
                ? `Showing ${matchGenderLabel.toLowerCase()} · ${sectionSubtitles[tab]}`
                : sectionSubtitles[tab]}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {tab !== 'interests' && !isLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-[#F0DFE7] bg-white px-4 py-2.5">
                <span className="text-2xl font-bold text-[#B66A8A]">{profiles.length}</span>
                <span className="text-xs leading-tight text-[#9A5776]">
                  {profiles.length === 1 ? 'Profile' : 'Profiles'}
                  <br />
                  found
                </span>
              </div>
            )}
            {pendingReceivedCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                <span className="text-2xl font-bold text-amber-600">{pendingReceivedCount}</span>
                <span className="text-xs leading-tight text-amber-700">
                  New
                  <br />
                  interests
                </span>
              </div>
            )}
            {shortlistCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-[#F0DFE7] bg-white px-4 py-2.5">
                <span className="text-2xl font-bold text-[#D97706]">{shortlistCount}</span>
                <span className="text-xs leading-tight text-[#9A5776]">
                  Short
                  <br />
                  listed
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <MatchTabsNav tabs={tabMeta} active={tab} onChange={setTab} />
        </div>
      </header>

      {/* Filters */}
      {(tab === 'suggestions' || tab === 'search') && (
        <MatchFiltersPanel
          filters={filters}
          onChange={setFilters}
          matchGenderLabel={matchGenderLabel}
          compact
        />
      )}

      {/* Interests sub-tabs */}
      {tab === 'interests' && (
        <div className="flex flex-wrap gap-2">
          {INTEREST_TABS.map((t) => {
            const Icon = t.icon;
            const active = interestSubTab === t.id;
            const count =
              t.id === 'received'
                ? received.data?.length ?? 0
                : t.id === 'sent'
                  ? sent.data?.length ?? 0
                  : accepted.data?.length ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterestSubTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-[#B66A8A] text-white shadow-md'
                    : 'border border-[#F0DFE7] bg-white text-[#7B4A62] hover:bg-[#FFF5F8]'
                }`}
              >
                <Icon size={15} />
                {t.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/25' : 'bg-[#F7E4EC] text-[#A65A7D]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {tab === 'interests' ? (
        <div className="space-y-3">
          {interestSubTab === 'received' && (
            received.data?.length ? (
              received.data.map((match) => (
                <InterestRequestCard
                  key={match.id}
                  match={match}
                  variant="received"
                  onAccept={async () => {
                    await acceptInterest.mutateAsync(match.id);
                    toast.success('Interest accepted — you can chat now');
                    setInterestSubTab('accepted');
                  }}
                  onReject={async () => {
                    await rejectInterest.mutateAsync(match.id);
                    toast.success('Interest declined');
                  }}
                />
              ))
            ) : (
              <EmptyState tab="interests" />
            )
          )}

          {interestSubTab === 'sent' && (
            sent.data?.length ? (
              sent.data.map((match) => (
                <InterestRequestCard key={match.id} match={match} variant="sent" />
              ))
            ) : (
              <EmptyState tab="interests" />
            )
          )}

          {interestSubTab === 'accepted' && (
            accepted.data?.length ? (
              <>
                {accepted.data.map((match) => (
                  <InterestRequestCard
                    key={match.id}
                    match={match}
                    variant={match.senderId === user?.id ? 'sent' : 'received'}
                  />
                ))}
                <Link to="/app/chat" className="inline-flex items-center gap-1 text-sm font-semibold text-[#B66A8A] hover:underline">
                  Open chat with your matches →
                </Link>
              </>
            ) : (
              <EmptyState tab="interests" />
            )
          )}
        </div>
      ) : isLoading ? (
        <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-[420px] animate-pulse rounded-3xl bg-gradient-to-br from-[#FFF9FC] to-[#F8F3FF]" />
          ))}
        </div>
      ) : profiles.length > 0 ? (
        <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile: MatchProfile) => {
            const isShortlisted = shortlistedIds.has(profile.id) || shortlistedIds.has(profile.userId);
            return (
              <MatchProfileCard
                key={profile.id}
                profile={profile}
                showScore={tab !== 'shortlist'}
                interestSent={sentInterestIds.includes(profile.userId) || sentInterestIds.includes(profile.id)}
                shortlisted={isShortlisted}
                onShortlist={() => handleShortlist(profile, isShortlisted)}
                onInterest={() => handleInterest(profile)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState tab={tab} />
      )}
    </div>
  );
}

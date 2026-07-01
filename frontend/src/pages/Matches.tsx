import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Search, Sparkles, Star, Users } from 'lucide-react';
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
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import { EMPTY_FILTERS, type InterestSubTab, type MatchFilters, type MatchInterest, type MatchTab } from '../types/matchmaking';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { formatMatchGenderLabel, resolveOppositeGenderLabel } from '../lib/matchGender';

const TABS: { id: MatchTab; label: string; icon: typeof Heart }[] = [
  { id: 'suggestions', label: 'Suggested', icon: Sparkles },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'shortlist', label: 'Shortlist', icon: Star },
  { id: 'interests', label: 'Interests', icon: Users },
];

const INTEREST_TABS: { id: InterestSubTab; label: string }[] = [
  { id: 'received', label: 'Received' },
  { id: 'sent', label: 'Sent' },
  { id: 'accepted', label: 'Accepted' },
];

function collectSentIds(matches: MatchInterest[] | undefined) {
  const ids = new Set<string>();
  matches?.forEach((m) => {
    if (m.receiverProfile?.id) ids.add(m.receiverProfile.id);
    if (m.receiverProfile?.userId) ids.add(m.receiverProfile.userId);
    ids.add(m.receiverId);
  });
  return Array.from(ids);
}

export default function Matches() {
  const [tab, setTab] = useState<MatchTab>('search');
  const [interestSubTab, setInterestSubTab] = useState<InterestSubTab>('received');
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [sentInterestIds, setSentInterestIds] = useState<string[]>([]);
  const [params, setParams] = useSearchParams();
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
  const { sendInterest, acceptInterest, rejectInterest } = useMatchActions();

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
    const urlTab = params.get('tab') as MatchTab | null;
    if (urlTab && TABS.some((t) => t.id === urlTab)) {
      setTab(urlTab);
    }
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

  const suggestions = useMatchSuggestions(debouncedFilters);
  const search = useMatchSearch(debouncedFilters, tab === 'search');
  const shortlist = useShortlist();
  const received = useReceivedInterests();
  const sent = useSentInterests();
  const accepted = useAcceptedInterests();

  useEffect(() => {
    setSentInterestIds(collectSentIds(sent.data));
  }, [sent.data]);

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
    return list.filter((p: { gender?: string }) => p.gender === targetGender);
  }, [activeData?.profiles, targetGender]);
  const pendingReceivedCount = received.data?.length ?? 0;

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

  const tabLabels: Record<MatchTab, string> = {
    suggestions: 'Suggested matches',
    search: 'Search results',
    shortlist: 'Your shortlist',
    interests: 'Interest requests',
  };

  return (
    <div className="space-y-8 soft-fade-in">
      <section className="relative overflow-hidden rounded-3xl border border-[#F2DFE8] bg-gradient-to-br from-[#FFF8FB] via-[#F8F3FF] to-[#FFF5EF] p-6 shadow-[0_15px_45px_rgba(174,94,129,0.12)] sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#F4D8E4]/60 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-[#EBDDFF]/60 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#E5C8D5] bg-white/80 px-4 py-1 text-xs font-medium tracking-wide text-[#9A5776]">
              <Heart size={14} className="text-[#C1698F]" fill="currentColor" /> Matchmaking
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-[#5D2B44] sm:text-4xl">Find Your Match</h1>
            <p className="mt-2 max-w-xl text-sm text-[#815A6D] sm:text-base">
              {matchGenderLabel
                ? `Discover compatible ${matchGenderLabel.toLowerCase()} based on your profile preferences.`
                : 'Discover compatible profiles, send interests, and build meaningful connections.'}
            </p>
          </div>

          <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-[#EEDBE5] bg-white/80 p-1.5 shadow-sm backdrop-blur">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-gradient-to-r from-[#B66A8A] to-[#C07AA0] text-white shadow-md shadow-[#B66A8A]/25'
                      : 'text-[#7B4A62] hover:bg-[#FFF5F9]'
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                  {t.id === 'interests' && pendingReceivedCount > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-[#FDE9F2] text-[#A75378]'
                    }`}>
                      {pendingReceivedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {(tab === 'suggestions' || tab === 'search') && (
        <MatchFiltersPanel filters={filters} onChange={setFilters} matchGenderLabel={matchGenderLabel} />
      )}

      {tab === 'interests' ? (
        <div className="space-y-5">
          <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-[#F0DFE7] bg-white p-1.5 shadow-sm">
            {INTEREST_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterestSubTab(t.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  interestSubTab === t.id
                    ? 'bg-[#B66A8A] text-white shadow-sm'
                    : 'text-[#7B4A62] hover:bg-[#FFF5F9]'
                }`}
              >
                {t.label}
                {t.id === 'received' && pendingReceivedCount > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 text-[10px] font-bold ${
                    interestSubTab === t.id ? 'bg-white/25 text-white' : 'bg-amber-400 text-white'
                  }`}>
                    {pendingReceivedCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {interestSubTab === 'received' && (
            <div className="rounded-2xl border border-[#F0DFE7] bg-white p-6 shadow-sm space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#523045]">Received Interests</h2>
              {received.data?.length ? (
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
                <p className="text-sm text-gray-500">No pending interest requests.</p>
              )}
            </div>
          )}

          {interestSubTab === 'sent' && (
            <div className="rounded-2xl border border-[#F0DFE7] bg-white p-6 shadow-sm space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#523045]">Sent Interests</h2>
              {sent.data?.length ? (
                sent.data.map((match) => (
                  <InterestRequestCard key={match.id} match={match} variant="sent" />
                ))
              ) : (
                <p className="text-sm text-gray-500">You have not sent any interests yet.</p>
              )}
            </div>
          )}

          {interestSubTab === 'accepted' && (
            <div className="rounded-2xl border border-[#F0DFE7] bg-white p-6 shadow-sm space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#523045]">Accepted Matches</h2>
              {accepted.data?.length ? (
                <>
                  {accepted.data.map((match) => (
                    <InterestRequestCard
                      key={match.id}
                      match={match}
                      variant={match.senderId === user?.id ? 'sent' : 'received'}
                    />
                  ))}
                  <Link to="/app/chat" className="inline-flex items-center gap-1 text-sm font-semibold text-[#B66A8A] hover:text-[#A75878]">
                    Open chat with your matches →
                  </Link>
                </>
              ) : (
                <p className="text-sm text-gray-500">No accepted matches yet.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {!isLoading && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#7B4A62]">
                {tabLabels[tab]}
                <span className="ml-2 rounded-full bg-[#F7E4EC] px-2.5 py-0.5 text-xs font-semibold text-[#A65A7D]">
                  {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
                </span>
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-80 animate-pulse rounded-2xl border border-[#F0DFE7] bg-gradient-to-br from-[#FFF9FC] to-[#F8F3FF]" />
              ))}
            </div>
          ) : profiles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile: any) => (
                <MatchProfileCard
                  key={profile.id}
                  profile={profile}
                  showScore
                  interestSent={sentInterestIds.includes(profile.userId) || sentInterestIds.includes(profile.id)}
                  onInterest={() => handleInterest(profile)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#F0DFE7] bg-gradient-to-br from-[#FFF9FC] to-[#FAF5FF] py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7E4EC] text-3xl">
                💞
              </div>
              <p className="font-display text-lg font-semibold text-[#5D2B44]">No profiles found right now</p>
              <p className="mt-1 text-sm text-[#9A5776]">Try clearing filters or check back soon for new matches.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

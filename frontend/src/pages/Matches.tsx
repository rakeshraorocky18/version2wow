import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Search, SlidersHorizontal, Sparkles, Star, Users } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFooterPagination } from '../context/FooterPaginationContext';
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

const PROFILES_PER_PAGE = 5;

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
  const [heroSearch, setHeroSearch] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'newest' | 'nameAsc' | 'ageAsc'>('default');
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { setTotalPages } = useFooterPagination();

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
    const genderFiltered = !targetGender ? list : list.filter((p: { gender?: string }) => p.gender === targetGender);
    const query = heroSearch.trim().toLowerCase();
    const searched = !query
      ? genderFiltered
      : genderFiltered.filter((p: any) => {
      const name = `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase();
      const location = `${p.city || ''} ${p.state || ''} ${p.country || ''}`.toLowerCase();
      const faith = `${p.religion || ''} ${p.caste || ''}`.toLowerCase();
      return name.includes(query) || location.includes(query) || faith.includes(query);
    });
    const sorted = [...searched];
    if (sortBy === 'nameAsc') {
      sorted.sort((a: any, b: any) =>
        `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`),
      );
    } else if (sortBy === 'ageAsc') {
      sorted.sort((a: any, b: any) => (a.age ?? 999) - (b.age ?? 999));
    } else if (sortBy === 'newest') {
      sorted.sort(
        (a: any, b: any) =>
          new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime(),
      );
    }
    return sorted;
  }, [activeData?.profiles, targetGender, heroSearch, sortBy]);

  const currentPage = Math.max(1, Number(params.get('page') || '1'));
  const totalPages = Math.max(1, Math.ceil(profiles.length / PROFILES_PER_PAGE));
  const paginatedProfiles = profiles.slice(
    (currentPage - 1) * PROFILES_PER_PAGE,
    currentPage * PROFILES_PER_PAGE,
  );

  useEffect(() => {
    if (tab === 'interests') {
      setTotalPages(1);
      return;
    }
    setTotalPages(totalPages);
  }, [tab, totalPages, setTotalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      const next = new URLSearchParams(params);
      if (totalPages <= 1) next.delete('page');
      else next.set('page', String(totalPages));
      setParams(next, { replace: true });
    }
  }, [currentPage, totalPages, params, setParams]);
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
    <div className="matches-page relative -mx-4 sm:-mx-6">
      <div className="matches-page-scroll-bg" aria-hidden>
        <img
          src="/images/matches-hero-bg.png"
          alt=""
          className="matches-page-scroll-texture"
        />
      </div>

      <div className="relative z-10 space-y-8 px-4 soft-fade-in sm:px-6">
      <section className="matches-hero relative overflow-hidden px-2 py-14 sm:px-4 sm:py-16">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#333333] sm:text-[2.75rem]">
            Our <span className="text-[#f82f71]">Members</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#444444] sm:text-[15px]">
            Your search for a great relationship has never been easier with groundbreaking overhaul of the
            datepress you know and trust.
          </p>
          <div className="matches-hero-search mx-auto mt-10 flex max-w-2xl items-center rounded-full bg-white px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <Search size={18} className="shrink-0 text-[#999999]" />
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => {
                setHeroSearch(e.target.value);
                if (tab !== 'search') setTab('search');
              }}
              onFocus={() => {
                if (tab !== 'search') setTab('search');
              }}
              placeholder="Search"
              className="h-11 flex-1 bg-transparent px-3 text-sm text-[#333333] placeholder:text-[#999999] outline-none"
            />
            <button
              type="button"
              onClick={() => setTab('search')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f82f71] text-white transition hover:bg-[#e62866]"
              aria-label="Filter search results"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>
      </section>

      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-white p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
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
          <div className="flex items-center gap-3">
            <span className="h-7 w-1.5 rounded-full bg-[#f82f71]" />
            <h2 className="text-xl font-bold text-[#333333]">Member Search</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
            {(tab === 'suggestions' || tab === 'search') && (
              <div>
                <MatchFiltersPanel filters={filters} onChange={setFilters} matchGenderLabel={matchGenderLabel} />
              </div>
            )}
            <div className="space-y-4">
              {!isLoading && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] sm:px-5">
                  <p className="text-sm font-semibold text-[#333333]">
                    Total <span className="text-[#f82f71]">{profiles.length}</span> Results Found
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="match-sort" className="text-sm font-semibold text-[#4C3843]">Sort By</label>
                    <select
                      id="match-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'default' | 'newest' | 'nameAsc' | 'ageAsc')}
                      className="h-10 min-w-[150px] rounded-lg border border-[#EEE3E8] bg-[#FAF7F9] px-3 text-sm text-[#5D4A55] outline-none transition focus:border-[#DCAFC2]"
                    >
                      <option value="default">Default</option>
                      <option value="newest">Newest</option>
                      <option value="nameAsc">Name (A-Z)</option>
                      <option value="ageAsc">Age (Low-High)</option>
                    </select>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-64 animate-pulse rounded-3xl border border-[#F0DFE7] bg-gradient-to-br from-[#FFF9FC] to-[#F8F3FF]" />
                  ))}
                </div>
              ) : profiles.length > 0 ? (
                <div className="space-y-4">
                  {paginatedProfiles.map((profile: any) => (
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
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

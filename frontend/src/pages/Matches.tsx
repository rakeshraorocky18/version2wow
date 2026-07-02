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

  return (
    <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
      <section className="dp-breadcrumb">
        <div className="dp-breadcrumb__bg" aria-hidden>
          <img src="/images/matches-hero-bg.png" alt="" />
        </div>
        <div className="dp-breadcrumb__content">
          <h1 className="dp-breadcrumb__title">
            Our <span>Members</span>
          </h1>
          <p className="dp-breadcrumb__subtitle">
            Your search for a great relationship has never been easier with groundbreaking overhaul of the
            datepress you know and trust.
          </p>
        </div>
      </section>

      <section className="dp-member-area">
        <div className="dp-member-area__shapes" aria-hidden>
          <span className="dp-heart-shape dp-heart-shape--1" />
          <span className="dp-heart-shape dp-heart-shape--2" />
          <span className="dp-heart-shape dp-heart-shape--3" />
          <span className="dp-heart-shape dp-heart-shape--4" />
        </div>

        <div className="dp-member-area__inner soft-fade-in">
          <div className="dp-search-bar">
            <Search size={22} className="dp-search-bar__icon" />
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
              className="dp-search-bar__input"
            />
            <button
              type="button"
              onClick={() => setTab('search')}
              className="dp-search-bar__filter"
              aria-label="Filter search results"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          <div className="dp-tabs">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`dp-tabs__btn ${active ? 'is-active' : ''}`}
                >
                  <Icon size={15} />
                  {t.label}
                  {t.id === 'interests' && pendingReceivedCount > 0 && (
                    <span className="dp-tabs__badge">{pendingReceivedCount}</span>
                  )}
                </button>
              );
            })}
          </div>

      {tab === 'interests' ? (
        <div className="space-y-5">
          <div className="dp-tabs dp-tabs--sub">
            {INTEREST_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterestSubTab(t.id)}
                className={`dp-tabs__btn ${interestSubTab === t.id ? 'is-active' : ''}`}
              >
                {t.label}
                {t.id === 'received' && pendingReceivedCount > 0 && (
                  <span className="dp-tabs__badge">{pendingReceivedCount}</span>
                )}
              </button>
            ))}
          </div>

          {interestSubTab === 'received' && (
            <div className="dp-panel space-y-3">
              <h2 className="dp-panel__title">Received Interests</h2>
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
                <p className="text-sm text-[#6a737c]">No pending interest requests.</p>
              )}
            </div>
          )}

          {interestSubTab === 'sent' && (
            <div className="dp-panel space-y-3">
              <h2 className="dp-panel__title">Sent Interests</h2>
              {sent.data?.length ? (
                sent.data.map((match) => (
                  <InterestRequestCard key={match.id} match={match} variant="sent" />
                ))
              ) : (
                <p className="text-sm text-[#6a737c]">You have not sent any interests yet.</p>
              )}
            </div>
          )}

          {interestSubTab === 'accepted' && (
            <div className="dp-panel space-y-3">
              <h2 className="dp-panel__title">Accepted Matches</h2>
              {accepted.data?.length ? (
                <>
                  {accepted.data.map((match) => (
                    <InterestRequestCard
                      key={match.id}
                      match={match}
                      variant={match.senderId === user?.id ? 'sent' : 'received'}
                    />
                  ))}
                  <Link to="/app/chat" className="inline-flex items-center gap-1 text-sm font-semibold text-[#f4196d] hover:underline">
                    Open chat with your matches →
                  </Link>
                </>
              ) : (
                <p className="text-sm text-[#6a737c]">No accepted matches yet.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="dp-member-layout">
            {(tab === 'suggestions' || tab === 'search') && (
              <MatchFiltersPanel filters={filters} onChange={setFilters} matchGenderLabel={matchGenderLabel} />
            )}
            <div className="dp-member-results">
              {!isLoading && (
                <div className="dp-result-toolbar">
                  <p className="dp-result-toolbar__count">
                    Total <span>{profiles.length}</span> Results Found
                  </p>
                  <div className="dp-result-toolbar__sort">
                    <label htmlFor="match-sort">Sort By</label>
                    <select
                      id="match-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'default' | 'newest' | 'nameAsc' | 'ageAsc')}
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
                <div className="space-y-8">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="dp-member-card dp-member-card--skeleton" />
                  ))}
                </div>
              ) : profiles.length > 0 ? (
                <div>
                  {paginatedProfiles.map((profile: any, idx: number) => (
                    <MatchProfileCard
                      key={profile.id}
                      profile={profile}
                      showScore
                      interestSent={sentInterestIds.includes(profile.userId) || sentInterestIds.includes(profile.id)}
                      onInterest={() => handleInterest(profile)}
                      animationDelay={idx * 100}
                    />
                  ))}
                </div>
              ) : (
                <div className="dp-empty-state">
                  <div className="dp-empty-state__icon">💞</div>
                  <p className="dp-empty-state__title">No profiles found right now</p>
                  <p className="dp-empty-state__text">Try clearing filters or check back soon for new matches.</p>
                </div>
              )}
            </div>
          </div>
      )}
        </div>
      </section>
    </div>
  );
}

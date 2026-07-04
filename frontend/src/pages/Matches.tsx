import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Heart, Search, SlidersHorizontal, Sparkles, Star, Users } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useFooterPagination } from '../context/FooterPaginationContext';
import {
  useMatchActions,
  useMyMatchProfile,
  useMatchSearch,
  useMatchSuggestions,
  useReceivedInterests,
  useSentInterests,
  useAcceptedInterests,
  useShortlist,
  usePremiumStatus,
  usePremiumActions,
} from '../hooks/useMatchmaking';
import MatchProfileCard from '../components/matchmaking/MatchProfileCard';
import MatchCardSkeleton from '../components/matchmaking/MatchCardSkeleton';
import MatchFiltersPanel from '../components/matchmaking/MatchFiltersPanel';
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import PremiumUpgradeBanner from '../components/matchmaking/PremiumUpgradeBanner';
import PremiumPlansModal from '../components/matchmaking/PremiumPlansModal';
import {
  EMPTY_FILTERS,
  type InterestSubTab,
  type MatchFilters,
  type MatchTab,
} from '../types/matchmaking';
import { useAuthStore } from '../store/authStore';
import { formatMatchGenderLabel, resolveOppositeGenderLabel } from '../lib/matchGender';
import {
  resolveInterestStatus,
  resolvePartnerUserId,
  isInterestAlreadyExistsError,
  type InterestStatus,
} from '../lib/matchInterestUtils';
import { estimateProfileCompletion } from '../lib/matchCardUtils';

const TABS: { id: MatchTab; label: string; icon: typeof Heart }[] = [
  { id: 'suggestions', label: 'Suggested', icon: Sparkles },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'shortlist', label: 'Shortlist', icon: Star },
  { id: 'interests', label: 'Interests', icon: Users },
];

const INTEREST_TABS: { id: InterestSubTab; label: string }[] = [
  { id: 'received', label: 'Interested in Me' },
  { id: 'sent', label: 'Sent' },
  { id: 'accepted', label: 'Accepted' },
];

const PROFILES_PER_PAGE = 12;
const INTERESTS_PER_PAGE = 10;

function paginateList<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    totalPages,
    currentPage: safePage,
  };
}

export default function Matches() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MatchTab>('search');
  const [interestSubTab, setInterestSubTab] = useState<InterestSubTab>('received');
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [localConnectedIds, setLocalConnectedIds] = useState<Set<string>>(() => new Set());
  const [heroSearch, setHeroSearch] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'newest' | 'nameAsc' | 'ageAsc'>('default');
  const [plansOpen, setPlansOpen] = useState(false);
  const [shortlistLoadingId, setShortlistLoadingId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { setTotalPages } = useFooterPagination();
  const filtersInitialized = useRef(false);

  const { data: myProfile } = useMyMatchProfile();

  const matchGenderLabel = formatMatchGenderLabel(
    resolveOppositeGenderLabel(myProfile?.gender, user?.role),
  );
  const targetGender = resolveOppositeGenderLabel(myProfile?.gender, user?.role);

  const { sendInterest, acceptInterest, rejectInterest, toggleShortlist } = useMatchActions();
  const { data: premiumStatus } = usePremiumStatus();
  const { activateBoost } = usePremiumActions();

  const currentPage = Math.max(1, Number(params.get('page') || '1'));

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
    if (filtersInitialized.current) return;
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
    filtersInitialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  const prevFiltersRef = useRef(JSON.stringify(debouncedFilters));
  const prevTabRef = useRef(tab);

  useEffect(() => {
    const filtersKey = JSON.stringify(debouncedFilters);
    const filtersChanged = prevFiltersRef.current !== filtersKey;
    const tabChanged = prevTabRef.current !== tab;
    if (!filtersChanged && !tabChanged) return;

    prevFiltersRef.current = filtersKey;
    prevTabRef.current = tab;

    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('tab', tab);
        if (tab === 'interests') {
          next.set('interest', interestSubTab);
        } else {
          next.delete('interest');
        }
        (Object.keys(EMPTY_FILTERS) as Array<keyof MatchFilters>).forEach((key) => {
          const value = debouncedFilters[key];
          if (value === '' || value === false) next.delete(key);
          else next.set(key, String(value));
        });
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [debouncedFilters, tab, interestSubTab, setParams]);

  const suggestions = useMatchSuggestions(debouncedFilters, {
    enabled: tab === 'suggestions',
    page: currentPage,
    limit: PROFILES_PER_PAGE,
  });
  const search = useMatchSearch(debouncedFilters, {
    enabled: tab === 'search',
    page: currentPage,
    limit: PROFILES_PER_PAGE,
  });
  const shortlist = useShortlist(true);
  const shortlistedIds = useMemo(
    () => new Set((shortlist.data?.profiles ?? []).map((p) => p.id)),
    [shortlist.data?.profiles],
  );
  const received = useReceivedInterests();
  const sent = useSentInterests();
  const accepted = useAcceptedInterests();

  const resolveInterest = (profile: {
    id: string;
    userId: string;
    interestStatus?: InterestStatus;
    matchPartnerUserId?: string | null;
  }): InterestStatus =>
    resolveInterestStatus(
      profile,
      sent.data,
      received.data,
      accepted.data,
      user?.id,
      localConnectedIds,
    );

  const resolvePartner = (profile: {
    id: string;
    userId: string;
    matchPartnerUserId?: string | null;
  }) =>
    resolvePartnerUserId(profile, accepted.data, sent.data, user?.id) || profile.userId;

  const activeData = useMemo(() => {
    if (tab === 'suggestions') return suggestions.data;
    if (tab === 'search') return search.data;
    if (tab === 'shortlist') return shortlist.data;
    return null;
  }, [tab, suggestions.data, search.data, shortlist.data]);

  const activeQuery =
    tab === 'suggestions' ? suggestions : tab === 'search' ? search : tab === 'shortlist' ? shortlist : null;

  const isInitialLoading = Boolean(activeQuery?.isLoading && !activeQuery?.data);
  const isFetching = Boolean(activeQuery?.isFetching);
  const isError = Boolean(activeQuery?.isError);
  const refetchActive = activeQuery?.refetch;

  const profiles = useMemo(() => {
    const list = activeData?.profiles || [];
    const genderFiltered = !targetGender
      ? list
      : list.filter((p: { gender?: string }) => p.gender === targetGender);

    const verifiedFiltered = debouncedFilters.verifiedOnly
      ? genderFiltered.filter((p: { isVerified?: boolean }) => p.isVerified === true)
      : genderFiltered;

    const minCompletion = Number(debouncedFilters.minProfileCompletion) || 0;
    const completionFiltered =
      minCompletion > 0
        ? verifiedFiltered.filter((p) => estimateProfileCompletion(p) >= minCompletion)
        : verifiedFiltered;

    const query = heroSearch.trim().toLowerCase();
    const searched = !query
      ? completionFiltered
      : completionFiltered.filter((p: { firstName?: string; lastName?: string; city?: string; state?: string; country?: string; religion?: string; caste?: string }) => {
          const name = `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase();
          const location = `${p.city || ''} ${p.state || ''} ${p.country || ''}`.toLowerCase();
          const faith = `${p.religion || ''} ${p.caste || ''}`.toLowerCase();
          return name.includes(query) || location.includes(query) || faith.includes(query);
        });
    const sorted = [...searched];
    if (sortBy === 'nameAsc') {
      sorted.sort((a, b) =>
        `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`),
      );
    } else if (sortBy === 'ageAsc') {
      sorted.sort((a, b) => (a.age ?? 999) - (b.age ?? 999));
    } else if (sortBy === 'newest') {
      sorted.sort(
        (a, b) =>
          new Date((a as { createdAt?: string; updatedAt?: string }).createdAt || (a as { updatedAt?: string }).updatedAt || 0).getTime() -
          new Date((b as { createdAt?: string; updatedAt?: string }).createdAt || (b as { updatedAt?: string }).updatedAt || 0).getTime(),
      );
    }
    return sorted;
  }, [activeData?.profiles, targetGender, heroSearch, sortBy, debouncedFilters.verifiedOnly, debouncedFilters.minProfileCompletion]);

  const serverTotal = activeData?.total ?? profiles.length;
  const totalPages = Math.max(1, Math.ceil(serverTotal / PROFILES_PER_PAGE));

  const pendingReceived = (received.data ?? []).filter((m) => m.status === 'pending');
  const pendingReceivedCount = pendingReceived.length;

  const receivedPage = paginateList(pendingReceived, currentPage, INTERESTS_PER_PAGE);
  const sentPage = paginateList(sent.data ?? [], currentPage, INTERESTS_PER_PAGE);
  const acceptedPage = paginateList(accepted.data ?? [], currentPage, INTERESTS_PER_PAGE);

  useEffect(() => {
    if (tab === 'interests') {
      const interestList =
        interestSubTab === 'received'
          ? pendingReceived
          : interestSubTab === 'sent'
            ? (sent.data ?? [])
            : (accepted.data ?? []);
      setTotalPages(Math.max(1, Math.ceil(interestList.length / INTERESTS_PER_PAGE)));
      return;
    }
    setTotalPages(totalPages);
  }, [tab, interestSubTab, totalPages, pendingReceived, sent.data, accepted.data, setTotalPages]);

  useEffect(() => {
    const listLen =
      tab === 'interests'
        ? interestSubTab === 'received'
          ? pendingReceived.length
          : interestSubTab === 'sent'
            ? (sent.data?.length ?? 0)
            : (accepted.data?.length ?? 0)
        : serverTotal;
    const maxPages =
      tab === 'interests'
        ? Math.max(1, Math.ceil(listLen / INTERESTS_PER_PAGE))
        : totalPages;
    if (currentPage > maxPages) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (maxPages <= 1) next.delete('page');
          else next.set('page', String(maxPages));
          return next;
        },
        { replace: true },
      );
    }
  }, [currentPage, totalPages, tab, interestSubTab, pendingReceived.length, sent.data, accepted.data, serverTotal, setParams]);

  const handleInterest = async (profile: { id: string; userId: string; interestStatus?: InterestStatus }) => {
    const status = resolveInterest(profile);
    if (status !== 'none') return;

    const receiverId = profile.userId || profile.id;
    if (!receiverId) {
      toast.error('Unable to send interest for this profile');
      return;
    }
    if (!myProfile?.id) {
      toast.error('Complete your profile before sending interest');
      navigate('/app/profile/edit');
      return;
    }
    if (profile.userId === user?.id) {
      toast.error('You cannot send interest to your own profile');
      return;
    }
    try {
      await sendInterest.mutateAsync(receiverId);
      setLocalConnectedIds((prev) => {
        const next = new Set(prev);
        next.add(profile.id);
        next.add(profile.userId);
        return next;
      });
      toast.success('Interest sent successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Could not send interest';
      if (isInterestAlreadyExistsError(msg)) {
        setLocalConnectedIds((prev) => {
          const next = new Set(prev);
          next.add(profile.id);
          next.add(profile.userId);
          return next;
        });
        return;
      }
      toast.error(msg);
    }
  };

  const handleInterestSubTabChange = (sub: InterestSubTab) => {
    setInterestSubTab(sub);
    const next = new URLSearchParams(params);
    next.set('interest', sub);
    next.delete('page');
    setParams(next, { replace: true });
  };

  const handleActivateBoost = async () => {
    try {
      const result = await activateBoost.mutateAsync();
      toast.success(
        result.isBoosted
          ? 'Profile boost activated! You will appear at the top of match listings.'
          : 'Boost activated',
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Could not activate boost');
    }
  };

  const handleShortlist = async (profile: { id: string }) => {
    const shortlisted = shortlistedIds.has(profile.id);
    setShortlistLoadingId(profile.id);
    try {
      await toggleShortlist.mutateAsync({ profileId: profile.id, shortlisted });
      toast.success(shortlisted ? 'Removed from shortlist' : 'Added to shortlist');
    } catch {
      toast.error('Could not update shortlist');
    } finally {
      setShortlistLoadingId(null);
    }
  };

  return (
    <div className="datepress-matches matches-page relative -mx-4 sm:-mx-6">
      <div className="datepress-bg" aria-hidden>
        <div className="datepress-bg__streaks" />
        <div className="datepress-bg__radials">
          <span className="datepress-bg__radial datepress-bg__radial--light-pink" />
          <span className="datepress-bg__radial datepress-bg__radial--baby-pink" />
          <span className="datepress-bg__radial datepress-bg__radial--soft-blue" />
          <span className="datepress-bg__radial datepress-bg__radial--lavender" />
          <span className="datepress-bg__radial datepress-bg__radial--light-pink-2" />
          <span className="datepress-bg__radial datepress-bg__radial--soft-blue-2" />
        </div>
        <div className="datepress-bg__hearts">
          <svg className="datepress-bg__heart datepress-bg__heart--1" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 105c-1.2-1.1-28.5-26.2-28.5-45.8 0-12.4 10-22.4 22.4-22.4 7.1 0 13.7 3.4 17.8 8.6 4.1-5.2 10.7-8.6 17.8-8.6 12.4 0 22.4 10 22.4 22.4 0 19.6-27.3 44.7-28.5 45.8L60 105z" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
          </svg>
          <svg className="datepress-bg__heart datepress-bg__heart--2" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 105c-1.2-1.1-28.5-26.2-28.5-45.8 0-12.4 10-22.4 22.4-22.4 7.1 0 13.7 3.4 17.8 8.6 4.1-5.2 10.7-8.6 17.8-8.6 12.4 0 22.4 10 22.4 22.4 0 19.6-27.3 44.7-28.5 45.8L60 105z" stroke="rgba(255,255,255,0.14)" strokeWidth="3" />
          </svg>
          <svg className="datepress-bg__heart datepress-bg__heart--3" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 105c-1.2-1.1-28.5-26.2-28.5-45.8 0-12.4 10-22.4 22.4-22.4 7.1 0 13.7 3.4 17.8 8.6 4.1-5.2 10.7-8.6 17.8-8.6 12.4 0 22.4 10 22.4 22.4 0 19.6-27.3 44.7-28.5 45.8L60 105z" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
          </svg>
          <svg className="datepress-bg__heart datepress-bg__heart--4" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 105c-1.2-1.1-28.5-26.2-28.5-45.8 0-12.4 10-22.4 22.4-22.4 7.1 0 13.7 3.4 17.8 8.6 4.1-5.2 10.7-8.6 17.8-8.6 12.4 0 22.4 10 22.4 22.4 0 19.6-27.3 44.7-28.5 45.8L60 105z" stroke="rgba(255,255,255,0.15)" strokeWidth="3.5" />
          </svg>
        </div>
        <div className="datepress-bg__frost" />
      </div>
      <section className="dp-breadcrumb">
        <div className="dp-breadcrumb__content">
          <h1 className="dp-breadcrumb__title">
            Find Your <span>Perfect Match</span>
          </h1>
          <p className="dp-breadcrumb__subtitle">
            Join thousands of verified members and discover a trusted matrimonial experience designed
            to help you find your perfect life partner with WOW – World of Weddings.
          </p>
        </div>
      </section>

      <section className="dp-member-area">
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

          {tab !== 'interests' && (
            <PremiumUpgradeBanner
              premiumStatus={premiumStatus}
              onViewPlans={() => setPlansOpen(true)}
              onActivateBoost={() => void handleActivateBoost()}
              boostLoading={activateBoost.isPending}
            />
          )}

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
                    onClick={() => handleInterestSubTabChange(t.id)}
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
                  <h2 className="dp-panel__title">Interested in Me</h2>
                  {received.isLoading && !received.data ? (
                    <p className="text-sm text-[#6a737c]">Loading interests…</p>
                  ) : receivedPage.items.length ? (
                    receivedPage.items.map((match) => (
                      <InterestRequestCard
                        key={match.id}
                        match={match}
                        variant="received"
                        onAccept={async () => {
                          await acceptInterest.mutateAsync(match.id);
                          toast.success('Interest accepted — you can chat now');
                          setInterestSubTab('accepted');
                          const next = new URLSearchParams(params);
                          next.set('interest', 'accepted');
                          next.delete('page');
                          setParams(next, { replace: true });
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
                  {sent.isLoading && !sent.data ? (
                    <p className="text-sm text-[#6a737c]">Loading…</p>
                  ) : sentPage.items.length ? (
                    sentPage.items.map((match) => (
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
                  {accepted.isLoading && !accepted.data ? (
                    <p className="text-sm text-[#6a737c]">Loading…</p>
                  ) : acceptedPage.items.length ? (
                    <>
                      {acceptedPage.items.map((match) => (
                        <InterestRequestCard
                          key={match.id}
                          match={match}
                          variant={match.senderId === user?.id ? 'sent' : 'received'}
                        />
                      ))}
                      <Link
                        to="/app/chat"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#f4196d] hover:underline"
                      >
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
                {!isInitialLoading && (
                  <div className="dp-result-toolbar">
                    <p className="dp-result-toolbar__count">
                      Total <span>{serverTotal}</span> Results Found
                      {isFetching && (
                        <span className="ml-2 text-xs font-normal text-[#9a5776]">Updating…</span>
                      )}
                    </p>
                    <div className="dp-result-toolbar__sort">
                      <label htmlFor="match-sort">Sort By</label>
                      <select
                        id="match-sort"
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as 'default' | 'newest' | 'nameAsc' | 'ageAsc')
                        }
                      >
                        <option value="default">Default</option>
                        <option value="newest">Newest</option>
                        <option value="nameAsc">Name (A-Z)</option>
                        <option value="ageAsc">Age (Low-High)</option>
                      </select>
                    </div>
                  </div>
                )}

                {isInitialLoading ? (
                  <div className="space-y-10">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <MatchCardSkeleton key={idx} />
                    ))}
                  </div>
                ) : isError ? (
                  <div className="dp-empty-state dp-empty-state--error">
                    <div className="dp-empty-state__icon">⚠️</div>
                    <p className="dp-empty-state__title">Could not load profiles</p>
                    <p className="dp-empty-state__text">
                      Something went wrong while fetching matches. Please try again.
                    </p>
                    <button
                      type="button"
                      className="dp-connect-btn dp-empty-state__retry"
                      onClick={() => void refetchActive?.()}
                    >
                      Retry
                    </button>
                  </div>
                ) : profiles.length > 0 ? (
                  <div className="dp-profile-list">
                    {profiles.map((profile, idx) => {
                      const interestStatus = resolveInterest(profile);
                      const partnerUserId = resolvePartner(profile);
                      return (
                        <MatchProfileCard
                          key={profile.id}
                          profile={profile}
                          showScore
                          interestStatus={interestStatus}
                          partnerUserId={partnerUserId}
                          onInterest={() => handleInterest(profile)}
                          onShortlist={() => handleShortlist(profile)}
                          isShortlisted={shortlistedIds.has(profile.id)}
                          animationDelay={idx * 40}
                          interestLoading={sendInterest.isPending}
                          shortlistLoading={shortlistLoadingId === profile.id}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="dp-empty-state">
                    <div className="dp-empty-state__icon">💞</div>
                    <p className="dp-empty-state__title">No profiles found right now</p>
                    <p className="dp-empty-state__text">
                      Try adjusting your filters, clearing search, or check back soon for new members.
                    </p>
                    {(debouncedFilters.verifiedOnly ||
                      debouncedFilters.minProfileCompletion ||
                      heroSearch) && (
                      <button
                        type="button"
                        className="dp-filter-sidebar__clear mt-4"
                        onClick={() => {
                          setFilters(EMPTY_FILTERS);
                          setHeroSearch('');
                        }}
                      >
                        Clear filters & search
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <PremiumPlansModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlan={premiumStatus?.subscriptionType || 'Free'}
      />
    </div>
  );
}

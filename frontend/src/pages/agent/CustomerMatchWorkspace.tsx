import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Filter,
  HeartHandshake,
  Loader2,
  PanelRightOpen,
  Pencil,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  useAgentCustomer,
  useAgentCustomerMatching,
  useAgentRecommendations,
} from '../../hooks/agent/useAgent';
import {
  EMPTY_MATCH_FILTERS,
  filtersFromPartnerPreferences,
  toMatchSearchPayload,
  type AgentMatchFilters,
  type AgentMatchProfile,
  type MatchSortBy,
  type MatchViewMode,
} from '../../types/agentMatching';
import PartnerPreferenceSidebar from '../../components/agent/matching/PartnerPreferenceSidebar';
import MatchToolbar, {
  buildActiveFilterChips,
} from '../../components/agent/matching/MatchToolbar';
import MatchProfileCard from '../../components/agent/matching/MatchProfileCard';
import MatchLoadingSkeleton from '../../components/agent/matching/MatchLoadingSkeleton';
import SuggestionSlidePanel from '../../components/agent/matching/SuggestionSlidePanel';
import MatchLockBanner from '../../components/agent/matching/MatchLockBanner';
import {
  isMatchmakingUnlocked,
  MATCH_COMPLETION_THRESHOLD,
} from '../../constants/agentMatching';
import { ErrorState, ProfileProgress, StatusBadge, TableSkeleton } from '../../components/agent/AgentUI';

const PAGE_SIZE = 12;

export default function CustomerMatchWorkspace() {
  const navigate = useNavigate();
  const { customerId = '', id = '' } = useParams();
  const resolvedId = customerId || id;

  const {
    data: customer,
    isLoading: customerLoading,
    isError: customerError,
  } = useAgentCustomer(resolvedId);

  const [draftFilters, setDraftFilters] = useState<AgentMatchFilters>(EMPTY_MATCH_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AgentMatchFilters>(EMPTY_MATCH_FILTERS);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<MatchSortBy>('compatibility');
  const [viewMode, setViewMode] = useState<MatchViewMode>('list');
  const [page, setPage] = useState(1);
  const [scrollMode, setScrollMode] = useState<'pagination' | 'infinite'>('pagination');
  const [accumulated, setAccumulated] = useState<AgentMatchProfile[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const prefillsApplied = useRef(false);
  const suggestionsScheduled = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setFiltersOpen(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Prefill draft filters from partner prefs for agent convenience — do NOT apply on load
  useEffect(() => {
    if (!customer || prefillsApplied.current) return;
    const prefs = filtersFromPartnerPreferences(
      customer.partnerPreferences as Record<string, unknown> | undefined,
    );
    setDraftFilters(prefs);
    setAppliedFilters(EMPTY_MATCH_FILTERS);
    prefillsApplied.current = true;
  }, [customer]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [debouncedSearch, sortBy, appliedFilters, scrollMode]);

  const searchPayload = useMemo(
    () =>
      toMatchSearchPayload(appliedFilters, {
        search: debouncedSearch,
        sortBy,
        page,
        limit: PAGE_SIZE,
      }),
    [appliedFilters, debouncedSearch, sortBy, page],
  );

  const filtersActive = useMemo(() => {
    const payload = toMatchSearchPayload(appliedFilters, {});
    return Object.keys(payload).some(
      (key) => !['sortBy', 'page', 'limit', 'search'].includes(key),
    );
  }, [appliedFilters]);

  const {
    data: results,
    isLoading: matchesLoading,
    isFetching,
    isError: matchesError,
    refetch: refetchMatches,
  } = useAgentCustomerMatching(resolvedId, searchPayload, !!resolvedId);

  const {
    data: recommendations,
    isLoading: recLoading,
    isFetching: recFetching,
    refetch: refetchRecs,
  } = useAgentRecommendations(resolvedId, !!resolvedId);

  useEffect(() => {
    if (!results?.data) return;
    if (scrollMode === 'infinite') {
      setAccumulated((prev) => {
        if (page === 1) return results.data;
        const existing = new Set(prev.map((p) => p.id));
        return [...prev, ...results.data.filter((p) => !existing.has(p.id))];
      });
    } else {
      setAccumulated(results.data);
    }
  }, [results, page, scrollMode]);

  // Auto-open AI panel ~700ms after workspace is ready (independent of filters/results)
  useEffect(() => {
    if (suggestionsScheduled.current) return;
    if (customerLoading || !customer) return;
    suggestionsScheduled.current = true;
    const timer = window.setTimeout(() => setSuggestionsOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [customerLoading, customer]);

  useEffect(() => {
    if (scrollMode !== 'infinite') return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || isFetching) return;
        if (!results || page >= results.totalPages) return;
        setPage((p) => p + 1);
      },
      { rootMargin: '240px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollMode, isFetching, results, page]);

  const customerName = customer
    ? `${customer.firstName} ${customer.lastName || ''}`.trim()
    : '';
  const profiles = scrollMode === 'infinite' ? accumulated : results?.data || [];
  const total = results?.total ?? 0;
  const totalPages = results?.totalPages ?? 1;
  const showSkeleton = (customerLoading || matchesLoading) && page === 1;
  const suggestedProfiles = recommendations?.data || [];
  const requiredThreshold =
    customer?.matchCompletionThreshold ?? MATCH_COMPLETION_THRESHOLD;
  const matchUnlocked =
    customer?.matchmakingUnlocked ??
    isMatchmakingUnlocked(customer?.profileCompletion);
  const editUrl = `/agent/customers/${resolvedId}/edit`;
  const activeChips = useMemo(
    () => buildActiveFilterChips(appliedFilters),
    [appliedFilters],
  );

  const removeChip = (key: string) => {
    setAppliedFilters((prev) => {
      const next = { ...prev };
      if (key === 'age') {
        next.minAge = '';
        next.maxAge = '';
      } else if (key === 'height') {
        next.minHeight = '';
        next.maxHeight = '';
      } else if (key in next) {
        const typedKey = key as keyof AgentMatchFilters;
        if (typeof next[typedKey] === 'boolean') {
          (next as Record<string, unknown>)[key] = false;
        } else {
          (next as Record<string, unknown>)[key] = '';
        }
      }
      setDraftFilters(next);
      return next;
    });
    setPage(1);
  };

  const notify = (message: string) => toast.success(message);

  if (customerLoading) return <TableSkeleton rows={6} />;
  if (customerError || !customer) {
    return (
      <div className="space-y-4">
        <Link
          to="/agent/customers"
          className="inline-flex items-center gap-1 text-sm text-wow-muted hover:text-wow-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <ErrorState message="Customer not found." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/agent/customers"
            className="mb-2 inline-flex items-center gap-1 text-sm text-wow-muted hover:text-wow-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to customers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-wow-primary to-wow-primary-light text-white shadow-sm">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl text-wow-text sm:text-3xl">
                  Match Workspace
                </h1>
                <StatusBadge status={customer.status} />
              </div>
              <p className="text-sm text-wow-muted">
                Finding matches for{' '}
                <span className="font-medium text-wow-primary">{customerName}</span>
                <span> · {customer.customerCode}</span>
              </p>
            </div>
          </div>
          <div className="mt-3 max-w-sm">
            <ProfileProgress value={customer.profileCompletion} />
            {!matchUnlocked && (
              <p className="mt-1.5 text-xs text-wow-muted">
                {customer.profileCompletion}% complete · {requiredThreshold}% required to unlock
                matchmaking
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium lg:hidden"
          >
            <Filter className="h-4 w-4" />
            {filtersOpen ? 'Hide Filters' : 'Filters'}
          </button>
          {!suggestionsOpen && (
            <button
              type="button"
              onClick={() => setSuggestionsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-wow-primary/30 bg-[#FFF5F7] px-3 py-2 text-sm font-medium text-wow-primary"
            >
              <PanelRightOpen className="h-4 w-4" />
              AI Suggestions
            </button>
          )}
          {!matchUnlocked ? (
            <Link
              to={editUrl}
              className="btn-primary inline-flex items-center gap-1.5 !py-2 !px-3 text-sm shadow-md shadow-wow-primary/25"
            >
              <Pencil className="h-4 w-4" /> Complete Profile
            </Link>
          ) : (
            <>
              <Link
                to={`/agent/customers/${resolvedId}/manage`}
                className="btn-secondary inline-flex items-center gap-1.5 !py-2 !px-3 text-sm"
              >
                <Pencil className="h-4 w-4" /> Manage
              </Link>
              <Link
                to={`/agent/customers/${resolvedId}/profile`}
                className="btn-primary inline-flex items-center gap-1.5 !py-2 !px-3 text-sm"
              >
                View Profile
              </Link>
            </>
          )}
        </div>
      </div>

      {!matchUnlocked && (
        <MatchLockBanner
          profileCompletion={customer.profileCompletion}
          requiredThreshold={requiredThreshold}
          editUrl={editUrl}
        />
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div
          className={`${filtersOpen ? 'block' : 'hidden'} lg:block ${
            matchUnlocked ? '' : 'opacity-80'
          }`}
        >
          <PartnerPreferenceSidebar
            filters={draftFilters}
            onChange={setDraftFilters}
            onApply={() => {
              if (!matchUnlocked) {
                toast.error(`Complete the customer profile to ${requiredThreshold}% to filter matches`);
                return;
              }
              setAppliedFilters(draftFilters);
              setPage(1);
              toast.success('Filters applied');
            }}
            onReset={() => {
              const prefs = filtersFromPartnerPreferences(
                customer.partnerPreferences as Record<string, unknown> | undefined,
              );
              setDraftFilters(prefs);
              setAppliedFilters(EMPTY_MATCH_FILTERS);
              setPage(1);
              toast.success('Showing all profiles again');
            }}
            onSaveSearch={() => {
              if (!matchUnlocked) {
                toast.error('Complete the customer profile to save searches');
                return;
              }
              try {
                localStorage.setItem(
                  `wow-agent-saved-search:${resolvedId}`,
                  JSON.stringify({ filters: draftFilters, savedAt: new Date().toISOString() }),
                );
                toast.success('Search saved');
              } catch {
                toast.error('Unable to save search');
              }
            }}
            isApplying={isFetching}
          />
        </div>

        <section className="min-w-0 flex-1 space-y-5" aria-label="Matching profiles">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-wow-text">
                {filtersActive ? 'Matching Profiles' : 'All Profiles'}
              </h2>
              <p className="mt-1 text-sm text-wow-muted">
                {filtersActive
                  ? 'Profiles matching your applied filters.'
                  : 'Browse every available profile. Apply filters when you want to narrow results.'}
              </p>
            </div>
            <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setScrollMode('pagination')}
                className={`rounded-xl px-3 py-1.5 font-medium transition ${
                  scrollMode === 'pagination' ? 'bg-wow-primary text-white' : 'text-wow-muted'
                }`}
              >
                Pagination
              </button>
              <button
                type="button"
                onClick={() => setScrollMode('infinite')}
                className={`rounded-xl px-3 py-1.5 font-medium transition ${
                  scrollMode === 'infinite' ? 'bg-wow-primary text-white' : 'text-wow-muted'
                }`}
              >
                Infinite Scroll
              </button>
            </div>
          </div>

          <MatchToolbar
            search={search}
            onSearchChange={setSearch}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resultCount={total}
            isFetching={isFetching && !showSkeleton}
            onRefresh={() => void refetchMatches()}
            activeChips={activeChips}
            onRemoveChip={removeChip}
            onClearChips={() => {
              setAppliedFilters(EMPTY_MATCH_FILTERS);
              setDraftFilters(
                filtersFromPartnerPreferences(
                  customer.partnerPreferences as Record<string, unknown> | undefined,
                ),
              );
              setPage(1);
            }}
          />

          {matchesError && (
            <div className="card border-red-100 bg-red-50 py-8 text-center">
              <p className="mb-3 font-medium text-red-700">Unable to load matching profiles.</p>
              <button
                type="button"
                onClick={() => void refetchMatches()}
                className="btn-secondary !px-4 !py-2 text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {showSkeleton && !matchesError && <MatchLoadingSkeleton />}

          {!showSkeleton && !matchesError && profiles.length === 0 && (
            <div className="card py-14 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF0F4] to-[#F7EBEF]">
                <Users className="h-9 w-9 text-wow-primary" />
              </div>
              <h3 className="font-display text-xl text-wow-text">
                No matching profiles found.
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-wow-muted">
                Try broadening partner preference filters or add more opposite-gender customer
                profiles across agents.
              </p>
              <button
                type="button"
                className="btn-primary mt-6 !px-5 !py-2.5 text-sm"
                onClick={() => {
                  const prefs = filtersFromPartnerPreferences(
                    customer.partnerPreferences as Record<string, unknown> | undefined,
                  );
                  setDraftFilters(prefs);
                  setAppliedFilters(EMPTY_MATCH_FILTERS);
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {!showSkeleton && !matchesError && profiles.length > 0 && (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-5 xl:grid-cols-2'
                    : 'flex flex-col gap-5'
                }
              >
                {profiles.map((profile, index) => (
                  <MatchProfileCard
                    key={profile.id}
                    profile={profile}
                    workspaceCustomerId={resolvedId}
                    viewMode={viewMode}
                    index={index}
                    locked={!matchUnlocked}
                    completeProfileUrl={editUrl}
                    onSendInterest={(p) =>
                      notify(`Interest sent to ${p.name || p.firstName}`)
                    }
                    onFavourite={(p) => notify(`${p.name || p.firstName} added to favourites`)}
                    onNotes={(p) => {
                      notify(`Opening notes for ${p.name || p.firstName}`);
                      navigate(`/agent/customers/${p.id}/manage?tab=notes`);
                    }}
                  />
                ))}
              </div>

              {!matchUnlocked && profiles.length > 0 && (
                <MatchLockBanner
                  profileCompletion={customer.profileCompletion}
                  requiredThreshold={requiredThreshold}
                  editUrl={editUrl}
                />
              )}

              {scrollMode === 'pagination' && totalPages > 1 && (
                <div className="card flex items-center justify-between !py-3">
                  <p className="text-sm text-wow-muted">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages || isFetching}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {scrollMode === 'infinite' && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  {isFetching && page > 1 && (
                    <span className="inline-flex items-center gap-2 text-sm text-wow-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading more…
                    </span>
                  )}
                  {!isFetching && page >= totalPages && (
                    <span className="inline-flex items-center gap-2 text-sm text-wow-muted">
                      <Users className="h-4 w-4" /> End of results
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <SuggestionSlidePanel
        open={suggestionsOpen}
        profiles={suggestedProfiles}
        workspaceCustomerId={resolvedId}
        isLoading={recLoading}
        isFetching={recFetching}
        locked={!matchUnlocked}
        completeProfileUrl={editUrl}
        onClose={() => setSuggestionsOpen(false)}
        onCollapse={() => setSuggestionsOpen(false)}
        onRefresh={() => void refetchRecs()}
      />

      {!suggestionsOpen && (
        <button
          type="button"
          onClick={() => setSuggestionsOpen(true)}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-wow-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-wow-primary/30 lg:hidden"
        >
          <Sparkles className="h-4 w-4" />
          AI Suggestions
        </button>
      )}
    </div>
  );
}

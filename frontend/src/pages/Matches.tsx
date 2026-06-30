import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
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
import InterestRequestCard from '../components/matchmaking/InterestRequestCard';
import { EMPTY_FILTERS, type InterestSubTab, type MatchFilters, type MatchInterest, type MatchTab } from '../types/matchmaking';
import { useAuthStore } from '../store/authStore';

const TABS: { id: MatchTab; label: string }[] = [
  { id: 'suggestions', label: 'Suggested' },
  { id: 'search', label: 'Search' },
  { id: 'shortlist', label: 'Shortlist' },
  { id: 'interests', label: 'Interests' },
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
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const { sendInterest, toggleShortlist, acceptInterest, rejectInterest } = useMatchActions();

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

  const profiles = activeData?.profiles || [];
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

  const handleShortlist = async (profileId: string) => {
    const shortlisted = shortlistedIds.includes(profileId);
    try {
      await toggleShortlist.mutateAsync({ profileId, shortlisted });
      setShortlistedIds((prev) =>
        shortlisted ? prev.filter((id) => id !== profileId) : [...prev, profileId],
      );
      toast.success(shortlisted ? 'Removed from shortlist' : 'Added to shortlist');
    } catch {
      toast.error('Could not update shortlist');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Find Your Match</h1>
          <p className="text-sm text-gray-500">All profiles with live filters, shortlist, and interest actions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.label}
              {t.id === 'interests' && pendingReceivedCount > 0 && (
                <span className="ml-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
                  {pendingReceivedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {(tab === 'suggestions' || tab === 'search') && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <select className="input-field" value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })} aria-label="Gender filter">
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input list="religion-options" className="input-field" placeholder="Religion" value={filters.religion} onChange={(e) => setFilters({ ...filters, religion: e.target.value })} />
            <input className="input-field" placeholder="Caste" value={filters.caste} onChange={(e) => setFilters({ ...filters, caste: e.target.value })} />
            <input className="input-field" placeholder="Sub Caste" value={filters.subCaste} onChange={(e) => setFilters({ ...filters, subCaste: e.target.value })} />
            <input className="input-field" placeholder="Education" value={filters.education} onChange={(e) => setFilters({ ...filters, education: e.target.value })} />
            <input className="input-field" placeholder="Occupation" value={filters.occupation} onChange={(e) => setFilters({ ...filters, occupation: e.target.value })} />
            <select className="input-field" value={filters.workingStatus} onChange={(e) => setFilters({ ...filters, workingStatus: e.target.value })} aria-label="Working status filter">
              <option value="">Working Status</option>
              <option value="working">Currently Working</option>
              <option value="not_working">Not Working</option>
            </select>
            <input className="input-field" placeholder="Country" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })} />
            <input className="input-field" placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
            <input className="input-field" placeholder="State" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} />
            <select className="input-field" value={filters.maritalStatus} onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })} aria-label="Marital status filter">
              <option value="">Marital Status</option>
              <option>Never Married</option>
              <option>Divorced</option>
              <option>Widowed</option>
              <option>Awaiting Divorce</option>
              <option>Annulled</option>
            </select>
            <select className="input-field" value={filters.diet} onChange={(e) => setFilters({ ...filters, diet: e.target.value })} aria-label="Diet filter">
              <option value="">Any Diet</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
              <option value="Vegan">Vegan</option>
            </select>
            <input className="input-field" placeholder="Min age" type="number" value={filters.minAge} onChange={(e) => setFilters({ ...filters, minAge: e.target.value })} />
            <input className="input-field" placeholder="Max age" type="number" value={filters.maxAge} onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })} />
            <input className="input-field" placeholder="Min height (ft)" type="number" value={filters.minHeight} onChange={(e) => setFilters({ ...filters, minHeight: e.target.value })} />
            <input className="input-field" placeholder="Max height (ft)" type="number" value={filters.maxHeight} onChange={(e) => setFilters({ ...filters, maxHeight: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-gray-700 px-2">
              <input
                type="checkbox"
                checked={filters.horoscopeAvailable}
                onChange={(e) => setFilters({ ...filters, horoscopeAvailable: e.target.checked })}
              />
              Horoscope available
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 px-2">
              <input
                type="checkbox"
                checked={filters.includeHoroscope}
                onChange={(e) => setFilters({ ...filters, includeHoroscope: e.target.checked })}
              />
              Include horoscope in score
            </label>
            <button className="btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>Reset All Filters</button>
          </div>
          <datalist id="religion-options">
            <option value="Hindu" />
            <option value="Christian" />
            <option value="Jain" />
            <option value="Sikh" />
            <option value="Muslim" />
            <option value="Buddhist" />
            <option value="Jewish" />
            <option value="Parsi" />
            <option value="Spiritual - not religious" />
            <option value="No Religion" />
            <option value="Other" />
          </datalist>
        </div>
      )}

      {tab === 'interests' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {INTEREST_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterestSubTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  interestSubTab === t.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
                {t.id === 'received' && pendingReceivedCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-white">
                    {pendingReceivedCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {interestSubTab === 'received' && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-900">Received Interests</h2>
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
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-900">Sent Interests</h2>
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
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-900">Accepted Matches</h2>
              {accepted.data?.length ? (
                <>
                  {accepted.data.map((match) => (
                    <InterestRequestCard
                      key={match.id}
                      match={match}
                      variant={match.senderId === user?.id ? 'sent' : 'received'}
                    />
                  ))}
                  <Link to="/app/chat" className="inline-block text-sm font-medium text-primary-600 hover:underline">
                    Open chat with your matches →
                  </Link>
                </>
              ) : (
                <p className="text-sm text-gray-500">No accepted matches yet.</p>
              )}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="card animate-pulse h-80 bg-gray-100" />
          ))}
        </div>
      ) : profiles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile: any) => (
            <MatchProfileCard
              key={profile.id}
              profile={profile}
              showScore
              interestSent={sentInterestIds.includes(profile.userId) || sentInterestIds.includes(profile.id)}
              shortlisted={shortlistedIds.includes(profile.id) || tab === 'shortlist'}
              onInterest={() => handleInterest(profile)}
              onShortlist={() => handleShortlist(profile.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💞</div>
          <p className="text-gray-600 font-medium">No profiles found right now.</p>
          <p className="text-gray-500 text-sm mt-1">Try clearing filters or check back soon for new matches.</p>
        </div>
      )}
    </div>
  );
}

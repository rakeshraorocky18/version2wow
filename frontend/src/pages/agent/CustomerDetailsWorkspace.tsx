import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Ban,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Heart,
  Share2,
  History,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Star,
  StickyNote,
  UserRound,
  X,
} from 'lucide-react';
import { getPhotoUrl } from '../../lib/profileUtils';
import type { ReactNode } from 'react';
import {
  useAgentCustomerAction,
  useAgentCustomerChat,
  useAgentCustomerHistory,
  useAgentCustomerNotifications,
  useAgentCustomerWorkspace,
  useAgentCustomerWorkspaceMatches,
  useAgentRecommendations,
  useSendAgentCustomerChatMessage,
} from '../../hooks/agent/useAgent';
import type {
  AgentCustomerHistoryCard,
  AgentCustomerNotification,
  AgentCustomerWorkspaceProfile,
  AgentRelationshipStatus,
} from '../../services/agent/agentService';
import {
  EMPTY_MATCH_FILTERS,
  toMatchSearchPayload,
  type AgentMatchFilters,
  type AgentMatchSearchPayload,
  type MatchSortBy,
} from '../../types/agentMatching';
import { ErrorState, TableSkeleton } from '../../components/agent/AgentUI';
import PartnerPreferenceSidebar from '../../components/agent/matching/PartnerPreferenceSidebar';
import SuggestionSlidePanel from '../../components/agent/matching/SuggestionSlidePanel';
import Chat from '../../components/agent/Chat';

type WorkspaceTab = 'matches' | 'chat' | 'history';
type HistoryCategory = 'friends' | 'requestsReceived' | 'requestsSent' | 'shortlisted' | 'blocked' | 'declined';
type CustomerActionName =
  | 'send-interest'
  | 'accept-interest'
  | 'decline-interest'
  | 'withdraw-interest'
  | 'favourite'
  | 'shortlist'
  | 'block'
  | 'unblock'
  | 'ignore'
  | 'notes'
  | 'mark-notifications-read';

const TABS: Array<{ id: WorkspaceTab; label: string; icon: typeof Heart }> = [
  { id: 'matches', label: 'Matches', icon: Heart },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'history', label: 'History', icon: History },
];

const HISTORY_CATEGORIES: Array<{ id: HistoryCategory; label: string; description: string }> = [
  { id: 'friends', label: 'Friends', description: 'Accepted matches' },
  { id: 'requestsReceived', label: 'Requests', description: 'Received requests' },
  { id: 'requestsSent', label: 'Pending', description: 'Sent requests' },
  { id: 'shortlisted', label: 'Shortlist', description: 'Saved profiles' },
  { id: 'blocked', label: 'Blocked', description: 'Blocked profiles' },
  { id: 'declined', label: 'Closed', description: 'Declined / ignored' },
];

function fullName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function relationshipLabel(status?: AgentRelationshipStatus) {
  if (status === 'accepted') return 'Accepted';
  if (status === 'pending_sent') return 'Pending';
  if (status === 'pending_received') return 'Request Received';
  if (status === 'declined') return 'Declined';
  if (status === 'blocked') return 'Blocked';
  if (status === 'ignored') return 'Ignored';
  return 'Recommended';
}

function getErrorMessage(error: unknown, fallback: string) {
  const maybe = error as { response?: { data?: { message?: string } } };
  return maybe.response?.data?.message || fallback;
}

function ProfileAvatar({ name, src, size = 'h-14 w-14' }: { name: string; src?: string | null; size?: string }) {
  return (
    <div className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF0F4] text-wow-primary`}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name) || <UserRound className="h-5 w-5" />}
    </div>
  );
}

function MatchCard({
  profile,
  customerId,
  onAction,
  busy,
}: {
  profile: AgentCustomerWorkspaceProfile;
  customerId: string;
  onAction: (action: CustomerActionName, profileId: string, content?: string) => void;
  busy: boolean;
}) {
  const navigate = useNavigate();
  const name = profile.name || fullName(profile.firstName, profile.lastName);
  const accepted = profile.relationshipStatus === 'accepted';
  const pending = profile.relationshipStatus === 'pending_sent';
  const received = profile.relationshipStatus === 'pending_received';

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/public/profile/${profile.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${name} - WOW Profile`,
          text: 'View this matrimonial profile',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Profile link copied to clipboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to share profile');
    }
  };

  return (
    <article className="overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_8px_28px_rgba(44,38,48,0.06)]">
      <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
        <div className="relative min-h-[220px] bg-gradient-to-br from-[#FFF0F4] to-[#F7EBEF]">
          {profile.profilePhoto ? (
            <img src={getPhotoUrl(profile.profilePhoto || '')} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center">
              <ProfileAvatar name={name} size="h-24 w-24 text-2xl" />
            </div>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-wow-primary shadow-sm">
            {profile.compatibilityScore}% Match
          </span>
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
            <span className={`h-2 w-2 rounded-full ${profile.onlineStatus ? 'bg-emerald-400' : 'bg-gray-300'}`} />
            {profile.onlineStatus ? 'Online' : profile.recentlyActive ? 'Recently Active' : 'Offline'}
          </span>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex-1 space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl text-wow-text">{name}</h3>
                <p className="mt-1 text-sm text-wow-muted">
                  {[profile.age ? `${profile.age} yrs` : null, profile.height, profile.customerCode].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="rounded-full bg-[#FFF5F7] px-3 py-1 text-xs font-semibold text-wow-primary">
                {relationshipLabel(profile.relationshipStatus)}
              </span>
            </div>

            <p className="line-clamp-2 text-sm leading-relaxed text-wow-muted">
              {profile.aboutMe || 'Profile available for recommendation review.'}
            </p>

            <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                ['Religion', profile.religion],
                ['Caste', profile.caste || profile.community],
                ['Profession', profile.occupation],
                ['Education', profile.education],
                ['City', profile.city],
                ['Country', profile.country],
                ['Gender', profile.gender],
                ['Completion', `${profile.profileCompletion}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#FAF8FB] px-3 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-wow-muted">{label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium text-wow-text">{value || '-'}</dd>
                </div>
              ))}
            </dl>

            {!accepted && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Full profile unlocks after request acceptance. Currently showing About Me, personal, religion, and location details only.
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-[#FFFBFC] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/agent/customers/${customerId}/profile/${profile.id}`)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:text-wow-primary"
              >
                <Eye className="mr-1 inline h-4 w-4" /> View Profile
              </button>

              {received ? (
                <>
                  <button type="button" disabled={busy} onClick={() => onAction('accept-interest', profile.id)} className="btn-primary !px-3 !py-2 text-sm">
                    <Check className="mr-1 inline h-4 w-4" /> Accept
                  </button>
                  <button type="button" disabled={busy} onClick={() => onAction('decline-interest', profile.id)} className="rounded-xl border border-red-100 bg-white px-3 py-2 text-sm text-red-600">
                    <X className="mr-1 inline h-4 w-4" /> Decline
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy || pending || accepted}
                  onClick={() => onAction('send-interest', profile.id)}
                  className="btn-primary !px-3 !py-2 text-sm disabled:opacity-60"
                >
                  <Send className="mr-1 inline h-4 w-4" /> {accepted ? 'Accepted' : pending ? 'Pending' : 'Send Interest'}
                </button>
              )}

              <button type="button" disabled={busy} onClick={() => onAction('favourite', profile.id)} className={`rounded-xl border px-3 py-2 text-sm ${profile.favourite ? 'border-wow-primary bg-[#FFF0F4] text-wow-primary' : 'border-gray-200 bg-white'}`}>
                <Star className={`mr-1 inline h-4 w-4 ${profile.favourite ? 'fill-current' : ''}`} /> Favourite
              </button>
              <button type="button" disabled={busy} onClick={() => onAction('shortlist', profile.id)} className={`rounded-xl border px-3 py-2 text-sm ${profile.shortlisted ? 'border-wow-primary bg-[#FFF0F4] text-wow-primary' : 'border-gray-200 bg-white'}`}>
                <Heart className={`mr-1 inline h-4 w-4 ${profile.shortlisted ? 'fill-current' : ''}`} /> Shortlist
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const content = window.prompt('Add internal note');
                  if (content?.trim()) onAction('notes', profile.id, content.trim());
                }}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <StickyNote className="mr-1 inline h-4 w-4" /> Notes {profile.notesCount ? `(${profile.notesCount})` : ''}
              </button>
              <button type="button" disabled={busy} onClick={() => onAction('ignore', profile.id)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                Ignore
              </button>
              <button type="button" disabled={busy} onClick={() => onAction('block', profile.id)} className="rounded-xl border border-red-100 bg-white px-3 py-2 text-sm text-red-600">
                <Ban className="mr-1 inline h-4 w-4" /> Block
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:text-wow-primary"
              >
                <Share2 className="mr-1 inline h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function HistorySection({
  title,
  items,
  empty,
  actions,
}: {
  title: string;
  items: AgentCustomerHistoryCard[];
  empty: string;
  actions: (item: AgentCustomerHistoryCard) => ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-[0_10px_28px_rgba(44,38,48,0.05)]">
      <h3 className="text-lg font-medium tracking-tight text-wow-text">{title}</h3>
      {!items.length ? (
        <p className="mt-4 rounded-2xl border border-dashed border-pink-100 bg-[#FFF9FB] px-4 py-10 text-center text-sm text-wow-muted">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const name = item.profile.name || fullName(item.profile.firstName, item.profile.lastName);
            return (
              <div key={item.relationship.id} className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-[#FFF9FB] p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <ProfileAvatar name={name} src={item.profile.profileImageUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-wow-text">{name}</p>
                    <p className="text-xs text-wow-muted">{relationshipLabel(item.relationship.status)} · {formatTime(item.relationship.updatedAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{actions(item)}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function notificationTarget(notification: AgentCustomerNotification, customerId: string) {
  const data = notification.data || {};
  const profileId = data.profileId || data.senderId || data.matchedProfileId || data.targetProfileId;
  if (notification.type === 'message' && typeof profileId === 'string') {
    return { tab: 'chat' as const, profileId };
  }
  if (typeof profileId === 'string') {
    return { path: `/agent/customers/${customerId}/profile/${profileId}` };
  }
  if (notification.type === 'match' || notification.type === 'interest') {
    return { tab: 'history' as const };
  }
  return { tab: 'matches' as const };
}

export default function CustomerDetailsWorkspace() {
  const { customerId = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('matches');
  const [historyCategory, setHistoryCategory] = useState<HistoryCategory>('friends');
  const [draftFilters, setDraftFilters] = useState<AgentMatchFilters>(EMPTY_MATCH_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AgentMatchFilters>(EMPTY_MATCH_FILTERS);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<MatchSortBy>('compatibility');
  const [page, setPage] = useState(1);
  const [activeChatProfileId, setActiveChatProfileId] = useState<string | undefined>();
  const [recommendationsOpen, setRecommendationsOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Initialize active tab and chat target from URL search params (e.g. ?section=chat&profileId=...)
  useEffect(() => {
    const section = searchParams.get('section') as WorkspaceTab | null;
    const profileId = searchParams.get('profileId') || undefined;
    if (section) {
      setActiveTab(section);
    }
    if (profileId) {
      setActiveChatProfileId(profileId);
    }
  }, [searchParams]);

  const workspace = useAgentCustomerWorkspace(customerId);
  const matchesPayload = useMemo<AgentMatchSearchPayload>(
    () =>
      toMatchSearchPayload(appliedFilters, {
        search: search.trim() || undefined,
        sortBy,
        page,
        limit: 12,
      }),
    [appliedFilters, search, sortBy, page],
  );
  const matches = useAgentCustomerWorkspaceMatches(customerId, matchesPayload, activeTab === 'matches');
  const history = useAgentCustomerHistory(customerId, activeTab === 'history');
  const notifications = useAgentCustomerNotifications(customerId, { page: 1, limit: 50 }, true);
  const recommendations = useAgentRecommendations(customerId, activeTab === 'matches');
  const chat = useAgentCustomerChat(customerId, { profileId: activeChatProfileId, page: 1, limit: 50 }, activeTab === 'chat');
  const action = useAgentCustomerAction(customerId);
  const sendMessage = useSendAgentCustomerChatMessage(customerId);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    if (!activeChatProfileId && chat.data?.activeProfileId) {
      setActiveChatProfileId(chat.data.activeProfileId);
    }
  }, [activeTab, activeChatProfileId, chat.data?.activeProfileId]);

  const customer = workspace.data?.customer;
  const customerName = customer ? fullName(customer.firstName, customer.lastName) : '';
  const unreadNotifications = notifications.data?.data?.filter((n) => n.status !== 'read').length ?? 0;
  const chatUnread = chat.data?.contacts.reduce((sum, contact) => sum + contact.unreadCount, 0) ?? 0;
  const shouldHideFromMatchPool = (profile: { id: string; customerCode?: string | null; relationshipStatus?: string | null }) => {
    if (!customer) return false;
    if (profile.id === customer.id || profile.customerCode === customer.customerCode) return true;
    return [
      'accepted',
      'pending_sent',
      'pending_received',
      'blocked',
      'ignored',
      'declined',
      'withdrawn',
    ].includes(profile.relationshipStatus || '');
  };
  const recommendedProfiles = (recommendations.data?.data || []).filter(
    (profile) => !shouldHideFromMatchPool(profile),
  );
  const matchProfiles = (matches.data?.data || []).filter(
    (profile) => !shouldHideFromMatchPool(profile),
  );

  const updateFilters = (next: AgentMatchFilters) => {
    setDraftFilters(next);
    setAppliedFilters(next);
    setPage(1);
  };

  const runAction = (
    actionName: CustomerActionName,
    profileId?: string,
    content?: string,
  ) => {
    action.mutate(
      { action: actionName, profileId, content },
      {
        onSuccess: () => toast.success('Updated'),
        onError: (err: unknown) => toast.error(getErrorMessage(err, 'Action failed')),
      },
    );
  };

  if (workspace.isLoading) return <TableSkeleton rows={8} />;
  if (workspace.isError || !customer || !workspace.data) {
    return <ErrorState message="Unable to load customer workspace." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 rounded-[28px] bg-gradient-to-br from-white via-[#FFF9FB] to-[#F8F3F6] p-4">
      <div className="sticky top-3 z-20 rounded-[22px] border border-gray-100 bg-white/95 px-4 py-3 shadow-[0_12px_36px_rgba(44,38,48,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/agent/customers" className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium text-wow-primary hover:bg-[#FFF5F7]">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="min-w-[180px] border-l border-gray-100 pl-4">
            <h1 className="font-display text-xl leading-tight text-wow-text">{customerName}</h1>
            <p className="text-xs text-wow-muted">ID: {customer.customerCode}</p>
          </div>

          <nav className="flex flex-1 flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const badge = tab.id === 'chat' ? chatUnread : 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
                  activeTab === tab.id ? 'bg-[#FFF0F4] text-wow-primary' : 'text-wow-muted hover:bg-[#FFF5F7]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-wow-primary px-1 text-[10px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
          </nav>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-[#FAF8FB] px-4 py-2.5 text-sm font-medium text-wow-text hover:text-wow-primary"
          >
            <Bell className="h-4 w-4" />
            Notifications
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-wow-primary px-1 text-[10px] font-semibold text-white">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'matches' && (
        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <PartnerPreferenceSidebar
            filters={draftFilters}
            onChange={updateFilters}
            onApply={() => undefined}
            onReset={() => {
              setDraftFilters(EMPTY_MATCH_FILTERS);
              setAppliedFilters(EMPTY_MATCH_FILTERS);
              setPage(1);
            }}
            onSaveSearch={() => undefined}
            isApplying={matches.isFetching}
            className="lg:top-24"
            compactDropdowns
            hideActions
          />

          <div className="min-w-0 space-y-5">
            <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wow-muted" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search all recommended profiles..."
                    className="input-field !pl-10"
                  />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as MatchSortBy)} className="input-field lg:w-52">
                  <option value="compatibility">Compatibility</option>
                  <option value="newest">Newest</option>
                  <option value="recently_active">Recently Active</option>
                  <option value="completion">Completion</option>
                </select>
                {recommendedProfiles.length > 0 && !recommendationsOpen && (
                  <button
                    type="button"
                    onClick={() => setRecommendationsOpen(true)}
                    className="btn-secondary inline-flex items-center gap-2 !px-4 !py-2 text-sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    Recommendations
                  </button>
                )}
              </div>
            </div>

            {matches.isLoading ? (
              <TableSkeleton rows={6} />
            ) : !matchProfiles.length ? (
              <div className="card py-14 text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-wow-primary" />
                <p className="font-medium text-wow-text">No recommended profiles found.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {matchProfiles.map((profile) => (
                  <MatchCard
                    key={profile.id}
                    profile={profile}
                    customerId={customerId}
                    busy={action.isPending}
                    onAction={(actionName, profileId, content) => {
                      if (actionName === 'notes') {
                        if (!content?.trim()) return;
                        runAction('notes', profileId, content);
                        return;
                      }
                      if (actionName === 'block' && !window.confirm('Block this profile for this customer?')) return;
                      runAction(actionName, profileId);
                    }}
                  />
                ))}
                {matches.data && (matches.data.totalPages ?? 1) > 1 && (
                  <div className="card flex items-center justify-between !py-3">
                    <p className="text-sm text-wow-muted">Page {matches.data.page} of {matches.data.totalPages}</p>
                    <div className="flex gap-2">
                      <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-secondary !px-3 !py-2 text-sm disabled:opacity-40">Previous</button>
                      <button disabled={page >= matches.data.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary !px-3 !py-2 text-sm disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <SuggestionSlidePanel
            open={recommendationsOpen && recommendedProfiles.length > 0}
            profiles={recommendedProfiles}
            workspaceCustomerId={customerId}
            isLoading={recommendations.isLoading}
            isFetching={recommendations.isFetching}
            onClose={() => setRecommendationsOpen(false)}
            onCollapse={() => setRecommendationsOpen(false)}
            onRefresh={() => void recommendations.refetch()}
          />
        </section>
      )}

      {activeTab === 'chat' && (
        <Chat
          embedded
          agentMode
          agentCustomerId={customerId}
          initialUserId={activeChatProfileId}
          onSelectContact={(userId) => setActiveChatProfileId(userId)}
          agentContacts={(chat.data?.contacts || []).map((c) => ({
            userId: c.userId,
            name: c.name,
            subtitle: c.subtitle,
            photo: c.photo ? getPhotoUrl(c.photo) : undefined,
            lastMessageAt: c.lastMessageAt ?? undefined,
            isBlocked: c.isBlocked ?? undefined,
            muted: c.muted ?? undefined,
            onlineStatus: c.onlineStatus,
            unreadCount: c.unreadCount,
          }))}
          agentMessages={chat.data?.messages?.messages || []}
          onAgentSendMessage={(payload) => {
            sendMessage.mutate(payload, {
              onSuccess: () => {
                toast.success('Message sent');
                chat.refetch();
                notifications.refetch();
              },
              onError: (err: unknown) => toast.error(getErrorMessage(err, 'Unable to send message')),
            });
          }}
          agentLoading={chat.isLoading}
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-5">
          {history.isLoading ? (
            <TableSkeleton rows={5} />
          ) : history.data ? (
            <section className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {HISTORY_CATEGORIES.map((category) => {
                  const count = history.data[category.id]?.length || 0;
                  const active = historyCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setHistoryCategory(category.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-wow-primary bg-[#FFF5F7] shadow-sm'
                          : 'border-gray-100 bg-[#FAF8FB] hover:border-wow-primary/30 hover:bg-white'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-wow-muted">{category.description}</p>
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <span className="font-display text-xl text-wow-text">{category.label}</span>
                        <span className="text-2xl font-semibold text-wow-primary">{count}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <HistorySection
                  title={HISTORY_CATEGORIES.find((category) => category.id === historyCategory)?.label || 'History'}
                  items={history.data[historyCategory] || []}
                  empty="No profiles in this category."
                  actions={(item) => {
                    if (historyCategory === 'friends') {
                      return (
                        <>
                          <button
                            onClick={() => navigate(`/agent/customers/${customerId}/profile/${item.profile.id}?hideNav=true&returnTo=/agent/customers/${customerId}`)}
                            className="btn-secondary !px-3 !py-2 text-sm"
                          >
                            View Profile
                          </button>
                          <button onClick={() => { setActiveChatProfileId(item.profile.id); setActiveTab('chat'); }} className="btn-primary !px-3 !py-2 text-sm">Open Chat</button>
                        </>
                      );
                    }
                    if (historyCategory === 'requestsReceived') {
                      return (
                        <>
                          <button onClick={() => runAction('accept-interest', item.profile.id)} className="btn-primary !px-3 !py-2 text-sm"><CheckCircle2 className="mr-1 inline h-4 w-4" />Accept</button>
                          <button onClick={() => runAction('decline-interest', item.profile.id)} className="btn-secondary !px-3 !py-2 text-sm">Decline</button>
                          <button
                            onClick={() => navigate(`/agent/customers/${customerId}/profile/${item.profile.id}?hideNav=true&returnTo=/agent/customers/${customerId}`)}
                            className="btn-secondary !px-3 !py-2 text-sm"
                          >
                            View Profile
                          </button>
                        </>
                      );
                    }
                    if (historyCategory === 'requestsSent') {
                      return (
                        <>
                          <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700"><Clock3 className="mr-1 inline h-4 w-4" />Pending</span>
                          <button onClick={() => runAction('withdraw-interest', item.profile.id)} className="btn-secondary !px-3 !py-2 text-sm">Withdraw</button>
                          <button
                            onClick={() => navigate(`/agent/customers/${customerId}/profile/${item.profile.id}?hideNav=true&returnTo=/agent/customers/${customerId}`)}
                            className="btn-secondary !px-3 !py-2 text-sm"
                          >
                            View Profile
                          </button>
                        </>
                      );
                    }
                    if (historyCategory === 'shortlisted') {
                      return (
                        <>
                          <button onClick={() => runAction('send-interest', item.profile.id)} className="btn-primary !px-3 !py-2 text-sm">Send Interest</button>
                          <button onClick={() => runAction('shortlist', item.profile.id)} className="btn-secondary !px-3 !py-2 text-sm">Remove Shortlist</button>
                        </>
                      );
                    }
                    if (historyCategory === 'blocked') {
                      return (
                        <>
                          <button
                            onClick={() => navigate(`/agent/customers/${customerId}/profile/${item.profile.id}?hideNav=true&returnTo=/agent/customers/${customerId}`)}
                            className="btn-secondary !px-3 !py-2 text-sm"
                          >
                            View Profile
                          </button>
                          <button onClick={() => runAction('unblock', item.profile.id)} className="btn-primary !px-3 !py-2 text-sm">Unblock</button>
                        </>
                      );
                    }
                    return (
                      <button
                        onClick={() => navigate(`/agent/customers/${customerId}/profile/${item.profile.id}?hideNav=true&returnTo=/agent/customers/${customerId}`)}
                        className="btn-secondary !px-3 !py-2 text-sm"
                      >
                        View Profile
                      </button>
                    );
                  }}
                />
              </div>
            </section>
          ) : (
            <ErrorState message="Unable to load customer history." />
          )}
        </div>
      )}

      {notificationsOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setNotificationsOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col border-l border-gray-100 bg-white shadow-[-16px_0_48px_rgba(44,38,48,0.14)]">
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#FFF5F7] to-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-wow-text">Notifications</h2>
                  <p className="text-sm text-wow-muted">Updates for {customerName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="rounded-xl p-2 text-wow-muted hover:bg-white hover:text-wow-primary"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <button onClick={() => runAction('mark-notifications-read')} className="btn-secondary mt-4 w-full !px-3 !py-2 text-sm">Mark All Read</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {notifications.isLoading ? (
                <TableSkeleton rows={4} />
              ) : !notifications.data?.data.length ? (
                <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-wow-muted">No notifications yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.data.data.map((notification) => {
                    const unread = notification.status !== 'read';
                    const Icon = notification.type === 'message' ? MessageCircle : notification.type === 'match' ? Heart : Bell;
                    return (
                      <button
                        key={notification.id}
                        onClick={() => {
                          runAction('mark-notifications-read', notification.id);
                          const target = notificationTarget(notification, customerId);
                          setNotificationsOpen(false);
                          if ('path' in target && target.path) {
                            navigate(target.path);
                            return;
                          }
                          if ('tab' in target && target.tab) {
                            setActiveTab(target.tab);
                            if (target.tab === 'chat' && target.profileId) {
                              setActiveChatProfileId(target.profileId);
                            }
                            if (target.tab === 'history') {
                              setHistoryCategory('requestsReceived');
                            }
                          }
                        }}
                        className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition hover:border-wow-primary/40 ${
                          unread ? 'border-wow-primary/20 bg-[#FFF5F7]' : 'border-gray-100 bg-[#FAF8FB]'
                        }`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-wow-primary"><Icon className="h-5 w-5" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-wow-text">{notification.title}</p>
                            {unread && <span className="h-2 w-2 rounded-full bg-wow-primary" />}
                          </div>
                          <p className="mt-1 text-sm text-wow-muted">{notification.body}</p>
                          <p className="mt-1 text-xs text-wow-muted">{formatTime(notification.createdAt)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

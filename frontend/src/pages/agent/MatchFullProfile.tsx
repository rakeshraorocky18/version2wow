import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  FileText,
  Heart,
  History,
  Inbox,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import { useAgentCustomerAction, useAgentMatchProfile } from '../../hooks/agent/useAgent';
import { getPhotoUrl } from '../../lib/profileUtils';
import { displayValue } from '../../lib/agent/addCustomerUtils';
import CompatibilityBadge from '../../components/agent/matching/CompatibilityBadge';
import {
  ErrorState,
  ProfileProgress,
  TableSkeleton,
} from '../../components/agent/AgentUI';
import { ReviewRow } from '../../components/agent/addCustomer/WizardUI';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal Information' },
  { id: 'family', label: 'Family Details' },
  { id: 'education', label: 'Education' },
  { id: 'career', label: 'Career' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'partner', label: 'Partner Preferences' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity Timeline' },
] as const;

type TabId = (typeof TABS)[number]['id'];
type SectionId = 'matches' | 'chat' | 'history' | 'favourites' | 'notifications';
type MatchStatus = 'matched' | 'pending_sent' | 'pending_received' | 'accepted';

type ChatMessage = {
  id: string;
  sender: 'agent' | 'customer';
  content: string;
  createdAt: string;
};

type ProfileNotification = {
  id: string;
  type: 'request' | 'message' | 'profile' | 'view' | 'match';
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

type ProfileActivity = {
  status: MatchStatus;
  favourite: boolean;
  notesStarted: boolean;
  viewedAt?: string;
  interestSentAt?: string;
  requestReceivedAt?: string;
  acceptedAt?: string;
  chatReadAt?: string;
  messages: ChatMessage[];
  notifications: ProfileNotification[];
};

const NAV_ITEMS: Array<{ id: SectionId; label: string; icon: typeof Heart }> = [
  { id: 'matches', label: 'Matches', icon: Heart },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'history', label: 'History', icon: History },
  { id: 'favourites', label: 'Favourites', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const EMPTY_ACTIVITY: ProfileActivity = {
  status: 'matched',
  favourite: false,
  notesStarted: false,
  messages: [],
  notifications: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function activityStorageKey(customerId: string, matchedProfileId: string) {
  return `wow-agent-match-profile:${customerId}:${matchedProfileId}`;
}

function readActivity(customerId: string, matchedProfileId: string): ProfileActivity {
  if (!customerId || !matchedProfileId) return EMPTY_ACTIVITY;
  try {
    const raw = localStorage.getItem(activityStorageKey(customerId, matchedProfileId));
    if (!raw) return EMPTY_ACTIVITY;
    return { ...EMPTY_ACTIVITY, ...(JSON.parse(raw) as Partial<ProfileActivity>) };
  } catch {
    return EMPTY_ACTIVITY;
  }
}

function formatDateTime(value?: string) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function addNotification(
  activity: ProfileActivity,
  notification: Omit<ProfileNotification, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
  },
) {
  const id = notification.id || makeId(notification.type);
  if (activity.notifications.some((n) => n.id === id)) return activity.notifications;
  return [
    {
      ...notification,
      id,
      createdAt: notification.createdAt || new Date().toISOString(),
    },
    ...activity.notifications,
  ];
}

function StatusPill({ status }: { status: MatchStatus }) {
  const label =
    status === 'accepted'
      ? 'Accepted'
      : status === 'pending_received'
        ? 'Request Received'
        : status === 'pending_sent'
          ? 'Pending'
          : 'Matched';
  const tone =
    status === 'accepted'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'matched'
        ? 'bg-pink-50 text-wow-primary'
        : 'bg-amber-50 text-amber-700';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

export default function MatchFullProfile() {
  const { customerId = '', matchedProfileId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>('overview');
  const [messageInput, setMessageInput] = useState('');
  const [activity, setActivity] = useState<ProfileActivity>(() =>
    readActivity(customerId, matchedProfileId),
  );
  const { data, isLoading, isError } = useAgentMatchProfile(
    customerId,
    matchedProfileId,
  );
  const profileAction = useAgentCustomerAction(customerId);

  const profile = data?.profile;
  const documents = data?.documents || [];

  const personal = useMemo(
    () => asRecord(profile?.personalDetails),
    [profile?.personalDetails],
  );
  const family = useMemo(
    () => asRecord(profile?.familyDetails),
    [profile?.familyDetails],
  );
  const education = useMemo(
    () => asRecord(profile?.educationDetails),
    [profile?.educationDetails],
  );
  const religion = useMemo(
    () => asRecord(profile?.religionDetails),
    [profile?.religionDetails],
  );
  const partner = useMemo(
    () => asRecord(profile?.partnerPreferences),
    [profile?.partnerPreferences],
  );

  const activeSection = (
    NAV_ITEMS.some((item) => item.id === searchParams.get('section'))
      ? searchParams.get('section')
      : 'matches'
  ) as SectionId;

  const name = profile?.name || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setActivity(readActivity(customerId, matchedProfileId));
  }, [customerId, matchedProfileId]);

  useEffect(() => {
    if (!profile) return;
    const serverStatus =
      profile.relationshipStatus === 'accepted' ||
      profile.relationshipStatus === 'pending_sent' ||
      profile.relationshipStatus === 'pending_received'
        ? profile.relationshipStatus
        : undefined;
    setActivity((prev) => ({
      ...prev,
      status: serverStatus || prev.status,
      favourite: profile.favourite ?? prev.favourite,
      acceptedAt:
        serverStatus === 'accepted'
          ? prev.acceptedAt || new Date().toISOString()
          : prev.acceptedAt,
    }));
  }, [profile]);

  useEffect(() => {
    if (!customerId || !matchedProfileId) return;
    localStorage.setItem(activityStorageKey(customerId, matchedProfileId), JSON.stringify(activity));
  }, [activity, customerId, matchedProfileId]);

  useEffect(() => {
    if (!profile || !name) return;
    setActivity((prev) => {
      const now = new Date().toISOString();
      const firstView = !prev.viewedAt;
      const notifications = firstView
        ? addNotification(
            {
              ...prev,
              notifications: addNotification(prev, {
                id: 'new-preference-profile',
                type: 'profile',
                title: 'New profile added',
                message: `${name} was added for this customer's preferences.`,
                read: false,
                createdAt: profile.createdAt || now,
              }),
            },
            {
              id: 'profile-viewed',
              type: 'view',
              title: 'Profile viewed',
              message: `${name}'s profile was viewed by the agent.`,
              read: false,
              createdAt: now,
            },
          )
        : prev.notifications;

      return {
        ...prev,
        viewedAt: prev.viewedAt || now,
        notifications,
      };
    });
  }, [profile, name]);

  useEffect(() => {
    if (activeSection !== 'chat') return;
    setActivity((prev) => ({ ...prev, chatReadAt: new Date().toISOString() }));
  }, [activeSection]);

  const setSection = (nextSection: SectionId) => {
    const next = new URLSearchParams(searchParams);
    if (nextSection === 'matches') next.delete('section');
    else next.set('section', nextSection);
    setSearchParams(next);
  };

  const updateStatus = (status: MatchStatus) => {
    if (!name) return;
    const now = new Date().toISOString();
    setActivity((prev) => {
      let notification: Omit<ProfileNotification, 'id' | 'createdAt'> & {
        id: string;
        createdAt: string;
      };

      if (status === 'accepted') {
        notification = {
          id: 'accepted',
          type: 'match',
          title: 'Match accepted',
          message: `${name} accepted the match request.`,
          read: false,
          createdAt: now,
        };
      } else if (status === 'pending_received') {
        notification = {
          id: 'request-received',
          type: 'request',
          title: 'Request received',
          message: `${name} sent a match request to this customer.`,
          read: false,
          createdAt: now,
        };
      } else {
        notification = {
          id: 'interest-sent',
          type: 'request',
          title: 'Interest sent',
          message: `Interest request sent to ${name}.`,
          read: false,
          createdAt: now,
        };
      }

      return {
        ...prev,
        status,
        interestSentAt: status === 'pending_sent' ? now : prev.interestSentAt,
        requestReceivedAt: status === 'pending_received' ? now : prev.requestReceivedAt,
        acceptedAt: status === 'accepted' ? now : prev.acceptedAt,
        notifications: addNotification(prev, notification),
      };
    });
  };

  const handleSendInterest = () => {
    profileAction.mutate(
      { action: 'send-interest', profileId: matchedProfileId },
      {
        onSuccess: () => {
          updateStatus('pending_sent');
          toast.success(`Interest sent to ${name}`);
        },
        onError: () => toast.error('Could not send interest'),
      },
    );
  };

  const handleFavourite = () => {
    const nextFavourite = !activity.favourite;
    profileAction.mutate(
      { action: 'favourite', profileId: matchedProfileId },
      {
        onSuccess: () => {
          setActivity((prev) => ({ ...prev, favourite: nextFavourite }));
          toast.success(
            nextFavourite
              ? `${name} added to favourites`
              : `${name} removed from favourites`,
          );
        },
        onError: () => toast.error('Could not update favourite'),
      },
    );
  };

  const handleAccept = () => {
    profileAction.mutate(
      { action: 'accept-interest', profileId: matchedProfileId },
      {
        onSuccess: () => {
          updateStatus('accepted');
          toast.success(`${name} moved to accepted matches`);
        },
        onError: () => toast.error('Could not accept match'),
      },
    );
  };

  const sendChatMessage = () => {
    if (!isAccepted) {
      toast.error('Chat is available after the match is accepted.');
      return;
    }
    if (!messageInput.trim() || !name) return;
    const now = new Date().toISOString();
    const agentMessage: ChatMessage = {
      id: makeId('agent-message'),
      sender: 'agent',
      content: messageInput.trim(),
      createdAt: now,
    };
    const customerMessage: ChatMessage = {
      id: makeId('customer-message'),
      sender: 'customer',
      content: 'Thanks, I received your message. I will review and respond soon.',
      createdAt: new Date(Date.now() + 1000).toISOString(),
    };

    setActivity((prev) => ({
      ...prev,
      messages: [...prev.messages, agentMessage, customerMessage],
      notifications: addNotification(prev, {
        id: makeId('new-message'),
        type: 'message',
        title: 'New message received',
        message: `${name} sent a new message in chat.`,
        read: activeSection === 'chat',
        createdAt: customerMessage.createdAt,
      }),
    }));
    setMessageInput('');
  };

  const unreadNotifications = activity.notifications.filter((n) => !n.read).length;
  const unreadChatMessages = activity.messages.filter((m) => {
    if (m.sender !== 'customer') return false;
    if (!activity.chatReadAt) return true;
    return new Date(m.createdAt).getTime() > new Date(activity.chatReadAt).getTime();
  }).length;
  const isAccepted =
    activity.status === 'accepted' ||
    profile?.accepted ||
    profile?.relationshipStatus === 'accepted';
  const isPending =
    activity.status === 'pending_sent' ||
    profile?.relationshipStatus === 'pending_sent';

  const historyStats = [
    { label: 'Matched', value: 1, icon: Heart },
    { label: 'Accepted', value: activity.status === 'accepted' ? 1 : 0, icon: CheckCircle2 },
    { label: 'Received', value: activity.status === 'pending_received' ? 1 : 0, icon: Inbox },
    {
      label: 'Pending',
      value: activity.status === 'pending_sent' || activity.status === 'pending_received' ? 1 : 0,
      icon: Clock3,
    },
    { label: 'Viewed', value: activity.viewedAt ? 1 : 0, icon: Eye },
  ];

  if (isLoading) return <TableSkeleton rows={10} />;
  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          to="/agent/customers"
          className="inline-flex items-center gap-1 text-sm text-wow-muted hover:text-wow-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <ErrorState message="Matched profile not found." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="sticky top-3 z-20 rounded-2xl border border-pink-100 bg-white/95 px-3 py-2 shadow-[0_8px_28px_rgba(182,106,138,0.12)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/agent/customers"
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-wow-primary transition hover:bg-[#FFF5F7]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Customers
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Profile workspace">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              const badge =
                item.id === 'chat'
                  ? unreadChatMessages
                  : item.id === 'notifications'
                    ? unreadNotifications
                    : 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'favourites' && !activity.favourite) {
                      handleFavourite();
                    }
                    setSection(item.id);
                  }}
                  className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[#FFF0F4] text-wow-primary shadow-sm'
                      : 'text-wow-muted hover:bg-[#FFF5F7] hover:text-wow-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-wow-primary px-1 text-[10px] font-semibold text-white">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Header */}
      <section
        className="overflow-hidden rounded-[20px] border border-gray-100 bg-white"
        style={{ boxShadow: '0 8px 28px rgba(182, 106, 138, 0.08)' }}
      >
        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <div className="relative min-h-[280px] bg-gradient-to-br from-[#FFF0F4] to-[#F7EBEF]">
            {profile.profilePhoto ? (
              <img
                src={getPhotoUrl(profile.profilePhoto || '')}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-wow-primary">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/85 text-3xl font-semibold shadow-sm">
                  {initials || <UserRound className="h-10 w-10" />}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-3xl text-wow-text sm:text-4xl">{name}</h1>
                  <p className="mt-1 text-sm text-wow-muted">
                    {[
                      profile.age ? `${profile.age} yrs` : null,
                      profile.gender,
                      profile.customerCode,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <CompatibilityBadge score={profile.compatibilityScore} size="lg" />
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
                {profile.isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Crown className="h-3.5 w-3.5" /> Premium
                  </span>
                )}
                <StatusPill status={activity.status} />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-wow-bg px-2.5 py-1 text-xs font-medium text-wow-muted">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      profile.onlineStatus ? 'bg-emerald-400' : 'bg-gray-300'
                    }`}
                  />
                  {profile.onlineStatus
                    ? 'Online'
                    : profile.recentlyActive
                      ? 'Recently Active'
                      : 'Offline'}
                </span>
              </div>

              <div className="max-w-md">
                <ProfileProgress value={profile.profileCompletion} />
              </div>

              <p className="max-w-2xl text-sm leading-relaxed text-wow-muted">
                {profile.aboutMe?.trim() ||
                  'Profile available for agent review and recommendation.'}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleFavourite}
                disabled={profileAction.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-wow-primary/30 hover:text-wow-primary disabled:opacity-60"
              >
                <Star className={`h-4 w-4 ${activity.favourite ? 'fill-current text-wow-primary' : ''}`} />
                {activity.favourite ? 'Unfavourite' : 'Favourite'}
              </button>
              {isAccepted ? (
                <button
                  type="button"
                  onClick={() => setSection('chat')}
                  className="btn-primary inline-flex items-center gap-2 !rounded-2xl !px-5 !py-2.5 text-sm shadow-lg shadow-wow-primary/25"
                >
                  <MessageCircle className="h-4 w-4" /> Chat
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendInterest}
                  disabled={profileAction.isPending || isPending}
                  className="btn-primary inline-flex items-center gap-2 !rounded-2xl !px-5 !py-2.5 text-sm shadow-lg shadow-wow-primary/25 disabled:opacity-60"
                >
                  <Heart className="h-4 w-4 fill-current" /> {isPending ? 'Interest Sent' : 'Send Interest'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {activeSection === 'matches' && (
        <>
          {/* Tabs */}
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full gap-1 rounded-[20px] border border-gray-100 bg-white p-1.5 shadow-sm">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`whitespace-nowrap rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
                    tab === t.id
                      ? 'bg-wow-primary text-white shadow-sm'
                      : 'text-wow-muted hover:bg-[#FFF5F7] hover:text-wow-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <section
            className="rounded-[20px] border border-gray-100 bg-white p-6"
            style={{ boxShadow: '0 4px 24px rgba(182, 106, 138, 0.06)' }}
          >
            {tab === 'overview' && (
              <dl className="grid gap-1 sm:grid-cols-2">
                <ReviewRow label="Religion" value={profile.religion || ''} />
                <ReviewRow label="Caste / Community" value={profile.community || profile.caste || ''} />
                <ReviewRow label="City" value={profile.city || ''} />
                <ReviewRow label="Occupation" value={profile.occupation || ''} />
                <ReviewRow label="Education" value={profile.education || ''} />
                <ReviewRow label="Marital Status" value={profile.maritalStatus || ''} />
                <ReviewRow label="Height" value={profile.height || ''} />
                <ReviewRow label="Compatibility" value={`${profile.compatibilityScore}%`} />
                {(profile.reasons?.length ?? 0) > 0 && (
                  <div className="sm:col-span-2 mt-4 rounded-2xl bg-[#FFFBFC] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wow-muted">
                      Compatibility reasons
                    </p>
                    <ul className="space-y-1.5">
                      {profile.reasons!.map((reason) => (
                        <li key={reason} className="text-sm text-wow-text">
                          ✓ {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </dl>
            )}

            {tab === 'personal' && (
              <dl>
                <ReviewRow label="Phone" value={profile.phone || ''} />
                <ReviewRow label="Email" value={profile.email || ''} />
                <ReviewRow label="Gender" value={profile.gender || ''} />
                <ReviewRow label="Date of Birth" value={profile.dateOfBirth || ''} />
                <ReviewRow label="Mother Tongue" value={profile.motherTongue || ''} />
                <ReviewRow label="Address" value={profile.address || ''} />
                <ReviewRow
                  label="Communication Address"
                  value={displayValue(personal.communicationAddress)}
                />
                <ReviewRow label="Marital Status" value={String(personal.maritalStatus || profile.maritalStatus || '')} />
                <ReviewRow label="Height" value={String(personal.height || profile.height || '')} />
                <ReviewRow label="Weight" value={String(personal.weight || '')} />
              </dl>
            )}

            {tab === 'family' && (
              <dl>
                <ReviewRow label="Father" value={String(family.fatherName || '')} />
                <ReviewRow label="Mother" value={String(family.motherName || '')} />
                <ReviewRow label="Brothers" value={displayValue(family.brothers)} />
                <ReviewRow label="Sisters" value={displayValue(family.sisters)} />
                <ReviewRow label="Family Type" value={String(family.familyType || '')} />
                <ReviewRow label="Family Status" value={String(family.familyStatus || '')} />
                <ReviewRow label="Family Assets" value={displayValue(family.familyAssets)} />
              </dl>
            )}

            {tab === 'education' && (
              <dl>
                <ReviewRow label="Education" value={profile.education || ''} />
                <ReviewRow label="Highest Qualification" value={String(education.highestQualification || education.qualification || '')} />
                <ReviewRow label="College / University" value={String(education.college || education.university || '')} />
                <ReviewRow label="Field of Study" value={String(education.fieldOfStudy || '')} />
              </dl>
            )}

            {tab === 'career' && (
              <dl>
                <ReviewRow label="Occupation" value={profile.occupation || ''} />
                <ReviewRow label="Company" value={String(education.company || '')} />
                <ReviewRow label="Annual Income" value={String(education.annualIncome || '')} />
                <ReviewRow label="Work Location" value={String(education.workLocation || '')} />
              </dl>
            )}

            {tab === 'lifestyle' && (
              <dl>
                <ReviewRow label="Diet" value={String(personal.foodPreference || personal.diet || '')} />
                <ReviewRow label="Smoking" value={String(personal.smoking || '')} />
                <ReviewRow label="Drinking" value={String(personal.drinking || '')} />
                <ReviewRow label="Religion" value={profile.religion || ''} />
                <ReviewRow label="Gothra" value={String(religion.gothra || personal.gothram || '')} />
                <ReviewRow label="Star" value={String(religion.star || personal.star || '')} />
                <ReviewRow label="Rasi" value={String(religion.rasi || personal.rasi || '')} />
              </dl>
            )}

            {tab === 'partner' && (
              <dl>
                <ReviewRow label="Age Range" value={String(partner.ageRange || '')} />
                <ReviewRow label="Preferred Religion" value={String(partner.religion || '')} />
                <ReviewRow label="Preferred Caste" value={String(partner.caste || '')} />
                <ReviewRow label="Education" value={String(partner.education || '')} />
                <ReviewRow label="Occupation" value={String(partner.profession || partner.occupation || '')} />
                <ReviewRow label="Location" value={String(partner.locationPreference || partner.city || '')} />
                <ReviewRow label="Expectations" value={String(partner.otherExpectations || partner.notes || '')} />
              </dl>
            )}

            {tab === 'documents' && (
              <div className="space-y-3">
                {!documents.length ? (
                  <p className="text-sm text-wow-muted">No documents available for this profile.</p>
                ) : (
                  documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-[#FAF8FB] px-4 py-3 text-sm transition hover:border-wow-primary/30"
                    >
                      <FileText className="h-4 w-4 text-wow-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-wow-text">{doc.fileName}</p>
                        <p className="text-xs capitalize text-wow-muted">{doc.type.replace(/_/g, ' ')}</p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}

            {tab === 'activity' && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-gray-100 bg-[#FAF8FB] p-4">
                  <p className="text-sm font-semibold text-wow-text">Current status</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill status={activity.status} />
                    {activity.viewedAt && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-wow-muted">
                        Viewed {formatDateTime(activity.viewedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => updateStatus('pending_received')}
                    className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left text-sm hover:border-wow-primary/30"
                  >
                    Mark request received
                  </button>
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={profileAction.isPending || isAccepted}
                    className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left text-sm hover:border-wow-primary/30 disabled:opacity-60"
                  >
                    {isAccepted ? 'Accepted' : 'Mark accepted'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('history')}
                    className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left text-sm hover:border-wow-primary/30"
                  >
                    View full history
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {activeSection === 'chat' && (
        <section className="card overflow-hidden !p-0">
          <div className="grid min-h-[32rem] lg:grid-cols-[300px_1fr]">
            <aside className="border-b border-gray-100 bg-[#FFFBFC] lg:border-b-0 lg:border-r">
              <div className="border-b border-gray-100 p-4">
                <h2 className="font-display text-xl text-wow-text">Chat</h2>
                <p className="mt-1 text-sm text-wow-muted">Conversation for this match profile.</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-3 bg-white p-4 text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#FFF0F4] text-wow-primary">
                  {profile.profilePhoto ? (
                    <img src={getPhotoUrl(profile.profilePhoto || '')} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials || <MessageCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-wow-text">{name}</p>
                  <p className="truncate text-xs text-wow-muted">
                    {isAccepted
                      ? 'Accepted match'
                      : 'Chat opens after match activity'}
                  </p>
                </div>
              </button>
            </aside>

            <div className="flex min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 p-4">
                <div>
                  <h3 className="font-semibold text-wow-text">{name}</h3>
                  <p className="text-xs text-wow-muted">{profile.customerCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Meeting reminder added')}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-wow-muted hover:text-wow-primary"
                >
                  Schedule
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAF8FB] p-4">
                {activity.messages.length === 0 ? (
                  <div className="flex h-full min-h-[18rem] items-center justify-center text-center">
                    <div>
                      <MessageCircle className="mx-auto mb-3 h-10 w-10 text-wow-primary" />
                      <p className="font-medium text-wow-text">
                        {isAccepted ? 'No messages yet.' : 'Chat unlocks after acceptance.'}
                      </p>
                      <p className="mt-1 text-sm text-wow-muted">Start a chat with this match profile.</p>
                    </div>
                  </div>
                ) : (
                  activity.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          message.sender === 'agent'
                            ? 'bg-wow-primary text-white'
                            : 'bg-white text-wow-text'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            message.sender === 'agent' ? 'text-white/75' : 'text-wow-muted'
                          }`}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 p-4">
                <div className="flex gap-2">
                  <input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') sendChatMessage();
                    }}
                    disabled={!isAccepted}
                    placeholder={isAccepted ? 'Type a message...' : 'Accept the match to start chat'}
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={sendChatMessage}
                    disabled={!isAccepted}
                    className="btn-primary inline-flex items-center gap-2 !px-4 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" /> Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeSection === 'history' && (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {historyStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
                  <Icon className="mb-3 h-5 w-5 text-wow-primary" />
                  <p className="text-2xl font-semibold text-wow-text">{stat.value}</p>
                  <p className="text-sm text-wow-muted">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-wow-text">Match History</h2>
                <p className="text-sm text-wow-muted">Requests, accepted matches, chat, and profile views.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus('pending_received')}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm hover:text-wow-primary"
                >
                  Request Received
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={profileAction.isPending || isAccepted}
                  className="btn-primary !px-3 !py-2 text-sm disabled:opacity-60"
                >
                  {isAccepted ? 'Accepted' : 'Accept'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Profile matched',
                  body: `${name} matched at ${profile.compatibilityScore}% compatibility.`,
                  time: profile.createdAt,
                  icon: Sparkles,
                },
                activity.viewedAt
                  ? {
                      title: 'Profile viewed',
                      body: 'Agent opened and reviewed this profile.',
                      time: activity.viewedAt,
                      icon: Eye,
                    }
                  : null,
                activity.interestSentAt
                  ? {
                      title: 'Interest sent',
                      body: `Interest was sent to ${name}.`,
                      time: activity.interestSentAt,
                      icon: Send,
                    }
                  : null,
                activity.requestReceivedAt
                  ? {
                      title: 'Request received',
                      body: `${name} sent a request to this customer.`,
                      time: activity.requestReceivedAt,
                      icon: Inbox,
                    }
                  : null,
                activity.acceptedAt
                  ? {
                      title: 'Match accepted',
                      body: 'The match request was accepted.',
                      time: activity.acceptedAt,
                      icon: CheckCircle2,
                    }
                  : null,
              ]
                .filter(Boolean)
                .map((entry) => {
                  const item = entry!;
                  const Icon = item.icon;
                  return (
                    <div key={`${item.title}-${item.time}`} className="flex gap-3 rounded-2xl bg-[#FAF8FB] p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-wow-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-wow-text">{item.title}</p>
                        <p className="text-sm text-wow-muted">{item.body}</p>
                        <p className="mt-1 text-xs text-wow-muted">{formatDateTime(item.time)}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {activeSection === 'favourites' && (
        <section className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-wow-text">Favourites</h2>
              <p className="text-sm text-wow-muted">
                Save profiles here for quick agent follow-up.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFavourite}
              disabled={profileAction.isPending}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
                activity.favourite
                  ? 'border border-gray-200 text-wow-muted hover:text-wow-primary'
                  : 'btn-primary'
              }`}
            >
              {activity.favourite ? 'Remove from Favourites' : 'Add to Favourites'}
            </button>
          </div>

          {activity.favourite ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-[#F6DDE7] bg-[#FFFBFC] p-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0F4] text-wow-primary">
                {profile.profilePhoto ? (
                  <img src={getPhotoUrl(profile.profilePhoto || '')} alt={name} className="h-full w-full object-cover" />
                ) : (
                  initials || <UserRound className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-wow-text">{name}</p>
                <p className="text-sm text-wow-muted">
                  {profile.age ? `${profile.age} yrs · ` : ''}
                  {profile.customerCode} · {isAccepted ? 'Accepted friend' : 'Saved recommendation'}
                </p>
              </div>
              {isAccepted && (
                <button
                  type="button"
                  onClick={() => setSection('chat')}
                  className="btn-primary inline-flex items-center justify-center gap-2 !rounded-2xl !px-4 !py-2.5 text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAF8FB] p-8 text-center">
              <Star className="mx-auto mb-3 h-8 w-8 text-wow-primary" />
              <p className="font-medium text-wow-text">No favourite saved for this profile.</p>
              <p className="mt-1 text-sm text-wow-muted">
                Click Add to Favourites to save this profile.
              </p>
            </div>
          )}
        </section>
      )}

      {activeSection === 'notifications' && (
        <section className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-wow-text">Notifications</h2>
              <p className="text-sm text-wow-muted">
                Requests, new messages, matching profiles, and profile views.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setActivity((prev) => ({
                  ...prev,
                  notifications: prev.notifications.map((n) => ({ ...n, read: true })),
                }))
              }
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm hover:text-wow-primary"
            >
              Mark all read
            </button>
          </div>

          {activity.notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
              <Bell className="mx-auto mb-3 h-9 w-9 text-wow-primary" />
              <p className="font-medium text-wow-text">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.notifications.map((notification) => {
                const Icon =
                  notification.type === 'message'
                    ? MessageCircle
                    : notification.type === 'request'
                      ? Inbox
                      : notification.type === 'view'
                        ? Eye
                        : notification.type === 'match'
                          ? Heart
                          : Sparkles;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      setActivity((prev) => ({
                        ...prev,
                        notifications: prev.notifications.map((n) =>
                          n.id === notification.id ? { ...n, read: true } : n,
                        ),
                      }))
                    }
                    className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition ${
                      notification.read
                        ? 'border-gray-100 bg-[#FAF8FB]'
                        : 'border-wow-primary/20 bg-[#FFF5F7]'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-wow-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-wow-text">{notification.title}</p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-wow-primary" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-wow-muted">{notification.message}</p>
                      <p className="mt-1 text-xs text-wow-muted">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => updateStatus('pending_received')}
              className="rounded-2xl border border-gray-100 bg-[#FAF8FB] px-4 py-3 text-left text-sm hover:border-wow-primary/30"
            >
              Add request received
            </button>
            <button
              type="button"
              onClick={() => setSection('chat')}
              className="rounded-2xl border border-gray-100 bg-[#FAF8FB] px-4 py-3 text-left text-sm hover:border-wow-primary/30"
            >
              Open chat messages
            </button>
            <button
              type="button"
              onClick={() =>
                setActivity((prev) => ({
                  ...prev,
                  notifications: addNotification(prev, {
                    id: makeId('preference-profile'),
                    type: 'profile',
                    title: 'New profile added',
                    message: `${name} is available for this customer's preferences.`,
                    read: false,
                    createdAt: new Date().toISOString(),
                  }),
                }))
              }
              className="rounded-2xl border border-gray-100 bg-[#FAF8FB] px-4 py-3 text-left text-sm hover:border-wow-primary/30"
            >
              Add preference profile alert
            </button>
          </div>
        </section>
      )}
    </motion.div>
  );
}

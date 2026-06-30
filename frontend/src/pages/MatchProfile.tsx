import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  UserRound,
  Sparkles,
  UserCircle,
  Users,
  HeartHandshake,
  LayoutGrid,
} from 'lucide-react';
import api from '../lib/api';
import { getPhotoUrl } from '../lib/profileUtils';
import ProfileDetailsView, { type ProfileTab } from '../components/profile/ProfileDetailsView';
import { useProfileCompatibility } from '../hooks/useMatchmaking';

const TABS: { id: ProfileTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'about', label: 'About', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: UserCircle },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: HeartHandshake },
];

export default function MatchProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['match-profile', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/users/profile/${id}`);
      return data;
    },
  });

  const { data: compatibility } = useProfileCompatibility(id);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading profile...</div>;
  }

  if (isError || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link to="/app/matches?tab=interests&interest=accepted" className="inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
          <ArrowLeft size={16} /> Back to Matches
        </Link>
        <div className="card mt-4 text-center py-10">
          <p className="text-gray-600">Profile not found or unavailable.</p>
        </div>
      </div>
    );
  }

  const wizard = profile.wizardProfile || {};
  const pd = { ...profile, ...(wizard.personalDetails || {}) };
  const express = wizard.expressYourself || profile.expressYourself || {};
  const fullName =
    pd.displayName || `${pd.firstName || profile.firstName || ''} ${pd.lastName || profile.lastName || ''}`.trim() || 'Profile';
  const photoUrl = getPhotoUrl(wizard.profilePhoto || profile.photos?.[0] || '');
  const chatUserId = profile.userId;
  const location = [pd.city || profile.city, pd.state || profile.state, pd.country || profile.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="soft-fade-in mx-auto max-w-4xl space-y-5 pb-8">
      <Link to="/app/matches?tab=interests&interest=accepted" className="inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
        <ArrowLeft size={16} /> Back to Matches
      </Link>

      <div className="overflow-hidden rounded-3xl border border-[#F2DFE8] bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF]" />
        <div className="relative px-6 pb-6 -mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-primary-100 shadow-md">
                {photoUrl ? (
                  <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound size={36} className="text-primary-600" />
                  </div>
                )}
              </div>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold text-[#5D2B44]">{fullName}</h1>
                {location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-[#815A6D]">
                    <MapPin size={14} className="text-[#B66A8A]" />
                    {location}
                  </p>
                )}
                {compatibility?.score !== undefined && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#FFF0F5] px-3 py-1 text-sm font-medium text-[#B66A8A]">
                    {compatibility.score}% compatibility
                    {compatibility.highlights?.length ? ` · ${compatibility.highlights[0]}` : ''}
                  </div>
                )}
              </div>
            </div>
            <Link
              to={chatUserId ? `/app/chat?userId=${chatUserId}` : '/app/chat'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B66A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A75878]"
            >
              <MessageCircle size={16} /> Start Chat
            </Link>
          </div>

          {(express.aboutMe || profile.bio) && (
            <p className="mt-4 rounded-xl border border-[#F2DFE8] bg-[#FFFBFC] px-4 py-3 text-sm leading-relaxed text-[#6B4A5A]">
              {express.aboutMe || profile.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[#F2DFE8] bg-white p-1.5 shadow-sm">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition sm:gap-2 sm:px-4 ${
              activeTab === tabId
                ? 'bg-[#B66A8A] text-white shadow-md'
                : 'text-[#815A6D] hover:bg-[#FFF5F8] hover:text-[#5D2B44]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <ProfileDetailsView profile={profile} tab={activeTab} />
    </div>
  );
}

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, MessageCircle, UserRound } from 'lucide-react';
import api from '../lib/api';
import { getPhotoUrl } from '../lib/profileUtils';
import ProfileDetailsView from '../components/profile/ProfileDetailsView';
import { useProfileCompatibility } from '../hooks/useMatchmaking';

export default function MatchProfile() {
  const { id } = useParams<{ id: string }>();

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
      <div className="max-w-3xl mx-auto">
        <Link to="/app/matches" className="inline-flex items-center gap-2 text-primary-600 hover:underline">
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
  const fullName = `${pd.firstName || ''} ${pd.lastName || ''}`.trim() || 'Profile';
  const photoUrl = getPhotoUrl(wizard.profilePhoto || profile.photos?.[0] || '');
  const chatUserId = profile.userId;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/app/matches" className="inline-flex items-center gap-2 text-primary-600 hover:underline">
        <ArrowLeft size={16} /> Back to Matches
      </Link>

      <div className="card">
        <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <UserRound size={32} className="text-primary-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{fullName}</h1>
            {(pd.city || profile.city) && (
              <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} />
                {[pd.city || profile.city, pd.state || profile.state, pd.country || profile.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {(express.aboutMe || profile.bio) && (
              <p className="mt-2 text-gray-600">{express.aboutMe || profile.bio}</p>
            )}
            {compatibility?.score !== undefined && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                {compatibility.score}% compatibility
                {compatibility.highlights?.length ? ` · ${compatibility.highlights[0]}` : ''}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Link
            to={chatUserId ? `/app/chat?userId=${chatUserId}` : '/app/chat'}
            className="inline-flex items-center gap-2 btn-primary"
          >
            <MessageCircle size={16} /> Start Chat
          </Link>
        </div>

        <div className="mt-6">
          <ProfileDetailsView profile={profile} />
        </div>
      </div>
    </div>
  );
}

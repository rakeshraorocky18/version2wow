import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart, X, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getPhotoUrl } from '../lib/profileUtils';
import { useAuthStore } from '../store/authStore';

export default function Matches() {
  const [filters, setFilters] = useState({ gender: '', religion: '', city: '' });
  const [sentInterestIds, setSentInterestIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile-for-match-filter'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/users/profile');
        return data;
      } catch {
        return null;
      }
    },
  });

  const sendInterestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      await api.post('/matches/interest', { receiverId });
    },
    onSuccess: (_, receiverId) => {
      setSentInterestIds((prev) => (prev.includes(receiverId) ? prev : [...prev, receiverId]));
      toast.success('Interest sent successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      if (typeof message === 'string' && message.length > 0) {
        toast.error(message);
        return;
      }
      toast.error('Could not send interest. Please try again.');
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['matches-suggestions', filters, myProfile?.id, currentUserId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.gender) params.set('gender', filters.gender);
      if (filters.religion) params.set('religion', filters.religion);
      if (filters.city) params.set('city', filters.city);
      const { data } = await api.get(`/users/search?${params.toString()}`);

      return {
        ...data,
        profiles: (data?.profiles || []).filter((profile: any) => {
          const profileId = profile._id || profile.id;
          const profileUserId = profile.userId;

          if (myProfile?.id && profileId === myProfile.id) {
            return false;
          }
          if (currentUserId && profileUserId === currentUserId) {
            return false;
          }
          if (currentUserId && profileId === currentUserId) {
            return false;
          }
          return true;
        }),
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Find Your Match</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="input-field"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input
            type="text"
            value={filters.religion}
            onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
            className="input-field"
            placeholder="Religion"
          />
          <input
            type="text"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="input-field"
            placeholder="City"
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading profiles...</div>
      ) : data?.profiles?.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.profiles.map((profile: any, index: number) => {
            const profileId = profile._id || profile.id;
            return (
            <div
              key={profileId || `profile-${index}`}
              onClick={() => {
                if (!profileId) {
                  toast.error('Unable to open this profile right now');
                  return;
                }
                navigate(`/app/matches/${profileId}`);
              }}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {getPhotoUrl(profile.photos?.[0] || profile.wizardProfile?.profilePhoto || '') ? (
                  <img
                    src={getPhotoUrl(profile.photos?.[0] || profile.wizardProfile?.profilePhoto || '')}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">
                    {profile.gender === 'female' ? '👩' : '👨'}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {(profile.location?.city || profile.city) && (
                  <p className="flex items-center gap-1">
                    <MapPin size={14} /> {profile.location?.city || profile.city}, {profile.location?.state || profile.state}
                  </p>
                )}
                {profile.occupation && (
                  <p className="flex items-center gap-1">
                    <Briefcase size={14} /> {profile.occupation}
                  </p>
                )}
                {profile.education && (
                  <p className="flex items-center gap-1">
                    <GraduationCap size={14} /> {profile.education}
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const receiverId = profileId;
                    if (!receiverId) {
                      toast.error('Profile ID is missing for this user');
                      return;
                    }
                    sendInterestMutation.mutate(receiverId);
                  }}
                  disabled={
                    sendInterestMutation.isPending || sentInterestIds.includes(profileId)
                  }
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  <Heart size={16} />
                  {sentInterestIds.includes(profileId)
                    ? 'Sent'
                    : sendInterestMutation.isPending
                      ? 'Sending...'
                      : 'Interest'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast('Skipped profile');
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart size={48} className="text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-500">No profiles found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}

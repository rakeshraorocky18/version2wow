import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, GraduationCap, MapPin, UserRound } from 'lucide-react';
import api from '../lib/api';

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

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Profile';

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/app/matches" className="inline-flex items-center gap-2 text-primary-600 hover:underline">
        <ArrowLeft size={16} /> Back to Matches
      </Link>

      <div className="card">
        <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <UserRound size={32} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{fullName}</h1>
            {profile.bio && <p className="mt-2 text-gray-600">{profile.bio}</p>}
          </div>
        </div>

        <div className="mt-4">
          <Link
            to={`/app/chat?userId=${id}`}
            className="inline-flex items-center gap-2 btn-primary"
          >
            Start Chat
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm text-gray-700">
          {(profile.city || profile.state) && (
            <p className="flex items-center gap-2">
              <MapPin size={16} /> {profile.city || 'N/A'}{profile.state ? `, ${profile.state}` : ''}
            </p>
          )}
          {profile.occupation && (
            <p className="flex items-center gap-2">
              <Briefcase size={16} /> {profile.occupation}
            </p>
          )}
          {profile.education && (
            <p className="flex items-center gap-2">
              <GraduationCap size={16} /> {profile.education}
            </p>
          )}
          {profile.religion && <p>Religion: {profile.religion}</p>}
          {profile.motherTongue && <p>Mother tongue: {profile.motherTongue}</p>}
          {profile.height && <p>Height: {profile.height}</p>}
          {profile.income && <p>Income: {profile.income}</p>}
        </div>
      </div>
    </div>
  );
}

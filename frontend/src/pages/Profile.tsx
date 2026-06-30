import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';

import { User, Pencil, Loader2, MapPin } from 'lucide-react';

import api from '../lib/api';

import { getPhotoUrl } from '../lib/profileUtils';

import ProfileDetailsView from '../components/profile/ProfileDetailsView';



export default function Profile() {

  const { data: profile, isLoading } = useQuery({

    queryKey: ['myProfile'],

    queryFn: async () => {

      const { data } = await api.get('/users/profile');

      return data;

    },

    retry: false,

  });



  if (isLoading) {

    return (

      <div className="flex items-center justify-center min-h-[50vh]">

        <Loader2 className="animate-spin text-primary-600" size={32} />

      </div>

    );

  }



  if (!profile) {

    return (

      <div className="max-w-2xl mx-auto text-center space-y-6 py-16">

        <User size={48} className="mx-auto text-gray-300" />

        <h1 className="text-2xl font-display font-bold text-gray-900">No Profile Yet</h1>

        <p className="text-gray-500">Create your profile to start connecting with matches.</p>

        <Link to="/app/profile/edit" className="btn-primary inline-flex items-center gap-2">

          <Pencil size={18} /> Create Profile

        </Link>

      </div>

    );

  }



  const wizard = profile.wizardProfile || {};

  const pd = wizard.personalDetails || profile;

  const photoUrl = getPhotoUrl(wizard.profilePhoto || profile.photos?.[0] || '');

  const displayName =

    pd.displayName || `${pd.firstName || profile.firstName || ''} ${pd.lastName || profile.lastName || ''}`.trim();



  return (

    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">

        <h1 className="text-2xl font-display font-bold text-gray-900">My Profile</h1>

        <Link to="/app/profile/edit" className="btn-secondary flex items-center gap-2 text-sm py-2">

          <Pencil size={16} /> Edit Profile

        </Link>

      </div>



      <div className="card">

        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">

          <div className="w-28 h-28 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center shrink-0">

            {photoUrl ? (

              <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />

            ) : (

              <User size={40} className="text-primary-400" />

            )}

          </div>

          <div className="text-center sm:text-left">

            <h2 className="text-xl font-display font-bold text-gray-900">{displayName || 'My Profile'}</h2>

            {(pd.city || profile.city) && (

              <p className="text-sm text-gray-500 flex items-center gap-1 justify-center sm:justify-start mt-1">

                <MapPin size={14} />

                {[pd.city || profile.city, pd.state || profile.state, pd.country || profile.country]

                  .filter(Boolean)

                  .join(', ')}

              </p>

            )}

            {profile.isComplete && (

              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">

                Profile Complete

              </span>

            )}

          </div>

        </div>



        <ProfileDetailsView profile={profile} />

      </div>

    </div>

  );

}


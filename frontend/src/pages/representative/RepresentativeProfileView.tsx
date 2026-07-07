import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  MapPin,
  Pencil,
  UserRound,
  Users,
  Eye,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/api';
import { calculateCompletion, getPhotoUrl, profileFromApi } from '../../lib/profileUtils';
import { useAuthStore } from '../../store/authStore';
import { isRepresentativeRole } from '../../lib/profileTypeOptions';
import type { RepresentativeProfile } from '../../types/extendedProfiles';

export default function RepresentativeProfileView() {
  const user = useAuthStore((s) => s.user);

  const { data: repProfile, isLoading: repLoading } = useQuery({
    queryKey: ['representative-profile-me'],
    queryFn: async () => {
      const { data } = await api.get('/representative-profiles/me');
      return data as RepresentativeProfile | null;
    },
  });

  const { data: managedProfile, isLoading: managedLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/users/profile');
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  if (repLoading || managedLoading) {
    return <div className="py-12 text-center text-gray-500">Loading profiles...</div>;
  }

  if (!repProfile && isRepresentativeRole(user?.role)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/app" className="inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="card text-center py-10">
          <p className="text-gray-600">Create your representative profile to get started.</p>
          <Link to="/app/profile/edit/representative" className="btn-primary mt-4 inline-block text-sm">
            Create Representative Profile
          </Link>
        </div>
      </div>
    );
  }

  if (!repProfile) {
    return (
      <div className="mx-auto max-w-2xl card text-center py-10">
        <p className="text-gray-600">Representative profile not found.</p>
      </div>
    );
  }

  const repPhoto = getPhotoUrl(repProfile.profilePhoto || '');
  const repLocation = [repProfile.city, repProfile.state, repProfile.country].filter(Boolean).join(', ');
  const managingLabel = repProfile.managingProfileFor || 'Bride/Groom';

  const mp = managedProfile || {};
  const mpWizard = mp.wizardProfile || {};
  const mpPd = mpWizard.personalDetails || mp;
  const managedName =
    mpPd.displayName ||
    `${mpPd.firstName || mp.firstName || ''} ${mpPd.lastName || mp.lastName || ''}`.trim() ||
    `${managingLabel} Profile`;
  const managedPhoto = getPhotoUrl(mpWizard.profilePhoto || mp.photos?.[0] || '');
  const managedCompletion = managedProfile ? calculateCompletion(profileFromApi(managedProfile)) : 0;
  const managedLocation = [mpPd.city || mp.city, mpPd.state || mp.state].filter(Boolean).join(', ');

  return (
    <div className="soft-fade-in mx-auto max-w-5xl space-y-6 pb-10">
      <Link to="/app" className="inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A5776]">Family Member / Friend</p>
        <h1 className="font-display text-2xl font-bold text-[#5D2B44]">My Profiles</h1>
        <p className="mt-1 text-sm text-[#815A6D]">
          Manage your representative details and the {managingLabel.toLowerCase()} profile separately.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Representative card */}
        <section className="overflow-hidden rounded-3xl border-2 border-[#E5C8D5] bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF] px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[#6E4A9C]">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5776]">Profile 1</p>
                <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Representative (You)</h2>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#F2DFE8] bg-[#FFF5F8]">
                {repPhoto ? (
                  <img src={repPhoto} alt={repProfile.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#C4A0B0]"><UserRound size={28} /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[#5D2B44]">{repProfile.fullName}</h3>
                  {repProfile.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <BadgeCheck size={10} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#9A5776]">
                  {repProfile.relationship === 'Other' ? repProfile.relationshipOther : repProfile.relationship}
                </p>
                {repLocation && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#815A6D]">
                    <MapPin size={12} /> {repLocation}
                  </p>
                )}
              </div>
            </div>
            {repProfile.about && (
              <p className="mt-4 line-clamp-3 text-sm text-[#6B4A5A]">{repProfile.about}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/app/profile/edit/representative"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6E4A9C] px-4 py-2 text-sm font-medium text-white hover:bg-[#5D3D88]"
              >
                <Pencil size={14} /> Edit Representative
              </Link>
            </div>
          </div>
        </section>

        {/* Managed bride/groom card */}
        <section className="overflow-hidden rounded-3xl border-2 border-[#F2DFE8] bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#F9DEE7] to-[#FFF5EF] px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[#B66A8A]">
                <Heart size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5776]">Profile 2</p>
                <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Managed {managingLabel}</h2>
              </div>
            </div>
          </div>
          <div className="p-5">
            {managedProfile ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#F2DFE8] bg-[#FFF5F8]">
                    {managedPhoto ? (
                      <img src={managedPhoto} alt={managedName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">
                        {mpPd.gender === 'female' || managingLabel === 'Bride' ? '👰' : '🤵'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#5D2B44]">{managedName}</h3>
                    <p className="text-sm text-[#9A5776]">Matrimonial profile for matches</p>
                    {managedLocation && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#815A6D]">
                        <MapPin size={12} /> {managedLocation}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F4E4EC]">
                        <div
                          className="h-full rounded-full bg-[#B66A8A] transition-all"
                          style={{ width: `${managedCompletion}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#B66A8A]">{managedCompletion}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/app/profile/managed"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8B6C6] bg-white px-4 py-2 text-sm font-medium text-[#7B4A62] hover:bg-[#FFF5F8]"
                  >
                    <Eye size={14} /> View Profile
                  </Link>
                  <Link
                    to="/app/profile/edit/managed"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#B66A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#A75878]"
                  >
                    <Pencil size={14} /> Edit {managingLabel}
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E5C8D5] bg-[#FFFBFC] p-6 text-center">
                <Sparkles className="mx-auto text-[#B66A8A]" size={28} />
                <p className="mt-3 text-sm text-[#6B4A5A]">No {managingLabel.toLowerCase()} profile created yet.</p>
                <Link
                  to="/app/profile/edit/managed"
                  className="btn-primary mt-4 inline-block text-sm"
                >
                  Create {managingLabel} Profile
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

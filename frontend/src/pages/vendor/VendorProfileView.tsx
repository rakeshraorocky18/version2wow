import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getPhotoUrl } from '../../lib/profileUtils';
import { useAuthStore } from '../../store/authStore';
import { isVendorRole } from '../../lib/profileTypeOptions';
import type { VendorProfile } from '../../types/extendedProfiles';

export default function VendorProfileView() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isOwn = id === 'me' || !id;

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['vendor-profile', isOwn ? 'me' : id],
    queryFn: async () => {
      if (isOwn) {
        const { data } = await api.get('/vendor-profiles/me');
        return data as VendorProfile | null;
      }
      const { data } = await api.get(`/vendor-profiles/${id}`);
      return data as VendorProfile;
    },
  });

  const isOwner = profile?.userId === user?.id;
  const category = profile?.category === 'Other' ? profile.categoryOther || 'Other' : profile?.category;
  const bannerUrl = getPhotoUrl(profile?.businessBanner || '');
  const logoUrl = getPhotoUrl(profile?.businessLogo || '');

  const shareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: profile?.businessName, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied');
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading profile...</div>;
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/app" className="inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="card text-center py-10">
          <p className="text-gray-600">Vendor profile not found.</p>
          {isVendorRole(user?.role) && (
            <Link to="/app/profile/edit/vendor" className="btn-primary mt-4 inline-block text-sm">
              Create Business Profile
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="soft-fade-in mx-auto max-w-3xl space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <Link to="/app" className="inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        {isOwner && (
          <Link to="/app/profile/edit/vendor" className="inline-flex items-center gap-1 text-sm text-[#B66A8A] hover:underline">
            <Pencil size={14} /> Edit
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#F2DFE8] bg-white shadow-sm">
        <div className="relative h-36 bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF]">
          {bannerUrl && <img src={bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
              {logoUrl ? (
                <img src={logoUrl} alt={profile.businessName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#FFF5F8] text-2xl">🏢</div>
              )}
            </div>
            <div className="pb-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold text-[#5D2B44]">{profile.businessName}</h1>
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-[#9A5776]">{category}</p>
              {profile.ownerName && <p className="text-xs text-[#815A6D]">by {profile.ownerName}</p>}
            </div>
          </div>

          {profile.businessDescription && (
            <p className="mt-4 text-sm leading-relaxed text-[#5D2B44]">{profile.businessDescription}</p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {profile.yearsOfExperience != null && (
              <Chip label="Experience" value={`${profile.yearsOfExperience}+ years`} />
            )}
            {profile.teamSize != null && <Chip label="Team Size" value={String(profile.teamSize)} />}
            {profile.pricingRange && <Chip label="Pricing" value={profile.pricingRange} />}
            {profile.serviceCities?.length ? (
              <Chip label="Cities" value={profile.serviceCities.join(', ')} />
            ) : null}
            {profile.serviceStates?.length ? (
              <Chip label="States" value={profile.serviceStates.join(', ')} />
            ) : null}
          </div>

          {(profile.portfolioPhotos?.length || profile.portfolioVideos?.length) ? (
            <div className="mt-6">
              <h2 className="font-display text-base font-semibold text-[#5D2B44] mb-3">Gallery</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {profile.portfolioPhotos?.map((url) => (
                  <img key={url} src={getPhotoUrl(url)} alt="" className="h-28 w-full rounded-xl object-cover" />
                ))}
              </div>
              {profile.portfolioVideos?.length ? (
                <div className="mt-3 space-y-2">
                  {profile.portfolioVideos.map((url) => (
                    <video key={url} src={getPhotoUrl(url)} controls className="w-full rounded-xl" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[#F2DFE8] bg-[#FFFBFC] p-4 space-y-2">
            <h2 className="font-display text-base font-semibold text-[#5D2B44]">Contact</h2>
            {profile.businessAddress && (
              <p className="flex items-start gap-2 text-sm text-[#5D2B44]">
                <MapPin size={14} className="mt-0.5 shrink-0" /> {profile.businessAddress}
              </p>
            )}
            {profile.googleMapsLocation && (
              <a href={profile.googleMapsLocation} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#B66A8A] hover:underline">
                <ExternalLink size={14} /> View on Maps
              </a>
            )}
            {profile.mobileNumber && (
              <a href={`tel:${profile.mobileNumber}`} className="flex items-center gap-2 text-sm text-[#5D2B44]">
                <Phone size={14} /> {profile.mobileNumber}
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-[#5D2B44]">
                <Mail size={14} /> {profile.email}
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#B66A8A] hover:underline">
                <Globe size={14} /> Website
              </a>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              {profile.instagram && <SocialLink label="Instagram" href={profile.instagram} />}
              {profile.facebook && <SocialLink label="Facebook" href={profile.facebook} />}
              {profile.whatsapp && (
                <SocialLink label="WhatsApp" href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} />
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {profile.mobileNumber && (
              <a href={`tel:${profile.mobileNumber}`} className="btn-primary text-sm py-2.5">
                Contact Vendor
              </a>
            )}
            <button type="button" onClick={shareProfile} className="btn-secondary flex items-center gap-2 text-sm py-2.5">
              <Share2 size={16} /> Share Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#F2DFE8] bg-[#FFFBFC] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A5776]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#5D2B44]">{value}</p>
    </div>
  );
}

function SocialLink({ label, href }: { label: string; href: string }) {
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#B66A8A] hover:underline">
      {label}
    </a>
  );
}

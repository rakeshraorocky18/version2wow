import {
  BadgeCheck,
  Camera,
  MapPin,
  Pencil,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardCard from './DashboardCard';
import type { DashboardOwnProfileCardData } from '../../hooks/useDashboard';

interface FeaturedMatchCardProps {
  profile: DashboardOwnProfileCardData | null;
}

const FALLBACK_PROFILE: DashboardOwnProfileCardData = {
  name: 'Your Profile',
  firstName: 'You',
  age: undefined,
  location: 'Add your city',
  profession: 'Add your profession',
  photoUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
  isVerified: false,
  completionPercent: 0,
  interests: ['Travel', 'Music', 'Fitness', 'Family Values'],
  sectionProgress: [
    { label: 'Personal Details', score: 45 },
    { label: 'Religion/Culture', score: 45 },
    { label: 'Family Values', score: 45 },
    { label: 'Partner Preferences', score: 45 },
  ],
  aboutPoints: [
    'Complete your profile to help us find better matches for you.',
  ],
};

export default function FeaturedMatchCard({ profile }: FeaturedMatchCardProps) {
  const data = profile ?? FALLBACK_PROFILE;
  const aboutPoints =
    data.aboutPoints.length > 0
      ? data.aboutPoints
      : ['Add a short bio to tell others more about yourself.'];

  return (
    <DashboardCard className="wow-featured-match-card" delay={1} noHover>
      <div className="wow-featured-match-card__media">
        <img
          src={data.photoUrl || FALLBACK_PROFILE.photoUrl}
          alt={data.name}
          className="h-full w-full object-cover"
        />
        <div className="wow-featured-match-card__overlay" />
        <div className="wow-featured-match-card__badge">
          <User size={14} />
          My Profile
        </div>
        <div className="wow-featured-match-card__compatibility">
          {data.completionPercent}% Complete
        </div>
      </div>

      <div className="wow-featured-match-card__body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[1.1rem] font-semibold text-[#2C2630]">
                {data.name}
                {data.age ? `, ${data.age}` : ''}
              </h2>
              {data.isVerified && (
                <span className="wow-verified-pill">
                  <BadgeCheck size={13} />
                  Verified
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-[#6B6670]">
              {data.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} />
                  {data.location}
                </span>
              )}
              <span>{data.profession}</span>
            </div>
          </div>
          <div className="wow-featured-match-score-ring">
            <span>{data.completionPercent}%</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="wow-section-kicker">My Interests</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {data.interests.length > 0 ? (
              data.interests.slice(0, 4).map((interest) => (
                <span key={interest} className="wow-soft-chip">
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#6B6670]">
                Add interests in your profile to stand out.
              </span>
            )}
          </div>
        </div>

        <div className="wow-featured-match-card__insights">
          {data.sectionProgress.slice(0, 4).map((item) => (
            <div key={item.label} className="wow-featured-match-card__insight">
              <span>{item.label}</span>
              <strong>{item.score}%</strong>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="wow-section-kicker">About Me</p>
          <ul className="wow-featured-match-card__reasons">
            {aboutPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link to="/app/profile/details" className="wow-secondary-button text-center">
            View Profile
          </Link>
          <Link
            to="/app/profile/edit"
            className="wow-primary-button inline-flex items-center justify-center gap-2"
          >
            <Pencil size={14} />
            {data.completionPercent < 100 ? 'Complete Profile' : 'Edit Profile'}
          </Link>
          <Link
            to="/app/profile/photos"
            className="wow-ghost-button inline-flex items-center justify-center gap-2"
          >
            <Camera size={14} />
            Upload Photos
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}

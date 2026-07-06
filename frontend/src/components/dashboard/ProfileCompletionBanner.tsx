import { Link } from 'react-router-dom';
import { Camera, ChevronRight, Sparkles, User } from 'lucide-react';
import CircularProgressRing from './CircularProgressRing';

interface ProfileCompletionBannerProps {
  completionPercent: number;
  missingSections: string[];
  hasPhoto: boolean;
  isVerified?: boolean;
}

export default function ProfileCompletionBanner({
  completionPercent,
  missingSections,
  hasPhoto,
  isVerified,
}: ProfileCompletionBannerProps) {
  if (completionPercent >= 100) return null;

  const missing = new Set(missingSections);
  const checklist = [
    { label: 'Basic Information', done: completionPercent >= 20 || !missing.has('Personal Details') },
    { label: 'Photos Added', done: hasPhoto },
    {
      label: 'Preferences Added',
      done: completionPercent >= 60 || !missing.has('Partner Preferences'),
    },
    { label: 'Family Details', done: !missing.has('Family Details') && completionPercent >= 50 },
    {
      label: 'Lifestyle Preferences',
      done: !missing.has('Lifestyle Preferences') && completionPercent >= 70,
    },
    { label: 'Verification', done: Boolean(isVerified) },
  ];

  return (
    <div className="wow-profile-completion-card">
      <div className="wow-profile-completion-card__inner">
        <div className="wow-profile-completion-card__ring">
          <CircularProgressRing
            percent={completionPercent}
            size={76}
            strokeWidth={5}
            gradientId="wowProfileCompletionGrad"
          />
          <span className="wow-profile-completion-card__pct">{completionPercent}%</span>
        </div>
        <div className="wow-profile-completion-card__content">
          <p className="wow-section-kicker inline-flex items-center gap-2">
            <Sparkles size={13} />
            Unlock Better Matches
          </p>
          <h3 className="wow-section-title">
            Profile Completion
          </h3>
          <p className="wow-section-subtitle !mb-0">
            Complete your profile to receive 3x more compatible matches.
          </p>
          <ul className="wow-profile-completion-card__list">
            {checklist.map((item) => (
              <li key={item.label} className={item.done ? 'is-complete' : 'is-pending'}>
                <span aria-hidden>{item.done ? '✓' : '○'}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="wow-profile-completion-card__actions">
          {!hasPhoto && (
            <Link to="/app/profile/photos" className="wow-secondary-button inline-flex items-center gap-2">
              <Camera size={14} />
              Add Photos
            </Link>
          )}
          <Link to="/app/profile/edit" className="wow-primary-button inline-flex items-center gap-2">
            <User size={14} />
            Complete Profile
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

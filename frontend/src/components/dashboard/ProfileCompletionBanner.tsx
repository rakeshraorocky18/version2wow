import { Link } from 'react-router-dom';
import { Camera, ChevronRight, Heart, User } from 'lucide-react';
import CircularProgressRing from './CircularProgressRing';

interface ProfileCompletionBannerProps {
  completionPercent: number;
  missingSections: string[];
  hasPhoto: boolean;
}

export default function ProfileCompletionBanner({
  completionPercent,
  missingSections,
  hasPhoto,
}: ProfileCompletionBannerProps) {
  if (completionPercent >= 100) return null;

  const pendingItems = [
    ...(!hasPhoto ? ['Add profile photo'] : []),
    ...missingSections.slice(0, 3).map((s) => `Complete ${s}`),
  ].slice(0, 4);

  return (
    <div className="shaadi-completion-banner">
      <div className="shaadi-completion-banner__inner">
        <div className="shaadi-completion-banner__ring">
          <CircularProgressRing
            percent={completionPercent}
            size={56}
            strokeWidth={5}
            gradientId="shaadiProgressGrad"
          />
          <span className="shaadi-completion-banner__pct">{completionPercent}%</span>
        </div>
        <div className="shaadi-completion-banner__content">
          <p className="shaadi-completion-banner__eyebrow">My WOW · Profile strength</p>
          <h3 className="shaadi-completion-banner__title">
            Complete your profile to get better matches
          </h3>
          {pendingItems.length > 0 && (
            <ul className="shaadi-completion-banner__list">
              {pendingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="shaadi-completion-banner__actions">
          {!hasPhoto && (
            <Link to="/app/profile/photos" className="shaadi-btn shaadi-btn--outline">
              <Camera size={14} /> Add Photos
            </Link>
          )}
          <Link to="/app/profile/edit" className="shaadi-btn shaadi-btn--primary">
            <User size={14} /> Complete Profile <ChevronRight size={14} />
          </Link>
          <Link
            to="/app/profile/edit?section=partner-preferences"
            className="shaadi-btn shaadi-btn--ghost"
          >
            <Heart size={14} /> Partner Preferences
          </Link>
        </div>
      </div>
    </div>
  );
}

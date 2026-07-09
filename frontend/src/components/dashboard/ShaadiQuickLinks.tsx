import { Link } from 'react-router-dom';
import { Camera, Heart, Pencil, User } from 'lucide-react';

interface ShaadiQuickLinksProps {
  completionPercent: number;
}

export default function ShaadiQuickLinks({ completionPercent }: ShaadiQuickLinksProps) {
  const partnerPrefsComplete = completionPercent >= 100;

  const links = [
    { to: '/app/profile/edit', icon: Pencil, label: 'Edit Profile', disabled: false },
    {
      to: '/app/profile/edit?section=partner-preferences',
      icon: Heart,
      label: 'Partner Preferences',
      disabled: partnerPrefsComplete,
    },
    { to: '/app/profile/photos', icon: Camera, label: 'Add Photos', disabled: false },
    { to: '/app/matches?tab=shortlist', icon: User, label: 'My Shortlist', disabled: false },
  ];

  return (
    <nav className="shaadi-quick-links" aria-label="Profile quick links">
      {links.map(({ to, icon: Icon, label, disabled }) =>
        disabled ? (
          <span
            key={to}
            className="shaadi-quick-links__item is-disabled"
            aria-disabled="true"
            title="Partner preferences completed"
          >
            <span className="shaadi-quick-links__icon">
              <Icon size={15} />
            </span>
            <span className="shaadi-quick-links__label">{label}</span>
          </span>
        ) : (
          <Link key={to} to={to} className="shaadi-quick-links__item">
            <span className="shaadi-quick-links__icon">
              <Icon size={15} />
            </span>
            <span className="shaadi-quick-links__label">{label}</span>
          </Link>
        ),
      )}
    </nav>
  );
}

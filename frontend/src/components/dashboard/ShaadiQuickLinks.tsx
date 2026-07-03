import { Link } from 'react-router-dom';
import { Camera, Heart, Pencil, Shield, User } from 'lucide-react';

const LINKS = [
  { to: '/app/profile/edit', icon: Pencil, label: 'Edit Profile' },
  { to: '/app/profile/edit?section=partner-preferences', icon: Heart, label: 'Partner Preferences' },
  { to: '/app/profile/photos', icon: Camera, label: 'Add Photos' },
  { to: '/app/profile', icon: Shield, label: 'Privacy & Settings' },
  { to: '/app/matches?tab=shortlist', icon: User, label: 'My Shortlist' },
];

export default function ShaadiQuickLinks() {
  return (
    <nav className="shaadi-quick-links" aria-label="Profile quick links">
      {LINKS.map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to} className="shaadi-quick-links__item">
          <span className="shaadi-quick-links__icon">
            <Icon size={15} />
          </span>
          <span className="shaadi-quick-links__label">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import DashboardCard from './DashboardCard';
import type { DashboardActiveConnection } from '../../hooks/useDashboard';

interface ContinueConnectionCardProps {
  connections: DashboardActiveConnection[];
}

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80';

export default function ContinueConnectionCard({
  connections,
}: ContinueConnectionCardProps) {
  return (
    <DashboardCard className="wow-connections-card" delay={4}>
      <div className="dp-dash-panel-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="wow-section-kicker">Continue Your Connection</p>
            <h2 className="wow-section-title">Active conversations that feel promising</h2>
            <p className="wow-section-subtitle">
              Keep meaningful momentum alive with the connections already moving forward.
            </p>
          </div>
          <Link to="/app/chat" className="wow-inline-link">
            Open inbox
          </Link>
        </div>

        {connections.length > 0 ? (
          <div className="wow-connections-card__list">
            {connections.map((connection) => (
              <div key={connection.id} className="wow-connections-card__item">
                <img
                  src={connection.photoUrl || FALLBACK_PHOTO}
                  alt={connection.name}
                  className="wow-connections-card__avatar"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="truncate text-base font-semibold text-[#2C2630]">
                        {connection.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6B6670]">
                        {connection.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {connection.location}
                          </span>
                        )}
                        <span>{connection.compatibilityScore}% compatibility</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[#8A7A84]">
                      {connection.timeLabel}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#5A5360]">
                    "{connection.lastMessage}"
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={connection.chatPath}
                      className="wow-primary-button inline-flex items-center gap-2"
                    >
                      <MessageCircle size={14} />
                      Reply
                    </Link>
                    <Link
                      to={connection.chatPath}
                      className="wow-secondary-button inline-flex items-center gap-2"
                    >
                      Open Chat
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="wow-empty-state">
            <p className="text-sm font-medium text-[#2C2630]">
              No active conversations yet.
            </p>
            <p className="mt-1 text-sm text-[#6B6670]">
              Send a few thoughtful interests to unlock stronger conversations here.
            </p>
            <Link to="/app/matches?tab=suggestions" className="wow-inline-link mt-3 inline-flex">
              Discover matches
            </Link>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

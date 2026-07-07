import { Clock3, Eye, Flame, Heart, Mail, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardCard from './DashboardCard';

interface MatchmakingSnapshotBarProps {
  newMatches: number;
  newInterests: number;
  newReplies: number;
  profileViews: number;
  updatedLabel?: string;
}

const items = [
  { key: 'matches', label: 'New Matches', icon: Heart, accent: 'rose' },
  { key: 'interests', label: 'New Interests', icon: Mail, accent: 'blush' },
  { key: 'replies', label: 'New Replies', icon: MessageCircle, accent: 'lavender' },
  { key: 'views', label: 'Profile Views', icon: Eye, accent: 'gold' },
] as const;

export default function MatchmakingSnapshotBar({
  newMatches,
  newInterests,
  newReplies,
  profileViews,
  updatedLabel = 'Updated 5 minutes ago',
}: MatchmakingSnapshotBarProps) {
  const values = {
    matches: newMatches,
    interests: newInterests,
    replies: newReplies,
    views: profileViews,
  };

  return (
    <DashboardCard className="wow-snapshot-bar" delay={0} noHover>
      <div className="dp-dash-panel-body">
        <div className="wow-snapshot-bar__grid">
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.key}
                className={`wow-snapshot-bar__item is-${item.accent}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="wow-snapshot-bar__icon">
                  <Icon size={14} />
                </span>
                <div>
                  <p className="wow-snapshot-bar__value">{values[item.key]}</p>
                  <p className="wow-snapshot-bar__label">{item.label}</p>
                </div>
              </motion.div>
            );
          })}

          <div className="wow-snapshot-bar__trend">
            <span className="wow-snapshot-bar__trend-chip">
              <Flame size={14} />
              Compatibility Trending Up
            </span>
            <span className="wow-snapshot-bar__updated">
              <Clock3 size={12} />
              {updatedLabel}
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

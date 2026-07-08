import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import DashboardCard from './DashboardCard';

export interface ActivityItem {
  icon: ReactNode;
  text: string;
  time: string;
  color: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  emptyCta?: { label: string; to: string };
  footerLink?: { label: string; to: string };
}

export default function RecentActivity({
  activities,
  emptyCta,
  footerLink,
}: RecentActivityProps) {
  return (
    <DashboardCard delay={6}>
      <div className="dp-dash-panel-body">
        <h2 className="dp-dash-section-title">Recent Activity</h2>
        <p className="dp-dash-section-subtitle">Your latest updates</p>

        {activities.length > 0 ? (
          <ul>
            {activities.map((item, i) => (
              <motion.li
                key={`${item.text}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="dp-dash-activity__item"
              >
                <span className="dp-dash-activity__icon">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="dp-dash-activity__text truncate">{item.text}</p>
                  <p className="dp-dash-activity__time">{item.time}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-[#6a737c]">No recent activity yet</p>
            {emptyCta && (
              <Link to={emptyCta.to} className="dp-dash-btn dp-dash-btn--outline mt-3 inline-flex">
                {emptyCta.label}
              </Link>
            )}
          </div>
        )}

        {footerLink && (
          <Link
            to={footerLink.to}
            className="mt-4 flex items-center gap-2 rounded-xl border border-[rgba(0,0,0,0.04)] bg-[#f7f8fa] p-3 transition-colors hover:border-[rgba(244,25,109,0.15)]"
          >
            <span className="text-xs font-bold text-[#f4196d]">{footerLink.label}</span>
          </Link>
        )}
      </div>
    </DashboardCard>
  );
}

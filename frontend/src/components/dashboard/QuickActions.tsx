import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import DashboardCard from './DashboardCard';
import { staggerContainer, fadeSlideUp } from './motion';

interface QuickAction {
  icon: ReactNode;
  label: string;
  to: string;
  color: string;
  bg: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

function QuickActionBtn({ icon, label, to }: QuickAction) {
  return (
    <motion.div variants={fadeSlideUp}>
      <Link to={to} className="dp-dash-quick-item">
        <div className="dp-dash-quick-item__icon">{icon}</div>
        <span className="dp-dash-quick-item__label">{label}</span>
      </Link>
    </motion.div>
  );
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <DashboardCard delay={2} className="wow-quick-actions-card self-start">
      <div className="dp-dash-panel-body">
        <p className="wow-section-kicker">Quick Actions</p>
        <h2 className="wow-section-title">Move faster through your journey</h2>
        <p className="wow-section-subtitle">Essential shortcuts for matches, chat, and planning.</p>
        <motion.div
          className="dp-dash-quick-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {actions.map((action) => (
            <QuickActionBtn key={action.label} {...action} />
          ))}
        </motion.div>
      </div>
    </DashboardCard>
  );
}

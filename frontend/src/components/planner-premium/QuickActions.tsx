import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, MessageCircle, Building2, ClipboardList, Wallet,
  Plane, PartyPopper, Mail, Camera, Gift,
} from 'lucide-react';
import GlassCard from './GlassCard';
import { staggerContainer, fadeSlideUp } from '../dashboard/motion';

const ACTIONS = [
  { icon: Heart, title: 'Matches', desc: 'Discover your perfect match', path: '/app/matches', gradient: 'from-romantic-rose to-romantic-blush' },
  { icon: MessageCircle, title: 'Messages', desc: 'Chat with your connections', path: '/app/chat', gradient: 'from-romantic-lavender to-romantic-rose' },
  { icon: Building2, title: 'Vendors', desc: 'Browse premium vendors', path: '/app/vendors', gradient: 'from-romantic-champagne to-romantic-peach' },
  { icon: ClipboardList, title: 'Planner', desc: 'Manage your checklist', path: '/app/planner', gradient: 'from-romantic-blush to-romantic-lavender' },
  { icon: Wallet, title: 'Finance', desc: 'Track wedding budget', path: '/app/finance', gradient: 'from-romantic-rose to-romantic-champagne' },
  { icon: Plane, title: 'Honeymoon', desc: 'Plan your dream getaway', path: '/app/honeymoon', gradient: 'from-romantic-lavender to-romantic-peach' },
  { icon: PartyPopper, title: 'Events', desc: 'Organize ceremonies', path: '/app/events', gradient: 'from-romantic-peach to-romantic-rose' },
  { icon: Mail, title: 'Invitations', desc: 'Send beautiful invites', path: '/app/events', gradient: 'from-romantic-blush to-romantic-champagne' },
  { icon: Camera, title: 'Gallery', desc: 'Capture memories', path: '/app/profile', gradient: 'from-romantic-rose to-romantic-lavender' },
  { icon: Gift, title: 'Registry', desc: 'Manage gift registry', path: '/app/finance', gradient: 'from-romantic-champagne to-romantic-blush' },
];

export default function QuickActions() {
  return (
    <section aria-label="Quick actions">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Quick Actions
      </h2>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {ACTIONS.map((action, i) => (
          <motion.div key={action.title} variants={fadeSlideUp} custom={i}>
            <Link to={action.path} className="block">
              <GlassCard delay={0} className="group h-full cursor-pointer">
                <div
                  className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${action.gradient} p-3 text-white shadow-lg transition group-hover:shadow-romantic-rose/40 group-hover:shadow-xl`}
                >
                  <action.icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-romantic-cream">{action.title}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{action.desc}</p>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, MessageCircle } from 'lucide-react';
import DashboardCard from './DashboardCard';

export default function AIAssistant() {
  return (
    <DashboardCard className="dp-dash-ai overflow-hidden" delay={8}>
      <div className="dp-dash-panel-body relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <div className="dp-dash-quick-item__icon !h-10 !w-10">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="dp-dash-section-title !mb-0 !text-base">AI Wedding Assistant</h2>
            <p className="text-[10px] text-[#6a737c]">Your personal planning companion</p>
          </div>
        </div>

        <div className="dp-dash-ai__bubble">
          <p className="text-sm font-bold text-[#242729]">Need help planning today?</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#6a737c]">
            Ask our AI Wedding Assistant for recommendations, timelines, budgeting help, venue
            suggestions, match insights, and wedding planning guidance.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/app/chat" className="dp-connect-btn w-full">
            <MessageCircle size={16} /> Ask AI
          </Link>
        </motion.div>

        <p className="mt-3 text-center text-[10px] text-[#6a737c]">
          Powered by WOW — always here for your journey 💕
        </p>
      </div>
    </DashboardCard>
  );
}

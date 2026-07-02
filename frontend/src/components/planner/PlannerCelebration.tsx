import { useEffect, useState } from 'react';
import { PartyPopper, Sparkles } from 'lucide-react';

interface PlannerCelebrationProps {
  show: boolean;
}

function ConfettiPiece({ delay, left }: { delay: number; left: number }) {
  const colors = ['#B66A8A', '#6E4A9C', '#E8A4BC', '#6BBF8A', '#F59E0B'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <span
      className="pointer-events-none absolute top-0 h-2 w-2 animate-planner-confetti rounded-sm opacity-90"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

export default function PlannerCelebration({ show }: PlannerCelebrationProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-[#FFF5F8] to-[#F8F5FF] p-8 text-center shadow-lg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <ConfettiPiece key={i} delay={i * 120} left={(i * 4.2) % 100} />
        ))}
      </div>

      <div className="relative">
        <div className="mx-auto flex h-16 w-16 animate-bounce items-center justify-center rounded-2xl bg-white shadow-md ring-2 ring-emerald-200">
          <PartyPopper size={32} className="text-emerald-500" />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#B66A8A] ring-1 ring-[#F4D8E4]">
          <Sparkles size={12} />
          Milestone reached
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-[#5D2B44] sm:text-3xl">
          Congratulations! Wedding planning is complete.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#815A6D]">
          Every task on your checklist is done. Enjoy the calm before your big day!
        </p>
      </div>
    </div>
  );
}

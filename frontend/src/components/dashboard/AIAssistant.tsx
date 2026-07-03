import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';
import DashboardCard from './DashboardCard';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

const WELCOME_MESSAGE =
  'Hi! I\'m your AI Wedding Assistant. Ask me about timelines, budgeting, venues, vendors, or match tips — I\'m here to help you plan your perfect day.';

function getAssistantReply(input: string): string {
  const q = input.toLowerCase();

  if (q.includes('budget') || q.includes('cost') || q.includes('money')) {
    return 'A good wedding budget splits roughly 40% venue & catering, 15% photography, 10% decor, and the rest across attire, entertainment, and extras. Open Finance to track yours, or tell me your total budget for a quick breakdown.';
  }
  if (q.includes('venue') || q.includes('location')) {
    return 'Start with guest count and season, then shortlist 3–5 venues in your city. Visit on a weekday, ask about in-house catering, and check cancellation terms. Browse Vendors for venue options near you.';
  }
  if (q.includes('vendor') || q.includes('photographer') || q.includes('cater')) {
    return 'Book photographers and venues 9–12 months ahead. Compare portfolios, read reviews, and get itemised quotes. Your Recommended Vendors section shows options near your location.';
  }
  if (q.includes('timeline') || q.includes('schedule') || q.includes('when')) {
    return '12 months out: venue & photographer. 6 months: catering, decor, invitations. 3 months: outfits & rehearsals. 1 month: final headcount & seating. Use Wedding Planner for a personalised checklist.';
  }
  if (q.includes('match') || q.includes('partner') || q.includes('interest')) {
    return 'Complete your profile and partner preferences for better matches. Respond to interest requests promptly, and keep your photos updated. Check Matches to explore suggestions tailored to you.';
  }
  if (q.includes('invitation') || q.includes('guest')) {
    return 'Send save-the-dates 6–8 months before, formal invites 2–3 months before. Track RSVPs in Events and keep a buffer of 5–10% extra meals for last-minute guests.';
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return 'Hello! How can I help with your wedding planning today? You can ask about budget, venues, timelines, vendors, or matches.';
  }

  return 'I can help with wedding timelines, budgeting, venue & vendor tips, invitations, and match guidance. Try asking something like "How should I plan my budget?" or "When should I book a photographer?"';
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME_MESSAGE },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: getAssistantReply(trimmed),
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

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

        {!isOpen ? (
          <>
            <div className="dp-dash-ai__bubble">
              <p className="text-sm font-bold text-[#242729]">Need help planning today?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#6a737c]">
                Get recommendations, timelines, budgeting help, venue suggestions, and wedding
                planning guidance — right here on your dashboard.
              </p>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsOpen(true)}
              className="dp-connect-btn w-full"
            >
              <Sparkles size={16} /> Ask AI
            </motion.button>
          </>
        ) : (
          <div className="dp-dash-ai__chat">
            <div ref={scrollRef} className="dp-dash-ai__messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`dp-dash-ai__msg ${msg.role === 'user' ? 'is-user' : 'is-assistant'}`}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="dp-dash-ai__msg is-assistant is-typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <form
              className="dp-dash-ai__input-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about budget, venues, timeline..."
                className="dp-dash-ai__input"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="dp-dash-ai__send"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        <p className="mt-3 text-center text-[10px] text-[#6a737c]">
          Powered by WOW — always here for your journey 💕
        </p>
      </div>
    </DashboardCard>
  );
}

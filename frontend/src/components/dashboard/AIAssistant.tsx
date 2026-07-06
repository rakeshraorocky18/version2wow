import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Send, Sparkles } from 'lucide-react';
import DashboardCard from './DashboardCard';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

const WELCOME_MESSAGE =
  "Hi! I'm your WOW AI Companion. I can help with match analysis, compatibility insights, conversation starters, relationship advice, wedding planning, budget planning, and vendor discovery.";

function getAssistantReply(input: string): string {
  const q = input.toLowerCase();

  if (q.includes('budget') || q.includes('cost') || q.includes('money')) {
    return 'A good wedding budget splits roughly 40% venue & catering, 15% photography, 10% decor, and the rest across attire, entertainment, and extras. Open Finance to track yours, or tell me your total budget for a quick breakdown.';
  }
  if (q.includes('match') || q.includes('compatibility') || q.includes('partner')) {
    return 'Prioritise shared family values, communication style, life goals, and emotional consistency. A strong match is not only high compatibility, but also high clarity and ease of conversation over time.';
  }
  if (q.includes('message') || q.includes('conversation') || q.includes('starter')) {
    return 'A strong first message should feel warm, specific, and easy to answer. Mention one genuine detail from their profile, then ask a simple open question that invites a comfortable reply.';
  }
  if (q.includes('venue') || q.includes('location')) {
    return 'Start with guest count and season, then shortlist 3–5 venues in your city. Visit on a weekday, ask about in-house catering, and check cancellation terms. Browse Vendors for venue options near you.';
  }
  if (q.includes('vendor') || q.includes('photographer') || q.includes('cater')) {
    return 'Book photographers and venues 9–12 months ahead. Compare portfolios, read reviews, and get itemised quotes. Your Recommended Vendors section shows options near your location.';
  }
  if (q.includes('decor') || q.includes('makeup') || q.includes('mehendi') || q.includes('music')) {
    return 'Lock creative vendors after your venue and guest count are clear. Ask for recent work samples, package inclusions, setup timing, and backup plans before confirming.';
  }
  if (q.includes('timeline') || q.includes('schedule') || q.includes('when')) {
    return '12 months out: venue & photographer. 6 months: catering, decor, invitations. 3 months: outfits & rehearsals. 1 month: final headcount & seating. Use Wedding Planner for a personalised checklist.';
  }
  if (q.includes('invitation') || q.includes('guest')) {
    return 'Send save-the-dates 6–8 months before, formal invites 2–3 months before. Track RSVPs in Events and keep a buffer of 5–10% extra meals for last-minute guests.';
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return 'Hello! How can I help today? You can ask about compatibility, first messages, relationship advice, budgets, venues, vendors, guests, or invitations.';
  }

  return 'I can help with match analysis, compatibility, conversation starters, relationship guidance, wedding timelines, budgets, venues, vendors, and invitations. Try asking something like "How should I open the conversation?" or "How should I split my budget?"';
}

const DEFAULT_STARTER =
  'Hi! I noticed how grounded and family-oriented your profile feels. I would love to know what kind of life you are hoping to build with the right partner.';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME_MESSAGE },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suggestedStarter = DEFAULT_STARTER;

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestedStarter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <DashboardCard className="wow-ai-advisor-card overflow-hidden" delay={8}>
      <div className="dp-dash-panel-body relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <div className="wow-ai-advisor-card__icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="dp-dash-section-title !mb-0 !text-base">WOW AI Companion</h2>
            <p className="text-[10px] text-[#6a737c]">
              Match analysis, conversation support, and planning guidance
            </p>
          </div>
        </div>

        {!isOpen ? (
          <>
            <div className="wow-ai-advisor-card__bubble">
              <p className="text-sm font-bold text-[#242729]">
                Need help with the next relationship or wedding step?
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#6a737c]">
                Get instant support for match analysis, compatibility insights, conversation
                starters, relationship advice, budgets, vendors, and timelines.
              </p>
            </div>
            <div className="wow-ai-advisor-card__recommendation">
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-[18px] border border-[rgba(183,110,121,0.1)] bg-white/80 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B76E79]">
                    What I Can Help With
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5A5360]">
                    Match analysis, conversation starters, relationship guidance, budgets,
                    timelines, vendors, and invitations.
                  </p>
                </div>
                <div className="rounded-[18px] border border-[rgba(183,110,121,0.1)] bg-white/80 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B76E79]">
                    Suggested Opening Message
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5A5360]">{suggestedStarter}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(true)}
                  className="wow-primary-button"
                >
                  Ask AI
                </motion.button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="wow-ghost-button inline-flex items-center"
                >
                  <Copy size={14} />
                  {copied ? 'Copied' : 'Copy Conversation Starter'}
                </button>
              </div>
            </div>
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
                placeholder="Ask about compatibility, messages, budgets, or timelines..."
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
          Powered by WOW for every step from match to marriage.
        </p>
      </div>
    </DashboardCard>
  );
}

import { useState } from 'react';
import { ChevronDown, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import DashboardCard from './DashboardCard';

const STORIES = [
  {
    id: 'rahul-sneha',
    couple: 'Rahul ❤️ Sneha',
    matched: 'March 2025',
    married: 'November 2025',
    image:
      'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=80',
    duration: '8 months',
    inspired: '4,500 People Inspired',
    summary: 'A thoughtful conversation about family traditions turned into a confident yes from both sides.',
    story:
      'Rahul and Sneha first connected over their shared love for close-knit family celebrations. After a few honest conversations and a calm in-person meeting with both families, they knew the connection felt easy, respectful, and full of long-term promise.',
    highlights: ['Shared family values', 'Fast mutual clarity', 'Wedding planned in 8 months'],
  },
  {
    id: 'arjun-meera',
    couple: 'Arjun ❤️ Meera',
    matched: 'June 2025',
    married: 'January 2026',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    duration: '7 months',
    inspired: '3,900 People Inspired',
    summary: 'Their match started with one warm message and quickly grew into daily calls and a strong partnership.',
    story:
      'Arjun noticed how grounded Meera sounded in her profile and sent a sincere first message. Their conversations moved naturally from hobbies to future plans, and within weeks both families were excited to help them take the next step together.',
    highlights: ['Strong first conversation', 'Aligned future goals', 'Family support from the start'],
  },
  {
    id: 'dev-isha',
    couple: 'Dev ❤️ Isha',
    matched: 'August 2025',
    married: 'April 2026',
    image:
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    duration: '9 months',
    inspired: '4,200 People Inspired',
    summary: 'What began as a simple introduction became a joyful partnership built on trust and patience.',
    story:
      'Dev and Isha took their time getting to know each other, focusing on communication, shared expectations, and emotional comfort. That steady start helped them build confidence in the relationship and enjoy a beautifully planned celebration later on.',
    highlights: ['Steady communication', 'Comfort before commitment', 'Smooth planning journey'],
  },
];

export default function SuccessStoriesCarousel() {
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);

  return (
    <DashboardCard className="wow-success-stories-card" delay={7} noHover>
      <div className="dp-dash-panel-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="wow-section-kicker">Success Stories</p>
            <h2 className="wow-section-title">Real journeys that turned into forever</h2>
            <p className="wow-section-subtitle">
              Stories that reinforce trust, intention, and the beauty of meaningful matchmaking.
            </p>
          </div>
        </div>

        <div className="wow-story-track">
          {STORIES.map((story, index) => (
            <motion.article
              key={story.id}
              className="wow-story-card"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="relative h-48 overflow-hidden rounded-[22px]">
                <img src={story.image} alt={story.couple} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2C2630]/65 via-transparent to-transparent" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#B76E79] backdrop-blur">
                  <Heart size={12} fill="currentColor" />
                  Match Story
                </div>
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <h3 className="font-display text-[1.55rem] leading-none">{story.couple}</h3>
                  <div className="mt-2.5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-white/70">Matched</p>
                      <p className="font-semibold">{story.matched}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Married</p>
                      <p className="font-semibold">{story.married}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#6B6670]">{story.summary}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#7D7079]">
                <span className="rounded-full bg-white/80 px-3 py-1">{story.duration} journey</span>
                <span className="rounded-full bg-[#FFF0F4] px-3 py-1 text-[#B76E79]">
                  {story.inspired}
                </span>
              </div>

              <button
                type="button"
                className="wow-story-card__button inline-flex items-center justify-center gap-2"
                onClick={() =>
                  setOpenStoryId((current) => (current === story.id ? null : story.id))
                }
              >
                {openStoryId === story.id ? 'Hide Story' : 'View Story'}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${
                    openStoryId === story.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {openStoryId === story.id ? (
                  <motion.div
                    key={`${story.id}-details`}
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-[20px] border border-[rgba(183,110,121,0.12)] bg-white/75 p-4">
                      <p className="text-sm leading-relaxed text-[#4E4852]">{story.story}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {story.highlights.map((highlight) => (
                          <span key={highlight} className="wow-soft-chip">
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

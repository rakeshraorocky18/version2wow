import { useState } from 'react';
import { Share2, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import type { InspirationTheme } from '../../types/plannerDashboard';

interface InspirationGalleryProps {
  themes: InspirationTheme[];
}

export default function InspirationGallery({ themes }: InspirationGalleryProps) {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  return (
    <section aria-label="Wedding inspiration">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Wedding Inspiration
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme, i) => (
          <motion.div
            key={theme.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard delay={0} className="group overflow-hidden p-0">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={theme.image}
                  alt={theme.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-romantic-rose/80 via-romantic-lavender/30 to-transparent opacity-80 transition group-hover:opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-lg font-semibold text-white">{theme.title}</h3>
                  <div className="mt-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() =>
                        setSaved((prev) => {
                          const next = new Set(prev);
                          if (next.has(theme.id)) next.delete(theme.id);
                          else next.add(theme.id);
                          return next;
                        })
                      }
                      className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-romantic-rose"
                    >
                      <Bookmark size={12} fill={saved.has(theme.id) ? 'currentColor' : 'none'} />
                      Save
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-romantic-rose"
                      onClick={() => navigator.share?.({ title: theme.title, url: window.location.href })}
                    >
                      <Share2 size={12} />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

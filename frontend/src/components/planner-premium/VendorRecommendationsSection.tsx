import { useState } from 'react';
import { Star, Bookmark, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import type { VendorRecommendations } from '../../types/plannerDashboard';

interface VendorRecommendationsSectionProps {
  vendors: VendorRecommendations;
}

const SECTION_LABELS: Record<string, string> = {
  photographer: 'Recommended Photographers',
  decorator: 'Recommended Decorators',
  makeup: 'Recommended Makeup Artists',
  venue: 'Recommended Venues',
  caterer: 'Recommended Caterers',
};

export default function VendorRecommendationsSection({ vendors }: VendorRecommendationsSectionProps) {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section aria-label="Vendor recommendations">
      <h2 className="mb-4 font-display text-xl font-semibold text-gray-800 dark:text-romantic-cream">
        Vendor Recommendations
      </h2>
      <div className="space-y-8">
        {Object.entries(vendors).map(([key, items]) => (
          <div key={key}>
            <h3 className="mb-3 text-sm font-semibold text-romantic-rose dark:text-romantic-blush">
              {SECTION_LABELS[key] || key}
            </h3>
            {items.length === 0 ? (
              <GlassCard hover={false}>
                <p className="text-sm text-gray-500">No vendors found. Try updating your location in profile.</p>
              </GlassCard>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((vendor, i) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <GlassCard delay={0} className="overflow-hidden p-0">
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={vendor.image}
                          alt={vendor.name}
                          className="h-full w-full object-cover transition duration-500 hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-white">
                          <Star size={14} className="fill-romantic-champagne text-romantic-champagne" />
                          <span className="text-sm font-semibold">{vendor.rating}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-800 dark:text-romantic-cream">{vendor.name}</h4>
                        {vendor.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} />
                            {vendor.location}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-medium text-romantic-rose">{vendor.priceRange}</p>
                        <p className="text-xs text-emerald-600">{vendor.availability}</p>
                        <div className="mt-3 flex gap-2">
                          <Link
                            to={`/app/vendors`}
                            className="wow-btn-romantic flex-1 py-2 text-center text-xs"
                          >
                            Book Now
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleSave(vendor.id)}
                            className={`rounded-full border p-2 transition ${
                              saved.has(vendor.id)
                                ? 'border-romantic-rose bg-romantic-blush/30 text-romantic-rose'
                                : 'border-gray-200 text-gray-400 hover:border-romantic-blush'
                            }`}
                            aria-label={saved.has(vendor.id) ? 'Unsave vendor' : 'Save vendor'}
                          >
                            <Bookmark size={16} fill={saved.has(vendor.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';
import DashboardCard from './DashboardCard';

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  price: string;
  image: string;
  location?: string;
}

interface VendorCarouselProps {
  vendors: VendorItem[];
  locationLabel?: string;
}

export default function VendorCarousel({ vendors, locationLabel }: VendorCarouselProps) {
  const subtitle = locationLabel
    ? `Top picks near ${locationLabel}`
    : 'Add your city in profile for nearby recommendations';
  return (
    <DashboardCard delay={7} noHover>
      <div className="dp-dash-panel-body">
        <div className="dp-dash-section-header">
          <div>
            <h2 className="dp-dash-section-title">Recommended Vendors</h2>
            <p className="dp-dash-section-subtitle !mb-0">{subtitle}</p>
          </div>
          <Link to="/app/vendors" className="dp-dash-link">
            Browse all →
          </Link>
        </div>

        <div className="dp-dash-vendor-scroll">
          {vendors.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              className="dp-dash-vendor-card"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  className="dp-dash-vendor-card__img h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#f4196d]">
                  {vendor.category}
                </span>
              </div>
              <div className="dp-dash-vendor-card__body">
                <h3 className="truncate text-sm font-extrabold text-[#242729]">{vendor.name}</h3>
                {vendor.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#6a737c]">
                    <MapPin size={10} /> {vendor.location}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#f4c95d]">
                    <Star size={12} fill="currentColor" /> {vendor.rating}
                  </span>
                  <span className="text-[11px] font-medium text-[#6a737c]">{vendor.price}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to="/app/vendors"
                    className="flex flex-1 items-center justify-center rounded-xl border border-[rgba(244,25,109,0.2)] bg-white py-2 text-[11px] font-bold text-[#f4196d] transition-all hover:bg-[#ffeef1]"
                  >
                    View
                  </Link>
                  <Link
                    to="/app/vendors"
                    className="dp-connect-btn flex-1 !py-2 !text-[11px]"
                  >
                    Book
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

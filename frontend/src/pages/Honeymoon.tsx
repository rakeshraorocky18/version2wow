import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Palmtree, Search, Star, MapPin, Calendar, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface Package {
  id: string;
  name: string;
  destination: string;
  source?: 'external';
  durationNights: number;
  couplePrice: number;
  rating: number;
  isFeatured: boolean;
  images: string[];
  externalBookingUrl?: string;
}

interface PackageSearchResponse {
  packages: Package[];
  total: number;
  page: number;
  totalPages: number;
  localCount?: number;
  externalCount?: number;
}

export default function Honeymoon() {
  const [type, setType] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [searchDest, setSearchDest] = useState('');

  const { data, isLoading } = useQuery<PackageSearchResponse>({
    queryKey: ['honeymoon-packages', searchDest, type, minDuration],
    queryFn: async () => {
      const { data } = await api.get<PackageSearchResponse>('/honeymoon/packages', {
        params: {
          destination: searchDest || undefined,
          type: type || undefined,
          minDuration: minDuration || undefined,
          includeExternal: true,
          limit: 24,
        },
      });
      return data;
    },
  });

  const packages = data?.packages || [];

  const bookPackage = useMutation({
    mutationFn: async (pkg: Package) => {
      if (pkg.source === 'external') {
        if (pkg.externalBookingUrl) {
          window.open(pkg.externalBookingUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        throw new Error('No booking link available for this package');
      }

      const travelDate = new Date();
      travelDate.setDate(travelDate.getDate() + 30);
      const returnDate = new Date(travelDate);
      returnDate.setDate(returnDate.getDate() + Math.max(3, pkg.durationNights));

      await api.post('/honeymoon/book', {
        packageId: pkg.id,
        travelDate: travelDate.toISOString().slice(0, 10),
        returnDate: returnDate.toISOString().slice(0, 10),
        travellers: 2,
      });
    },
    onSuccess: (_, pkg) => {
      if (pkg.source === 'external') {
        toast.success('Opened provider page in a new tab');
        return;
      }
      toast.success('Trip request created');
    },
    onError: () => {
      toast.error('Unable to process booking right now');
    },
  });

  const popularDestinations = ['Maldives', 'Bali', 'Switzerland', 'Mauritius'];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Honeymoon Packages</h1>
        <p className="text-gray-500 mt-1">Discover your dream honeymoon destinations</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={searchDest}
              onChange={(e) => setSearchDest(e.target.value)}
              placeholder="Search destination..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
          <select
            value={minDuration}
            onChange={(e) => setMinDuration(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Any Duration</option>
            <option value="3">3 Nights</option>
            <option value="5">5 Nights</option>
            <option value="7">7 Nights</option>
            <option value="10">10+ Nights</option>
          </select>
        </div>
      </div>

      {/* Popular Destinations (placeholder) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Popular Destinations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {popularDestinations.map((dest) => (
            <div
              key={dest}
              onClick={() => setSearchDest(dest)}
              className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              <MapPin size={20} />
              <p className="mt-2 font-medium">{dest}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Loading honeymoon packages...
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Palmtree className="mx-auto text-primary-400" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Browse Packages</h3>
          <p className="mt-2 text-gray-500">Try searching by destination to load packages from local and external providers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                <Palmtree className="text-gray-400" size={32} />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                  {pkg.isFeatured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Featured</span>}
                </div>
                {pkg.source === 'external' && (
                  <p className="mt-1 text-xs text-blue-600">Live source: OpenTripMap</p>
                )}
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><MapPin size={14} /> {pkg.destination}</div>
                  <div className="flex items-center gap-2"><Calendar size={14} /> {pkg.durationNights} Nights</div>
                  <div className="flex items-center gap-2"><Star size={14} className="text-yellow-400" /> {pkg.rating}</div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="flex items-center text-lg font-bold text-primary-600"><IndianRupee size={16} />{pkg.couplePrice.toLocaleString()}</span>
                  <button
                    onClick={() => bookPackage.mutate(pkg)}
                    className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
                  >
                    {pkg.source === 'external' ? 'View Trip' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

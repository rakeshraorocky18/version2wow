import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, IndianRupee, Search } from 'lucide-react';
import api from '../lib/api';
import { useNavigate } from "react-router-dom";

const categories = [
  'All', 'venue', 'catering', 'photography', 'videography',
  'decor', 'makeup', 'entertainment', 'invitation',
];

interface VendorCard {
  _id: string;
  businessName: string;
  category: string;
  description?: string;
  location?: {
    city?: string;
    state?: string;
    address?: string;
  };
  pricing?: {
    startingPrice?: number;
  };
  phone?: string;
  email?: string;
  services?: string[];
  rating?: {
    average: number;
    count: number;
  };
  source?: 'local' | 'external';
  externalUrl?: string;
}

interface VendorsSearchResponse {
  vendors: VendorCard[];
  total: number;
  page: number;
  totalPages: number;
}

interface CitySuggestion {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
}

interface CitySuggestionResponse {
  results?: CitySuggestion[];
}



export default function Vendors() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [city, setCity] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorCard | null>(null);
  const [cityQuery, setCityQuery] = useState('');

  const { data, isLoading } = useQuery<VendorsSearchResponse>({
    queryKey: ['vendors', category, searchTerm, city],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('includeExternal', 'true');
      if (category) params.set('category', category);
      if (searchTerm) params.set('search', searchTerm);
      if (city) params.set('city', city);
      const { data } = await api.get(`/vendors/search?${params.toString()}`);
      return data;
    },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCity(cityQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [cityQuery]);

  const { data: citySuggestionsData } = useQuery<CitySuggestionResponse>({
    queryKey: ['city-suggestions', city],
    enabled: showCitySuggestions && city.trim().length >= 2,
    queryFn: async () => {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=6&countryCode=IN&language=en&format=json`,
      );
      if (!res.ok) return { results: [] };
      return (await res.json()) as CitySuggestionResponse;
    },
    staleTime: 5 * 60 * 1000,
  });

  const citySuggestions = useMemo(() => citySuggestionsData?.results || [], [citySuggestionsData?.results]);

  const selectCitySuggestion = (name: string) => {
    setCity(name);
    setCityQuery(name);
    setShowCitySuggestions(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold text-gray-900">Vendor Marketplace</h1>
      </div>


      {/* Search & Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9"
              placeholder="Search vendors..."
            />
          </div>
          <div className="relative md:w-64">
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowCitySuggestions(false), 150);
              }}
              className="input-field"
              placeholder="City"
            />
            {showCitySuggestions && city.trim().length >= 2 && citySuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                {citySuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onMouseDown={() => selectCitySuggestion(suggestion.name)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-800">{suggestion.name}</div>
                    <div className="text-xs text-gray-500">
                      {[suggestion.admin1, suggestion.country].filter(Boolean).join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                (cat === 'All' && !category) || category === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading vendors...</div>
      ) : (data?.vendors ?? []).length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.vendors ?? []).map((vendor) => {
            const averageRating = vendor.rating?.average ?? 0;
            return (
              <div key={vendor._id} className="card hover:shadow-md transition-shadow">
              <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-3xl">🏪</span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vendor.businessName}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                    {vendor.category}
                  </span>
                  <span className={`inline-block mt-1 ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${vendor.source === 'external' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {vendor.source === 'external' ? 'OpenStreetMap' : 'Local'}
                  </span>
                </div>
                {averageRating > 0 && (
                  <div className="flex items-center gap-1 text-gold-500">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-medium">{averageRating}</span>
                  </div>
                )}
              </div>
              {vendor.location?.city && (
                <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {vendor.location.city}
                </p>
              )}
              {vendor.pricing?.startingPrice && (
                <p className="mt-1 text-sm text-gray-700 flex items-center gap-1">
                  <IndianRupee size={14} /> Starting ₹{vendor.pricing.startingPrice.toLocaleString()}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedVendor(vendor)}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  View Details
                </button>
                {vendor.externalUrl && (
                  <a
                    href={vendor.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    View on Map
                  </a>
                )}
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Store size={48} className="text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-500">No vendors found. Try a different search.</p>
        </div>
      )}

      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedVendor.businessName}</h3>
                <p className="text-sm text-gray-500 capitalize">{selectedVendor.category}</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 px-5 py-4 text-sm text-gray-700">
              {selectedVendor.description && (
                <p>{selectedVendor.description}</p>
              )}

              {(selectedVendor.location?.city || selectedVendor.location?.state || selectedVendor.location?.address) && (
                <p>
                  <span className="font-medium text-gray-900">Location: </span>
                  {[selectedVendor.location?.city, selectedVendor.location?.state, selectedVendor.location?.address]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}

              {selectedVendor.pricing?.startingPrice && (
                <p>
                  <span className="font-medium text-gray-900">Starting Price: </span>
                  ₹{selectedVendor.pricing.startingPrice.toLocaleString()}
                </p>
              )}

              {selectedVendor.rating?.average ? (
                <p>
                  <span className="font-medium text-gray-900">Rating: </span>
                  {selectedVendor.rating.average} ({selectedVendor.rating.count || 0} reviews)
                </p>
              ) : null}

              {selectedVendor.phone && (
                <p>
                  <span className="font-medium text-gray-900">Phone: </span>
                  {selectedVendor.phone}
                </p>
              )}

              {selectedVendor.email && (
                <p>
                  <span className="font-medium text-gray-900">Email: </span>
                  {selectedVendor.email}
                </p>
              )}

              {selectedVendor.services && selectedVendor.services.length > 0 && (
                <div>
                  <p className="font-medium text-gray-900">Services</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedVendor.services.map((service) => (
                      <span key={service} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">

              <button
                className="btn-primary"
                onClick={() => {
                  navigate(`/app/book/${selectedVendor._id}`);
                  // Navigate to booking page here
                }}
              >
                Book Now
              </button>

              {selectedVendor.externalUrl && (
                <a
                  href={selectedVendor.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-sm"
                >
                  View on Map
                </a>
              )}

              <button
                onClick={() => setSelectedVendor(null)}
                className="btn-secondary"
              >
                Close
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Store(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </svg>
  );
}

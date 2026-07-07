import { Link } from 'react-router-dom';
import { Heart, Users, Store, Calendar, Plane, Camera } from 'lucide-react';

const features = [
  { icon: Heart, title: 'Matchmaking', description: 'AI-powered compatibility matching with advanced filters' },
  { icon: Users, title: 'Family Dashboard', description: 'Collaborative planning with your entire family' },
  { icon: Store, title: 'Vendor Marketplace', description: 'Discover and book the best wedding vendors' },
  { icon: Calendar, title: 'Wedding Planner', description: 'Auto-generated timeline and task management' },
  { icon: Plane, title: 'Honeymoon Travel', description: 'Plan the perfect post-wedding getaway' },
  { icon: Camera, title: 'Memories', description: 'Store and share your precious wedding moments' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <nav className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            <span className="text-3xl font-display font-bold">WOW</span>
            <div className="flex gap-4">
              <Link to="/login" className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium bg-white text-primary-700 rounded-lg hover:bg-gray-100 transition">
                Get Started
              </Link>
            </div>
          </nav>

          <div className="text-center mt-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight">
              World of Weddings
            </h1>
            <p className="mt-6 text-xl text-primary-100 max-w-2xl mx-auto">
              Your complete wedding ecosystem. From finding your partner to preserving memories — all in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-gold text-lg px-8 py-4">
                Start Your Journey
              </Link>
              <a href="#features" className="btn-secondary border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                Explore Features
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900">
              Everything for Your Wedding Journey
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              One platform, infinite possibilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-primary-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-display font-bold text-gray-900">
            Ready to Begin Your Forever?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of couples who found their perfect match and planned their dream wedding with WOW.
          </p>
          <Link to="/register" className="btn-primary inline-block mt-8 text-lg px-8 py-4">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-2xl font-display font-bold text-white">WOW</span>
          <p className="mt-2">World of Weddings — Your wedding, simplified.</p>
          <p className="mt-4 text-sm">&copy; 2026 WOW. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

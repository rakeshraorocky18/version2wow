import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Heart,
  MessageCircle,
  Store,
  Calendar,
  User,
  Home,
  LogOut,
  Menu,
  X,
  PartyPopper,
  Palmtree,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/app', icon: Home, label: 'Dashboard' },
  { path: '/app/matches', icon: Heart, label: 'Matches' },
  { path: '/app/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/app/vendors', icon: Store, label: 'Vendors' },
  { path: '/app/planner', icon: Calendar, label: 'Planner' },
  { path: '/app/events', icon: PartyPopper, label: 'Events' },
  { path: '/app/honeymoon', icon: Palmtree, label: 'Honeymoon' },
  { path: '/app/finance', icon: Wallet, label: 'Finance' },
  { path: '/app/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9FC] to-[#F7F4FB]">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 border-b border-[#EEDCE6] bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/app" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#EFB5CA] to-[#DCA4EA] text-white shadow-sm">
                <Heart size={18} fill="currentColor" />
              </span>
              <div>
                <span className="text-2xl font-display font-bold text-[#8D4C6A]">WOW</span>
                <span className="hidden sm:block text-xs text-[#9E7A8C] -mt-1">World of Weddings</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/app'
                    ? location.pathname === '/app'
                    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#F8E8F0] text-[#9D5D7C]'
                        : 'text-[#74606D] hover:bg-[#F8F1F6]'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-[#7E6875]">{user?.email}</span>
              <button
                onClick={logout}
                className="text-[#8D7380] hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-[#EAD7E1] pb-4 px-4 bg-white/90">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-[#F8E8F0] text-[#9D5D7C]'
                      : 'text-[#74606D]'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import AppFooter from './AppFooter';
import { FooterPaginationProvider, useFooterPagination } from '../context/FooterPaginationContext';
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
import { useEffect, useRef, useState } from 'react';

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

function FooterPaginationReset() {
  const location = useLocation();
  const { setTotalPages } = useFooterPagination();
  useEffect(() => {
    setTotalPages(1);
  }, [location.pathname, setTotalPages]);
  return null;
}

export default function Layout() {
  const location = useLocation();
  const isMatchesPage = location.pathname.startsWith('/app/matches');
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY < 24 || mobileMenuOpen) {
        setIsNavVisible(true);
      } else if (delta > 8) {
        setIsNavVisible(false);
      } else if (delta < -8) {
        setIsNavVisible(true);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  return (
    <div className={`min-h-screen ${isMatchesPage ? 'bg-white' : 'bg-gradient-to-b from-[#FFF8FC] via-[#FAF6FF] to-[#F6F3FB]'}`}>
      {!isMatchesPage && (
        <>
          <div className="pointer-events-none fixed left-[-120px] top-16 h-72 w-72 rounded-full bg-[#F5DCE8]/70 blur-3xl" />
          <div className="pointer-events-none fixed bottom-6 right-[-120px] h-80 w-80 rounded-full bg-[#EAE5FF]/70 blur-3xl" />
        </>
      )}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Navbar integrated into main section */}
        <header
          onMouseEnter={() => {
            setIsNavHovered(true);
            setIsNavVisible(true);
          }}
          onMouseLeave={() => setIsNavHovered(false)}
          className={`sticky top-3 z-50 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
            isNavVisible || isNavHovered ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'
          } ${
            location.pathname === '/app'
              ? 'border-[#EEDCE6] bg-white/78 shadow-[0_12px_35px_rgba(174,94,129,0.16)]'
              : 'border-[#EAD7E1] bg-white/92 shadow-[0_10px_28px_rgba(160,100,134,0.1)]'
          } ${isNavHovered ? 'ring-2 ring-[#E9C7D8] shadow-[0_16px_36px_rgba(170,94,129,0.22)]' : ''}`}
        >
          <div className="flex justify-between items-center h-16 px-4 sm:px-5 lg:px-6">
            <Link to="/app" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ED88B2] via-[#D879BA] to-[#B984E5] text-white shadow-sm">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#F9E8F1] to-[#F1E9FB] text-[#8F4F6D] shadow-sm'
                        : 'text-[#74606D] hover:bg-[#F8F1F6] hover:text-[#8F4F6D] hover:shadow-sm'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block rounded-full border border-[#EBD8E3] bg-white/70 px-3 py-1 text-xs text-[#7E6875]">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-[#ECD8E3] bg-white/70 p-2 text-[#8D7380] transition-colors hover:bg-[#FDF2F6] hover:text-red-500"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-[#EAD7E1] pb-4 px-4 bg-white/90 rounded-b-2xl">
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
                        : 'text-[#74606D] hover:bg-[#F8F1F6]'
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
        <FooterPaginationProvider>
          <FooterPaginationReset />
          <Outlet />
          <AppFooter />
        </FooterPaginationProvider>
      </main>
    </div>
  );
}

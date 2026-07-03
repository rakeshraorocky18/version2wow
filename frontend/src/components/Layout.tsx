import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import AppFooter from './AppFooter';
import { FooterPaginationProvider, useFooterPagination } from '../context/FooterPaginationContext';
import { useReceivedInterests, useAcceptedInterests } from '../hooks/useMatchmaking';
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
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { path: '/app', icon: Home, label: 'Dashboard' },
  { path: '/app/matches', icon: Heart, label: 'Matches', badge: 'matches' },
  { path: '/app/chat', icon: MessageCircle, label: 'Chat', badge: 'chat' },
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

  // Notification counts from existing hooks
  const { data: receivedInterests = [] } = useReceivedInterests();
  const { data: acceptedInterests = [] } = useAcceptedInterests();
  const pendingMatchCount = receivedInterests.length;
  const acceptedCount = acceptedInterests.length;

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

  // Helper: get badge count for nav item
  function getBadgeCount(badge?: string): number {
    if (badge === 'matches') return pendingMatchCount;
    if (badge === 'chat') return acceptedCount;
    return 0;
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${isMatchesPage ? 'bg-white' : 'bg-[#FAF8FB]'}`}
    >
      {/* Ambient background blobs */}
      {!isMatchesPage && (
        <>
          <div className="pointer-events-none fixed left-[-120px] top-16 h-72 w-72 rounded-full bg-[#F5DCE8]/60 blur-3xl" />
          <div className="pointer-events-none fixed bottom-6 right-[-120px] h-80 w-80 rounded-full bg-[#EAE5FF]/60 blur-3xl" />
        </>
      )}

      <main className="flex flex-1 flex-col w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Navbar ─────────────────────────────────────── */}
        <header
          onMouseEnter={() => {
            setIsNavHovered(true);
            setIsNavVisible(true);
          }}
          onMouseLeave={() => setIsNavHovered(false)}
          className={`
            sticky top-3 z-50 rounded-2xl border backdrop-blur-xl
            transition-all duration-300
            ${isNavVisible || isNavHovered
              ? 'translate-y-0 opacity-100'
              : '-translate-y-24 opacity-0 pointer-events-none'
            }
            ${location.pathname === '/app'
              ? 'border-[#EEDCE6] bg-white/80 shadow-[0_12px_40px_rgba(174,94,129,0.18)]'
              : 'border-[#EAD7E1] bg-white/90 shadow-[0_10px_30px_rgba(160,100,134,0.12)]'
            }
            ${isNavHovered
              ? 'ring-1 ring-[#E9C7D8] shadow-[0_16px_44px_rgba(170,94,129,0.22)]'
              : ''
            }
          `}
        >
          <div className="flex items-center justify-between h-16 px-4 sm:px-5 lg:px-6">

            {/* Logo */}
            <Link to="/app" className="flex items-center gap-3 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ED88B2] via-[#D879BA] to-[#B984E5] text-white shadow-[0_4px_12px_rgba(183,110,121,0.35)] transition-transform duration-300 group-hover:scale-105">
                <Heart size={18} fill="currentColor" />
              </span>
              <div>
                <span className="text-xl font-display font-bold bg-gradient-to-r from-[#B76E79] to-[#8860BE] bg-clip-text text-transparent">
                  WOW
                </span>
                <p className="hidden sm:block text-[10px] font-medium text-[#9E7A8C] -mt-0.5 leading-none">
                  World of Weddings
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/app'
                    ? location.pathname === '/app'
                    : location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`);
                const badge = getBadgeCount(item.badge);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-[#F9E8F1] to-[#F1E9FB] text-[#B76E79] shadow-[0_2px_10px_rgba(183,110,121,0.15)]'
                        : 'text-[#74606D] hover:bg-[#FBF0F5] hover:text-[#B76E79]'
                      }
                    `}
                  >
                    <span className={`relative transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                      <Icon size={15} />
                      {badge > 0 && (
                        <span className="wow-nav-badge">{badge > 9 ? '9+' : badge}</span>
                      )}
                    </span>
                    <span>{item.label}</span>
                    {/* Active underline accent */}
                    {isActive && (
                      <span className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#B76E79] to-[#8860BE]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side: user info + logout */}
            <div className="flex items-center gap-2">
              {/* User pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[#EBD8E3] bg-white/70 px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#F9E5EC] to-[#F0EAFF] text-[#B76E79]">
                  <User size={12} />
                </div>
                <span className="text-xs font-medium text-[#5C3550] max-w-[120px] truncate">
                  {user?.email?.split('@')[0] ?? 'User'}
                </span>
                <ChevronDown size={12} className="text-[#A08090]" />
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-xl border border-[#ECD8E3] bg-white/70 px-3 py-2 text-xs font-medium text-[#8D7380] transition-all duration-200 hover:bg-[#FDF2F6] hover:text-red-500 hover:border-red-200"
                title="Logout"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile hamburger */}
              <button
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-[#EBD8E3] bg-white/70 text-[#8D7380] transition-colors hover:bg-[#FDF2F6]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile nav drawer */}
          {mobileMenuOpen && (
            <nav
              className="lg:hidden border-t border-[#EAD7E1] pb-4 pt-2 px-3 bg-white/95 rounded-b-2xl"
              aria-label="Mobile navigation"
            >
              <div className="grid grid-cols-3 gap-2 py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/app'
                      ? location.pathname === '/app'
                      : location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`);
                  const badge = getBadgeCount(item.badge);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold text-center
                        transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-br from-[#F9E8F1] to-[#F1E9FB] text-[#B76E79]'
                          : 'text-[#74606D] hover:bg-[#FBF0F5] hover:text-[#B76E79]'
                        }
                      `}
                    >
                      <span className="relative">
                        <Icon size={18} />
                        {badge > 0 && (
                          <span className="wow-nav-badge">{badge > 9 ? '9+' : badge}</span>
                        )}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile user row */}
              <div className="mt-2 flex items-center justify-between rounded-xl border border-[#EBD8E3] bg-[#FFFBFC] px-4 py-2.5">
                <span className="text-xs font-medium text-[#5C3550] truncate max-w-[200px]">
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#8D7380] transition-colors hover:text-red-500"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </nav>
          )}
        </header>

        {/* Main content — flex-1 pushes footer to viewport bottom on short pages */}
        <div className="mt-5 flex flex-1 flex-col">
          <FooterPaginationProvider>
            <FooterPaginationReset />
            <div className="flex-1">
              <Outlet />
            </div>
            <AppFooter />
          </FooterPaginationProvider>
        </div>
      </main>
    </div>
  );
}

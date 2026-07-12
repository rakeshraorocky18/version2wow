import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import AppFooter from './AppFooter';
import { FooterPaginationProvider, useFooterPagination } from '../context/FooterPaginationContext';
import { useReceivedInterests, useShortlist } from '../hooks/useMatchmaking';
import { useChatSocket } from '../hooks/useChatSocket';
import api from '../lib/api';
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
  { path: '/app/events', icon: PartyPopper, label: 'Events', badge: 'events' },
  { path: '/app/honeymoon', icon: Palmtree, label: 'Honeymoon' },
  { path: '/app/finance', icon: Wallet, label: 'Finance' },
  { path: '/app/profile', icon: User, label: 'Profile', badge: 'saved' },
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
  const queryClient = useQueryClient();
  const isMatchesPage = location.pathname.startsWith('/app/matches');
  const isDashboardPage = location.pathname === '/app';
  const isChatPage = location.pathname.startsWith('/app/chat');
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const lastScrollYRef = useRef(0);

  // Notification counts from existing hooks
  const { data: receivedInterests = [] } = useReceivedInterests();
  const pendingMatchCount = receivedInterests.filter((m) => m.status === 'pending').length;
  const { data: shortlistData } = useShortlist();
  const shortlistCount = shortlistData?.profiles?.length ?? 0;
  const { data: unreadChat } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: async () => {
      const { data } = await api.get<{ unreadCount: number }>('/chat/unread');
      return data.unreadCount ?? 0;
    },
    staleTime: 0,
    refetchInterval: isChatPage ? 5_000 : 10_000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
  const chatUnreadCount = unreadChat ?? 0;

  // Live-update chat badge when a new message arrives
  useChatSocket({
    onNewMessage: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    },
  });

  // When entering chat page, refresh unread immediately
  useEffect(() => {
    if (!isChatPage) return;
    queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
  }, [isChatPage, queryClient]);

  const { data: events = [] } = useQuery({
    queryKey: ['layout-events-count'],
    queryFn: async () => {
      const { data } = await api.get('/events');
      return data as Array<{ id: string }>;
    },
  });
  const eventCount = events.length;

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
    if (badge === 'chat') return chatUnreadCount;
    if (badge === 'events') return eventCount;
    if (badge === 'saved') return shortlistCount;
    return 0;
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isMatchesPage ? 'bg-transparent' : isDashboardPage ? 'bg-[#FAF7F2]' : 'bg-[#FFF8FB]'
      }`}
    >
      {/* Ambient background blobs stay off pages with custom full-bleed backgrounds. */}
      {!isMatchesPage && !isDashboardPage && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#FCEEEF]/70 blur-3xl" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[#F5EBDD]/65 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#EAF6FF]/45 blur-3xl" />
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Navbar ─────────────────────────────────────── */}
        <header
          onMouseEnter={() => {
            setIsNavHovered(true);
            setIsNavVisible(true);
          }}
          onMouseLeave={() => setIsNavHovered(false)}
          className={`
            sticky top-3 z-50 rounded-[22px] border backdrop-blur-xl
            transition-all duration-500 ease-out
            ${isNavVisible || isNavHovered
              ? 'translate-y-0 opacity-100'
              : '-translate-y-24 opacity-0 pointer-events-none'
            }
            ${location.pathname === '/app'
              ? 'border-[rgba(183,110,121,0.12)] bg-white/75 shadow-[0_12px_40px_rgba(183,110,121,0.12)]'
              : 'border-[rgba(183,110,121,0.12)] bg-white/85 shadow-[0_10px_30px_rgba(183,110,121,0.08)]'
            }
            ${isNavHovered
              ? 'ring-1 ring-[#E7C6D0]/50 shadow-[0_16px_44px_rgba(183,110,121,0.16)]'
              : ''
            }
          `}
        >
          <div className="flex items-center justify-between h-16 px-4 sm:px-5 lg:px-6">

            {/* Logo */}
            <Link to="/app" className="flex items-center gap-3 group">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#B76E79] to-[#D69BA6] text-white shadow-[0_4px_14px_rgba(183,110,121,0.35)]"
              >
                <Heart size={18} fill="currentColor" />
              </motion.span>
              <div>
                <span className="text-xl font-display font-bold bg-gradient-to-r from-[#B76E79] to-[#D69BA6] bg-clip-text text-transparent">
                  WOW
                </span>
                <p className="hidden sm:block text-[10px] font-medium text-[#6B6670] -mt-0.5 leading-none">
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
                    className="relative"
                  >
                    <motion.span
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className={`
                        relative flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-medium
                        transition-colors duration-300
                        ${isActive
                          ? 'bg-gradient-to-r from-[#FFF0F4] to-[#FFF5F8] text-[#B76E79] shadow-[0_2px_12px_rgba(183,110,121,0.12)]'
                          : 'text-[#6B6670] hover:bg-[#FFF5F8] hover:text-[#B76E79]'
                        }
                      `}
                    >
                      <span className="relative">
                        <Icon size={15} />
                        {badge > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="wow-nav-badge"
                          >
                            {badge > 9 ? '9+' : badge}
                          </motion.span>
                        )}
                      </span>
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active-indicator"
                          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-[#B76E79] to-[#D69BA6]"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </motion.span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side: user info + logout */}
            <div className="flex items-center gap-2">
              {/* User pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-[#E7C6D0]/50 bg-white/60 px-3 py-1.5 backdrop-blur-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF0F4] to-[#FFF5F8] text-[#B76E79]">
                  <User size={13} />
                </div>
                <span className="text-xs font-medium text-[#2C2630] max-w-[120px] truncate">
                  {user?.email?.split('@')[0] ?? 'User'}
                </span>
                <ChevronDown size={12} className="text-[#A08090]" />
              </div>

              {/* Logout button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={logout}
                className="flex items-center gap-1.5 rounded-2xl border border-[#E7C6D0]/50 bg-white/60 px-3.5 py-2 text-xs font-medium text-[#8D7380] backdrop-blur-sm transition-colors duration-300 hover:border-red-200 hover:bg-[#FDF2F6] hover:text-red-500"
                title="Logout"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>

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
                          ? 'bg-gradient-to-br from-[#F9E8F1] to-[#FFF5F8] text-[#B76E79]'
                          : 'text-[#6B6670] hover:bg-[#FBF0F5] hover:text-[#B76E79]'
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
            <div className={`flex-1 ${isChatPage ? 'flex min-h-0 flex-col' : ''}`}>
              <Outlet />
            </div>
            <AppFooter />
          </FooterPaginationProvider>
        </div>
      </main>
    </div>
  );
}

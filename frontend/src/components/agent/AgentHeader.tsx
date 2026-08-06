import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import WowLogo from '../brand/WowLogo';
import { resolveCustomerImageUrl } from '../../lib/agent/customerAvatar';

interface AgentHeaderProps {
  onToggleMobileNav?: () => void;
  mobileOpen?: boolean;
  notificationOpen: boolean;
  setNotificationOpen: (open: boolean) => void;
  unreadCount: number;
}

const navItems = [
  { title: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
  { title: 'Customers', path: '/agent/customers', icon: Users },
  { title: 'Add Customer', path: '/agent/customers/new', icon: UserPlus },
  { title: 'Worksheet', path: '/agent/worksheet', icon: ClipboardList },
  { title: 'Activity Log', path: '/agent/activity', icon: History },
  { title: 'Settings', path: '/agent/settings', icon: Settings },
];

export default function AgentHeader({
  onToggleMobileNav,
  mobileOpen,
  notificationOpen,
  setNotificationOpen,
  unreadCount,
}: AgentHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAgentAuthStore((s) => s.user);
  const logout = useAgentAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/agent/dashboard') {
      return location.pathname === '/agent/dashboard' || location.pathname === '/agent';
    }
    if (path === '/agent/customers') {
      return location.pathname === '/agent/customers';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/agent/login');
  };

  const initials = (user?.firstName?.[0] || user?.email?.[0] || 'A').toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-50 lg:hidden"
            onClick={onToggleMobileNav}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="shrink-0">
            <WowLogo variant="compact" to="/agent/dashboard" />
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[#FFF0F4] text-[#E91E63]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications button */}
          <button
            type="button"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 rounded-full hover:bg-pink-50/60 text-gray-500 hover:text-[#E91E63] transition-colors"
            aria-label="Notifications"
            aria-expanded={notificationOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E91E63] px-1 text-[10px] font-bold leading-none text-white shadow-xs animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Round Logo / Avatar button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-sm ring-2 ring-pink-200/80 hover:ring-[#E91E63] hover:shadow-md transition-all active:scale-95 overflow-hidden"
              aria-label="Account options"
              aria-expanded={menuOpen}
              title="Account options"
            >
              {user?.profileImageUrl ? (
                <img
                  src={resolveCustomerImageUrl(user.profileImageUrl)}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E91E63] via-[#E91E63] to-[#C2185B] text-white flex items-center justify-center text-sm font-extrabold">
                  {initials}
                </div>
              )}
            </button>

            {/* Dropdown Menu featuring Logout */}
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-pink-100/80 p-2 z-30 overflow-hidden"
                style={{ animation: 'menuFade 0.15s ease-out' }}
              >
                <style>{`@keyframes menuFade{from{opacity:0;transform:scale(0.95) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
                
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-gray-800 truncate">{user?.name || user?.firstName || 'Agent'}</p>
                  <p className="text-[11px] font-medium text-gray-400 truncate">{user?.email || 'Agent Account'}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

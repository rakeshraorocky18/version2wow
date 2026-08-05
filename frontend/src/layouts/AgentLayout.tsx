import { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import NotificationPanel from '../components/agent/NotificationPanel';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  History,
  Settings,
  LogOut,
} from 'lucide-react';
import AgentHeader from '../components/agent/AgentHeader';
import { useAgentAuthStore } from '../store/agent/agentAuthStore';
import { agentService } from '../services/agent/agentService';

const mobileItems = [
  { title: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
  { title: 'Customers', path: '/agent/customers', icon: Users },
  { title: 'Add Customer', path: '/agent/customers/new', icon: UserPlus },
  { title: 'Worksheet', path: '/agent/worksheet', icon: ClipboardList },
  { title: 'Activity Log', path: '/agent/activity', icon: History },
  { title: 'Settings', path: '/agent/settings', icon: Settings },
];

function isMobileItemActive(pathname: string, path: string) {
  if (path === '/agent/dashboard') {
    return pathname === '/agent' || pathname === '/agent/dashboard';
  }
  if (path === '/agent/customers') {
    return pathname === '/agent/customers';
  }
  return pathname.startsWith(path);
}

export default function AgentLayout() {
  const user = useAgentAuthStore((s) => s.user);
  const isAuthenticated = useAgentAuthStore((s) => s.isAuthenticated);
  const logout = useAgentAuthStore((s) => s.logout);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const reloadUnreadCount = async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await agentService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Unable to load unread notification count', error);
    }
  };

  useEffect(() => {
    void reloadUnreadCount();
  }, [user?.id]);

  useEffect(() => {
    if (!notificationOpen) return;
    void reloadUnreadCount();
  }, [notificationOpen, user?.id]);

  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('agentSettings');
      return stored ? JSON.parse(stored) : { compactView: false };
    } catch {
      return { compactView: false };
    }
  });

  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        const stored = localStorage.getItem('agentSettings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('agent-settings-changed', handleSettingsChange);
    handleSettingsChange();

    return () => {
      window.removeEventListener('agent-settings-changed', handleSettingsChange);
    };
  }, []);


  // Customer context (/agent/customers/:id and nested pages) — hide agent shell
  // until the agent returns to the portal (e.g. customers list / dashboard).
  // Keep chrome on /agent/customers and /agent/customers/new.
  const isCustomerContext =
    /^\/agent\/customers\/(?!new(?:\/|$))[^/]+(?:\/.*)?$/.test(
      location.pathname,
    );

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />;
  }

  if (isCustomerContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F3] via-[#FAF8FB] to-[#F7EBEF]">
        <main className="min-h-screen overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8F9FB] transition-all duration-200 ${settings.compactView ? 'compact-view' : ''}`}>


      <div className="flex min-h-screen flex-col">
        <AgentHeader
          mobileOpen={mobileOpen}
          onToggleMobileNav={() => {
            setNotificationOpen(false);
            setMobileOpen((v) => !v);
          }}
          notificationOpen={notificationOpen}
          setNotificationOpen={(next) => {
            setMobileOpen(false);
            setNotificationOpen(next);
          }}
          unreadCount={unreadCount}
        />

        {notificationOpen && (
          <NotificationPanel
            open={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            onNotificationRead={() => void reloadUnreadCount()}
          />
        )}

        {mobileOpen && (
          <nav
            aria-label="Agent portal navigation"
            className="border-b border-gray-100 bg-white px-4 py-3 shadow-sm lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-1">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                const active = isMobileItemActive(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                      active
                        ? 'bg-pink-50 font-semibold text-[#E91E63]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </nav>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  History,
  Settings,
  LogOut,
} from 'lucide-react';
import AgentSidebar from '../components/agent/AgentSidebar';
import AgentHeader from '../components/agent/AgentHeader';
import { useAgentAuthStore } from '../store/agent/agentAuthStore';

const mobileItems = [
  { title: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
  { title: 'Customers', path: '/agent/customers', icon: Users },
  { title: 'Add Customer', path: '/agent/customers/new', icon: UserPlus },
  { title: 'Worksheet', path: '/agent/worksheet', icon: ClipboardList },
  { title: 'Activity Log', path: '/agent/activity', icon: History },
  { title: 'Settings', path: '/agent/settings', icon: Settings },
];

export default function AgentLayout() {
  const isAuthenticated = useAgentAuthStore((s) => s.isAuthenticated);
  const logout = useAgentAuthStore((s) => s.logout);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#FFF8F3] via-[#FAF8FB] to-[#F7EBEF]">
      <AgentSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AgentHeader
          mobileOpen={mobileOpen}
          onToggleMobileNav={() => setMobileOpen((v) => !v)}
        />

        {mobileOpen && (
          <div className="md:hidden border-b border-wow-secondary/40 bg-white px-4 py-3 space-y-1">
            {mobileItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    active ? 'bg-wow-primary/10 text-wow-primary' : 'text-wow-text'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.title}
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

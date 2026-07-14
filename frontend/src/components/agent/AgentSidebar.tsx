import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  History,
  Settings,
  LogOut,
  Heart,
} from 'lucide-react';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';

const menuItems = [
  { title: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
  { title: 'Customers', path: '/agent/customers', icon: Users },
  { title: 'Add Customer', path: '/agent/customers/new', icon: UserPlus },
  { title: 'Worksheet', path: '/agent/worksheet', icon: ClipboardList },
  { title: 'Activity Log', path: '/agent/activity', icon: History },
  { title: 'Settings', path: '/agent/settings', icon: Settings },
];

export default function AgentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAgentAuthStore((s) => s.logout);

  const isActive = (path: string) => {
    if (path === '/agent/dashboard') {
      return location.pathname === '/agent/dashboard' || location.pathname === '/agent';
    }
    if (path === '/agent/customers') {
      return (
        location.pathname === '/agent/customers' ||
        (/^\/agent\/customers\/[^/]+$/.test(location.pathname) &&
          !location.pathname.endsWith('/new'))
      );
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  return (
    <aside className="hidden md:flex w-64 flex-col bg-wow-text text-white min-h-screen">
      <div className="px-6 py-8 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-wow-primary-light fill-wow-primary-light" />
          <div>
            <p className="font-display text-xl leading-tight">WOW</p>
            <p className="text-xs text-white/60 tracking-wide uppercase">Agent Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                active
                  ? 'bg-wow-primary text-white shadow-lg shadow-wow-primary/30'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

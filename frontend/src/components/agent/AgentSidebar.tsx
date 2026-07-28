import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  History,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import WowLogo from '../brand/WowLogo';

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
  const user = useAgentAuthStore((s) => s.user);

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

  const initials = (user?.firstName?.[0] || user?.email?.[0] || 'A').toUpperCase();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-[#1E1B32] text-white min-h-screen">
      <div className="px-5 py-7 border-b border-white/10 flex justify-center items-center">
        <WowLogo variant="sidebar" to="/agent/dashboard" />
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
                  ? 'bg-[#E91E63]/90 text-white shadow-lg shadow-[#E91E63]/25'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E91E63] text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Agent'}</p>
            <p className="text-[11px] text-white/50 truncate">
              {user?.employeeCode ? `ID: ${user.employeeCode}` : user?.email}
            </p>
          </div>
        </div>
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

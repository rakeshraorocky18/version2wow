import { useState } from 'react';
import { Bell, ChevronDown, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import WowLogo from '../brand/WowLogo';

interface AgentHeaderProps {
  onToggleMobileNav?: () => void;
  mobileOpen?: boolean;
}

export default function AgentHeader({ onToggleMobileNav, mobileOpen }: AgentHeaderProps) {
  const navigate = useNavigate();
  const user = useAgentAuthStore((s) => s.user);
  const logout = useAgentAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-50"
          onClick={onToggleMobileNav}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="md:hidden">
          <WowLogo variant="compact" to="/agent/dashboard" />
        </div>
        <p className="hidden md:block text-sm text-gray-500">
          Relationship Manager Workspace
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative p-2 rounded-full hover:bg-gray-50 text-gray-500"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E91E63]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-gray-50 transition"
          >
            <div className="w-9 h-9 rounded-full bg-[#E91E63] text-white flex items-center justify-center text-sm font-semibold">
              {(user?.firstName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {user?.name || 'Agent'}
              </p>
              <p className="text-xs text-gray-500">Agent</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-30">
              <Link
                to="/agent/settings"
                className="block px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Profile & Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

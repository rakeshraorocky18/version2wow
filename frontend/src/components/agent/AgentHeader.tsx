import { useState } from 'react';
import { Bell, ChevronDown, Menu, X, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';

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
    <header className="h-16 bg-white/90 backdrop-blur border-b border-wow-secondary/40 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-wow-bg"
          onClick={onToggleMobileNav}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="md:hidden flex items-center gap-2 text-wow-text">
          <Heart className="w-4 h-4 text-wow-primary fill-wow-primary" />
          <span className="font-display text-lg">WOW Agent</span>
        </div>
        <p className="hidden md:block text-sm text-wow-muted">
          Relationship Manager Workspace
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative p-2 rounded-full hover:bg-wow-bg text-wow-muted"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-wow-primary" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-wow-bg transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-wow-primary to-wow-primary-light text-white flex items-center justify-center text-sm font-semibold">
              {(user?.firstName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-wow-text leading-tight">
                {user?.name || 'Agent'}
              </p>
              <p className="text-xs text-wow-muted">Agent</p>
            </div>
            <ChevronDown className="w-4 h-4 text-wow-muted" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-30">
              <Link
                to="/agent/settings"
                className="block px-4 py-2 text-sm hover:bg-wow-bg"
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

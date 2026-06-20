import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationDropdown from '../components/NotificationDropdown';
import {
  LayoutDashboard, Send, CheckSquare, FileText,
  Globe, Archive, LogOut, Newspaper
} from 'lucide-react';

const navItems = {
  Student: [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/submissions',  icon: Send,             label: 'My Submissions' },
    { to: '/archives',     icon: Archive,          label: 'Archives' },
  ],
  Faculty: [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/submissions',  icon: Send,             label: 'My Submissions' },
    { to: '/archives',     icon: Archive,          label: 'Archives' },
  ],
  Admin: [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/approvals',    icon: CheckSquare,      label: 'Approvals' },
    { to: '/generation',   icon: FileText,         label: 'Generation' },
    { to: '/publication',  icon: Globe,            label: 'Publication' },
    { to: '/archives',     icon: Archive,          label: 'Archives' },
  ],
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = navItems[user?.role] || [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-surface-900 border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Newspaper size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">NEWSFLOW</p>
              <p className="text-xs text-white/40">{user?.department}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hidden">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm">
              {user?.name?.[0] || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-surface-950/80 backdrop-blur-sm border-b border-white/5">
          <div />
          <NotificationDropdown />
        </header>

        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

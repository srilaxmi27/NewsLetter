import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationDropdown from '../components/NotificationDropdown';
import {
  LayoutDashboard, Send, CheckSquare, FileText,
  Globe, Archive, LogOut, Newspaper, User,
} from 'lucide-react';

const NAV = {
  Student: [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/submissions', icon: Send,             label: 'My Submissions' },
    { to: '/archives',    icon: Archive,          label: 'Archives' },
    { to: '/profile',     icon: User,             label: 'Profile' },
  ],
  Faculty: [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/submissions', icon: Send,             label: 'My Submissions' },
    { to: '/archives',    icon: Archive,          label: 'Archives' },
    { to: '/profile',     icon: User,             label: 'Profile' },
  ],
  Admin: [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/approvals',   icon: CheckSquare,      label: 'Approvals' },
    { to: '/generation',  icon: FileText,         label: 'Generation' },
    { to: '/publication', icon: Globe,            label: 'Publication' },
    { to: '/archives',    icon: Archive,          label: 'Archives' },
    { to: '/profile',     icon: User,             label: 'Profile' },
  ],
};

const ROLE_DOT = {
  Student: 'bg-blue-400',
  Faculty: 'bg-violet-400',
  Admin:   'bg-primary-500',
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = NAV[user?.role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-ink-200 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shadow-purple">
              <Newspaper size={13} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-ink-900 text-sm leading-none tracking-tight">NewsFlow</p>
              <p className="text-2xs text-ink-400 mt-0.5 leading-none truncate max-w-[7rem]">
                {user?.department_name || user?.department}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-hidden">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2.5 py-3 border-t border-ink-100 space-y-0.5">
          <NavLink to="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-ink-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-800 truncate leading-tight">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[user?.role] || 'bg-ink-400'}`} />
                <span className="text-2xs text-ink-400">{user?.role}</span>
              </div>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-7 py-3
                           bg-white/95 backdrop-blur-sm border-b border-ink-200">
          <div />
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <NavLink to="/profile">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs hover:ring-2 hover:ring-primary-300 transition-all">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-7 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

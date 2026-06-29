import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatDistanceToNow } from '../../utils/formatters';
import {
  Send, FileText, Clock, CheckCircle, XCircle,
  MessageSquare, ChevronRight, Plus, Users, Newspaper,
  TrendingUp, BookOpen, Award,
} from 'lucide-react';

// ── Shared components ──────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, iconBg, color, sub }) => (
  <div className="stat-card">
    <div className={`stat-icon ${iconBg}`}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className="stat-value">{value ?? '—'}</p>
      <p className="stat-label">{label}</p>
      {sub && <p className="text-2xs text-ink-300 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="stat-card">
    <div className="stat-icon bg-ink-100 animate-pulse" />
    <div className="flex-1">
      <div className="h-7 w-12 bg-ink-100 rounded-lg animate-pulse mb-1" />
      <div className="h-3 w-20 bg-ink-100 rounded-lg animate-pulse" />
    </div>
  </div>
);

const SkeletonRow = () => (
  <tr>
    {[1,2,3,4].map(i => (
      <td key={i} className="table-cell">
        <div className="h-4 bg-ink-100 rounded-lg animate-pulse" style={{ width: `${60 + i * 10}%` }} />
      </td>
    ))}
  </tr>
);

// ── Admin Dashboard ─────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [stats,    setStats]    = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/recent-activity'),
    ])
      .then(([s, a]) => {
        setStats(s.data.data);
        setActivity(a.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = stats;

  const statCards = s ? [
    { icon: Users,      label: 'Students',          value: s.users.students,          iconBg: 'bg-blue-50',     color: 'text-blue-500'    },
    { icon: BookOpen,   label: 'Faculty',            value: s.users.faculty,           iconBg: 'bg-violet-50',   color: 'text-violet-500'  },
    { icon: Clock,      label: 'Pending Review',     value: s.submissions.pending,     iconBg: 'bg-amber-50',    color: 'text-amber-500'   },
    { icon: CheckCircle,label: 'Approved',           value: s.submissions.approved,    iconBg: 'bg-emerald-50',  color: 'text-emerald-500' },
    { icon: XCircle,    label: 'Rejected',           value: s.submissions.rejected,    iconBg: 'bg-red-50',      color: 'text-red-400'     },
    { icon: Newspaper,  label: 'Published Newsletters', value: s.newsletters.published, iconBg: 'bg-primary-50', color: 'text-primary-500' },
  ] : [];

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">AIML Department overview</p>
        </div>
        <Link to="/approvals" className="btn-primary">
          <CheckCircle size={15} /> Review submissions
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((sc, i) => <StatCard key={i} {...sc} />)
        }
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        {[
          { to: '/approvals',  label: 'Review pending', sub: `${s?.submissions.pending ?? '—'} waiting`, icon: CheckCircle, accent: 'border-amber-200 hover:border-amber-300 hover:bg-amber-50' },
          { to: '/generation', label: 'Build newsletter', sub: 'Curate approved content',    icon: FileText,   accent: 'border-primary-200 hover:border-primary-300 hover:bg-primary-50' },
          { to: '/publication',label: 'Publish',          sub: 'Generate PDF & send emails',  icon: Send,       accent: 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50' },
        ].map(({ to, label, sub, icon: Icon, accent }) => (
          <Link key={to} to={to}
            className={`card flex items-center gap-3 p-4 transition-all hover:shadow-card-md ${accent}`}>
            <Icon size={18} className="text-ink-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-ink-800 text-sm">{label}</p>
              <p className="text-2xs text-ink-400 truncate">{sub}</p>
            </div>
            <ChevronRight size={14} className="text-ink-300 ml-auto flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="font-medium text-ink-800 text-sm">Recent activity</h2>
          <Link to="/approvals" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {loading ? (
          <table className="w-full"><tbody>{[1,2,3].map(i => <SkeletonRow key={i} />)}</tbody></table>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <TrendingUp size={28} className="text-ink-300" />
            <p className="text-sm text-ink-400">No activity yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <th className="table-header">Title</th>
                <th className="table-header">By</th>
                <th className="table-header">Type</th>
                <th className="table-header">Status</th>
                <th className="table-header">Updated</th>
              </tr>
            </thead>
            <tbody>
              {activity.slice(0, 10).map(s => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell font-medium text-ink-800 max-w-[200px] truncate">{s.title}</td>
                  <td className="table-cell text-ink-500 text-xs">{s.submitted_by}</td>
                  <td className="table-cell">
                    <span className="text-2xs text-ink-400 bg-ink-100 px-2 py-0.5 rounded-md font-medium">{s.type}</span>
                  </td>
                  <td className="table-cell"><StatusBadge status={s.status} /></td>
                  <td className="table-cell text-ink-400 text-xs">{formatDistanceToNow(s.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Student / Faculty Dashboard ─────────────────────────────────────────────

const UserDashboard = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    api.get('/submissions/mine')
      .then(r => setSubmissions(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total:    submissions.length,
    pending:  submissions.filter(s => s.status === 'Pending').length,
    approved: submissions.filter(s => ['Approved','Selected','Published','Archived'].includes(s.status)).length,
    rejected: submissions.filter(s => s.status === 'Rejected').length,
  };

  const statCards = [
    { icon: Send,        label: 'Total',    value: counts.total,    iconBg: 'bg-primary-50', color: 'text-primary-500' },
    { icon: Clock,       label: 'Pending',  value: counts.pending,  iconBg: 'bg-amber-50',   color: 'text-amber-500'   },
    { icon: CheckCircle, label: 'Approved', value: counts.approved, iconBg: 'bg-emerald-50', color: 'text-emerald-500' },
    { icon: XCircle,     label: 'Rejected', value: counts.rejected, iconBg: 'bg-red-50',     color: 'text-red-400'     },
  ];

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">
            Good to see you, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="page-subtitle">{user?.department_name || user?.department} · {user?.role}</p>
        </div>
        <Link to="/submissions/new" className="btn-primary">
          <Plus size={15} /> New submission
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((sc, i) => <StatCard key={i} {...sc} />)
        }
      </div>

      {/* Achievement prompt cards */}
      {!loading && counts.total === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
          {[
            { icon: Award,    label: 'Share an achievement', sub: 'Placement, certification, sports…', to: '/submissions/new' },
            { icon: BookOpen, label: 'Research publication',  sub: 'Journal, conference paper…',        to: '/submissions/new' },
            { icon: Users,    label: 'Faculty activity',      sub: 'Workshop, FDP, guest lecture…',     to: '/submissions/new' },
          ].map(({ icon: Icon, label, sub, to }) => (
            <Link key={label} to={to}
              className="card flex items-center gap-3 p-4 border-dashed border-2 hover:border-primary-300 hover:bg-primary-50/40 transition-all">
              <Icon size={18} className="text-ink-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-ink-700 text-sm">{label}</p>
                <p className="text-2xs text-ink-400">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent submissions */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="font-medium text-ink-800 text-sm">Recent submissions</h2>
          <Link to="/submissions" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {loading ? (
          <table className="w-full"><tbody>{[1,2,3].map(i => <SkeletonRow key={i} />)}</tbody></table>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Send size={28} className="text-ink-300" />
            <p className="text-sm text-ink-400">No submissions yet</p>
            <Link to="/submissions/new" className="btn-primary mt-1">
              <Plus size={14} /> Create one
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-100">
                <th className="table-header">Title</th>
                <th className="table-header">Type</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {submissions.slice(0, 6).map(s => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell font-medium text-ink-800">{s.title}</td>
                  <td className="table-cell">
                    <span className="text-2xs text-ink-400 bg-ink-100 px-2 py-0.5 rounded-md font-medium">{s.type}</span>
                  </td>
                  <td className="table-cell text-ink-400">{formatDate(s.created_at)}</td>
                  <td className="table-cell"><StatusBadge status={s.status} /></td>
                  <td className="table-cell">
                    {s.admin_remarks ? (
                      <div className="flex items-start gap-1.5 max-w-xs">
                        <MessageSquare size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-amber-700 line-clamp-1">{s.admin_remarks}</span>
                      </div>
                    ) : <span className="text-ink-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Route ──────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { user } = useAuth();
  return user?.role === 'Admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default DashboardPage;

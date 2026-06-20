import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { Send, FileText, Bell, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/50">{label}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = user.role === 'Admin' ? '/submissions/admin/pending' : '/submissions/mine';
        const res = await api.get(endpoint);
        setSubmissions(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = {
    Admin: [
      { icon: FileText, label: 'Pending Review', value: submissions.length, color: 'bg-yellow-500/20' },
    ],
    Student: [
      { icon: Send, label: 'Total Submissions', value: submissions.length, color: 'bg-primary-600/30' },
      { icon: TrendingUp, label: 'Approved', value: submissions.filter(s => ['Approved','Selected','Published','Archived'].includes(s.status)).length, color: 'bg-green-600/20' },
    ],
    Faculty: [
      { icon: Send, label: 'Total Submissions', value: submissions.length, color: 'bg-primary-600/30' },
      { icon: TrendingUp, label: 'Approved', value: submissions.filter(s => ['Approved','Selected','Published','Archived'].includes(s.status)).length, color: 'bg-green-600/20' },
    ],
  };

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/40">{user?.department} Department · {user?.role}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(stats[user?.role] || []).map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          {user?.role === 'Admin' ? 'Pending Submissions' : 'My Recent Submissions'}
        </h2>
        {loading ? (
          <div className="text-white/30 text-sm animate-pulse">Loading...</div>
        ) : submissions.length === 0 ? (
          <p className="text-white/30 text-sm">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <div>
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-white/40">{s.type} · {formatDate(s.created_at)}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

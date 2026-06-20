import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { Plus } from 'lucide-react';

const MySubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/submissions/mine').then(res => {
      setSubmissions(res.data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Submissions</h1>
          <p className="text-white/40">Track all your submitted achievements</p>
        </div>
        <Link to="/submissions/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Submission
        </Link>
      </div>

      {loading ? (
        <div className="text-white/30 animate-pulse">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-white/30 text-lg mb-4">No submissions yet</p>
          <Link to="/submissions/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} /> Create Your First Submission
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="card hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{s.title}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/40">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs">{s.type}</span>
                    <span>{formatDate(s.created_at)}</span>
                  </div>
                  {s.description && (
                    <p className="text-sm text-white/50 mt-2 line-clamp-1">{s.description}</p>
                  )}
                </div>
                {s.status === 'Draft' && (
                  <Link
                    to={`/submissions/edit/${s.id}`}
                    className="ml-4 btn-secondary text-sm"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;

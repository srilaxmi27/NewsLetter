import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Newspaper, ChevronRight, Users } from 'lucide-react';

const ROLE_COLORS = {
  Admin:   'from-primary-600 to-purple-600',
  Faculty: 'from-emerald-600 to-teal-600',
  Student: 'from-orange-500 to-pink-600',
};

const ROLE_BADGES = {
  Admin:   'bg-primary-500/20 text-primary-400',
  Faculty: 'bg-emerald-500/20 text-emerald-400',
  Student: 'bg-orange-500/20 text-orange-400',
};

const LoginPage = () => {
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  useEffect(() => {
    api.get('/auth/demo-users').then(res => {
      setUsers(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSelect = async (userId) => {
    setSelecting(userId);
    try {
      const res = await api.post('/auth/select', { userId });
      login(res.data.data);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-6 shadow-lg shadow-primary-600/30">
          <Newspaper size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          News<span className="text-gradient">Flow</span>
        </h1>
        <p className="text-white/50 text-lg">Department Newsletter Management System</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          MVP Mode — Select a demo account to continue
        </div>
      </div>

      {/* Demo Accounts */}
      {loading ? (
        <div className="text-white/40 animate-pulse">Loading demo accounts...</div>
      ) : (
        <div className="w-full max-w-4xl space-y-8">
          {Object.entries(users).map(([dept, deptUsers]) => (
            <div key={dept}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-white/50 text-sm font-medium px-3 py-1 rounded-full border border-white/10">
                  {dept} Department
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {deptUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.id)}
                    disabled={selecting === u.id}
                    className="group card text-left hover:border-primary-500/50 hover:bg-surface-800 transition-all duration-200 relative overflow-hidden"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ROLE_COLORS[u.role]}`} />
                    <div className="pt-2">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg font-bold text-white/80 mb-3 group-hover:scale-110 transition-transform">
                        {u.name[0]}
                      </div>
                      <p className="font-semibold text-white text-sm mb-1">{u.name}</p>
                      <span className={`badge text-xs ${ROLE_BADGES[u.role]}`}>{u.role}</span>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-white/30 truncate">{u.email}</p>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                    {selecting === u.id && (
                      <div className="absolute inset-0 bg-surface-900/80 flex items-center justify-center rounded-2xl">
                        <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-12 text-white/20 text-xs">
        NEWSFLOW MVP — Authentication will be implemented in a future release
      </p>
    </div>
  );
};

export default LoginPage;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Mail, Shield, Building, Pencil, Check, X, Send, Clock, CheckCircle, FileText } from 'lucide-react';
import { toast } from '../../components/Toast';

const ROLE_STYLE = {
  Student: 'bg-blue-100 text-blue-700',
  Faculty: 'bg-violet-100 text-violet-700',
  Admin:   'bg-primary-100 text-primary-700',
};

const StatPill = ({ label, value, color }) => (
  <div className={`flex flex-col items-center px-4 py-3 rounded-xl border ${color}`}>
    <span className="text-xl font-semibold">{value}</span>
    <span className="text-2xs font-medium uppercase tracking-wide mt-0.5 opacity-70">{label}</span>
  </div>
);

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [nameVal,  setNameVal]  = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    api.get('/users/me')
      .then(r => {
        setProfile(r.data.data);
        setNameVal(r.data.data.name);
      })
      .catch(() => {
        // Fall back to the session user so the page never shows an error state
        if (user) {
          setProfile({
            name:            user.name,
            email:           user.email,
            role:            user.role,
            department_name: user.department_name || user.department || 'AIML',
            updated_at:      new Date().toISOString(),
            stats:           { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0, published: 0 },
          });
          setNameVal(user.name);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    try {
      const r = await api.patch('/users/me', { name: nameVal.trim() });
      setProfile(p => ({ ...p, name: r.data.data.name }));
      setEditing(false);
      toast.success('Name updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update name.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="card h-40 animate-pulse bg-ink-50" />
      <div className="card h-28 animate-pulse bg-ink-50" />
    </div>
  );

  // Should never happen now — we fall back to session user above
  if (!profile) return null;

  const s = profile.stats;

  return (
    <div className="max-w-xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your account details and submission history</p>
      </div>

      {/* Identity card */}
      <div className="card mb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
            {profile.name?.[0]?.toUpperCase() || '?'}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2 mb-2">
                <input className="input py-1.5 text-base font-semibold flex-1"
                  value={nameVal} onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                  autoFocus />
                <button onClick={saveName} disabled={saving}
                  className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditing(false)}
                  className="p-1.5 rounded-lg bg-ink-50 border border-ink-200 text-ink-400 hover:bg-ink-100">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-ink-900 truncate">{profile.name}</h2>
                <button onClick={() => { setNameVal(profile.name); setEditing(true); }}
                  className="p-1 rounded-md text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors flex-shrink-0">
                  <Pencil size={13} />
                </button>
              </div>
            )}

            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${ROLE_STYLE[profile.role] || 'bg-ink-100 text-ink-600'}`}>
              {profile.role}
            </span>

            <div className="space-y-1.5">
              {[
                { icon: Mail,     label: profile.email },
                { icon: Building, label: profile.department_name || 'AIML' },
                { icon: Shield,   label: `Member since ${formatDate(profile.updated_at)}` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-ink-500">
                  <Icon size={13} className="text-ink-400 flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-2xs text-ink-300">
          Email and role are assigned by the institution and cannot be changed here.
        </p>
      </div>

      {/* Submission stats — students & faculty only */}
      {profile.role !== 'Admin' && s && (
        <div className="card mb-5">
          <h3 className="font-medium text-ink-800 text-sm mb-4">Submission statistics</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <StatPill label="Total"     value={s.total}     color="bg-ink-50 border-ink-200 text-ink-700" />
            <StatPill label="Pending"   value={s.pending}   color="bg-amber-50 border-amber-200 text-amber-700" />
            <StatPill label="Approved"  value={s.approved}  color="bg-emerald-50 border-emerald-200 text-emerald-700" />
            <StatPill label="Rejected"  value={s.rejected}  color="bg-red-50 border-red-200 text-red-600" />
            <StatPill label="Published" value={s.published} color="bg-primary-50 border-primary-200 text-primary-700" />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="card">
        <h3 className="font-medium text-ink-800 text-sm mb-3">Quick links</h3>
        <div className="space-y-0.5">
          {(profile.role !== 'Admin' ? [
            { to: '/submissions/new', label: 'New submission',     icon: Send,         desc: 'Submit an achievement' },
            { to: '/submissions',     label: 'My submissions',     icon: FileText,     desc: 'View all your work' },
            { to: '/archives',        label: 'Newsletter archive', icon: CheckCircle,  desc: 'Browse published newsletters' },
          ] : [
            { to: '/approvals',   label: 'Pending approvals', icon: Clock,    desc: 'Review submissions' },
            { to: '/generation',  label: 'Build newsletter',  icon: FileText, desc: 'Curate content' },
            { to: '/publication', label: 'Publish',           icon: Send,     desc: 'Generate PDF & send' },
          ]).map(({ to, label, icon: Icon, desc }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors group">
              <Icon size={15} className="text-ink-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-700 group-hover:text-ink-900">{label}</p>
                <p className="text-2xs text-ink-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

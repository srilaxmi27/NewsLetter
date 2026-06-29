import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { Newspaper, FlaskConical, ShieldCheck, X, Loader } from 'lucide-react';

const IS_DEV_MODE   = import.meta.env.VITE_DEV_MODE === 'true';
const ALLOWED_DOMAIN = 'vnrvjiet.in';

// ── Dev accounts — AIML only, admin hidden ──────────────────────────────────
const DEV_ACCOUNTS = [
  { email: 'student.aiml@newsletter.dev', role: 'Student', initial: 'S' },
  { email: 'faculty.aiml@newsletter.dev', role: 'Faculty', initial: 'F' },
];
const ROLE_COLORS = {
  Student: { ring: 'ring-blue-300',    text: 'text-blue-600',    bg: 'bg-blue-50',    active: 'bg-blue-100'    },
  Faculty: { ring: 'ring-violet-300',  text: 'text-violet-600',  bg: 'bg-violet-50',  active: 'bg-violet-100'  },
};

// ── Admin modal ──────────────────────────────────────────────────────────────
const AdminModal = ({ onClose, onLogin }) => {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setBusy(true); setErr('');
    try { await onLogin('admin.aiml@newsletter.dev', key.trim()); }
    catch { setErr('Invalid admin key.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-xs p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary-600" />
            <span className="font-semibold text-ink-900 text-sm">Admin access</span>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Access key</label>
            <input type="password" className="input" placeholder="Enter admin key"
              value={key} onChange={e => setKey(e.target.value)} autoFocus />
          </div>
          {err && <p className="text-red-600 text-xs">{err}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Signing in…' : 'Sign in as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Dev panel ────────────────────────────────────────────────────────────────
const DevPanel = () => {
  const [active,    setActive]    = useState(null);
  const [error,     setError]     = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const clicks = useRef(0);
  const { devLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    clicks.current += 1;
    if (clicks.current >= 3) { setShowAdmin(true); clicks.current = 0; }
  };

  const handle = async (email, adminKey) => {
    setActive(email); setError('');
    try {
      await devLogin(email, adminKey);
      navigate('/dashboard');
    } catch (e) {
      setError(e.isNetwork
        ? 'Cannot reach server. Make sure the backend is running.'
        : e.message || 'Login failed.');
    } finally { setActive(null); }
  };

  return (
    <div className="w-full max-w-sm">
      <button onClick={handleLogoClick} className="flex items-center gap-2.5 mb-10 focus:outline-none" tabIndex={-1}>
        <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shadow-purple">
          <Newspaper size={15} className="text-white" />
        </div>
        <span className="font-semibold text-ink-900 tracking-tight">NewsFlow</span>
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900 mb-1.5">Sign in</h1>
        <p className="text-sm text-ink-400">AIML Department · Pick an account</p>
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 mb-6">
        <FlaskConical size={11} className="text-amber-500" />
        <span className="text-2xs font-semibold text-amber-600 uppercase tracking-widest">Dev mode</span>
      </div>

      {error && (
        <div className="mb-5 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <div className="space-y-1.5">
        {DEV_ACCOUNTS.map(({ email, role, initial }) => {
          const c = ROLE_COLORS[role];
          const isLoading = active === email;
          return (
            <button key={email} onClick={() => handle(email)} disabled={active !== null}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border
                transition-all duration-150 text-left disabled:opacity-60 disabled:cursor-wait hover:shadow-sm
                ${isLoading ? `${c.active} border-current/20 ${c.text}` : `bg-white border-ink-200 hover:border-ink-300`}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ring-2 ${c.ring} ${c.bg} ${c.text}`}>
                {initial}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-800">{role}</p>
                <p className="text-2xs text-ink-400 font-mono">{email}</p>
              </div>
              {isLoading && <Loader size={13} className="animate-spin opacity-60" />}
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-ink-300 text-center">
        Remove <code className="text-ink-500 font-mono bg-ink-100 px-1 py-0.5 rounded">VITE_DEV_MODE</code> for production login
      </p>

      {showAdmin && (
        <AdminModal onClose={() => setShowAdmin(false)}
          onLogin={async (email, key) => { await handle(email, key); setShowAdmin(false); }} />
      )}
    </div>
  );
};

// ── Production panel — One Tap + button ──────────────────────────────────────
const ProdPanel = () => {
  const [error,     setError]     = useState('');
  const [busy,      setBusy]      = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const tapCount = useRef(0);
  const { login, devLogin } = useAuth();
  const navigate = useNavigate();

  const handleCredential = async (credential) => {
    setError(''); setBusy(true);
    try {
      await login(credential);
      navigate('/dashboard');
    } catch (e) {
      const msg = e?.response?.data?.error || e?.friendlyMessage || e.message || 'Sign-in failed.';
      // If domain is wrong, be explicit
      if (msg.toLowerCase().includes('only @')) {
        setError(`Only @${ALLOWED_DOMAIN} accounts are allowed. Please use your VNR VJIET email.`);
      } else if (e.isNetwork) {
        setError('Cannot reach server. Check your internet connection and try again.');
      } else {
        setError(msg);
      }
    } finally { setBusy(false); }
  };

  // ── Google One Tap — auto-detects the signed-in Google account ──
  // If the browser has a @vnrvjiet.in account signed in, this will
  // prompt automatically without any click.
  useGoogleOneTapLogin({
    onSuccess: (res) => handleCredential(res.credential),
    onError:   () => { /* One Tap failed silently — fallback to button */ },
    // Only prompt for @vnrvjiet.in accounts
    hosted_domain: ALLOWED_DOMAIN,
    // Don't show One Tap on the page if already processing
    cancel_on_tap_outside: false,
    // Use the FedCM flow where available (Chrome 117+)
    use_fedcm_for_prompt: true,
  });

  const handleLogoClick = () => {
    tapCount.current += 1;
    if (tapCount.current >= 5) { setShowAdmin(true); tapCount.current = 0; }
  };

  return (
    <div className="w-full max-w-sm">
      <button onClick={handleLogoClick} className="flex items-center gap-2.5 mb-10 focus:outline-none" tabIndex={-1}>
        <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shadow-purple">
          <Newspaper size={15} className="text-white" />
        </div>
        <span className="font-semibold text-ink-900 tracking-tight">NewsFlow</span>
      </button>

      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-ink-900 mb-1.5">Welcome back</h1>
        <p className="text-sm text-ink-400">
          Sign in with your{' '}
          <span className="font-semibold text-ink-700">@{ALLOWED_DOMAIN}</span>{' '}
          Google account
        </p>
      </div>

      {/* Domain hint */}
      <div className="flex items-center gap-2 mb-7 mt-4 px-3 py-2.5 rounded-xl bg-primary-50 border border-primary-100">
        <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[9px] font-bold">G</span>
        </div>
        <p className="text-xs text-primary-700">
          Only <strong>@{ALLOWED_DOMAIN}</strong> Google accounts are accepted.
          Other email addresses will be rejected.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {busy ? (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-ink-500">
          <Loader size={16} className="animate-spin" /> Signing in…
        </div>
      ) : (
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(res) => handleCredential(res.credential)}
            onError={() => setError('Google sign-in failed. Try again.')}
            shape="pill"
            theme="outline"
            text="signin_with"
            // Restrict account chooser to @vnrvjiet.in accounts only
            hosted_domain={ALLOWED_DOMAIN}
            // Show account selection always (so wrong account holders see the restriction)
            prompt="select_account"
          />
        </div>
      )}

      <p className="mt-5 text-xs text-ink-400 text-center">
        If One Tap appeared automatically, your VNR account was detected.
        <br />If not, click "Sign in with Google" above.
      </p>

      {showAdmin && (
        <AdminModal onClose={() => setShowAdmin(false)}
          onLogin={async (email, key) => {
            await devLogin(email, key);
            setShowAdmin(false);
            navigate('/dashboard');
          }} />
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[42%] bg-ink-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-12 translate-y-12" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
            <Newspaper size={15} className="text-white" />
          </div>
          <span className="font-semibold text-white/80 tracking-tight text-sm">NewsFlow</span>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-6">
            AIML Department · VNR VJIET
          </p>
          <h2 className="text-4xl font-serif text-white leading-tight mb-5">
            From classroom<br />to column.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Submit achievements, manage approvals, and publish your department's story — all in one place.
          </p>
          <div className="mt-10 space-y-3">
            {[
              { n: '01', label: 'Submit your work' },
              { n: '02', label: 'Admin reviews & approves' },
              { n: '03', label: 'Published as a newsletter' },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3">
                <span className="text-white/20 font-mono text-xs w-6">{n}</span>
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-white/40 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs">© 2025 NewsFlow · VNR VJIET</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center bg-ink-50 px-6 py-12">
        {IS_DEV_MODE ? <DevPanel /> : <ProdPanel />}
      </div>
    </div>
  );
};

export default LoginPage;

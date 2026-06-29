/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Retry an async fn up to `times` with exponential back-off
const withRetry = async (fn, times = 3, delayMs = 600) => {
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      const isNetwork = !err.response; // no response = network / timeout
      if (!isNetwork || i === times - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * 2 ** i));
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Initial session check ─────────────────────────────────────────────────
  // Retry up to 3× so a cold Neon DB wake-up doesn't log the user out.
  const checkAuth = useCallback(async () => {
    try {
      const res = await withRetry(() => api.get('/auth/profile'));
      setUser(res.data?.success ? res.data.data : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // ── Mid-session expiry ────────────────────────────────────────────────────
  // Only activate after 3 s so the initial profile 401 doesn't trigger logout
  useEffect(() => {
    let active = false;
    const t = setTimeout(() => { active = true; }, 3000);
    const handle = () => { if (active) { setUser(null); setLoading(false); } };
    window.addEventListener('auth:expired', handle);
    return () => { clearTimeout(t); window.removeEventListener('auth:expired', handle); };
  }, []);

  // ── Google login (standard button + One Tap) ──────────────────────────────
  const login = useCallback(async (googleToken) => {
    const res = await withRetry(() => api.post('/auth/google', { token: googleToken }));
    if (!res.data.success) throw new Error('Login failed');
    const u = res.data.data;
    setUser({
      id:              u.id,
      name:            u.name,
      email:           u.email,
      role:            u.role,
      department:      u.department,
      department_name: u.department,
      department_id:   u.department_id,
      picture:         u.picture,
    });
  }, []);

  // ── Dev login ─────────────────────────────────────────────────────────────
  const devLogin = useCallback(async (email, adminKey) => {
    const body = adminKey ? { email, adminKey } : { email };
    const res  = await withRetry(() => api.post('/auth/dev-login', body));
    if (!res.data.success) throw new Error('Dev login failed');
    const u = res.data.data;
    setUser({
      id:              u.id,
      name:            u.name,
      email:           u.email,
      role:            u.role,
      department:      u.department,
      department_name: u.department,
      department_id:   u.department_id,
    });
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/dev-logout'); } catch { /* best-effort */ }
    finally { setUser(null); }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, devLogin, logout, loading, checkAuth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

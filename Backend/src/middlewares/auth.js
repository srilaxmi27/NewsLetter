const pool = require('../config/db');

const IS_DEV_MODE = process.env.DEV_MODE === 'true';

// In-memory cache — avoids a DB hit on every authenticated request
const sessionCache = new Map(); // email → { user, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getLocalUserByEmail = async (email) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name
       FROM Users u
       LEFT JOIN Departments d ON d.id = u.department_id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('[Auth] DB lookup failed:', err.message);
    return null;
  }
};

// Invalidate cache entry (call after login/logout so stale data isn't served)
const invalidateCache = (email) => {
  if (email) sessionCache.delete(email.toLowerCase());
};

// ─────────────────────────────────────────────
// Primary auth: read devSession cookie
// Used for BOTH dev mode (dev accounts) and production (Google login)
// because googleLogin also sets a devSession cookie after verifying the token.
// ─────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  const raw = req.cookies?.devSession;
  if (!raw) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return res.status(401).json({ error: 'Malformed session. Please sign in again.' });
  }

  if (!session.userId || !session.email) {
    return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
  }

  const email = session.email.toLowerCase();

  // Check cache
  const cached = sessionCache.get(email);
  if (cached && cached.expiresAt > Date.now()) {
    req.user = cached.user;
    return next();
  }

  // DB lookup
  const localUser = await getLocalUserByEmail(email);
  if (!localUser) {
    return res.status(401).json({ error: 'User not found. Please sign in again.' });
  }

  const user = {
    id:              localUser.id,
    email:           localUser.email,
    name:            localUser.name,
    picture:         null,
    role:            localUser.role,
    department_name: localUser.department_name || 'AIML',
    department_id:   localUser.department_id || null,
  };

  sessionCache.set(email, { user, expiresAt: Date.now() + CACHE_TTL_MS });
  req.user = user;
  return next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  }
  next();
};

module.exports = { mockAuth: verifyToken, verifyToken, requireRole, invalidateCache };

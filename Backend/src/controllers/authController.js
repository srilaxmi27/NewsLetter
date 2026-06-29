const pool  = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const { invalidateCache } = require('../middlewares/auth');

const IS_DEV_MODE      = process.env.DEV_MODE === 'true';
const ALLOWED_DOMAIN   = process.env.ALLOWED_EMAIL_DOMAIN || 'vnrvjiet.in';
const ADMIN_EMAILS     = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// ─────────────────────────────────────────────
// Role detection logic
//  - Email in ADMIN_EMAILS list → Admin
//  - Local part matches a roll number pattern (digits/letters typical of
//    VNR roll numbers, e.g. "22471A6601") → Student
//  - Otherwise → Faculty
// ─────────────────────────────────────────────
const detectRole = (email) => {
  const lower = email.toLowerCase();
  if (ADMIN_EMAILS.includes(lower)) return 'Admin';

  // VNR roll number: starts with 2-digit year, followed by digits/letters, ~10 chars
  const local = lower.split('@')[0];
  if (/^\d{2}[0-9a-z]{6,10}$/.test(local)) return 'Student';

  return 'Faculty';
};

// ─────────────────────────────────────────────
// Upsert a Google-authenticated user into the DB
// Returns the full user record
// ─────────────────────────────────────────────
const upsertGoogleUser = async (email, name, picture) => {
  const role = detectRole(email);

  // AIML department is the only one — fetch its id
  const deptResult = await pool.query(
    `SELECT id FROM Departments WHERE name = 'AIML'`
  );
  if (deptResult.rows.length === 0) {
    throw new Error('AIML department not found in DB. Run initDB first.');
  }
  const departmentId = deptResult.rows[0].id;

  await pool.query(
    `INSERT INTO Users (department_id, name, email, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           role = EXCLUDED.role,
           department_id = EXCLUDED.department_id,
           updated_at = CURRENT_TIMESTAMP`,
    [departmentId, name, email.toLowerCase(), role]
  );

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name
     FROM Users u
     LEFT JOIN Departments d ON d.id = u.department_id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0];
};

// ─────────────────────────────────────────────
// POST /api/auth/google
// Body: { token } — Google ID token from frontend
// Validates domain, upserts user, sets session cookie.
// ─────────────────────────────────────────────
const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google token is required.' });
    if (!googleClient) {
      return res.status(503).json({ error: 'Google auth not configured on this server.' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    const email = payload.email?.toLowerCase();
    const emailDomain = email?.split('@')[1];

    if (emailDomain !== ALLOWED_DOMAIN) {
      return res.status(403).json({
        error: `Only @${ALLOWED_DOMAIN} accounts are allowed.`,
      });
    }

    const name    = payload.name || email.split('@')[0];
    const picture = payload.picture || null;

    const user = await upsertGoogleUser(email, name, picture);

    // Set session cookie — same shape as devSession so verifyToken works for both
    const session = JSON.stringify({ userId: user.id, email: user.email });
    res.cookie('devSession', session, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        role:          user.role,
        department:    user.department_name,
        department_id: user.department_id,
        picture,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DEV-MODE accounts — AIML only
// ─────────────────────────────────────────────
const DEV_ACCOUNTS = {
  'student.aiml@newsletter.dev': { name: 'Student AIML', role: 'Student', department: 'AIML' },
  'faculty.aiml@newsletter.dev': { name: 'Faculty AIML', role: 'Faculty', department: 'AIML' },
};

// Admin dev account — accessed via secret key, never exposed in UI
const DEV_ADMIN_ACCOUNT = {
  email: 'admin.aiml@newsletter.dev',
  data:  { name: 'Admin AIML', role: 'Admin', department: 'AIML' },
};

const DEV_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// POST /api/auth/dev-login  — body: { email, adminKey? }
const devLogin = async (req, res, next) => {
  if (!IS_DEV_MODE) {
    return res.status(403).json({ error: 'Dev login is disabled in production.' });
  }

  try {
    const { email, adminKey } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Admin requires the secret key
    let account;
    if (normalizedEmail === DEV_ADMIN_ACCOUNT.email) {
      const expectedKey = process.env.ADMIN_DEV_KEY || 'newsflow-admin-2025';
      if (adminKey !== expectedKey) {
        return res.status(403).json({ error: 'Invalid admin key.' });
      }
      account = DEV_ADMIN_ACCOUNT.data;
    } else {
      account = DEV_ACCOUNTS[normalizedEmail];
      if (!account) {
        return res.status(400).json({ error: 'Email not in the allowed dev accounts list.' });
      }
    }

    const deptResult = await pool.query(
      `SELECT id FROM Departments WHERE name = $1`,
      [account.department]
    );
    if (deptResult.rows.length === 0) {
      return res.status(500).json({ error: `Department "${account.department}" not found. Run initDB first.` });
    }

    const departmentId = deptResult.rows[0].id;

    await pool.query(
      `INSERT INTO Users (department_id, name, email, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name,
             role = EXCLUDED.role,
             department_id = EXCLUDED.department_id`,
      [departmentId, account.name, normalizedEmail, account.role]
    );

    const userResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name
       FROM Users u
       LEFT JOIN Departments d ON d.id = u.department_id
       WHERE u.email = $1`,
      [normalizedEmail]
    );

    const user = userResult.rows[0];
    const session = JSON.stringify({ userId: user.id, email: user.email });
    res.cookie('devSession', session, DEV_COOKIE_OPTIONS);

    return res.json({
      success: true,
      data: {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        role:          user.role,
        department:    user.department_name,
        department_id: user.department_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

const devLogout = (req, res) => {
  // Parse the cookie to get the email so we can invalidate the cache
  try {
    const raw = req.cookies?.devSession;
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.email) invalidateCache(session.email);
    }
  } catch { /* best-effort */ }
  res.clearCookie('devSession', { httpOnly: true, sameSite: 'lax' });
  return res.json({ success: true });
};

module.exports = { googleLogin, devLogin, devLogout };

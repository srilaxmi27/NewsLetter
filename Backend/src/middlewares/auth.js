// Mock Auth Middleware
// In MVP, the frontend sends a userId header.
// In production, this will be replaced with JWT verification.

const pool = require('../config/db');

const mockAuth = async (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'No user selected. Please login.' });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, d.name AS department_name
       FROM Users u
       LEFT JOIN Departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { mockAuth, requireRole };

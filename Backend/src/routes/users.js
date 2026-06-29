const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifyToken, invalidateCache } = require('../middlewares/auth');

router.use(verifyToken);

// GET /api/users/me — profile with submission stats
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userResult, statsResult] = await Promise.all([
      pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.updated_at, d.name AS department_name
         FROM Users u LEFT JOIN Departments d ON d.id = u.department_id
         WHERE u.id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT status, COUNT(*) AS count FROM Submissions WHERE user_id = $1 GROUP BY status`,
        [userId]
      ),
    ]);

    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found.' });

    const stats = {};
    for (const r of statsResult.rows) stats[r.status] = parseInt(r.count);

    res.json({
      success: true,
      data: {
        ...userResult.rows[0],
        stats: {
          total:     Object.values(stats).reduce((a, b) => a + b, 0),
          draft:     stats['Draft']     || 0,
          pending:   stats['Pending']   || 0,
          approved:  stats['Approved']  || 0,
          rejected:  stats['Rejected']  || 0,
          published: stats['Published'] || 0,
        },
      },
    });
  } catch (err) { next(err); }
});

// PATCH /api/users/me — update name only (email is immutable, role is system-assigned)
router.patch('/me', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
    if (name.trim().length > 100) return res.status(400).json({ error: 'Name too long.' });

    const result = await pool.query(
      `UPDATE Users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [name.trim(), req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    // Invalidate session cache so next request gets updated name
    invalidateCache(req.user.email);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;

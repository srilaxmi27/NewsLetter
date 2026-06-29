const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(requireRole('Admin'));

// GET /api/admin/stats — dashboard overview numbers
router.get('/stats', async (req, res, next) => {
  try {
    const deptId = req.user.department_id;

    const [userRows, submissionRows, newsletterRows] = await Promise.all([
      pool.query(
        `SELECT role, COUNT(*) AS count FROM Users WHERE department_id = $1 GROUP BY role`,
        [deptId]
      ),
      pool.query(
        `SELECT s.status, COUNT(*) AS count
         FROM Submissions s
         JOIN Users u ON u.id = s.user_id
         WHERE u.department_id = $1
         GROUP BY s.status`,
        [deptId]
      ),
      pool.query(
        `SELECT status, COUNT(*) AS count
         FROM Newsletters WHERE department_id = $1
         GROUP BY status`,
        [deptId]
      ),
    ]);

    const userCounts = {};
    for (const r of userRows.rows) userCounts[r.role] = parseInt(r.count);

    const subCounts = {};
    for (const r of submissionRows.rows) subCounts[r.status] = parseInt(r.count);

    const nlCounts = {};
    for (const r of newsletterRows.rows) nlCounts[r.status] = parseInt(r.count);

    res.json({
      success: true,
      data: {
        users: {
          students: userCounts['Student'] || 0,
          faculty:  userCounts['Faculty'] || 0,
          admins:   userCounts['Admin']   || 0,
          total:    (userCounts['Student'] || 0) + (userCounts['Faculty'] || 0) + (userCounts['Admin'] || 0),
        },
        submissions: {
          pending:   subCounts['Pending']   || 0,
          approved:  subCounts['Approved']  || 0,
          rejected:  subCounts['Rejected']  || 0,
          selected:  subCounts['Selected']  || 0,
          published: subCounts['Published'] || 0,
          draft:     subCounts['Draft']     || 0,
          total: Object.values(subCounts).reduce((a, b) => a + b, 0),
        },
        newsletters: {
          draft:     nlCounts['Draft']     || 0,
          published: nlCounts['Published'] || 0,
          archived:  nlCounts['Archived']  || 0,
          total: Object.values(nlCounts).reduce((a, b) => a + b, 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/recent-activity — last 20 submissions across all statuses
router.get('/recent-activity', async (req, res, next) => {
  try {
    const deptId = req.user.department_id;
    const result = await pool.query(
      `SELECT s.id, s.title, s.type, s.status, s.updated_at,
         u.name AS submitted_by, u.role AS submitter_role
       FROM Submissions s
       JOIN Users u ON u.id = s.user_id
       WHERE u.department_id = $1
       ORDER BY s.updated_at DESC
       LIMIT 20`,
      [deptId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

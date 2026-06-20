const pool = require('../config/db');

// ─────────────────────────────────────────────
// AuthService (Mock — No JWT in MVP)
// Returns all demo users grouped by department for the login page.
// ─────────────────────────────────────────────

const getAllDemoUsers = async () => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, d.name AS department
     FROM Users u
     LEFT JOIN Departments d ON u.department_id = d.id
     ORDER BY d.name, u.role, u.name`
  );
  return result.rows;
};

const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department
     FROM Users u
     LEFT JOIN Departments d ON u.department_id = d.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

module.exports = { getAllDemoUsers, getUserById };

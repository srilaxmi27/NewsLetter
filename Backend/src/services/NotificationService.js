const pool = require('../config/db');

// ─────────────────────────────────────────────
// NotificationService
// ─────────────────────────────────────────────

const createNotification = async (userId, type, message) => {
  await pool.query(
    `INSERT INTO Notifications (user_id, type, message)
     VALUES ($1, $2, $3)`,
    [userId, type, message]
  );
};

const getUserNotifications = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM Notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return result.rows;
};

const markAsRead = async (notificationId, userId) => {
  await pool.query(
    `UPDATE Notifications SET is_read = TRUE
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  await pool.query(
    `UPDATE Notifications SET is_read = TRUE WHERE user_id = $1`,
    [userId]
  );
};

const getUnreadCount = async (userId) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM Notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};

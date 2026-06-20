const NotificationService = require('../services/NotificationService');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.user.id);
    const unreadCount = await NotificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };

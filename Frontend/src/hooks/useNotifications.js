import { useState, useEffect } from 'react';
import api from '../services/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await api.patch('/notifications/read-all');
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead };
};

import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from '../utils/formatters';

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const typeColors = {
    APPROVAL:    'bg-green-500',
    REJECTION:   'bg-red-500',
    PUBLICATION: 'bg-purple-500',
    SYSTEM:      'bg-blue-500',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
      >
        <Bell size={20} className="text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 z-50 card shadow-2xl max-h-96 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto scrollbar-hidden flex-1 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      n.is_read ? 'opacity-50' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[n.type] || 'bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 leading-snug">{n.message}</p>
                      <p className="text-xs text-white/30 mt-1">{formatDistanceToNow(n.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;

import { useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from '../utils/formatters';

const TYPE_STYLES = {
  APPROVAL:    { dot: 'bg-emerald-400', bg: 'bg-emerald-50/60'  },
  REJECTION:   { dot: 'bg-red-400',     bg: 'bg-red-50/60'      },
  PUBLICATION: { dot: 'bg-primary-400', bg: 'bg-primary-50/60'  },
  SYSTEM:      { dot: 'bg-blue-400',    bg: 'bg-blue-50/60'     },
};

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl border border-ink-200 hover:bg-ink-50 transition-all"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-ink-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 bg-primary-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-76 z-50 bg-white border border-ink-200 rounded-xl shadow-card-lg max-h-96 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
              <h3 className="font-medium text-ink-800 text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-600">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto scrollbar-hidden flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell size={24} className="text-ink-300" />
                  <p className="text-sm text-ink-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM;
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      className={`flex gap-3 px-4 py-3 border-b border-ink-50 transition-colors
                        ${n.is_read ? 'opacity-50' : `${style.bg} cursor-pointer hover:brightness-[0.98]`}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-700 leading-snug">{n.message}</p>
                        <p className="text-2xs text-ink-400 mt-0.5">{formatDistanceToNow(n.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';

const POLL_INTERVAL_MS = 60 * 1000;

const TYPE_STYLES = {
  budget_alert: { icon: 'account_balance_wallet', className: 'bg-error-container text-on-error-container' },
  subscription_due: { icon: 'event_repeat', className: 'bg-secondary-container text-on-secondary-container' },
  anomaly: { icon: 'warning', className: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  system: { icon: 'info', className: 'bg-surface-container-high text-on-surface-variant' }
};

// created_at comes back as MySQL's local 'YYYY-MM-DD HH:MM:SS' (dateStrings),
// so parse it as local time rather than UTC.
function timeAgo(createdAt) {
  const date = new Date(String(createdAt).replace(' ', 'T'));
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notifications', { params: { limit: 20 } });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError('');
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setLoading(notifications.length === 0);
      load();
    }
    setOpen(!open);
  };

  const markRead = async (notification) => {
    if (notification.is_read) return;
    setNotifications((list) => list.map((n) => (n.notification_id === notification.notification_id ? { ...n, is_read: 1 } : n)));
    setUnreadCount((count) => Math.max(count - 1, 0));
    try {
      await apiClient.patch(`/notifications/${notification.notification_id}/read`);
    } catch {
      load();
    }
  };

  const markAllRead = async () => {
    setNotifications((list) => list.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      load();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative p-space-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
        type="button"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-semibold leading-[18px] text-center ring-2 ring-surface-container-lowest">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl bg-surface-container-lowest shadow-lg ring-1 ring-outline-variant z-[60] overflow-hidden"
        >
          <div className="flex items-center justify-between px-space-md py-space-sm border-b border-surface-variant">
            <span className="font-label-md text-label-md font-semibold text-on-surface">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="font-label-sm text-label-sm font-semibold text-secondary hover:underline"
                type="button"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="px-space-md py-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">Loading…</p>
            )}
            {!loading && error && (
              <p role="alert" className="px-space-md py-space-lg text-center font-body-sm text-body-sm text-error">{error}</p>
            )}
            {!loading && !error && notifications.length === 0 && (
              <div className="px-space-md py-space-lg flex flex-col items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[28px] text-outline">notifications_off</span>
                <span className="font-body-sm text-body-sm">You're all caught up.</span>
              </div>
            )}
            {!loading && notifications.map((n) => {
              const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
              return (
                <button
                  key={n.notification_id}
                  onClick={() => markRead(n)}
                  className={`w-full text-left flex items-start gap-space-sm px-space-md py-space-sm transition-colors hover:bg-surface-container-low ${n.is_read ? '' : 'bg-surface-container-low/60'}`}
                  type="button"
                >
                  <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${style.className}`}>
                    <span className="material-symbols-outlined text-[18px]">{style.icon}</span>
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className={`font-body-sm text-body-sm ${n.is_read ? 'text-on-surface-variant' : 'text-on-surface font-medium'}`}>
                      {n.message}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.is_read && <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-secondary" aria-label="Unread"></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

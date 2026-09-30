import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead, NotificationItem } from '../../api/comms';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(() => {
    fetchUnreadCount().then(setCount).catch(() => {});
  }, []);

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 60000);
    return () => clearInterval(t);
  }, [loadCount]);

  useEffect(() => {
    if (open) fetchNotifications().then(setItems).catch(() => {});
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function readOne(id: string) {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    loadCount();
  }

  async function readAll() {
    await markAllNotificationsRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    loadCount();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-input hover:bg-primary-light text-text-secondary">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface border border-border rounded-card shadow-elevated z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-semibold text-text-primary">Notifications</span>
            {count > 0 && (
              <button onClick={readAll} className="text-xs text-primary hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-3 py-6 text-sm text-text-muted text-center">No notifications yet.</div>
            )}
            {items.map((n) => (
              <button key={n.id} onClick={() => !n.read && readOne(n.id)}
                className={`w-full text-left px-3 py-2 border-b border-border last:border-b-0 hover:bg-gray-50 ${n.read ? 'opacity-60' : ''}`}>
                <div className="text-sm font-medium text-text-primary">{n.title}</div>
                {n.body && <div className="text-xs text-text-secondary">{n.body}</div>}
                <div className="text-[10px] text-text-muted mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
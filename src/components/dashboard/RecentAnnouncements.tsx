import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNewsFeed, NewsItem } from '../../api/comms';
import { Card } from '../ui/Card';
import { Megaphone } from 'lucide-react';

export function RecentAnnouncements() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetchNewsFeed().then((l) => setItems(l.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary">Recent Announcements</h3>
        <Link to="/communications" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="border-b border-border last:border-b-0 pb-2 last:pb-0">
            <div className="text-sm font-medium text-text-primary flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" /> {n.title}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString()} · {n.body.slice(0, 90)}{n.body.length > 90 ? '…' : ''}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-text-muted">No announcements yet.</p>}
      </div>
    </Card>
  );
}
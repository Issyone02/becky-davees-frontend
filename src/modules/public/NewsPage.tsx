import { useEffect, useState } from 'react';
import { PageHero } from '../../components/public/PageHero';

export function PublicNewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/public/news`).then((r) => (r.ok ? r.json() : null)).then((j) => setNews(j?.data ?? j ?? [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL}/public/events`).then((r) => (r.ok ? r.json() : null)).then((j) => setEvents(j?.data ?? j ?? [])).catch(() => {});
  }, []);

  return (
    <>
      <PageHero title="News & Events" subtitle="Announcements and upcoming activities" />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold mb-4">News & Announcements</h2>
          {news.length === 0 && <p className="text-text-muted">No public announcements yet.</p>}
          <div className="space-y-4">
            {news.map((n) => (
              <article key={n.id} className="card">
                <div className="font-semibold text-text-primary">{n.title}</div>
                <div className="text-sm text-text-secondary mt-1 whitespace-pre-line">{n.body}</div>
                <div className="text-xs text-text-muted mt-2">{new Date(n.publishedAt).toLocaleDateString()} · {n.author?.fullName}</div>
              </article>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
          {events.length === 0 && <p className="text-text-muted">No upcoming public events.</p>}
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="card flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{e.title}</div>
                  {e.location && <div className="text-xs text-text-muted">{e.location}</div>}
                </div>
                <div className="text-sm text-text-secondary shrink-0">{new Date(e.startDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
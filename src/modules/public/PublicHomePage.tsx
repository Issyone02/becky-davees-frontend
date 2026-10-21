import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolInfo } from '../../hooks/useSchoolInfo';
import { useBrandColor } from '../../hooks/useBrandColor';

export function PublicHomePage() {
  const info = useSchoolInfo();
  const brandColor = useBrandColor();
  const [news, setNews] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/public/news`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setNews(((j?.data ?? j) as any[] ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);
  const schoolName = info?.schoolName ?? 'Our School';

  return (
    <div>
      <section className="px-4 py-16 text-center" style={{ backgroundColor: `${brandColor}12` }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Welcome to {schoolName}</h1>
          {info?.motto && <p className="mt-3 text-lg italic text-text-secondary">{info.motto}</p>}
          {info?.address && <p className="mt-2 text-sm text-text-muted">{info.address}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/admissions" className="px-6 py-3 rounded-input text-white font-semibold" style={{ backgroundColor: brandColor }}>Apply for Admission</Link>
            <Link to="/contact" className="px-6 py-3 rounded-input border border-border bg-white font-semibold">Contact Us</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          ['Academic Excellence', 'A rigorous curriculum delivered by dedicated teachers, with continuous assessment and transparent reporting.'],
          ['Safe & Caring Environment', 'A nurturing community where every child is known, valued and supported to grow.'],
          ['Modern Record Keeping', 'Attendance, results, report cards and fees managed digitally — every document verifiable at a scan.'],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <div className="font-bold mb-1">{t}</div>
            <div className="text-sm text-text-secondary">{d}</div>
          </div>
        ))}
      </section>

      {news.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <Link to="/news" className="text-sm font-medium" style={{ color: brandColor }}>View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {news.map((n) => (
              <div key={n.id} className="card">
                <div className="font-semibold">{n.title}</div>
                <div className="text-sm text-text-secondary line-clamp-3 mt-1">{n.body}</div>
                <div className="text-xs text-text-muted mt-2">{new Date(n.publishedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
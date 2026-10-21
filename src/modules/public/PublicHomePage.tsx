import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolInfo } from '../../hooks/useSchoolInfo';
import { useBrandColor } from '../../hooks/useBrandColor';
import { GraduationCap, HeartHandshake, ShieldCheck, BookOpen, Trophy, Users, Sparkles } from 'lucide-react';

// EDIT these to your school's real numbers.
const STATS = [
  { value: '20+', label: 'Years of Excellence' },
  { value: '500+', label: 'Happy Students' },
  { value: '40+', label: 'Dedicated Staff' },
  { value: '98%', label: 'Exam Success Rate' },
];

const FEATURES = [
  { icon: GraduationCap, title: 'Academic Excellence', text: 'A rigorous curriculum with continuous assessment and transparent, verifiable reporting.' },
  { icon: HeartHandshake, title: 'Caring Community', text: 'Every child is known, valued and supported by a dedicated class teacher.' },
  { icon: ShieldCheck, title: 'Safe Environment', text: 'A secure, disciplined and nurturing space for your child to grow.' },
  { icon: BookOpen, title: 'Rich Curriculum', text: 'Broad subjects from early years to senior secondary, plus co-curricular activities.' },
  { icon: Trophy, title: 'Proven Results', text: 'Consistently strong termly outcomes and confident, well-rounded graduates.' },
  { icon: Users, title: 'Engaged Parents', text: 'A live parent portal for attendance, results, fees and report cards.' },
];

// EDIT these testimonials with real quotes from your parents.
const TESTIMONIALS = [
  { quote: 'The teachers truly know my child. The online report card and portal keep me involved every single term.', name: 'Parent, Primary 4' },
  { quote: 'Discipline, warmth and excellent academics. Moving our children here was the best decision we made.', name: 'Parent, Junior Secondary' },
  { quote: 'I can check attendance and fees from my phone. It feels like the school is always within reach.', name: 'Parent, Primary 2' },
];

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
      {/* Hero */}
      <section className="px-4 py-20 text-center text-white" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-4">
            <Sparkles className="h-3 w-3" /> Admissions open for the new session
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Welcome to {schoolName}</h1>
          {info?.motto && <p className="mt-3 text-lg italic text-white/90">{info.motto}</p>}
          {info?.address && <p className="mt-2 text-sm text-white/75">{info.address}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/admissions" className="px-6 py-3 rounded-input bg-white font-semibold shadow" style={{ color: brandColor }}>Apply for Admission</Link>
            <Link to="/contact" className="px-6 py-3 rounded-input border border-white/60 font-semibold text-white">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold" style={{ color: brandColor }}>{s.value}</div>
              <div className="text-xs text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold">Why families choose us</h2>
          <p className="text-text-secondary mt-1">Six promises we make to every child who walks through our gates.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card flex gap-3 items-start">
              <div className="h-10 w-10 rounded-input flex items-center justify-center text-white shrink-0" style={{ backgroundColor: brandColor }}>
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">{f.title}</div>
                <div className="text-sm text-text-secondary mt-1">{f.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* News */}
      {news.length > 0 && (
        <section className="bg-white border-y border-border">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold">Latest News & Events</h2>
              <Link to="/news" className="text-sm font-medium" style={{ color: brandColor }}>View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {news.map((n) => (
                <div key={n.id} className="card border border-border">
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-text-secondary line-clamp-3 mt-1">{n.body}</div>
                  <div className="text-xs text-text-muted mt-2">{new Date(n.publishedAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold">What parents say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card border border-border bg-white">
              <blockquote className="text-sm text-text-secondary">"{t.quote}"</blockquote>
              <figcaption className="mt-3 text-xs font-semibold" style={{ color: brandColor }}>— {t.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
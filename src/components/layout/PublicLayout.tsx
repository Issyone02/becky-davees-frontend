import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSchoolInfo } from '../../hooks/useSchoolInfo';
import { useBrandColor } from '../../hooks/useBrandColor';
import { useAuthStore } from '../../store/auth.store';
import { assetUrl } from '../../utils/assetUrl';
import { Phone, Mail, MapPin } from 'lucide-react';

const links = [
  { to: '/home', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' },
  { to: '/admissions', label: 'Admissions' },
  { to: '/news', label: 'News & Events' },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout() {
  const info = useSchoolInfo();
  const brandColor = useBrandColor();
  const user = useAuthStore((s) => s.user);
  const schoolName = info?.schoolName ?? 'Our School';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-text-primary">
      {/* Top utility bar */}
      <div className="hidden md:block text-white text-xs" style={{ backgroundColor: brandColor }}>
        <div className="max-w-6xl mx-auto px-4 h-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            {info?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {info.phone}</span>}
            {info?.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {info.email}</span>}
          </div>
          {info?.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {info.address}</span>}
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/home" className="flex items-center gap-3 min-w-0">
            {info?.logoUrl ? (
              <img src={assetUrl(info.logoUrl)!} alt={`${schoolName} logo`} className="h-11 w-11 object-contain" />
            ) : (
              <div className="h-11 w-11 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: brandColor }}>
                {schoolName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-extrabold truncate" style={{ color: brandColor }}>{schoolName}</div>
              {info?.motto && <div className="text-[11px] italic text-text-muted truncate">{info.motto}</div>}
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `px-3 py-2 rounded-input text-sm font-medium ${isActive ? 'text-white' : 'text-text-secondary hover:bg-gray-100'}`}
                style={({ isActive }) => (isActive ? { backgroundColor: brandColor } : undefined)}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <Link to={user ? '/' : '/login'}
            className="shrink-0 px-4 py-2 rounded-input text-sm font-semibold text-white shadow"
            style={{ backgroundColor: brandColor }}>
            {user ? 'Open Dashboard' : 'Portal Login'}
          </Link>
        </div>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `px-3 py-1.5 rounded-input text-xs font-medium whitespace-nowrap ${isActive ? 'text-white' : 'text-text-secondary bg-gray-100'}`}
              style={({ isActive }) => (isActive ? { backgroundColor: brandColor } : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Call-to-action band */}
      <div className="text-white" style={{ backgroundColor: brandColor }}>
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-extrabold">Ready to join our family?</div>
            <div className="text-white/85 text-sm mt-1">Admissions are open for the new session. We would love to meet your child.</div>
          </div>
          <div className="flex gap-3">
            <Link to="/admissions" className="px-5 py-3 rounded-input bg-white font-semibold" style={{ color: brandColor }}>Apply Now</Link>
            <Link to="/contact" className="px-5 py-3 rounded-input border border-white/60 font-semibold text-white">Talk to Us</Link>
          </div>
        </div>
      </div>

      {/* Rich footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {info?.logoUrl && <img src={assetUrl(info.logoUrl)!} alt="" className="h-9 w-9 object-contain bg-white rounded p-0.5" />}
              <span className="font-extrabold text-white">{schoolName}</span>
            </div>
            {info?.motto && <p className="italic text-gray-400">{info.motto}</p>}
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Explore</div>
            <ul className="space-y-1">
              {links.slice(1).map((l) => (
                <li key={l.to}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Contact</div>
            <ul className="space-y-1 text-gray-400">
              {info?.address && <li>{info.address}</li>}
              {info?.phone && <li>{info.phone}</li>}
              {info?.email && <li>{info.email}</li>}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Portal</div>
            <p className="text-gray-400 mb-3">Staff and parents access results, attendance, fees and report cards here.</p>
            <Link to={user ? '/' : '/login'} className="inline-block px-4 py-2 rounded-input text-white font-semibold" style={{ backgroundColor: brandColor }}>
              {user ? 'Open Dashboard' : 'Portal Login'}
            </Link>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500 flex flex-col md:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} {schoolName}. All rights reserved.</span>
            <span>Powered by SchoolMS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
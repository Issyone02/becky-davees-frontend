import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSchoolInfo } from '../../hooks/useSchoolInfo';
import { useBrandColor } from '../../hooks/useBrandColor';
import { useAuthStore } from '../../store/auth.store';
import { assetUrl } from '../../utils/assetUrl';

const links = [
  { to: '/', label: 'Home', end: true },
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
    <div className="min-h-screen flex flex-col bg-white text-text-primary">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            {info?.logoUrl ? (
              <img src={assetUrl(info.logoUrl)!} alt={`${schoolName} logo`} className="h-10 w-10 object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: brandColor }}>
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
            className="shrink-0 px-4 py-2 rounded-input text-sm font-semibold text-white"
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

      <footer className="border-t border-border bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-extrabold mb-1" style={{ color: brandColor }}>{schoolName}</div>
            {info?.motto && <div className="italic text-text-secondary">{info.motto}</div>}
          </div>
          <div className="text-text-secondary space-y-1">
            {info?.address && <div>{info.address}</div>}
            {info?.phone && <div>{info.phone}</div>}
            {info?.email && <div>{info.email}</div>}
          </div>
          <div className="text-text-muted">© {new Date().getFullYear()} {schoolName}. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
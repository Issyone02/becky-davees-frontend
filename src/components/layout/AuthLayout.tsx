import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { previewRoleTheme } from '../../utils/themePreview';
import { useSchoolInfo } from '../../hooks/useSchoolInfo';
import { useBrandColor } from '../../hooks/useBrandColor';
import { assetUrl } from '../../utils/assetUrl';

function LoginThemePreview() {
  useEffect(() => {
    const handler = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (!t || t.tagName !== 'INPUT' || t.type === 'password') return;
      previewRoleTheme(t.value ?? '');
    };
    document.addEventListener('input', handler);
    return () => document.removeEventListener('input', handler);
  }, []);
  return null; // renders NOTHING — no extra section, no duplication
}

export function AuthLayout() {
  const info = useSchoolInfo();
  const brandColor = useBrandColor();
  const year = new Date().getFullYear();
  const schoolName = info?.schoolName ?? 'Our School';
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-primary-light/20">
      <LoginThemePreview />

      {/* Brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between p-10" style={{ backgroundColor: `${brandColor}15` }}>
        <div className="flex items-center gap-3 min-w-0">
          {info?.logoUrl ? (
            <img src={assetUrl(info.logoUrl)!} alt={`${schoolName} logo`}
              className="h-10 w-10 rounded-card object-contain bg-white border border-border shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-card bg-primary text-white font-bold flex items-center justify-center shrink-0">
              {schoolName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-lg font-bold text-text-primary truncate">{schoolName}</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-text-primary leading-tight">
            Get Started With Your<br />
            <span style={{ color: brandColor }}>Account</span>
          </h1>
          <p className={`mt-3 max-w-md text-text-secondary ${info?.motto ? 'italic' : ''}`}>
            {info?.motto ?? 'Smart insights, better decisions. Manage your school with confidence.'}
          </p>
        </div>
        <div className="text-sm text-text-muted">© {year} {schoolName}</div>
      </div>

      {/* Form panel — the ONLY Outlet */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
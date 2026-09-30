import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { previewRoleTheme } from '../../utils/themePreview';

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
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-primary-light/20">
      <LoginThemePreview />

      {/* Brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary-light/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-card bg-primary text-white font-bold flex items-center justify-center">S</div>
          <span className="text-lg font-bold text-text-primary">SchoolMS</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-text-primary leading-tight">
            Get Started With Your<br />
            <span className="text-primary">Account</span>
          </h1>
          <p className="text-text-secondary mt-3 max-w-md">
            Smart insights, better decisions. Manage your school with confidence.
          </p>
        </div>
        <div className="text-sm text-text-muted">© 2026 School Management System</div>
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
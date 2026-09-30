import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../store/auth.store';
import { useSessionGuard } from '../../hooks/useSessionGuard';

export function DashboardLayout() {
  const { user } = useAuthStore();
  useSessionGuard();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) document.documentElement.setAttribute('data-role', user.role);
  }, [user?.role]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
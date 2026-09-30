import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';
import { assetUrl } from '../../utils/assetUrl';
import {
  LayoutDashboard, Users, GraduationCap, UserCheck, BookOpen, ClipboardList,
  CalendarDays, FileText, DollarSign, Newspaper, BarChart3, Settings, LogOut,
  ClipboardCheck, UserCog, X, Megaphone, MessageSquare, Inbox, UserCircle
} from 'lucide-react';

const navByRole: Record<string, { label: string; to: string; icon: any }[]> = {
    SUPER_ADMIN: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Students', to: '/students', icon: GraduationCap },
    { label: 'Teachers', to: '/teachers', icon: Users },
    { label: 'Parents', to: '/parents', icon: UserCheck },
    { label: 'Approvals', to: '/registrations', icon: ClipboardCheck },
    { label: 'Attendance', to: '/attendance', icon: ClipboardList },
    { label: 'Academics', to: '/classes', icon: BookOpen },
    { label: 'Report Cards', to: '/report-cards', icon: FileText },
    { label: 'Promotions', to: '/promotions', icon: GraduationCap },
    { label: 'Finance', to: '/finance', icon: DollarSign },
    { label: 'Timetable', to: '/timetable', icon: CalendarDays },
    { label: 'News & Events', to: '/communications', icon: Megaphone },
    { label: 'Feedback Inbox', to: '/feedback-inbox', icon: Inbox },
    { label: 'User Management', to: '/users', icon: UserCog },
    { label: 'Audit Logs', to: '/audit', icon: FileText },
    { label: 'System', to: '/system', icon: Settings },
    { label: 'My Account', to: '/account', icon: UserCircle },
  ],
  ADMIN: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Students', to: '/students', icon: GraduationCap },
    { label: 'Teachers', to: '/teachers', icon: Users },
    { label: 'Parents', to: '/parents', icon: UserCheck },
    { label: 'Approvals', to: '/registrations', icon: ClipboardCheck },
    { label: 'Classes', to: '/classes', icon: BookOpen },
    { label: 'Attendance', to: '/attendance', icon: ClipboardList },
    { label: 'Academics', to: '/academics', icon: FileText },
    { label: 'Finance', to: '/finance', icon: DollarSign },
    { label: 'Timetable', to: '/timetable', icon: CalendarDays },
    { label: 'News & Events', to: '/communications', icon: Newspaper },
    { label: 'Feedback Inbox', to: '/feedback-inbox', icon: Inbox },
    { label: 'Report Cards', to: '/report-cards', icon: FileText },
    { label: 'Promotions', to: '/promotions', icon: GraduationCap },
    { label: 'Settings', to: '/settings', icon: Settings },
    { label: 'My Account', to: '/account', icon: UserCircle },
  ],
  TEACHER: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'My Classes', to: '/my-classes', icon: BookOpen },
    { label: 'My Students', to: '/my-students', icon: Users },
    { label: 'Attendance', to: '/attendance', icon: ClipboardList },
    { label: 'Academics', to: '/academics', icon: FileText },
    { label: 'Report Cards', to: '/report-cards', icon: FileText },
    { label: 'Timetable', to: '/timetable', icon: CalendarDays },
    { label: 'Announcements', to: '/announcements', icon: Newspaper },
    { label: 'Feedback', to: '/feedback', icon: MessageSquare },
    { label: 'My Account', to: '/account', icon: UserCircle },
  ],
    PARENT: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'My Children', to: '/children', icon: Users },
    { label: 'Attendance', to: '/child/attendance', icon: ClipboardCheck },
    { label: 'Results', to: '/child/results', icon: BookOpen },
    { label: 'Report Cards', to: '/child/report-cards', icon: FileText },
    { label: 'Fees', to: '/fees', icon: DollarSign },
    { label: 'News & Events', to: '/news', icon: Megaphone },
    { label: 'Feedback', to: '/feedback', icon: MessageSquare },
    { label: 'My Account', to: '/account', icon: UserCircle },

  ],
};

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore();
  if (!user) return null;
  const items = navByRole[user.role] ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">S</div>
          <div>
            <div className="font-bold text-text-primary">SchoolMS</div>
            <div className="text-xs text-text-muted capitalize">{user.role.replace('_', ' ')}</div>
          </div>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="p-1 text-text-muted"><X className="h-5 w-5" /></button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-input text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white shadow-elevated'
                : 'text-text-secondary hover:bg-primary-light hover:text-primary',
            )}
          >
            <it.icon className="h-5 w-5" />
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          {user.profilePictureUrl ? (
            <img src={assetUrl(user.profilePictureUrl)!} alt={user.fullName}
              className="h-9 w-9 rounded-full object-cover border border-border bg-white" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">{user.fullName}</div>
            <div className="text-xs text-text-muted truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-red-50 hover:text-red-600 rounded-input"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:block w-64 bg-surface border-r border-border h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface shadow-elevated">
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
import { GlobalSearch } from './GlobalSearch';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { NotificationBell } from './NotificationBell';
import { InstallAppButton } from './InstallAppButton';
import { assetUrl } from '../../utils/assetUrl';

interface TopbarProps {
  onMenu?: () => void;
  onMenuClick?: () => void;
}

export function Topbar({ onMenu, onMenuClick }: TopbarProps) {
  const { user } = useAuthStore();
  const openMenu = onMenuClick ?? onMenu;
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur border-b border-border flex items-center justify-between gap-4 px-4 md:px-6 w-full">
      {/* Left: menu + stretching search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {openMenu && (
          <button onClick={openMenu} title="Open menu"
            className="lg:hidden p-2 rounded-input hover:bg-primary-light text-text-secondary shrink-0">
            <Menu className="h-5 w-5" />
          </button>
        )}
        <GlobalSearch />
      </div>

      {/* Right: bell + profile, pinned to the far-right corner */}
      <div className="flex items-center gap-3 shrink-0">
        <InstallAppButton />
        <NotificationBell />
        <div className="flex items-center gap-2">
          {user.profilePictureUrl ? (
            <img src={assetUrl(user.profilePictureUrl)!} alt={user.fullName}
              className="h-9 w-9 rounded-full object-cover border border-border bg-white" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold text-text-primary">{user.fullName}</div>
            <div className="text-[11px] text-text-muted uppercase">{user.role.replace(/_/g, ' ')}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
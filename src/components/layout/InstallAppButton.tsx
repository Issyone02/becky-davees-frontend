import { Download } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export function InstallAppButton() {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  if (!canInstall || installed) return null;
  return (
    <button
      onClick={() => promptInstall()}
      title="Install Becky Davees School on this device"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
    >
      <Download className="h-4 w-4" /> Install App
    </button>
  );
}
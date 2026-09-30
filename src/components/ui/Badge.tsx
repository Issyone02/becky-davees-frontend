import { cn } from '../../utils/cn';

type Status = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
const map: Record<Status, string> = {
  success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger',
  info: 'badge-info', neutral: 'badge-neutral',
};

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return <span className={cn('badge', map[status])}>{label}</span>;
}
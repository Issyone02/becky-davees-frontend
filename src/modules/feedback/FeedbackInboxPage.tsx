import { useCallback, useEffect, useState } from 'react';
import * as fb from '../../api/feedback';
import { CATEGORY_LABELS, priorityBadge, statusBadge, FeedbackDetailModal } from './FeedbackPage';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { Search } from 'lucide-react';

export function FeedbackInboxPage() {
  const [rows, setRows] = useState<fb.FeedbackItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(() => {
    fb.fetchFeedbackAdmin({
      page, pageSize: 10,
      search: search || undefined, status: status || undefined,
      category: category || undefined, priority: priority || undefined,
    }).then(({ items, meta: m }) => { setRows(items); setMeta(m ?? { page: 1, totalPages: 1, total: 0 }); })
      .catch(console.error);
  }, [page, search, status, category, priority]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, category, priority]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Feedback Inbox</h1>
        <p className="text-text-secondary">All parent & teacher feedback — reply, track and resolve.</p>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search subject, message, person..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Select label="Status" placeholder="All statuses" value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{ value: 'OPEN', label: 'Open' }, { value: 'IN_PROGRESS', label: 'In Progress' }, { value: 'RESOLVED', label: 'Resolved' }, { value: 'CLOSED', label: 'Closed' }]} />
          <Select label="Category" placeholder="All categories" value={category} onChange={(e) => setCategory(e.target.value)}
            options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} />
          <Select label="Priority" placeholder="All priorities" value={priority} onChange={(e) => setPriority(e.target.value)}
            options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' }]} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table headers={['Date', 'From', 'Subject', 'Category', 'Priority', 'Status', 'Replies']}>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailId(r.id)}>
              <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-text-primary">{r.user?.fullName}</div>
                <div className="text-xs text-text-muted">{r.user?.role}</div>
              </td>
              <td className="px-4 py-3 text-sm text-text-primary max-w-[220px] truncate">{r.subject}</td>
              <td className="px-4 py-3"><span className="badge badge-neutral">{CATEGORY_LABELS[r.category] ?? r.category}</span></td>
              <td className="px-4 py-3">{priorityBadge(r.priority)}</td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
              <td className="px-4 py-3 text-text-secondary">{r._count?.replies ?? 0}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-text-muted">No feedback matches your filters.</td></tr>
          )}
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <FeedbackDetailModal id={detailId} onClose={() => setDetailId(null)} onSaved={load} isAdmin />
    </div>
  );
}
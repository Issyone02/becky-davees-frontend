import { useCallback, useEffect, useState } from 'react';
import client from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { Search, Eye } from 'lucide-react';

export function AuditLogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<any | null>(null);

  const load = useCallback(() => {
    client.get('/audit', { params: { page, pageSize: 15, search: search || undefined } })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta ?? { page: 1, totalPages: 1, total: 0 }); })
      .catch(console.error);
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
        <p className="text-text-secondary">Immutable record of every sensitive action in the system.</p>
      </div>

      <Card className="mb-4">
        <Input placeholder="Search action, entity, user..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table headers={['Time', 'User', 'Action', 'Entity', 'IP', '']}>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-text-primary">{r.user?.fullName ?? 'System'}</div>
                <div className="text-xs text-text-muted">{r.userRole ?? ''}</div>
              </td>
              <td className="px-4 py-3"><span className="badge badge-neutral">{r.action}</span></td>
              <td className="px-4 py-3 text-sm text-text-secondary">{r.entityType}{r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ''}</td>
              <td className="px-4 py-3 text-xs text-text-muted">{r.ipAddress ?? '—'}</td>
              <td className="px-4 py-3">
                <button onClick={() => setDetail(r)} className="p-2 rounded-input hover:bg-primary-light text-primary" title="View details">
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No audit entries match your search.</td></tr>
          )}
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Audit Detail — ${detail?.action ?? ''}`} wide>
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-text-secondary">
              <div>Time: <strong>{new Date(detail.createdAt).toLocaleString()}</strong></div>
              <div>User: <strong>{detail.user?.fullName ?? 'System'} ({detail.userRole ?? '—'})</strong></div>
              <div>Entity: <strong>{detail.entityType}</strong></div>
              <div>IP: <strong>{detail.ipAddress ?? '—'}</strong></div>
            </div>
            {detail.beforeValues && (
              <div>
                <div className="font-semibold text-text-primary mb-1">Before</div>
                <pre className="bg-gray-50 border border-border rounded-input p-3 text-xs overflow-x-auto">{JSON.stringify(JSON.parse(detail.beforeValues), null, 2)}</pre>
              </div>
            )}
            {detail.afterValues && (
              <div>
                <div className="font-semibold text-text-primary mb-1">After</div>
                <pre className="bg-gray-50 border border-border rounded-input p-3 text-xs overflow-x-auto">{JSON.stringify(JSON.parse(detail.afterValues), null, 2)}</pre>
              </div>
            )}
            <div className="flex justify-end"><Button variant="secondary" onClick={() => setDetail(null)}>Close</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
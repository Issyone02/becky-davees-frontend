import { useCallback, useEffect, useState } from 'react';
import { fetchParents, fetchStudents, createUser, updateAccountStatus, deleteAccount, Student, ParentItem } from '../../api/people';
import { AccountFormModal } from '../teachers/TeachersPage';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Trash2, Power, PowerOff } from 'lucide-react';

export function ParentsPage() {
  const [items, setItems] = useState<ParentItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [detailFor, setDetailFor] = useState<ParentItem | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchParents({ page, pageSize: 10, search: search || undefined });
      setItems(res.items);
      setMeta(res.meta);
    } catch (e) {
      console.error(e);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Parents / Guardians</h1>
          <p className="text-text-secondary">Manage guardian accounts and their children.</p>
        </div>
        <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add Parent</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <Input placeholder="Search parents..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />} className="md:max-w-xs" />
        </div>
        <Table headers={['Code', 'Name', 'Email', 'Children', 'Status', 'Actions']}>
          {items.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailFor(p)}>
              <td className="px-4 py-3 font-medium text-text-primary">{p.parentCode}</td>
              <td className="px-4 py-3 text-text-primary">{p.user.fullName}</td>
              <td className="px-4 py-3 text-text-secondary">{p.user.email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {p.students.length === 0 && <span className="text-text-muted">—</span>}
                  {p.students.map((s) => (
                    <span key={s.studentId} className="badge badge-neutral">{s.student.fullName}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  status={p.user.status === 'ACTIVE' ? 'success' : p.user.status === 'DEACTIVATED' ? 'danger' : 'warning'}
                  label={p.user.status.toLowerCase()}
                />
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1">
                  {p.user.status === 'ACTIVE' ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Deactivate this PARENT account? Login is blocked immediately; all archived records (receipts, payments, feedback) remain intact.')) {
                          await updateAccountStatus(p.user.id, 'DEACTIVATED');
                          load();
                        }
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 text-amber-600" title="Deactivate">
                      <PowerOff className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Reactivate this parent account?')) {
                          await updateAccountStatus(p.user.id, 'ACTIVE');
                          load();
                        }
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 text-green-600" title="Reactivate">
                      <Power className="h-4 w-4" />
                    </button>
                  )}
                  {!p.user.deletedAt && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('DELETE this PARENT account? It disappears from lists and can never log in; all archived records (receipts, payments, feedback, guardian names on historical documents) remain intact.')) {
                          await deleteAccount(p.user.id);
                          load();
                        }
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 text-red-600" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No parents found.</td></tr>
          )}
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <AccountFormModal open={open} onClose={() => setOpen(false)} onSaved={load} role="PARENT" title="Add Parent / Guardian" />
      <ParentDetailModal parent={detailFor} onClose={() => setDetailFor(null)} />
    </div>
  );
}function ParentDetailModal({ parent, onClose }: { parent: ParentItem | null; onClose: () => void }) {
  const [rows, setRows] = useState<{ relationship: string; isPrimary: boolean; student: Student }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parent) return;
    setLoading(true);
    setError(null);
    setRows([]);
    fetchStudents({ page: 1, pageSize: 500 })
      .then((res) => {
        const mine = res.items
          .filter((s) => (s.parents ?? []).some((ps: any) => ps.parent?.id === parent.id))
          .map((s) => {
            const link: any = (s.parents ?? []).find((ps: any) => ps.parent?.id === parent.id);
            return { relationship: link?.relationship ?? 'guardian', isPrimary: !!link?.isPrimary, student: s };
          })
          .sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
        setRows(mine);
      })
      .catch((e: any) => setError(e?.response?.data?.error?.message ?? 'Failed to load linked students'))
      .finally(() => setLoading(false));
  }, [parent]);

  return (
    <Modal open={!!parent} onClose={onClose} title={`Children of ${parent?.user.fullName ?? ''}`} wide>
      <div className="space-y-4">
        {parent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm bg-gray-50 rounded-input p-3">
            <div><span className="text-text-muted">Parent Code:</span> <strong>{parent.parentCode}</strong></div>
            <div><span className="text-text-muted">Email:</span> <strong>{parent.user.email}</strong></div>
            <div><span className="text-text-muted">Phone:</span> <strong>{parent.user.phone ?? '—'}</strong></div>
          </div>
        )}
        {loading && <p className="text-sm text-text-muted">Loading linked students…</p>}
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        {!loading && !error && (rows.length === 0 ? (
          <p className="text-sm text-text-muted">
            No students are linked to this parent yet. Use Students → Manage guardians to link children.
          </p>
        ) : (
          <Table headers={['Student ID', 'Admission No', 'Name', 'Class', 'Gender', 'Status', 'Relationship']}>
            {rows.map((r) => (
              <tr key={r.student.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-text-primary">{r.student.studentId}</td>
                <td className="px-4 py-3 text-text-secondary">{r.student.admissionNumber}</td>
                <td className="px-4 py-3 text-text-primary">{r.student.fullName}</td>
                <td className="px-4 py-3 text-text-secondary">{r.student.class?.name ?? '—'}</td>
                <td className="px-4 py-3 text-text-secondary capitalize">{(r.student.gender ?? '').toLowerCase()}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.student.status === 'active' ? 'success' : 'neutral'} label={r.student.status} />
                </td>
                <td className="px-4 py-3 text-text-secondary capitalize">
                  {r.relationship}{r.isPrimary ? ' · primary' : ''}
                </td>
              </tr>
            ))}
          </Table>
        ))}
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
import { useCallback, useEffect, useState } from 'react';
import { fetchTeachers, createUser, TeacherItem, updateAccountStatus, deleteAccount } from '../../api/people';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Trash2, Power, PowerOff, MoreVertical } from 'lucide-react';


export function TeachersPage() {
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchTeachers({ page, pageSize: 10, search: search || undefined });
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
          <h1 className="text-2xl font-bold text-text-primary">Teachers</h1>
          <p className="text-text-secondary">Manage teaching staff accounts.</p>
        </div>
        <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Add Teacher</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <Input placeholder="Search teachers..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />} className="md:max-w-xs" />
        </div>
        <Table headers={['Code', 'Name', 'Email', 'Phone', 'Status', 'Actions']}>
          {items.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{t.teacherCode}</td>
              <td className="px-4 py-3 text-text-primary">{t.user.fullName}</td>
              <td className="px-4 py-3 text-text-secondary">{t.user.email}</td>
              <td className="px-4 py-3 text-text-secondary">{t.user.phone ?? '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  status={t.user.status === 'ACTIVE' ? 'success' : t.user.status === 'DEACTIVATED' ? 'danger' : 'warning'}
                  label={t.user.status.toLowerCase()}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {t.user.status === 'ACTIVE' ? (
                    <button
                                           onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Deactivate this TEACHER account? Login is blocked immediately; all archived records (receipts, payments, feedback) remain intact.')) {
                          await updateAccountStatus(t.user.id, 'DEACTIVATED');
                          load();
                        }
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 text-amber-600"
                      title="Deactivate"
                    >
                      <PowerOff className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Reactivate this teacher account?')) {
                          await updateAccountStatus(t.user.id, 'ACTIVE');
                          load();
                        }
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 text-green-600"
                      title="Reactivate"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  )}
                  {!t.user.deletedAt && (
                    <button
                                            onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('DELETE this TEACHER account? It disappears from lists and can never log in; all archived records (results entered, report cards signed, audit logs) remain intact.')) {
                          await deleteAccount(t.user.id);
                          load();
                        }
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No teachers found.</td></tr>
          )}
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <AccountFormModal open={open} onClose={() => setOpen(false)} onSaved={load} role="TEACHER" title="Add Teacher" />
    </div>
  );
}

export function AccountFormModal({ open, onClose, onSaved, role, title }: {
  open: boolean; onClose: () => void; onSaved: () => void; role: 'TEACHER' | 'PARENT'; title: string;
}) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createUser({ ...form, role });
      onSaved();
      onClose();
      setForm({ fullName: '', email: '', phone: '', password: '' });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Temporary Password" type="text" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Min 8 chars, upper + lower + digit" required />
        <p className="text-xs text-text-muted">
          The user will be required to change this password on first login.
        </p>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Account</Button>
        </div>
      </form>
    </Modal>
  );
}
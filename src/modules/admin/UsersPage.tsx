import { useCallback, useEffect, useState } from 'react';
import client from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Search } from 'lucide-react';

interface UserRow {
  id: string; fullName: string; email: string; username: string | null; phone: string | null;
  role: string; status: string; mustChangePassword: boolean; lastLoginAt: string | null; createdAt: string;
}

const statusBadge = (s: string) =>
  s === 'ACTIVE' ? <StatusBadge status="success" label="Active" /> :
  s === 'PENDING' ? <StatusBadge status="warning" label="Pending" /> :
  s === 'SUSPENDED' ? <StatusBadge status="danger" label="Suspended" /> :
  <StatusBadge status="neutral" label={s} />;

export function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'role' | 'status' | 'reset' | null>(null);
  const [target, setTarget] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ role: 'TEACHER', status: 'ACTIVE' });
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    client.get('/users', { params: { page, pageSize: 10, search: search || undefined, role: role || undefined, status: status || undefined } })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta ?? { page: 1, totalPages: 1, total: 0 }); })
      .catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [page, search, role, status]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { setPage(1); }, [search, role, status]);

  function openModal(m: 'role' | 'status' | 'reset', u: UserRow) {
    setTarget(u); setModal(m); setTempPwd(null); setError(null);
    setForm({ role: u.role, status: u.status });
  }

  async function submit() {
    if (!target) return;
    setBusy(true); setError(null);
    try {
      if (modal === 'role') await client.patch(`/users/${target.id}/role`, { role: form.role });
      if (modal === 'status') await client.patch(`/users/${target.id}/status`, { status: form.status });
      if (modal === 'reset') {
        const { data } = await client.post(`/users/${target.id}/reset-password`);
        setTempPwd(data.data.temporaryPassword);
      }
      if (modal !== 'reset') setModal(null);
      load();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
        <p className="text-text-secondary">All platform accounts, roles and access control.</p>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Search name, email or username..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          <Select label="Role" placeholder="All roles" value={role} onChange={(e) => setRole(e.target.value)}
            options={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT'].map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
          <Select label="Status" placeholder="All statuses" value={status} onChange={(e) => setStatus(e.target.value)}
            options={['ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED'].map((s) => ({ value: s, label: s }))} />
        </div>
      </Card>

      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}

      <Card className="p-0 overflow-hidden">
        <Table headers={['User', 'Role', 'Status', 'Last Login', 'Actions']}>
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-text-primary">{u.fullName}</div>
                <div className="text-xs text-text-muted">{u.email}</div>
              </td>
              <td className="px-4 py-3"><span className="badge badge-info">{u.role.replace('_', ' ')}</span></td>
              <td className="px-4 py-3">{statusBadge(u.status)}</td>
              <td className="px-4 py-3 text-text-secondary text-sm">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => openModal('role', u)}>Role</Button>
                  <Button size="sm" variant="ghost" onClick={() => openModal('status', u)}>Status</Button>
                  <Button size="sm" variant="ghost" onClick={() => openModal('reset', u)}>Reset PW</Button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-text-muted">No users match your filters.</td></tr>
          )}
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal === 'role' ? `Change Role — ${target?.fullName}` : modal === 'status' ? `Change Status — ${target?.fullName}` : `Reset Password — ${target?.fullName}`}>
        <div className="space-y-4">
          {modal === 'role' && (
            <Select label="New Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT'].map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
          )}
          {modal === 'status' && (
            <Select label="New Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={['ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED'].map((s) => ({ value: s, label: s }))} />
          )}
          {modal === 'reset' && !tempPwd && (
            <p className="text-sm text-text-secondary">
              This generates a temporary password and forces the user to change it at next login. Share it securely.
            </p>
          )}
          {modal === 'reset' && tempPwd && (
            <div className="text-sm bg-green-50 border border-green-200 text-green-800 p-3 rounded-input">
              Temporary password: <strong className="font-mono text-base">{tempPwd}</strong>
              <div className="text-xs mt-1">Copy it now — it will not be shown again.</div>
            </div>
          )}
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>{tempPwd ? 'Close' : 'Cancel'}</Button>
            {!tempPwd && <Button onClick={submit} loading={busy}>Confirm</Button>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
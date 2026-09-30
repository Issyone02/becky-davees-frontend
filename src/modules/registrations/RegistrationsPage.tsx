import { useCallback, useEffect, useState } from 'react';
import { fetchPendingRegistrations, approveRegistration, rejectRegistration, RegistrationItem } from '../../api/people';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

export function RegistrationsPage() {
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [rejectFor, setRejectFor] = useState<RegistrationItem | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchPendingRegistrations());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(item: RegistrationItem) {
    setBusy(true);
    setError(null);
    try {
      await approveRegistration(item.userId);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Approval failed');
    } finally {
      setBusy(false);
    }
  }

  async function submitReject() {
    if (!rejectFor) return;
    setBusy(true);
    setError(null);
    try {
      await rejectRegistration(rejectFor.userId, reason);
      setRejectFor(null);
      setReason('');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Rejection failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Registration Approvals</h1>
        <p className="text-text-secondary">Review teacher and parent sign-up requests.</p>
      </div>

      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}

      <Card className="p-0 overflow-hidden">
        <Table headers={['Name', 'Role', 'Email', 'Phone', 'Submitted', 'Actions']}>
          {items.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{r.user.fullName}</td>
              <td className="px-4 py-3">
                <StatusBadge status={r.user.role === 'TEACHER' ? 'info' : 'neutral'} label={r.user.role.toLowerCase()} />
              </td>
              <td className="px-4 py-3 text-text-secondary">{r.user.email}</td>
              <td className="px-4 py-3 text-text-secondary">{r.user.phone ?? '—'}</td>
              <td className="px-4 py-3 text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve(r)} disabled={busy}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => setRejectFor(r)} disabled={busy}>Reject</Button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No pending registrations. 🎉</td></tr>
          )}
        </Table>
      </Card>

      <Modal open={!!rejectFor} onClose={() => setRejectFor(null)} title={`Reject ${rejectFor?.user.fullName ?? ''}`}>
        <div className="space-y-4">
          <Input label="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Could not verify employment records" required />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button variant="danger" onClick={submitReject} disabled={busy || reason.trim().length < 3}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
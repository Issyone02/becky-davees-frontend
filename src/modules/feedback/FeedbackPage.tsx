import { useCallback, useEffect, useState } from 'react';
import * as fb from '../../api/feedback';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { UploadButton } from '../../components/ui/UploadButton';
import { Plus, MessageSquare, Paperclip } from 'lucide-react';

export const CATEGORY_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic', FINANCE: 'Finance', INFRASTRUCTURE: 'Infrastructure',
  WELFARE: 'Student Welfare', GENERAL: 'General',
};
export const priorityBadge = (p: string) =>
  p === 'URGENT' ? <StatusBadge status="danger" label="Urgent" /> :
  p === 'HIGH' ? <StatusBadge status="warning" label="High" /> :
  p === 'MEDIUM' ? <StatusBadge status="info" label="Medium" /> :
  <StatusBadge status="neutral" label="Low" />;
export const statusBadge = (s: string) =>
  s === 'OPEN' ? <StatusBadge status="info" label="Open" /> :
  s === 'IN_PROGRESS' ? <StatusBadge status="warning" label="In Progress" /> :
  s === 'RESOLVED' ? <StatusBadge status="success" label="Resolved" /> :
  <StatusBadge status="neutral" label="Closed" />;

export function FeedbackPage() {
  const [rows, setRows] = useState<fb.FeedbackItem[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fb.fetchMyFeedback().then(setRows).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Feedback & Complaints</h1>
          <p className="text-text-secondary">Raise concerns privately; the administration replies here.</p>
        </div>
        <Button onClick={() => setOpenNew(true)} leftIcon={<Plus className="h-4 w-4" />}>New Feedback</Button>
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id} className="cursor-pointer hover:shadow-elevated transition-shadow" >
            <button className="w-full text-left" onClick={() => setDetailId(r.id)}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold text-text-primary">{r.subject}</div>
                  <div className="text-xs text-text-muted mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <span className="badge badge-neutral">{CATEGORY_LABELS[r.category] ?? r.category}</span>
                  {priorityBadge(r.priority)}
                  {statusBadge(r.status)}
                </div>
              </div>
              <p className="text-sm text-text-secondary mt-2 line-clamp-2">{r.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {r.replies?.length ?? 0} repl{(r.replies?.length ?? 0) === 1 ? 'y' : 'ies'}</span>
                {r.attachmentUrl && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" /> attachment</span>}
              </div>
            </button>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card><p className="text-sm text-text-muted text-center py-8">No feedback yet. Click "New Feedback" to raise your first concern.</p></Card>
        )}
      </div>
      <NewFeedbackModal open={openNew} onClose={() => setOpenNew(false)} onSaved={load} />
      <FeedbackDetailModal id={detailId} onClose={() => setDetailId(null)} onSaved={load} isAdmin={false} />
    </div>
  );
}

export function NewFeedbackModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ category: 'GENERAL', priority: 'MEDIUM', subject: '', message: '', attachmentUrl: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({ category: 'GENERAL', priority: 'MEDIUM', subject: '', message: '', attachmentUrl: '' });
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await fb.createFeedback({ ...form, attachmentUrl: form.attachmentUrl || null });
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Feedback / Complaint" wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} />
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' }]} />
        </div>
        <Input label="Subject" placeholder="Brief summary of the issue" value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        <div>
          <label className="label">Details</label>
          <textarea className="input-field min-h-[120px]" placeholder="Describe the issue clearly (min 10 characters)..."
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">Attachment (optional, max 5MB):</span>
          <UploadButton label="Upload" onUploaded={(url) => setForm({ ...form, attachmentUrl: url })} />
          {form.attachmentUrl && <span className="text-xs text-green-700">Attached ✓</span>}
        </div>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <Button type="submit" className="w-full" loading={busy}>Submit Feedback</Button>
      </form>
    </Modal>
  );
}

export function FeedbackDetailModal({ id, onClose, onSaved, isAdmin }: {
  id: string | null; onClose: () => void; onSaved: () => void; isAdmin: boolean;
}) {
  const [data, setData] = useState<fb.FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setReplyText(''); setError(null);
    fb.fetchFeedback(id).then(setData).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [id]);

  async function refresh() {
    if (!id) return;
    const d = await fb.fetchFeedback(id);
    setData(d); onSaved();
  }

  async function sendReply() {
    if (!id || replyText.trim().length < 2) return;
    setBusy(true); setError(null);
    try { await fb.replyFeedback(id, replyText.trim()); setReplyText(''); await refresh(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  async function changeStatus(status: string) {
    if (!id) return;
    setBusy(true); setError(null);
    try { await fb.setFeedbackStatus(id, status); await refresh(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={!!id} onClose={onClose} title={data?.subject ?? 'Feedback'} wide>
      {data && (
        <div className="space-y-4">
          <div className="flex gap-1 flex-wrap">
            <span className="badge badge-neutral">{CATEGORY_LABELS[data.category] ?? data.category}</span>
            {priorityBadge(data.priority)}
            {statusBadge(data.status)}
            <span className="text-xs text-text-muted self-center">by {data.user?.fullName} ({data.user?.role}) · {new Date(data.createdAt).toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 rounded-input p-3 text-sm text-text-primary whitespace-pre-line">{data.message}</div>
          {data.attachmentUrl && (
            <a href={data.attachmentUrl.startsWith('http') ? data.attachmentUrl : `http://localhost:4000${data.attachmentUrl}`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Paperclip className="h-4 w-4" /> View attachment
            </a>
          )}

          <div className="space-y-2 max-h-[30vh] overflow-y-auto">
            {(data.replies ?? []).map((r) => (
              <div key={r.id} className={`rounded-input p-3 text-sm ${r.user.role === 'ADMIN' || r.user.role === 'SUPER_ADMIN' ? 'bg-primary-light/40 border border-primary/20' : 'bg-gray-50'}`}>
                <div className="text-xs font-semibold text-text-primary mb-1">
                  {r.user.fullName} ({r.user.role === 'SUPER_ADMIN' ? 'Super Admin' : r.user.role === 'ADMIN' ? 'Admin' : 'Submitter'}) · {new Date(r.createdAt).toLocaleString()}
                </div>
                <div className="text-text-secondary whitespace-pre-line">{r.message}</div>
              </div>
            ))}
            {(data.replies?.length ?? 0) === 0 && <p className="text-xs text-text-muted">No replies yet.</p>}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {data.status !== 'IN_PROGRESS' && <Button size="sm" variant="secondary" onClick={() => changeStatus('IN_PROGRESS')}>Mark In Progress</Button>}
              {data.status !== 'RESOLVED' && <Button size="sm" variant="secondary" onClick={() => changeStatus('RESOLVED')}>Mark Resolved</Button>}
              {data.status !== 'CLOSED' && <Button size="sm" variant="danger" onClick={() => changeStatus('CLOSED')}>Close</Button>}
              {data.status !== 'OPEN' && <Button size="sm" variant="ghost" onClick={() => changeStatus('OPEN')}>Reopen</Button>}
            </div>
          )}

          <div className="space-y-2">
            <textarea className="input-field min-h-[70px]" placeholder={isAdmin ? 'Write an official reply...' : 'Add a follow-up note...'}
              value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            <div className="flex justify-end">
              <Button onClick={sendReply} loading={busy} disabled={replyText.trim().length < 2} leftIcon={<MessageSquare className="h-4 w-4" />}>Send Reply</Button>
            </div>
          </div>
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        </div>
      )}
    </Modal>
  );
}
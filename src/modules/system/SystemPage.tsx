import { useCallback, useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '../../api/results';
import { fetchGradingScale, createGradingScale, updateGradingScale, deleteGradingScale, GradingScaleItem } from '../../api/academic';
import { UploadButton } from '../../components/ui/UploadButton';
import { assetUrl } from '../../utils/assetUrl';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Pencil, X } from 'lucide-react';
import { MessagingTab } from './MessagingTab';

const tabs = ['School Profile', 'Grading Scale', 'Messaging', 'System Info'] as const;
type Tab = (typeof tabs)[number];

export function SystemPage() {
  const [tab, setTab] = useState<Tab>('School Profile');
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">System</h1>
        <p className="text-text-secondary">School configuration, grading scale and platform information.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-input text-sm font-medium ${tab === t ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'School Profile' && <ProfileTab />}
      {tab === 'Grading Scale' && <ScaleTab />}
      {tab === 'Messaging' && <MessagingTab />}
      {tab === 'System Info' && <InfoTab />}
    </div>
  );
}

function ProfileTab() {
  const [form, setForm] = useState({
    schoolName: '', motto: '', address: '', phone: '', email: '', headTeacherName: '',
    logoUrl: '', officialStampUrl: '', headTeacherSignatureUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings().then((s: any) => {
      if (s) setForm({
        schoolName: s.schoolName ?? '', motto: s.motto ?? '', address: s.address ?? '',
        phone: s.phone ?? '', email: s.email ?? '', headTeacherName: s.headTeacherName ?? '',
        logoUrl: s.logoUrl ?? '', officialStampUrl: s.officialStampUrl ?? '', headTeacherSignatureUrl: s.headTeacherSignatureUrl ?? '',
      });
    }).catch(console.error);
  }, []);

  async function save() {
    setSaving(true); setError(null); setInfo(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, k === 'schoolName' ? v : (v === '' ? null : v)]));
      await updateSettings(payload);
      setInfo('Settings saved.');
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  function UploadRow({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-44 text-sm text-text-secondary">{label}</div>
        {value && <img src={assetUrl(value)!} alt={label} className="h-10 border border-border rounded p-0.5 bg-white" />}
        <UploadButton label={value ? 'Replace' : 'Upload'} onUploaded={onChange} />
        {value && <Button variant="ghost" size="sm" onClick={() => onChange('')}>Remove</Button>}
      </div>
    );
  }

  return (
    <Card className="max-w-3xl">
      <div className="space-y-4">
        <Input label="School Name" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
        <Input label="Motto" value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Phone Numbers (comma separated)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Head Teacher's Name" value={form.headTeacherName} onChange={(e) => setForm({ ...form, headTeacherName: e.target.value })} />
        <div className="space-y-3 border-t border-border pt-4">
          <UploadRow label="School Logo" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} />
          <UploadRow label="Official Stamp" value={form.officialStampUrl} onChange={(url) => setForm({ ...form, officialStampUrl: url })} />
          <UploadRow label="Head Teacher Signature" value={form.headTeacherSignatureUrl} onChange={(url) => setForm({ ...form, headTeacherSignatureUrl: url })} />
        </div>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        {info && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}
        <Button onClick={save} loading={saving}>Save Settings</Button>
      </div>
    </Card>
  );
}

function ScaleTab() {
  const [rows, setRows] = useState<GradingScaleItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GradingScaleItem | null>(null);
  const [form, setForm] = useState({ minScore: '', maxScore: '', grade: '', remark: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchGradingScale().then(setRows).catch(console.error);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const payload = { minScore: Number(form.minScore), maxScore: Number(form.maxScore), grade: form.grade, remark: form.remark, sessionId: null };
      if (editing) await updateGradingScale(editing.id, payload);
      else await createGradingScale(payload);
      setOpen(false); setEditing(null); load();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this grading band?')) return;
    await deleteGradingScale(id).then(load).catch(console.error);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setForm({ minScore: '', maxScore: '', grade: '', remark: '' }); setOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>Add Band</Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <Table headers={['Score Range', 'Grade', 'Remark', 'Actions']}>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-text-primary">{r.minScore} – {r.maxScore}</td>
              <td className="px-4 py-3"><span className="badge badge-info">{r.grade}</span></td>
              <td className="px-4 py-3 text-text-secondary">{r.remark}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(r); setForm({ minScore: String(r.minScore), maxScore: String(r.maxScore), grade: r.grade, remark: r.remark }); setOpen(true); }}
                    className="p-2 rounded-input hover:bg-gray-100 text-text-secondary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(r.id)} className="p-2 rounded-input hover:bg-red-50 text-red-500"><X className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Grading Band' : 'Add Grading Band'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Score" type="number" value={form.minScore} onChange={(e) => setForm({ ...form, minScore: e.target.value })} required />
            <Input label="Max Score" type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} required />
          </div>
          <Input label="Grade" placeholder="e.g. A1" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required />
          <Input label="Remark" placeholder="e.g. Excellent" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} required />
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
          <Button type="submit" className="w-full" loading={busy}>{editing ? 'Save Changes' : 'Create Band'}</Button>
        </form>
      </Modal>
    </div>
  );
}

function InfoTab() {
  return (
    <Card className="max-w-3xl">
      <div className="space-y-2 text-sm text-text-secondary">
        <div><strong className="text-text-primary">Application:</strong> School Management System v1.0</div>
        <div><strong className="text-text-primary">Environment:</strong> {import.meta.env.MODE}</div>
        <div><strong className="text-text-primary">Database:</strong> SQLite (development) — switch to PostgreSQL/Supabase for production</div>
        <div><strong className="text-text-primary">Audit trail:</strong> Immutable; every sensitive action is recorded with IP & user-agent</div>
        <div><strong className="text-text-primary">Backups:</strong> Copy the `backend/prisma/dev.db` file regularly during development</div>
      </div>
    </Card>
  );
}
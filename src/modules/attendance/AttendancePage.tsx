import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useAcademicContext } from '../../hooks/useAcademicContext';
import { fetchMyClasses, fetchRegister, saveRegister, fetchAttendanceReport, RegisterData, ReportRow } from '../../api/attendance';
import { fetchClassesFull, fetchTerms, TermItem } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { Lock, CheckCheck, Save } from 'lucide-react';

const STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AttendancePage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  const ctx = useAcademicContext();

  const [tab, setTab] = useState<'register' | 'report'>('register');
  const [classOptions, setClassOptions] = useState<{ value: string; label: string }[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    if (ctx.loading) return;
    if (isTeacher) {
      fetchMyClasses().then((list) => {
        setClassOptions(list.map((c) => ({ value: c.classId, label: c.className })));
        if (list.length && !classId) setClassId(list[0].classId);
      }).catch(console.error);
    } else {
      fetchClassesFull().then((list) => {
        setClassOptions(list.map((c) => ({ value: c.id, label: c.name })));
        if (list.length && !classId) setClassId(list[0].id);
      }).catch(console.error);
    }
    fetchTerms().then((t) => {
      setTerms(t);
      if (!termId && ctx.termId) setTermId(ctx.termId);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.loading]);

  const sessionId = terms.find((t) => t.id === termId)?.sessionId ?? ctx.sessionId ?? '';
  const termOptions = terms.map((t) => ({ value: t.id, label: `${t.session?.name ?? ''} — ${t.name}` }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
          <p className="text-text-secondary">
            {isTeacher ? 'Mark and manage attendance for your classes.' : 'View and correct attendance registers.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('register')}
            className={`px-4 py-2 rounded-input text-sm font-medium ${tab === 'register' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
            Register
          </button>
          <button onClick={() => setTab('report')}
            className={`px-4 py-2 rounded-input text-sm font-medium ${tab === 'report' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
            Summary Report
          </button>
        </div>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} options={classOptions} placeholder="Select class" />
          <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)} options={termOptions} placeholder="Select term" />
          {tab === 'register' && (
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
        </div>
        {isTeacher && classOptions.length === 0 && !ctx.loading && (
          <p className="mt-3 text-sm text-amber-600">
            You have no teaching assignments yet. An administrator must assign you to a class (Academics → Teacher Assignments).
          </p>
        )}
      </Card>

      {tab === 'register' ? (
        <RegisterView classId={classId} sessionId={sessionId} termId={termId} date={date} isTeacher={isTeacher} />
      ) : (
        <ReportView classId={classId} termId={termId} />
      )}
    </div>
  );
}

function RegisterView({ classId, sessionId, termId, date, isTeacher }: {
  classId: string; sessionId: string; termId: string; date: string; isTeacher: boolean;
}) {
  const [data, setData] = useState<RegisterData | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    if (!classId || !termId || !date) return;
    setLoading(true); setError(null);
    fetchRegister({ classId, date, termId })
      .then((d) => {
        setData(d);
        const map: Record<string, string> = {};
        for (const s of d.students) {
          const rec = d.records.find((r) => r.studentId === s.id);
          map[s.id] = rec?.status ?? 'present';
        }
        setStatuses(map);
      })
      .catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed to load register'))
      .finally(() => setLoading(false));
  }, [classId, termId, date]);

  useEffect(() => { load(); }, [load]);

  const firstRecord = data?.records[0];
  const isUpdate = !!firstRecord;
  const locked = isUpdate && isTeacher && firstRecord
    ? Date.now() - new Date(firstRecord.markedAt).getTime() > 24 * 60 * 60 * 1000
    : false;

  async function doSave(reasonText?: string) {
    setSaving(true); setError(null);
    try {
      await saveRegister({
        classId, sessionId, termId, date,
        entries: Object.entries(statuses).map(([studentId, status]) => ({ studentId, status })),
        reason: reasonText,
      });
      setReasonOpen(false); setReason('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Failed to save register');
    } finally { setSaving(false); }
  }

  if (!classId || !termId) {
    return <Card><p className="text-sm text-text-muted">Select a class and term to begin.</p></Card>;
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border">
        <div className="text-sm text-text-secondary">
          {data?.students.length ?? 0} student(s)
          {firstRecord && (
            <span className="ml-3">
              · Marked by {firstRecord.marker?.fullName ?? '—'} on {new Date(firstRecord.markedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={locked}
            onClick={() => setStatuses(Object.fromEntries(Object.keys(statuses).map((k) => [k, 'present'])))}
            leftIcon={<CheckCheck className="h-4 w-4" />}>
            Mark all present
          </Button>
          <Button size="sm" disabled={locked || saving || !data?.students.length}
            onClick={() => (isUpdate ? setReasonOpen(true) : doSave())}
            leftIcon={<Save className="h-4 w-4" />}>
            {isUpdate ? 'Update Register' : 'Save Register'}
          </Button>
        </div>
      </div>

      {locked && (
        <div className="flex items-center gap-2 mx-4 mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-input">
          <Lock className="h-4 w-4" /> This register is locked (24-hour window passed). Only an administrator can correct it.
        </div>
      )}
      {error && <div className="mx-4 mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}

      <Table headers={['Student ID', 'Name', 'Gender', 'Status']}>
        {(data?.students ?? []).map((s) => (
          <tr key={s.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-text-primary">{s.studentId}</td>
            <td className="px-4 py-3 text-text-primary">{s.fullName}</td>
            <td className="px-4 py-3 text-text-secondary capitalize">{s.gender.toLowerCase()}</td>
            <td className="px-4 py-3">
              <select
                className="input-field w-32"
                value={statuses[s.id] ?? 'present'}
                disabled={locked}
                onChange={(e) => setStatuses({ ...statuses, [s.id]: e.target.value })}
              >
                {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </select>
            </td>
          </tr>
        ))}
        {(data?.students.length ?? 0) === 0 && !loading && (
          <tr><td colSpan={4} className="px-4 py-10 text-center text-text-muted">No active students in this class.</td></tr>
        )}
      </Table>

      <Modal open={reasonOpen} onClose={() => setReasonOpen(false)} title="Modify Register — Reason Required">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This register was already saved. Every change is recorded in the immutable correction log.
          </p>
          <Input label="Reason for modification" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Marked absent in error; student was present" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReasonOpen(false)}>Cancel</Button>
            <Button onClick={() => doSave(reason)} disabled={reason.trim().length < 5 || saving} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function ReportView({ classId, termId }: { classId: string; termId: string }) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !termId) return;
    fetchAttendanceReport({ classId, termId })
      .then(setRows)
      .catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed to load report'));
  }, [classId, termId]);

  if (!classId || !termId) {
    return <Card><p className="text-sm text-text-muted">Select a class and term to view the summary.</p></Card>;
  }

  return (
    <Card className="p-0 overflow-hidden">
      {error && <div className="m-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <Table headers={['Student', 'Present', 'Absent', 'Late', 'Excused', 'Days', 'Attendance Rate']}>
        {rows.map((r) => (
          <tr key={r.student.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-text-primary">{r.student.fullName}</td>
            <td className="px-4 py-3 text-green-600">{r.present}</td>
            <td className="px-4 py-3 text-red-500">{r.absent}</td>
            <td className="px-4 py-3 text-amber-600">{r.late}</td>
            <td className="px-4 py-3 text-text-secondary">{r.excused}</td>
            <td className="px-4 py-3 text-text-secondary">{r.total}</td>
            <td className="px-4 py-3">
              <StatusBadge status={r.rate >= 75 ? 'success' : r.rate >= 50 ? 'warning' : 'danger'} label={`${r.rate}%`} />
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={7} className="px-4 py-10 text-center text-text-muted">No attendance recorded for this class/term yet.</td></tr>
        )}
      </Table>
    </Card>
  );
}
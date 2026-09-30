import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../../api/academic';
import { fetchTeachers, TeacherItem } from '../../api/people';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Plus, Star, X, Pencil } from 'lucide-react';

const tabs = ['Sessions & Terms', 'Classes', 'Subjects', 'Class Subjects', 'Teacher Assignments'] as const;
type Tab = (typeof tabs)[number];

export function AcademicStructurePage() {
  const [tab, setTab] = useState<Tab>('Sessions & Terms');
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Academic Structure</h1>
        <p className="text-text-secondary">Sessions, terms, classes, subjects and teaching assignments.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-input text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Sessions & Terms' && <SessionsTab />}
      {tab === 'Classes' && <ClassesTab />}
      {tab === 'Subjects' && <SubjectsTab />}
      {tab === 'Class Subjects' && <ClassSubjectsTab />}
      {tab === 'Teacher Assignments' && <AssignmentsTab />}
    </div>
  );
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>;
}

// ================= SESSIONS & TERMS =================
function SessionsTab() {
  const [sessions, setSessions] = useState<api.SessionFull[]>([]);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<api.SessionFull | null>(null);
  const [termFor, setTermFor] = useState<api.SessionFull | null>(null);
  const [editingTerm, setEditingTerm] = useState<api.TermItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.fetchSessionsFull().then(setSessions).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed to load'));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function makeCurrent(id: string) {
    setError(null);
    try { await api.setCurrentSession(id); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditingSession(null); setSessionOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>Add Session</Button>
      </div>
      <ErrorBox error={error} />
      <Card className="p-0 overflow-hidden">
        <Table headers={['Session', 'Period', 'Terms', 'Status', 'Actions']}>
          {sessions.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
              <td className="px-4 py-3 text-text-secondary">
                {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {s.terms.map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1">
                      <span className={`badge ${t.isCurrent ? 'badge-success' : 'badge-neutral'}`}>{t.name}</span>
                      <button title={`Edit ${t.name} dates`} onClick={() => setEditingTerm(t)}
                        className="p-1 rounded hover:bg-gray-100 text-text-muted hover:text-primary">
                        <Pencil className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {s.terms.length === 0 && <span className="text-xs text-text-muted">No terms yet</span>}
                </div>
              </td>
              <td className="px-4 py-3">
                {s.isCurrent ? <StatusBadge status="success" label="Current" /> : <StatusBadge status="neutral" label="Inactive" />}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 items-center">
                  <Button size="sm" variant="secondary" onClick={() => setTermFor(s)} leftIcon={<Plus className="h-3 w-3" />}>Term</Button>
                  <button title="Edit session dates" onClick={() => { setEditingSession(s); setSessionOpen(true); }}
                    className="p-2 rounded-input hover:bg-gray-100 text-text-secondary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!s.isCurrent && (
                    <Button size="sm" variant="ghost" onClick={() => makeCurrent(s.id)} leftIcon={<Star className="h-3 w-3" />}>Set Current</Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <SessionModal open={sessionOpen} onClose={() => setSessionOpen(false)} onSaved={load} initial={editingSession} />
      <TermModal session={termFor} initial={editingTerm}
        onClose={() => { setTermFor(null); setEditingTerm(null); }} onSaved={load} />
    </div>
  );
}

function SessionModal({ open, onClose, onSaved, initial }: {
  open: boolean; onClose: () => void; onSaved: () => void; initial: api.SessionFull | null;
}) {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial
      ? { name: initial.name, startDate: initial.startDate.slice(0, 10), endDate: initial.endDate.slice(0, 10) }
      : { name: '', startDate: '', endDate: '' });
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (initial) await api.updateSession(initial.id, form);
      else await api.createSession(form);
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Edit Session — ${initial.name}` : 'Add Academic Session'}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Session Name" placeholder="e.g. 2027/2028" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
        <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        <ErrorBox error={error} />
        <Button type="submit" className="w-full" loading={loading}>{initial ? 'Save Changes' : 'Create Session'}</Button>
      </form>
    </Modal>
  );
}

function TermModal({ session, initial, onClose, onSaved }: {
  session: api.SessionFull | null; initial: api.TermItem | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const open = !!session || !!initial;

  useEffect(() => {
    if (initial) {
      setError(null);
      setForm({ name: initial.name, startDate: initial.startDate.slice(0, 10), endDate: initial.endDate.slice(0, 10) });
    } else if (session) {
      setError(null);
      setForm({ name: '', startDate: '', endDate: '' });
    }
  }, [session, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sessionId = initial?.sessionId ?? session?.id;
    if (!sessionId) return;
    setLoading(true); setError(null);
    try {
      if (initial) await api.updateTerm(initial.id, form);
      else await api.createTerm({ ...form, sessionId });
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Edit Term — ${initial.name}` : `Add Term — ${session?.name ?? ''}`}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Term Name" placeholder="e.g. First Term" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
        <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        <ErrorBox error={error} />
        <Button type="submit" className="w-full" loading={loading}>{initial ? 'Save Changes' : 'Create Term'}</Button>
      </form>
    </Modal>
  );
}

// ================= CLASSES =================
const LEVELS = [
  { key: 'nursery', label: 'Nursery', max: 2 },
  { key: 'primary', label: 'Primary', max: 6 },
  { key: 'junior', label: 'JSS', max: 3 },
  { key: 'senior', label: 'SSS', max: 3 },
];

function ClassesTab() {
  const [classes, setClasses] = useState<api.ClassFull[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<api.ClassFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.fetchClassesFull().then(setClasses).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete class "${name}"? Only classes with no students/assignments can be deleted.`)) return;
    setError(null);
    try { await api.deleteClass(id); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>Add Class</Button>
      </div>
      <ErrorBox error={error} />
      <Card className="p-0 overflow-hidden">
        <Table headers={['Class', 'Level', 'Students', 'Subjects', 'Actions']}>
          {classes.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
              <td className="px-4 py-3 text-text-secondary capitalize">{c.level}</td>
              <td className="px-4 py-3 text-text-secondary">{c._count?.students ?? 0}</td>
              <td className="px-4 py-3 text-text-secondary">{c._count?.classSubjects ?? 0}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button title="Edit" onClick={() => { setEditing(c); setOpen(true); }}
                    className="p-2 rounded-input hover:bg-gray-100 text-text-secondary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button title="Delete" onClick={() => remove(c.id, c.name)}
                    className="p-2 rounded-input hover:bg-red-50 text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <ClassModal open={open} onClose={() => setOpen(false)} onSaved={load} initial={editing} />
    </div>
  );
}

function ClassModal({ open, onClose, onSaved, initial }: { open: boolean; onClose: () => void; onSaved: () => void; initial: api.ClassFull | null }) {
  const [levelKey, setLevelKey] = useState('primary');
  const [num, setNum] = useState(1);
  const [department, setDepartment] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const level = LEVELS.find((l) => l.key === levelKey) ?? LEVELS[1];

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      const match = initial.name.trim().match(/^(.+?)\s+(\d+)(?:\s*\(([^)]+)\))?$/);
      const found = LEVELS.find((l) => l.label.toLowerCase() === (match?.[1] ?? initial.level).trim().toLowerCase());
      setLevelKey(found?.key ?? initial.level);
      const n = match ? parseInt(match[2], 10) : 1;
      setNum(found && n >= 1 && n <= found.max ? n : 1);
      setDepartment(match?.[3] ?? '');
      setCapacity(initial.capacity?.toString() ?? '');
    } else {
      setLevelKey('primary');
      setNum(1);
      setDepartment('');
      setCapacity('');
    }
  }, [open, initial]);

  useEffect(() => {
    if (num > level.max) setNum(1);
  }, [levelKey, level.max, num]);

  const composedName = `${level.label} ${num}${department.trim() ? ` (${department.trim()})` : ''}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload = {
      name: composedName,
      level: levelKey,
      capacity: capacity ? Number(capacity) : undefined,
      department: department.trim() || null,
    };
    try {
      if (initial) await api.updateClass(initial.id, payload);
      else await api.createClass(payload);
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Class' : 'Add Class'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Level" value={levelKey} onChange={(e) => setLevelKey(e.target.value)}
            options={LEVELS.map((l) => ({ value: l.key, label: l.label }))} />
          <Select label="Class Number" value={String(num)} onChange={(e) => setNum(Number(e.target.value))}
            options={Array.from({ length: level.max }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} />
        </div>
        <Input label="Department / Track (optional)" placeholder="e.g. Science, Arts, Commercial"
          value={department} onChange={(e) => setDepartment(e.target.value)} />
        <div className="text-sm text-text-secondary bg-gray-50 p-3 rounded-input">
          Class name will be: <strong className="text-text-primary">{composedName}</strong>
          <div className="text-xs text-text-muted mt-1">
            Allowed: Nursery 1–2 · Primary 1–6 · JSS 1–3 · SSS 1–3 · optional department, e.g. SSS 1 (Science)
          </div>
        </div>
        <Input label="Capacity (optional)" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        <ErrorBox error={error} />
        <Button type="submit" className="w-full" loading={loading}>{initial ? 'Save Changes' : 'Create Class'}</Button>
      </form>
    </Modal>
  );
}

// ================= SUBJECTS =================
function SubjectsTab() {
  const [subjects, setSubjects] = useState<api.SubjectItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<api.SubjectItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.fetchSubjects().then(setSubjects).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>Add Subject</Button>
      </div>
      <ErrorBox error={error} />
      <Card className="p-0 overflow-hidden">
        <Table headers={['Subject', 'Code', 'Used in Classes', 'Actions']}>
          {subjects.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
              <td className="px-4 py-3"><span className="badge badge-neutral">{s.code}</span></td>
              <td className="px-4 py-3 text-text-secondary">{s._count?.classSubjects ?? 0}</td>
              <td className="px-4 py-3">
                <button onClick={() => { setEditing(s); setOpen(true); }} className="p-2 rounded-input hover:bg-gray-100 text-text-secondary">
                  <Pencil className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {subjects.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-text-muted">No subjects yet. Add Mathematics, English, Science...</td></tr>
          )}
        </Table>
      </Card>
      <SubjectModal open={open} onClose={() => setOpen(false)} onSaved={load} initial={editing} />
    </div>
  );
}

function SubjectModal({ open, onClose, onSaved, initial }: { open: boolean; onClose: () => void; onSaved: () => void; initial: api.SubjectItem | null }) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(initial ? { name: initial.name, code: initial.code, description: initial.description ?? '' } : { name: '', code: '', description: '' });
    }
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (initial) await api.updateSubject(initial.id, form);
      else await api.createSubject(form);
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Subject' : 'Add Subject'}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Subject Name" placeholder="e.g. Mathematics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Code" placeholder="e.g. MATH" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <ErrorBox error={error} />
        <Button type="submit" className="w-full" loading={loading}>{initial ? 'Save Changes' : 'Create Subject'}</Button>
      </form>
    </Modal>
  );
}

// ================= CLASS SUBJECTS =================
function ClassSubjectsTab() {
  const [classes, setClasses] = useState<api.ClassFull[]>([]);
  const [subjects, setSubjects] = useState<api.SubjectItem[]>([]);
  const [classId, setClassId] = useState('');
  const [assigned, setAssigned] = useState<api.ClassSubjectItem[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    api.fetchClassesFull().then((c) => { setClasses(c); if (c.length) setClassId(c[0].id); }).catch(console.error);
    api.fetchSubjects().then(setSubjects).catch(console.error);
  }, []);

  const loadAssigned = useCallback(() => {
    if (classId) api.fetchClassSubjects(classId).then(setAssigned).catch(console.error);
  }, [classId]);
  useEffect(() => { loadAssigned(); }, [loadAssigned]);

  const available = subjects.filter((s) => !assigned.some((a) => a.subjectId === s.id));

  async function assign() {
    setError(null); setInfo(null);
    try { await api.assignSubject(classId, subjectId); setSubjectId(''); loadAssigned(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  async function remove(sid: string) {
    setError(null); setInfo(null);
    try { await api.removeSubject(classId, sid); loadAssigned(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  async function saveBulk(selectedIds: string[]) {
    setError(null); setInfo(null);
    try {
      const r = await api.assignSubjectsBulk(classId, selectedIds);
      setInfo(`Added ${r.created} subject(s). ${r.skipped} already existed and were skipped.`);
      setBulkOpen(false);
      loadAssigned();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}
          options={classes.map((c) => ({ value: c.id, label: c.name }))} />
        <div className="flex items-end gap-2">
          <Select label="Add subject to this class" placeholder="Select subject" value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)} options={available.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))} />
          <Button onClick={assign} disabled={!subjectId}>Add</Button>
          <Button variant="secondary" onClick={() => setBulkOpen(true)}>Add Subjects</Button>
        </div>
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      {info && <div className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}
      <div className="flex flex-wrap gap-2">
        {assigned.length === 0 && <p className="text-sm text-text-muted">No subjects assigned to this class yet.</p>}
        {assigned.map((a) => (
          <span key={a.id} className="inline-flex items-center gap-2 badge badge-info">
            {a.subject.name}
            <button onClick={() => remove(a.subjectId)} className="hover:text-red-600"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <BulkAssignSubjectsModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        subjects={subjects}
        assignedIds={assigned.map((a) => a.subjectId)}
        onSave={saveBulk}
        classes={classes}
      />
    </Card>
  );
}

function BulkAssignSubjectsModal({ open, onClose, subjects, assignedIds, onSave, classes }: {
  open: boolean;
  onClose: () => void;
  subjects: api.SubjectItem[];
  assignedIds: string[];
  onSave: (selectedIds: string[]) => void;
  classes: api.ClassFull[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [prefillClass, setPrefillClass] = useState('');

  async function prefillFromClass(sourceClassId: string) {
    setPrefillClass(sourceClassId);
    if (!sourceClassId) return;
    try {
      const rows = await api.fetchClassSubjects(sourceClassId);
      const ids = new Set(selected);
      rows.forEach((r) => { if (!assignedIds.includes(r.subjectId)) ids.add(r.subjectId); });
      setSelected(ids);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (open) {
      setSelected(new Set(assignedIds));
      setBusy(false);
      setPrefillClass('');
    }
  }, [open, assignedIds]);

  const toggle = (id: string) => {
    if (assignedIds.includes(id)) return; // can't un-assign existing
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAllAvailable = () => {
    const all = new Set(assignedIds);
    subjects.forEach((s) => all.add(s.id));
    setSelected(all);
  };

  const clearSelection = () => {
    setSelected(new Set(assignedIds));
  };

  const newCount = Array.from(selected).filter((id) => !assignedIds.includes(id)).length;

  async function save() {
    setBusy(true);
    const newIds = Array.from(selected).filter((id) => !assignedIds.includes(id));
    await onSave(newIds);
    setBusy(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Subjects to Class" wide>
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap items-end">
          <div className="w-48">
            <Select label="Copy subjects from class" placeholder="None" value={prefillClass}
              onChange={(e) => prefillFromClass(e.target.value)}
              options={classes.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <Button size="sm" variant="secondary" onClick={selectAllAvailable}>Select all available</Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
          <span className="ml-auto text-sm text-text-secondary self-center">
            {newCount} new subject{newCount === 1 ? '' : 's'} selected
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
          {subjects.map((s) => {
            const isAssigned = assignedIds.includes(s.id);
            const isSelected = selected.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                disabled={isAssigned}
                className={`p-3 rounded-input border text-left transition-colors ${
                  isAssigned
                    ? 'bg-primary-light/30 border-primary/40 cursor-not-allowed'
                    : isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface border-border hover:bg-primary-light/20'
                }`}
              >
                <div className="font-semibold text-sm">{s.name}</div>
                <div className={`text-xs ${isAssigned || isSelected ? 'opacity-80' : 'text-text-muted'}`}>
                  {s.code} {isAssigned ? '· Assigned' : ''}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={busy} disabled={newCount === 0}>
            Add {newCount} Subject{newCount === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ================= TEACHER ASSIGNMENTS =================
interface TeacherGroup {
  teacher: { id: string; teacherCode: string; user: { fullName: string } };
  items: api.AssignmentItem[];
}

function AssignmentsTab() {
  const [classes, setClasses] = useState<api.ClassFull[]>([]);
  const [sessions, setSessions] = useState<api.SessionFull[]>([]);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [assignments, setAssignments] = useState<api.AssignmentItem[]>([]);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.fetchClassesFull().then(setClasses).catch(console.error);
    api.fetchSessionsFull().then((s) => {
      setSessions(s);
      const current = s.find((x) => x.isCurrent);
      const currentTerm = current?.terms.find((t) => t.isCurrent);
      if (currentTerm) setTermId(currentTerm.id);
    }).catch(console.error);
  }, []);

  const load = useCallback(() => {
    api.fetchAssignments({ classId: classId || undefined, termId: termId || undefined })
      .then(setAssignments)
      .catch(console.error);
  }, [classId, termId]);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, TeacherGroup>();
    for (const a of assignments) {
      if (!map.has(a.teacherId)) {
        map.set(a.teacherId, { teacher: a.teacher, items: [] });
      }
      map.get(a.teacherId)!.items.push(a);
    }
    return Array.from(map.values())
      .sort((x, y) => x.teacher.user.fullName.localeCompare(y.teacher.user.fullName));
  }, [assignments]);

  const detailGroup = groups.find((g) => g.teacher.id === detailId) ?? null;

  const allTerms = sessions.flatMap((s) => s.terms.map((t) => ({ value: t.id, label: `${s.name} — ${t.name}` })));
  const termLabel = allTerms.find((t) => t.value === termId)?.label ?? 'Selected term';
  const selectedSessionId = sessions.find((s) => s.terms.some((t) => t.id === termId))?.id ?? '';

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Select label="Class filter (optional)" placeholder="All classes" value={classId}
          onChange={(e) => setClassId(e.target.value)}
          options={classes.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Term filter" placeholder="All terms" value={termId}
          onChange={(e) => setTermId(e.target.value)} options={allTerms} />
        <div className="flex items-end">
          <Button onClick={() => setOpen(true)} leftIcon={<Plus className="h-4 w-4" />}
            disabled={!termId} title={!termId ? 'Select a term first' : ''}>
            Assign Teacher
          </Button>
        </div>
      </div>
      <ErrorBox error={error} />

      {groups.length === 0 ? (
        <Card><p className="text-sm text-text-muted text-center py-8">No teaching assignments for the selected filters yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => {
            const uniqueSubjects = Array.from(new Map(g.items.map((i) => [i.subjectId, i.subject.name])).values());
            const uniqueClasses = Array.from(new Set(g.items.map((i) => i.classId)));
            const preview = uniqueSubjects.slice(0, 3);
            return (
              <button key={g.teacher.id} onClick={() => setDetailId(g.teacher.id)}
                className="text-left card hover:shadow-elevated hover:border-primary transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {g.teacher.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-text-primary truncate">{g.teacher.user.fullName}</div>
                    <div className="text-xs text-text-muted">{g.teacher.teacherCode}</div>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  <span className="badge badge-info">{uniqueSubjects.length} subject{uniqueSubjects.length === 1 ? '' : 's'}</span>
                  <span className="badge badge-neutral">{uniqueClasses.length} class{uniqueClasses.length === 1 ? '' : 'es'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {preview.map((name) => (
                    <span key={name} className="badge badge-neutral">{name}</span>
                  ))}
                  {uniqueSubjects.length > 3 && (
                    <span className="badge badge-neutral">+{uniqueSubjects.length - 3} more</span>
                  )}
                </div>
                <div className="mt-3 text-xs text-primary font-medium">Click to view all assignments →</div>
              </button>
            );
          })}
        </div>
      )}

      <AssignmentModal open={open} onClose={() => setOpen(false)} onSaved={load}
        termId={termId} sessionId={selectedSessionId} termLabel={termLabel} />
      <TeacherDetailModal group={detailGroup} showTerm={!termId}
        onClose={() => setDetailId(null)} onRemoved={load} />
    </div>
  );
}

function TeacherDetailModal({ group, showTerm, onClose, onRemoved }: {
  group: TeacherGroup | null; showTerm: boolean; onClose: () => void; onRemoved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!group) return [];
    const map = new Map<string, {
      subjectId: string; subjectName: string; subjectCode?: string;
      chips: { id: number; label: string; className: string; termName: string }[];
    }>();
    for (const a of group.items) {
      if (!map.has(a.subjectId)) {
        map.set(a.subjectId, {
          subjectId: a.subjectId, subjectName: a.subject.name, subjectCode: a.subject.code, chips: [],
        });
      }
      map.get(a.subjectId)!.chips.push({
        id: a.id,
        className: a.class.name,
        termName: a.term?.name ?? '',
        label: showTerm && a.term?.name ? `${a.class.name} · ${a.term.name}` : a.class.name,
      });
    }
    return Array.from(map.values())
      .sort((x, y) => x.subjectName.localeCompare(y.subjectName))
      .map((r) => ({
        ...r,
        chips: r.chips.sort((p, q) =>
          p.className.localeCompare(q.className) || p.termName.localeCompare(q.termName)),
      }));
  }, [group, showTerm]);

  const totals = useMemo(() => {
    if (!group) return { assignments: 0, subjects: 0, classes: 0 };
    return {
      assignments: group.items.length,
      subjects: new Set(group.items.map((i) => i.subjectId)).size,
      classes: new Set(group.items.map((i) => i.classId)).size,
    };
  }, [group]);

  async function remove(id: number) {
    setError(null);
    try { await api.deleteAssignment(id); onRemoved(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  return (
    <Modal open={!!group} onClose={onClose}
      title={`${group?.teacher.user.fullName ?? ''} — Teaching Assignments`} wide>
      <div className="text-xs text-text-muted mb-3">
        {totals.assignments} assignment{totals.assignments === 1 ? '' : 's'} · {totals.subjects} subject{totals.subjects === 1 ? '' : 's'} · {totals.classes} class{totals.classes === 1 ? '' : 'es'}
      </div>
      <ErrorBox error={error} />
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {rows.map((r) => (
          <div key={r.subjectId} className="bg-gray-50 rounded-input px-3 py-2">
            <div className="text-sm font-medium text-text-primary mb-1.5">
              {r.subjectName}
              {r.subjectCode && <span className="badge badge-neutral ml-2">{r.subjectCode}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.chips.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 badge badge-info">
                  {c.label}
                  <button onClick={() => remove(c.id)} title={`Remove ${r.subjectName} — ${c.label}`}
                    className="hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-text-muted">No assignments for this teacher in the selected scope.</p>
        )}
      </div>
    </Modal>
  );
}

function AssignmentModal({ open, onClose, onSaved, termId, sessionId, termLabel }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  termId: string; sessionId: string; termLabel: string;
}) {
  const [classes, setClasses] = useState<api.ClassFull[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classSubjects, setClassSubjects] = useState<api.ClassSubjectItem[]>([]);
  const [existing, setExisting] = useState<api.AssignmentItem[]>([]);
  const [form, setForm] = useState({ classId: '', teacherId: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null); setInfo(null);
    setForm({ classId: '', teacherId: '' });
    setClassSubjects([]); setSelected(new Set()); setExisting([]);
    api.fetchClassesFull().then(setClasses).catch(console.error);
    fetchTeachers({ pageSize: 100 }).then((r) => setTeachers(r.items)).catch(console.error);
  }, [open]);

  useEffect(() => {
    if (form.classId) {
      api.fetchClassSubjects(form.classId).then(setClassSubjects).catch(console.error);
      setSelected(new Set());
    } else { setClassSubjects([]); setSelected(new Set()); }
  }, [form.classId]);

  useEffect(() => {
    if (form.classId && form.teacherId && termId) {
      api.fetchAssignments({ classId: form.classId, termId })
        .then((rows) => setExisting(rows.filter((r) => r.teacherId === form.teacherId)))
        .catch(console.error);
    } else setExisting([]);
  }, [form.classId, form.teacherId, termId]);

  const assignedSubjectIds = new Set(existing.map((e) => e.subjectId));

  const toggle = (id: string) => {
    if (assignedSubjectIds.has(id)) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(classSubjects.filter((cs) => !assignedSubjectIds.has(cs.subjectId)).map((cs) => cs.subjectId)));
  const clearAll = () => setSelected(new Set());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    try {
      const r = await api.createAssignmentsBulk({ ...form, subjectIds: Array.from(selected), sessionId, termId });
      setInfo(`Assigned ${r.created} subject(s). ${r.skipped} skipped (already assigned or not offered by this class).`);
      setSelected(new Set());
      onSaved();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Teacher — Multiple Subjects" wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="text-sm text-text-secondary bg-gray-50 p-3 rounded-input">Term: <strong>{termLabel}</strong></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Class" placeholder="Select class" value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            options={classes.map((c) => ({ value: c.id, label: c.department ? `${c.name} (${c.department})` : c.name }))} required />
          <Select label="Teacher" placeholder="Select teacher" value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            options={teachers.map((t) => ({ value: t.id, label: `${t.user.fullName} (${t.teacherCode})` }))} required />
        </div>

        {form.classId && classSubjects.length === 0 && (
          <p className="text-xs text-amber-600">This class has no subjects yet. Assign subjects in the "Class Subjects" tab first.</p>
        )}

        {classSubjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Subjects (click to select multiple)</label>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" type="button" onClick={selectAll}>Select all</Button>
                <Button size="sm" variant="ghost" type="button" onClick={clearAll}>Clear</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
              {classSubjects.map((cs) => {
                const isAssigned = assignedSubjectIds.has(cs.subjectId);
                const isSelected = selected.has(cs.subjectId);
                return (
                  <button key={cs.id} type="button" onClick={() => toggle(cs.subjectId)} disabled={isAssigned}
                    className={`p-2.5 rounded-input border text-left text-sm transition-colors ${
                      isAssigned ? 'bg-primary-light/30 border-primary/40 cursor-not-allowed opacity-70'
                      : isSelected ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-border hover:bg-primary-light/20'}`}>
                    <div className="font-medium">{cs.subject.name}</div>
                    <div className={`text-xs ${isSelected || isAssigned ? 'opacity-80' : 'text-text-muted'}`}>
                      {cs.subject.code}{isAssigned ? ' · Already assigned' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-text-muted mt-2">{selected.size} subject(s) selected</div>
          </div>
        )}

        <ErrorBox error={error} />
        {info && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="submit" loading={loading}
            disabled={!form.teacherId || !form.classId || selected.size === 0}>
            Assign {selected.size || ''} Subject{selected.size === 1 ? '' : 's'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
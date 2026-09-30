import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { fetchClassesFull, fetchTerms, fetchClassSubjects, fetchAssignments, ClassFull, TermItem, ClassSubjectItem, AssignmentItem } from '../../api/academic';
import { fetchTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, TimetableEntry } from '../../api/timetable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Pencil, X, ChevronDown } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function TimetablePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termId, setTermId] = useState('');

  useEffect(() => {
    fetchTerms().then((t) => {
      setTerms(t);
      const current = t.find((x) => x.isCurrent);
      if (current) setTermId(current.id);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Timetable</h1>
        <p className="text-text-secondary">
          {isAdmin ? 'Build the weekly class timetable with automatic clash detection.' : 'Your weekly teaching schedule.'}
        </p>
      </div>
      {isAdmin ? (
        <AdminTimetable terms={terms} termId={termId} setTermId={setTermId} />
      ) : (
        <TeacherTimetable terms={terms} termId={termId} setTermId={setTermId} />
      )}
    </div>
  );
}

function DayGrid({ entries, isAdmin, onAdd, onEdit, onDelete }: {
  entries: TimetableEntry[]; isAdmin: boolean;
  onAdd: (day: number) => void;
  onEdit: (e: TimetableEntry) => void;
  onDelete: (e: TimetableEntry) => void;
}) {
  // On small screens start with only Monday open; on desktop state is ignored (always visible)
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    return isMobile
      ? { 1: true, 2: false, 3: false, 4: false, 5: false }
      : { 1: true, 2: true, 3: true, 4: true, 5: true };
  });
  const toggle = (day: number) => setExpanded((prev) => ({ ...prev, [day]: !prev[day] }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
      {DAYS.map((day, i) => {
        const dayNum = i + 1;
        const isOpen = expanded[dayNum];
        const dayEntries = entries.filter((e) => e.dayOfWeek === dayNum);
        return (
          <Card key={day} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => toggle(dayNum)}
                className="flex items-center gap-1.5 text-left flex-1 min-w-0">
                <span className="font-semibold text-text-primary text-sm">{day}</span>
                <span className="text-[10px] text-text-muted md:hidden">({dayEntries.length})</span>
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform md:hidden ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAdmin && (
                <button type="button" onClick={() => onAdd(dayNum)} title={`Add period on ${day}`}
                  className="p-1 rounded hover:bg-primary-light text-primary">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className={`space-y-2 ${isOpen ? 'block' : 'hidden md:block'}`}>
              {dayEntries.map((e) => (
                <div key={e.id} className="bg-gray-50 rounded-input px-2 py-1.5">
                  <div className="text-xs font-semibold text-text-primary">{e.startTime} – {e.endTime}</div>
                  <div className="text-xs text-text-secondary truncate">{e.subject.name}</div>
                  <div className="text-[11px] text-text-muted truncate">
                    {isAdmin ? e.teacher.user.fullName : e.class.name}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => onEdit(e)} className="p-1 rounded hover:bg-gray-100 text-text-secondary"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => onDelete(e)} className="p-1 rounded hover:bg-red-50 text-red-500"><X className="h-3 w-3" /></button>
                    </div>
                  )}
                </div>
              ))}
              {dayEntries.length === 0 && (
                <div className="text-[11px] text-text-muted text-center py-4">No periods</div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AdminTimetable({ terms, termId, setTermId }: { terms: TermItem[]; termId: string; setTermId: (v: string) => void }) {
  const [classes, setClasses] = useState<ClassFull[]>([]);
  const [classId, setClassId] = useState('');
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<ClassSubjectItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [modal, setModal] = useState<{ open: boolean; day: number; editing: TimetableEntry | null }>({ open: false, day: 1, editing: null });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassesFull().then((c) => { setClasses(c); if (c.length) setClassId(c[0].id); }).catch(console.error);
  }, []);

  const load = useCallback(() => {
    if (!classId || !termId) return;
    fetchTimetable({ classId, termId }).then(setEntries).catch(console.error);
    fetchClassSubjects(classId).then(setSubjects).catch(console.error);
    fetchAssignments({ classId, termId }).then(setAssignments).catch(console.error);
  }, [classId, termId]);
  useEffect(() => { load(); }, [load]);

  async function remove(e: TimetableEntry) {
    if (!window.confirm(`Remove ${e.subject.name} (${e.startTime}–${e.endTime}) from ${DAYS[e.dayOfWeek - 1]}?`)) return;
    await deleteTimetableEntry(e.id).then(load).catch(console.error);
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}
          options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" />
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: `${t.session?.name ?? ''} — ${t.name}` }))} placeholder="Select term" />
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <DayGrid entries={entries} isAdmin
        onAdd={(day) => setModal({ open: true, day, editing: null })}
        onEdit={(e) => setModal({ open: true, day: e.dayOfWeek, editing: e })}
        onDelete={remove} />
      <EntryModal open={modal.open} day={modal.day} editing={modal.editing}
        classId={classId} termId={termId} subjects={subjects} assignments={assignments}
        onClose={() => setModal({ open: false, day: 1, editing: null })} onSaved={load} />
    </div>
  );
}

function EntryModal({ open, day, editing, classId, termId, subjects, assignments, onClose, onSaved }: {
  open: boolean; day: number; editing: TimetableEntry | null;
  classId: string; termId: string; subjects: ClassSubjectItem[]; assignments: AssignmentItem[];
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ dayOfWeek: day, startTime: '08:00', endTime: '08:40', subjectId: '', teacherId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(editing
      ? { dayOfWeek: editing.dayOfWeek, startTime: editing.startTime, endTime: editing.endTime, subjectId: editing.subjectId, teacherId: editing.teacherId }
      : { dayOfWeek: day, startTime: '08:00', endTime: '08:40', subjectId: '', teacherId: '' });
  }, [open, day, editing]);

  const teacherOptions = Array.from(new Map(
    assignments.filter((a) => a.subjectId === form.subjectId).map((a) => [a.teacher.id, a.teacher.user.fullName]),
  ).entries()).map(([value, label]) => ({ value, label }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = { ...form, classId, termId };
      if (editing) await updateTimetableEntry(editing.id, payload);
      else await createTimetableEntry(payload);
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Period' : `Add Period — ${DAYS[day - 1]}`}>
      <form onSubmit={submit} className="space-y-4">
        <Select label="Day" value={String(form.dayOfWeek)} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
          options={DAYS.map((d, i) => ({ value: String(i + 1), label: d }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
          <Input label="End Time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
        </div>
        <Select label="Subject" placeholder="Select subject" value={form.subjectId}
          onChange={(e) => setForm({ ...form, subjectId: e.target.value, teacherId: '' })}
          options={subjects.map((s) => ({ value: s.subjectId, label: s.subject.name }))} required />
        <Select label="Teacher" placeholder="Select teacher" value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          options={teacherOptions} required />
        {form.subjectId && teacherOptions.length === 0 && (
          <p className="text-xs text-amber-600">No teacher is assigned to this subject for this class/term yet. Assign one in Academics → Teacher Assignments.</p>
        )}
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <Button type="submit" className="w-full" loading={loading} disabled={!form.teacherId || !form.subjectId}>
          {editing ? 'Save Changes' : 'Add Period'}
        </Button>
      </form>
    </Modal>
  );
}

function TeacherTimetable({ terms, termId, setTermId }: { terms: TermItem[]; termId: string; setTermId: (v: string) => void }) {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    if (!termId) return;
    fetchTimetable({ mine: '1', termId }).then(setEntries).catch(console.error);
  }, [termId]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: `${t.session?.name ?? ''} — ${t.name}` }))} placeholder="Select term" />
      </div>
      <DayGrid entries={entries} isAdmin={false}
        onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
    </div>
  );
}
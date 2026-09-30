import { useCallback, useEffect, useState } from 'react';
import {
  fetchStudents, fetchStudent, fetchClasses, fetchSessions, fetchParents,
  linkParent, unlinkParent, Student, ClassItem, SessionItem, ParentItem,
} from '../../api/people';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StudentFormModal } from './StudentFormModal';
import { Plus, Search, Pencil, Users2, X, Upload } from 'lucide-react';
import { assetUrl } from '../../utils/assetUrl';
import { BulkImportModal } from './BulkImportModal';

export function StudentsPage() {
  const [items, setItems] = useState<Student[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [guardianFor, setGuardianFor] = useState<Student | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchStudents({ page, pageSize: 10, search: search || undefined, classId: classFilter || undefined });
      setItems(res.items);
      setMeta(res.meta);
    } catch (e) {
      console.error(e);
    }
  }, [page, search, classFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchClasses().then(setClasses).catch(console.error);
    fetchSessions().then(setSessions).catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Students</h1>
          <p className="text-text-secondary">Manage student records and guardian links.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBulkOpen(true)} variant="secondary" leftIcon={<Upload className="h-4 w-4" />}>
            Bulk Add Students
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Add Student
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-border">
          <Input placeholder="Search by name..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />} className="md:max-w-xs" />
          <Select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
            placeholder="All classes" options={classes.map((c) => ({ value: c.id, label: c.name }))} className="md:max-w-xs" />
        </div>

        <Table headers={['Student ID', 'Name', 'Class', 'Gender', 'Guardians', 'Status', 'Actions']}>
          {items.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{s.studentId}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {s.photoUrl ? (
                    <img src={assetUrl(s.photoUrl)!} alt={s.fullName}
                      className="h-9 w-9 rounded-full object-cover border border-border bg-white shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0">
                      {s.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-text-primary">{s.fullName}</div>
                    <div className="text-xs text-text-muted">{s.admissionNumber}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary">{s.class?.name ?? '—'}</td>
              <td className="px-4 py-3 text-text-secondary capitalize">{s.gender.toLowerCase()}</td>
              <td className="px-4 py-3 text-text-secondary">{s.parents?.length ?? 0}</td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status === 'active' ? 'success' : 'neutral'} label={s.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button title="Manage guardians" onClick={() => setGuardianFor(s)}
                    className="p-2 rounded-input hover:bg-primary-light text-primary">
                    <Users2 className="h-4 w-4" />
                  </button>
                  <button title="Edit" onClick={() => { setEditing(s); setFormOpen(true); }}
                    className="p-2 rounded-input hover:bg-gray-100 text-text-secondary">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                No students found. Click "Add Student" to create one.
              </td>
            </tr>
          )}
        </Table>
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <StudentFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load}
        initial={editing} classes={classes} sessions={sessions} />
      <GuardianModal student={guardianFor} onClose={() => setGuardianFor(null)} onChanged={load} />
      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} onSaved={load} classFilter={classFilter} />
    </div>
  );
}

function GuardianModal({ student, onClose, onChanged }: { student: Student | null; onClose: () => void; onChanged: () => void }) {
  const [current, setCurrent] = useState<Student | null>(null);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [relationship, setRelationship] = useState('guardian');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    setError(null);
    setSelectedParent('');
    fetchStudent(student.id).then(setCurrent).catch(console.error);
    fetchParents({ pageSize: 100 }).then((r) => setParents(r.items)).catch(console.error);
  }, [student]);

  async function addLink() {
    if (!student || !selectedParent) return;
    setError(null);
    try {
      await linkParent(student.id, { parentId: selectedParent, relationship, isPrimary: false });
      setCurrent(await fetchStudent(student.id));
      onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to link guardian');
    }
  }

  async function removeLink(parentId: string) {
    if (!student) return;
    try {
      await unlinkParent(student.id, parentId);
      setCurrent(await fetchStudent(student.id));
      onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to unlink guardian');
    }
  }

  return (
    <Modal open={!!student} onClose={onClose} title={`Guardians — ${student?.fullName ?? ''}`}>
      <div className="space-y-3">
        {(current?.parents ?? []).length === 0 && (
          <p className="text-sm text-text-muted">No guardians linked yet.</p>
        )}
        {(current?.parents ?? []).map((p) => (
          <div key={p.parentId} className="flex items-center justify-between bg-gray-50 rounded-input px-3 py-2">
            <div>
              <div className="text-sm font-medium text-text-primary">{p.parent.user.fullName}</div>
              <div className="text-xs text-text-muted capitalize">{p.relationship}{p.isPrimary ? ' · primary' : ''}</div>
            </div>
            <button onClick={() => removeLink(p.parentId)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className="border-t border-border pt-4 space-y-3">
          <Select label="Link a guardian" placeholder="Select parent/guardian" value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            options={parents.map((p) => ({ value: p.id, label: `${p.user.fullName} (${p.parentCode})` }))} />
          <Select label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)}
            options={[
              { value: 'mother', label: 'Mother' },
              { value: 'father', label: 'Father' },
              { value: 'guardian', label: 'Guardian' },
              { value: 'other', label: 'Other' },
            ]} />
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
          <Button onClick={addLink} disabled={!selectedParent} className="w-full">Link Guardian</Button>
        </div>
      </div>
    </Modal>
  );
}
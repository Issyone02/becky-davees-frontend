import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { createStudent, updateStudent, Student, ClassItem, SessionItem } from '../../api/people';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: Student | null;
  classes: ClassItem[];
  sessions: SessionItem[];
}

export function StudentFormModal({ open, onClose, onSaved, initial, classes, sessions }: Props) {
  const [form, setForm] = useState({
    fullName: '', studentId: '', admissionNumber: '', dateOfBirth: '',
    gender: 'MALE', classId: '', sessionId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setForm({
        fullName: initial.fullName,
        studentId: initial.studentId,
        admissionNumber: initial.admissionNumber,
        dateOfBirth: initial.dateOfBirth.slice(0, 10),
        gender: initial.gender,
        classId: initial.classId,
        sessionId: initial.sessionId,
      });
    } else {
      const current = sessions.find((s) => s.isCurrent);
      setForm({ fullName: '', studentId: '', admissionNumber: '', dateOfBirth: '', gender: 'MALE', classId: '', sessionId: current?.id ?? '' });
    }
  }, [open, initial, sessions]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (initial) await updateStudent(initial.id, form);
      else await createStudent(form);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to save student');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Student' : 'Add Student'} wide>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Student ID" placeholder="STD-0004" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
          <Input label="Admission Number" placeholder="ADM-0004" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
            options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Class" placeholder="Select class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
            options={classes.map((c) => ({ value: c.id, label: c.name }))} required />
          <Select label="Session" placeholder="Select session" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
            options={sessions.map((s) => ({ value: s.id, label: s.name }))} required />
        </div>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Add Student'}</Button>
        </div>
      </form>
    </Modal>
  );
}
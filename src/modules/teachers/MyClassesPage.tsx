import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyClasses } from '../../api/attendance';
import { Card } from '../../components/ui/Card';
import { BookOpen, ClipboardCheck, PenLine, CalendarDays } from 'lucide-react';

interface MyClass { classId: string; className?: string; class?: { name: string }; subjects: { id: string; name: string; code?: string }[] }

export function MyClassesPage() {
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyClasses().then(setClasses).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Classes</h1>
        <p className="text-text-secondary">Classes and subjects assigned to you this term.</p>
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      {classes.length === 0 ? (
        <Card><p className="text-sm text-text-muted text-center py-8">No class assignments for the current term yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Card key={c.classId}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-input bg-primary-light text-primary flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="font-semibold text-text-primary">{c.className ?? c.class?.name}</div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {c.subjects.map((s) => (
                  <span key={s.id} className="badge badge-neutral">{s.name}</span>
                ))}
                {c.subjects.length === 0 && <span className="text-xs text-text-muted">No subjects assigned</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/attendance" className="btn-secondary text-xs inline-flex items-center gap-1">
                  <ClipboardCheck className="h-3 w-3" /> Attendance
                </Link>
                <Link to="/academics" className="btn-secondary text-xs inline-flex items-center gap-1">
                  <PenLine className="h-3 w-3" /> Scores
                </Link>
                <Link to="/timetable" className="btn-secondary text-xs inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Timetable
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
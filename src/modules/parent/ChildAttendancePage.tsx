import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMyChildren, fetchChildAttendance, ParentChild, fetchParentTerms } from '../../api/parent';
import { TermItem } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="text-lg font-bold text-text-primary">{value}</div>
    </Card>
  );
}

export function ChildAttendancePage() {
  const [params] = useSearchParams();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [childId, setChildId] = useState('');
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termId, setTermId] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchMyChildren().then((c) => { setChildren(c); setChildId(params.get('child') ?? c[0]?.id ?? ''); }).catch(console.error);
    fetchParentTerms().then((t) => { setTerms(t); const cur = t.find((x) => x.isCurrent); if (cur) setTermId(cur.id); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!childId || !termId) return;
    fetchChildAttendance(childId, termId).then(setData).catch(console.error);
  }, [childId, termId]);

  const badge = (s: string) =>
    s === 'present' ? <StatusBadge status="success" label="Present" /> :
    s === 'late' ? <StatusBadge status="warning" label="Late" /> :
    s === 'excused' ? <StatusBadge status="info" label="Excused" /> :
    <StatusBadge status="danger" label="Absent" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
        <p className="text-text-secondary">Daily attendance record for the selected child and term.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)}
          options={children.map((c) => ({ value: c.id, label: `${c.fullName} — ${c.className}` }))} placeholder="Select child" />
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" />
      </div>
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Stat label="Present" value={data.counts.present} />
          <Stat label="Late" value={data.counts.late} />
          <Stat label="Absent" value={data.counts.absent} />
          <Stat label="Excused" value={data.counts.excused} />
          <Stat label="Rate" value={`${data.rate ?? '—'}%`} />
        </div>
      )}
      <Card className="p-0 overflow-hidden">
        <Table headers={['Date', 'Status']}>
          {(data?.records ?? []).slice(0, 60).map((r: any) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-text-secondary">
                {new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-4 py-2">{badge(r.status)}</td>
            </tr>
          ))}
          {(data?.records.length ?? 0) === 0 && (
            <tr><td colSpan={2} className="px-4 py-10 text-center text-text-muted">No attendance records for this term yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
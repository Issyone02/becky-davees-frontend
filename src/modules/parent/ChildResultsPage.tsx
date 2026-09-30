import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMyChildren, fetchChildResults, ParentChild } from '../../api/parent';
import { fetchTerms, TermItem } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';

export function ChildResultsPage() {
  const [params] = useSearchParams();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [childId, setChildId] = useState('');
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termId, setTermId] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchMyChildren().then((c) => { setChildren(c); setChildId(params.get('child') ?? c[0]?.id ?? ''); }).catch(console.error);
    fetchTerms().then((t) => { setTerms(t); const cur = t.find((x) => x.isCurrent); if (cur) setTermId(cur.id); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!childId || !termId) return;
    fetchChildResults(childId, termId).then(setData).catch(console.error);
  }, [childId, termId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Results</h1>
        <p className="text-text-secondary">Subject-by-subject performance for the selected term.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)}
          options={children.map((c) => ({ value: c.id, label: `${c.fullName} — ${c.className}` }))} placeholder="Select child" />
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" />
      </div>
      {data && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="badge badge-info">Average: {data.average ?? '—'}</span>
          {data.grade && <span className="badge badge-success">Grade: {data.grade}</span>}
          {data.remark && <span className="badge badge-neutral">{data.remark}</span>}
        </div>
      )}
      <Card className="p-0 overflow-hidden">
        <Table headers={['Subject', 'CA (0–30)', 'Exam (0–70)', 'Total', 'Grade', 'Position']}>
          {(data?.results ?? []).map((r: any) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{r.subject.name}</td>
              <td className="px-4 py-3">{r.testScore}</td>
              <td className="px-4 py-3">{r.examScore}</td>
              <td className="px-4 py-3 font-semibold">{r.totalScore}</td>
              <td className="px-4 py-3">{r.grade ? <StatusBadge status="info" label={r.grade} /> : '—'}</td>
              <td className="px-4 py-3 text-text-secondary">{r.position ?? '—'}</td>
            </tr>
          ))}
          {(data?.results.length ?? 0) === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No results published for this term yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
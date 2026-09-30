import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMyChildren, fetchChildReportCard, ParentChild } from '../../api/parent';
import { fetchTerms, TermItem } from '../../api/academic';
import { ReportCardTemplate } from '../academics/ReportCardTemplate';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Printer } from 'lucide-react';

export function ChildReportCardsPage() {
  const [params] = useSearchParams();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [childId, setChildId] = useState('');
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termId, setTermId] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyChildren().then((c) => { setChildren(c); setChildId(params.get('child') ?? c[0]?.id ?? ''); }).catch(console.error);
    fetchTerms().then((t) => { setTerms(t); const cur = t.find((x) => x.isCurrent); if (cur) setTermId(cur.id); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!childId || !termId) return;
    setError(null); setData(null);
    fetchChildReportCard(childId, termId).then(setData).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed to load report card'));
  }, [childId, termId]);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Report Card</h1>
          <p className="text-text-secondary">Official continuous assessment report — printable.</p>
        </div>
        {data && (
          <Button onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />} className="no-print">Print / Save as PDF</Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 no-print">
        <Select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)}
          options={children.map((c) => ({ value: c.id, label: `${c.fullName} — ${c.className}` }))} placeholder="Select child" />
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" />
      </div>
      {error && <Card><div className="text-sm text-red-500">{error}</div></Card>}
      {data && <ReportCardTemplate data={data} />}
    </div>
  );
}
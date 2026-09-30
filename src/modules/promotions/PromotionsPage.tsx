import { useCallback, useEffect, useState } from 'react';
import * as promo from '../../api/promotions';
import { fetchSessionsFull, SessionFull } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { GraduationCap, ScrollText, ArrowRightCircle } from 'lucide-react';

type Decision = 'PROMOTE' | 'REPEAT' | 'GRADUATE' | 'WITHDRAW';
interface Row { studentId: string; name: string; fromClass: string; decision: Decision; toClassId: string }

export function PromotionsPage() {
  const [sessions, setSessions] = useState<SessionFull[]>([]);
  const [fromSessionId, setFromSessionId] = useState('');
  const [toSessionId, setToSessionId] = useState('');
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof promo.fetchPromotionPreview>> | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptFor, setTranscriptFor] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionsFull().then((s) => {
      setSessions(s);
      const cur = s.find((x) => x.isCurrent);
      if (cur) setFromSessionId(cur.id);
    }).catch(console.error);
    promo.fetchPromotionBatches().then(setBatches).catch(console.error);
    promo.fetchAlumni().then(setAlumni).catch(console.error);
  }, []);

  const load = useCallback(() => {
    if (!fromSessionId) return;
    setError(null);
    promo.fetchPromotionPreview(fromSessionId).then((p) => {
      setPreview(p);
      const m: Record<string, string> = {};
      const r: Row[] = [];
      for (const c of p.classes) {
        m[c.classId] = c.defaultDecision === 'GRADUATE' ? 'GRADUATE' : '';
        for (const s of c.students) {
          r.push({ studentId: s.id, name: s.fullName, fromClass: c.className, decision: c.defaultDecision === 'GRADUATE' ? 'GRADUATE' : 'PROMOTE', toClassId: '' });
        }
      }
      setMapping(m);
      setRows(r);
    }).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [fromSessionId]);
  useEffect(() => { load(); }, [load]);

  // Apply class-level mapping to its students
  function applyMapping(classId: string, value: string) {
    setMapping({ ...mapping, [classId]: value });
    setRows(rows.map((r) => {
      if (r.fromClass !== preview?.classes.find((c) => c.classId === classId)?.className) return r;
      if (value === 'GRADUATE') return { ...r, decision: 'GRADUATE', toClassId: '' };
      if (value && value !== 'PER_STUDENT') return { ...r, decision: 'PROMOTE', toClassId: value };
      return { ...r, decision: 'PROMOTE', toClassId: '' };
    }));
  }

  const counts = rows.reduce((a, r) => ({ ...a, [r.decision]: (a[r.decision] ?? 0) + 1 }), {} as Record<string, number>);

  async function apply() {
    const msg = `Promote ${counts.PROMOTE ?? 0}, Repeat ${counts.REPEAT ?? 0}, Graduate ${counts.GRADUATE ?? 0}, Withdraw ${counts.WITHDRAW ?? 0}. Continue?`;
    if (!window.confirm(msg)) return;
    setBusy(true); setError(null); setInfo(null);
    try {
      const r = await promo.applyPromotion({
        fromSessionId,
        toSessionId: toSessionId || null,
        entries: rows.map((x) => ({ studentId: x.studentId, decision: x.decision, toClassId: x.toClassId || null })),
      });
      setInfo(`Applied: ${r.counts.promoted} promoted, ${r.counts.repeated} repeated, ${r.counts.graduated} graduated, ${r.counts.withdrawn} withdrawn.`);
      promo.fetchPromotionBatches().then(setBatches);
      promo.fetchAlumni().then(setAlumni);
      load();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Session Promotions</h1>
        <p className="text-text-secondary">End-of-session transition: promote, repeat, graduate or withdraw — with permanent history.</p>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Ending session (from)" value={fromSessionId} onChange={(e) => setFromSessionId(e.target.value)}
            options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" />
          <Select label="New session (to)" value={toSessionId} onChange={(e) => setToSessionId(e.target.value)}
            options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select new session" />
        </div>
        <p className="text-xs text-text-muted mt-2">If the new session doesn't exist yet, create it first in Academics → Sessions (with its terms), then return here.</p>
      </Card>

      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      {info && <div className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}

      {/* Step 2: class mapping */}
      <Card className="mb-4 p-0 overflow-hidden">
        <div className="px-4 py-3 font-semibold text-text-primary">Step 1 — Class mapping</div>
        <Table headers={['Class (ending session)', 'Students', 'Destination']}>
          {(preview?.classes ?? []).map((c) => (
            <tr key={c.classId}>
              <td className="px-4 py-3 font-medium text-text-primary">{c.className}</td>
              <td className="px-4 py-3">{c.students.length}</td>
              <td className="px-4 py-3">
                <Select value={mapping[c.classId] ?? ''} onChange={(e) => applyMapping(c.classId, e.target.value)}
                  placeholder="Decide per student"
                  options={[
                    ...(preview?.allClasses ?? []).filter((x) => x.id !== c.classId).map((x) => ({ value: x.id, label: `→ ${x.name}` })),
                    { value: 'GRADUATE', label: '🎓 Graduate (leave school)' },
                    { value: 'PER_STUDENT', label: 'Decide per student (e.g. department split)' },
                  ]} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Step 3: per-student decisions */}
      <Card className="mb-4 p-0 overflow-hidden">
        <div className="px-4 py-3 font-semibold text-text-primary">Step 2 — Student decisions</div>
        <Table headers={['Student', 'From', 'Decision', 'Destination class']}>
          {rows.map((r) => (
            <tr key={r.studentId}>
              <td className="px-4 py-2 font-medium text-text-primary">{r.name}</td>
              <td className="px-4 py-2 text-text-secondary">{r.fromClass}</td>
              <td className="px-4 py-2">
                <Select value={r.decision} onChange={(e) => setRows(rows.map((x) => x.studentId === r.studentId ? { ...x, decision: e.target.value as Decision, toClassId: e.target.value === 'REPEAT' ? '' : x.toClassId } : x))}
                  options={[{ value: 'PROMOTE', label: 'Promote' }, { value: 'REPEAT', label: 'Repeat class' }, { value: 'GRADUATE', label: 'Graduate' }, { value: 'WITHDRAW', label: 'Withdraw' }]} />
              </td>
              <td className="px-4 py-2">
                {(r.decision === 'PROMOTE') ? (
                  <Select value={r.toClassId} onChange={(e) => setRows(rows.map((x) => x.studentId === r.studentId ? { ...x, toClassId: e.target.value } : x))}
                    placeholder="Select class"
                    options={(preview?.allClasses ?? []).filter((x) => x.name !== r.fromClass).map((x) => ({ value: x.id, label: x.name }))} />
                ) : r.decision === 'REPEAT' ? (
                  <span className="text-xs text-text-muted">Stays in {r.fromClass}</span>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No active students in this session's classes.</td></tr>}
        </Table>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-border">
          <span className="text-xs text-text-muted">
            Promote {counts.PROMOTE ?? 0} · Repeat {counts.REPEAT ?? 0} · Graduate {counts.GRADUATE ?? 0} · Withdraw {counts.WITHDRAW ?? 0}
          </span>
          <Button className="ml-auto" onClick={apply} loading={busy} leftIcon={<ArrowRightCircle className="h-4 w-4" />} disabled={rows.length === 0}>
            Apply Promotion
          </Button>
        </div>
      </Card>

      {/* Alumni */}
      <Card className="mb-4 p-0 overflow-hidden">
        <div className="px-4 py-3 font-semibold text-text-primary flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Alumni (graduated)</div>
        <Table headers={['Student', 'Last class', 'Graduated on', 'Transcript']}>
          {alumni.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-2 font-medium text-text-primary">{a.fullName}</td>
              <td className="px-4 py-2 text-text-secondary">{a.class?.name}</td>
              <td className="px-4 py-2 text-text-secondary">{a.graduatedAt ? new Date(a.graduatedAt).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-2">
                <button className="p-2 rounded-input hover:bg-primary-light text-primary" title="View transcript" onClick={() => setTranscriptFor(a.id)}>
                  <ScrollText className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {alumni.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No graduates yet.</td></tr>}
        </Table>
      </Card>

      {/* History */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 font-semibold text-text-primary">Promotion history</div>
        <Table headers={['Date', 'From session', 'To session', 'Summary']}>
          {batches.map((b) => {
            const c = JSON.parse(b.counts || '{}');
            return (
              <tr key={b.id}>
                <td className="px-4 py-2 text-text-secondary">{new Date(b.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">{b.fromSession?.name}</td>
                <td className="px-4 py-2">{b.toSession?.name ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-text-secondary">
                  {c.promoted ?? 0} promoted · {c.repeated ?? 0} repeated · {c.graduated ?? 0} graduated · {c.withdrawn ?? 0} withdrawn ({b.entries?.length ?? 0} entries)
                </td>
              </tr>
            );
          })}
          {batches.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No promotions applied yet.</td></tr>}
        </Table>
      </Card>

      <TranscriptModal studentId={transcriptFor} onClose={() => setTranscriptFor(null)} />
    </div>
  );
}

function TranscriptModal({ studentId, onClose }: { studentId: string | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!studentId) return;
    setData(null);
    promo.fetchTranscript(studentId).then(setData).catch(console.error);
  }, [studentId]);
  return (
    <Modal open={!!studentId} onClose={onClose} title={`Transcript — ${data?.student?.fullName ?? ''}`} wide>
      {data && (
        <Table headers={['Session', 'Term', 'Total', 'Average', 'Grade', 'Position']}>
          {data.cards.map((c: any) => (
            <tr key={c.id}>
              <td className="px-4 py-2">{c.session?.name}</td>
              <td className="px-4 py-2">{c.term?.name}</td>
              <td className="px-4 py-2">{c.totalScore}</td>
              <td className="px-4 py-2">{c.averageScore}</td>
              <td className="px-4 py-2"><StatusBadge status="info" label={c.overallGrade || '—'} /></td>
              <td className="px-4 py-2">{c.overallPosition ?? '—'}</td>
            </tr>
          ))}
          {data.cards.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No report cards on record.</td></tr>}
        </Table>
      )}
    </Modal>
  );
}
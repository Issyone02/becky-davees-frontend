import { assetUrl } from '../../utils/assetUrl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSessionsFull, fetchTerms, fetchClassesFull, SessionFull, TermItem, ClassFull } from '../../api/academic';
import * as fin from '../../api/finance';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Plus, Pencil, Printer, Receipt, BookOpen, Ban, ChevronDown, Copy } from 'lucide-react';

const tabs = ['Fee Structures', 'Balances', 'Payments'] as const;
type Tab = (typeof tabs)[number];

const METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Card'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function FinancePage() {
  const [tab, setTab] = useState<Tab>('Fee Structures');
  const [sessions, setSessions] = useState<SessionFull[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [classes, setClasses] = useState<ClassFull[]>([]);

  useEffect(() => {
    fetchSessionsFull().then(setSessions).catch(console.error);
    fetchTerms().then(setTerms).catch(console.error);
    fetchClassesFull().then(setClasses).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Finance</h1>
          <p className="text-text-secondary">Fee structures, payments, balances and receipts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-input text-sm font-medium ${tab === t ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === 'Fee Structures' && <FeeStructuresTab sessions={sessions} terms={terms} classes={classes} />}
      {tab === 'Balances' && <BalancesTab terms={terms} classes={classes} />}
      {tab === 'Payments' && <PaymentsTab terms={terms} classes={classes} />}
    </div>
  );
}

function FeeStructuresTab({ sessions, terms, classes }: { sessions: SessionFull[]; terms: TermItem[]; classes: ClassFull[] }) {
  const [sessionId, setSessionId] = useState('');
  const [termId, setTermId] = useState('');
  const [rows, setRows] = useState<fin.FeeStructure[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<fin.FeeStructure | null>(null);
  const [presetClassId, setPresetClassId] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [carryOpen, setCarryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!sessionId && sessions.length) setSessionId(sessions.find((s) => s.isCurrent)?.id ?? sessions[0].id); }, [sessions]);
  useEffect(() => { if (!termId && terms.length) setTermId(terms.find((t) => t.isCurrent)?.id ?? terms[0].id); }, [terms]);

  const load = useCallback(() => {
    if (!sessionId || !termId) return;
    fin.fetchFeeStructures({ sessionId, termId }).then(setRows).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [sessionId, termId]);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, { classId: string; cls: ClassFull | undefined; items: fin.FeeStructure[] }>();
    for (const f of rows) {
      if (!map.has(f.classId)) {
        map.set(f.classId, { classId: f.classId, cls: classes.find((c) => c.id === f.classId), items: [] });
      }
      map.get(f.classId)!.items.push(f);
    }
    return Array.from(map.values()).sort((a, b) => (a.cls?.name ?? '').localeCompare(b.cls?.name ?? ''));
  }, [rows, classes]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Select label="Session" value={sessionId} onChange={(e) => setSessionId(e.target.value)}
          options={sessions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select session" />
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" />
        <div className="flex items-end">
          <Button onClick={() => { setEditing(null); setPresetClassId(''); setOpen(true); }}
            disabled={!sessionId || !termId} leftIcon={<Plus className="h-4 w-4" />}>Add Fee Structure</Button>
        </div>
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}

      {groups.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted text-center py-4">
            No fee structures for this session/term yet. Remember: fees belong to the <strong>class</strong>, not the student —
            anyone promoted or enrolled into a class automatically inherits whatever structures exist for that class and term.
          </p>
          <div className="flex justify-center gap-2 pb-4">
            <Button variant="secondary" leftIcon={<Copy className="h-4 w-4" />} onClick={() => setCarryOpen(true)}>Inherit from Previous Term</Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setPresetClassId(''); setOpen(true); }}>Add Fee Structure</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {groups.map((g) => {
            const total = g.items.reduce((a, f) => a + f.amount, 0);
            const isOpen = !!expanded[g.classId];
            return (
              <div key={g.classId} className="card p-0 overflow-hidden">
                <button onClick={() => setExpanded({ ...expanded, [g.classId]: !isOpen })}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left">
                  <div className="min-w-0">
                    <div className="font-semibold text-text-primary truncate">{g.cls?.name ?? 'Class'}</div>
                    <div className="text-xs text-text-muted">
                      {g.items.length} fee item{g.items.length === 1 ? '' : 's'} · Total per student: <strong className="text-text-secondary">{total.toLocaleString()}</strong>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-border">
                    {g.items.map((f) => (
                      <div key={f.id} className="flex items-center justify-between px-4 py-2 border-b border-border last:border-b-0">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">{f.feeType}</div>
                          <div className="text-xs text-text-muted">Due {new Date(f.dueDate).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{f.amount.toLocaleString()}</span>
                          <button title="Edit fee item"
                            onClick={() => { setEditing(f); setPresetClassId(g.classId); setOpen(true); }}
                            className="p-1.5 rounded hover:bg-gray-100 text-text-secondary">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="p-3">
                      <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3 w-3" />}
                        onClick={() => { setEditing(null); setPresetClassId(g.classId); setOpen(true); }}>
                        Add fee item to {g.cls?.name ?? 'this class'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <FeeStructureModal open={open} onClose={() => setOpen(false)} onSaved={load} initial={editing}
        sessionId={sessionId} termId={termId} classes={classes} presetClassId={presetClassId} />
      <CarryForwardModal open={carryOpen} onClose={() => setCarryOpen(false)} onSaved={load}
        toSessionId={sessionId} toTermId={termId} sessions={sessions} terms={terms} />
    </div>
  );
}

function CarryForwardModal({ open, onClose, onSaved, toSessionId, toTermId, sessions, terms }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  toSessionId: string; toTermId: string; sessions: any[]; terms: TermItem[];
}) {
  const sorted = [...terms].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const idx = sorted.findIndex((t) => t.id === toTermId);
  const defaultPrev = idx > 0 ? sorted[idx - 1] : null;
  const [fromTermId, setFromTermId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null); setResult(null);
    setFromTermId(defaultPrev?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, toTermId]);

  const fromTerm = terms.find((t) => t.id === fromTermId);
  const fromSessionId = fromTerm?.sessionId ?? (fromTerm as any)?.session?.id ?? '';
  const toTerm = terms.find((t) => t.id === toTermId);
  const toSession = sessions.find((s) => s.id === toSessionId);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const r = await fin.carryForwardFeeStructures({ fromSessionId, fromTermId, toSessionId, toTermId });
      setResult(`Inherited ${r.created} fee item(s). ${r.skipped} already existed and were left untouched.`);
      onSaved();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Inherit Fee Structures">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Copies every class's fee items from the source term into <strong>{toSession?.name} — {toTerm?.name}</strong> (same amounts; due dates set to the new term's end). Existing items are never overwritten.
        </p>
        <Select label="Copy from (source term)" value={fromTermId} onChange={(e) => setFromTermId(e.target.value)}
          placeholder="Select source term"
          options={sorted.filter((t) => t.id !== toTermId).map((t) => ({ value: t.id, label: `${t.session?.name ?? ''} — ${t.name}` }))} />
        {result && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-input">{result}</div>}
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={submit} loading={busy} disabled={!fromTermId} leftIcon={<Copy className="h-4 w-4" />}>Inherit</Button>
        </div>
      </div>
    </Modal>
  );
}
function FeeStructureModal({ open, onClose, onSaved, initial, sessionId, termId, classes, presetClassId }: {
  open: boolean; onClose: () => void; onSaved: () => void; initial: fin.FeeStructure | null;
  sessionId: string; termId: string; classes: ClassFull[]; presetClassId: string;
}) {
  const [form, setForm] = useState({ classId: '', feeType: '', amount: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial
      ? { classId: initial.classId, feeType: initial.feeType, amount: String(initial.amount), dueDate: initial.dueDate.slice(0, 10) }
      : { classId: presetClassId, feeType: '', amount: '', dueDate: '' });
  }, [open, initial, presetClassId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (initial) {
        await fin.updateFeeStructure(initial.id, { feeType: form.feeType, amount: Number(form.amount), dueDate: form.dueDate });
      } else {
        await fin.createFeeStructure({ ...form, classId: form.classId, sessionId, termId, amount: Number(form.amount) });
      }
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Fee Structure' : 'Add Fee Structure'}>
      <form onSubmit={submit} className="space-y-4">
        {!initial && (
          <Select label="Class" placeholder="Select class" value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            disabled={!!presetClassId} required />
        )}
        <Input label="Fee Type" placeholder="e.g. Tuition, PTA Levy, Exam Fee" value={form.feeType}
          onChange={(e) => setForm({ ...form, feeType: e.target.value })} required />
        <Input label="Amount" type="number" min={1} value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <Input label="Due Date" type="date" value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <Button type="submit" className="w-full" loading={loading}>{initial ? 'Save Changes' : 'Create Fee Structure'}</Button>
      </form>
    </Modal>
  );
}

function BalancesTab({ terms, classes }: { terms: TermItem[]; classes: ClassFull[] }) {
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [data, setData] = useState<{ rows: fin.BalanceRow[]; structures: fin.FeeStructure[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<fin.BalanceRow | null>(null);
  const [ledgerFor, setLedgerFor] = useState<fin.BalanceRow | null>(null);

  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  useEffect(() => { if (!termId && terms.length) setTermId(terms.find((t) => t.isCurrent)?.id ?? terms[0].id); }, [terms]);

  const load = useCallback(() => {
    if (!classId || !termId) return;
    fin.fetchBalances({ classId, termId }).then(setData).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [classId, termId]);
  useEffect(() => { load(); }, [load]);

  const badge = (s: string) =>
    s === 'paid' ? <StatusBadge status="success" label="Paid" /> :
    s === 'partial' ? <StatusBadge status="warning" label="Partial" /> :
    s === 'unbilled' ? <StatusBadge status="neutral" label="No fees set" /> :
    <StatusBadge status="danger" label="Unpaid" />;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}
          options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" />
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" />
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <Card className="p-0 overflow-hidden">
        <Table headers={['Student', 'Billed', 'Paid', 'Balance', 'Status', 'Actions']}>
          {(data?.rows ?? []).map((r) => (
            <tr key={r.student.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{r.student.fullName}</td>
              <td className="px-4 py-3 text-text-secondary">{r.totalBilled.toLocaleString()}</td>
              <td className="px-4 py-3 text-green-600">{r.totalPaid.toLocaleString()}</td>
              <td className="px-4 py-3 font-semibold text-text-primary">{r.balance.toLocaleString()}</td>
              <td className="px-4 py-3">{badge(r.status)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setPayFor(r)}
                    disabled={r.status === 'paid' || r.status === 'unbilled'}>Record Payment</Button>
                  <Button size="sm" variant="ghost" onClick={() => setLedgerFor(r)} leftIcon={<BookOpen className="h-3 w-3" />}>Ledger</Button>
                </div>
              </td>
            </tr>
          ))}
          {(data?.rows.length ?? 0) === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No students in this class.</td></tr>
          )}
        </Table>
      </Card>
      <PaymentModal open={!!payFor} onClose={() => setPayFor(null)} onSaved={load}
        student={payFor?.student ?? null} termId={termId} />
      <LedgerModal open={!!ledgerFor} onClose={() => setLedgerFor(null)}
        student={ledgerFor?.student ?? null} termId={termId} />
    </div>
  );
}

function PaymentModal({ open, onClose, onSaved, student, termId }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  student: { id: string; fullName: string } | null; termId: string;
}) {
  const [lines, setLines] = useState<fin.LedgerLine[]>([]);
  const [form, setForm] = useState({ feeStructureId: '', amount: '', paymentMethod: 'Cash', paymentDate: todayStr() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !student) return;
    setError(null);
    setForm({ feeStructureId: '', amount: '', paymentMethod: 'Cash', paymentDate: todayStr() });
    fin.fetchLedger({ studentId: student.id, termId }).then((l) => setLines(l.lines)).catch(console.error);
  }, [open, student, termId]);

  const selectable = lines.filter((l) => l.balance > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setLoading(true); setError(null);
    try {
      await fin.recordPayment({
        studentId: student.id,
        feeStructureId: Number(form.feeStructureId),
        amountPaid: Number(form.amount),
        paymentMethod: form.paymentMethod,
        paymentDate: form.paymentDate,
        parentId: null,
      });
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Record Payment — ${student?.fullName ?? ''}`}>
      <form onSubmit={submit} className="space-y-4">
        <Select label="Fee Item" placeholder="Select fee item" value={form.feeStructureId}
          onChange={(e) => {
            const line = selectable.find((l) => String(l.structure.id) === e.target.value);
            setForm({ ...form, feeStructureId: e.target.value, amount: line ? String(line.balance) : form.amount });
          }}
          options={selectable.map((l) => ({ value: String(l.structure.id), label: `${l.structure.feeType} — balance ${l.balance.toLocaleString()}` }))} required />
        {selectable.length === 0 && <p className="text-xs text-amber-600">No outstanding fee items for this student in this term.</p>}
        <Input label="Amount" type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <Select label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
          options={METHODS.map((m) => ({ value: m, label: m }))} />
        <Input label="Payment Date" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} required />
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <Button type="submit" className="w-full" loading={loading} disabled={!form.feeStructureId}>Record Payment</Button>
      </form>
    </Modal>
  );
}

function LedgerModal({ open, onClose, student, termId }: {
  open: boolean; onClose: () => void; student: { id: string; fullName: string } | null; termId: string;
}) {
  const [ledger, setLedger] = useState<{ lines: fin.LedgerLine[]; payments: fin.PaymentRow[] } | null>(null);

  useEffect(() => {
    if (!open || !student) return;
    fin.fetchLedger({ studentId: student.id, termId }).then(setLedger).catch(console.error);
  }, [open, student, termId]);

  return (
    <Modal open={open} onClose={onClose} title={`Fee Ledger — ${student?.fullName ?? ''}`} wide>
      <div className="space-y-4">
        <Table headers={['Fee Item', 'Billed', 'Paid', 'Balance']}>
          {(ledger?.lines ?? []).map((l) => (
            <tr key={l.structure.id}>
              <td className="px-3 py-2 text-text-primary">{l.structure.feeType}</td>
              <td className="px-3 py-2">{l.structure.amount.toLocaleString()}</td>
              <td className="px-3 py-2 text-green-600">{l.paid.toLocaleString()}</td>
              <td className="px-3 py-2 font-semibold">{l.balance.toLocaleString()}</td>
            </tr>
          ))}
        </Table>
        <div className="text-sm font-medium text-text-secondary">Payment history</div>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {(ledger?.payments ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-input px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-text-primary">{p.receiptNumber}</span>
                <span className="text-text-muted"> · {p.feeStructure.feeType} · {p.paymentMethod} · {new Date(p.paymentDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">{p.amountPaid.toLocaleString()}</span>
                {p.status === 'voided' ? <StatusBadge status="danger" label="Voided" /> : <StatusBadge status="success" label="Paid" />}
              </div>
            </div>
          ))}
          {(ledger?.payments.length ?? 0) === 0 && <p className="text-sm text-text-muted">No payments recorded yet.</p>}
        </div>
      </div>
    </Modal>
  );
}

function PaymentsTab({ terms, classes }: { terms: TermItem[]; classes: ClassFull[] }) {
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState<fin.PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [voidFor, setVoidFor] = useState<fin.PaymentRow | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!termId && terms.length) setTermId(terms.find((t) => t.isCurrent)?.id ?? terms[0].id); }, [terms]);

  const load = useCallback(() => {
    if (!termId) return;
    fin.fetchPayments({ termId, classId: classId || undefined }).then(setRows).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [termId, classId]);
  useEffect(() => { load(); }, [load]);

  async function doVoid() {
    if (!voidFor) return;
    setBusy(true); setError(null);
    try { await fin.voidPayment(voidFor.id, reason); setVoidFor(null); setReason(''); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" />
        <Select label="Class filter (optional)" placeholder="All classes" value={classId}
          onChange={(e) => setClassId(e.target.value)} options={classes.map((c) => ({ value: c.id, label: c.name }))} />
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <Card className="p-0 overflow-hidden">
        <Table headers={['Receipt No', 'Student', 'Fee Item', 'Amount', 'Method', 'Date', 'Status', 'Actions']}>
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{p.receiptNumber}</td>
              <td className="px-4 py-3 text-text-primary">{p.student.fullName}</td>
              <td className="px-4 py-3 text-text-secondary">{p.feeStructure.feeType}</td>
              <td className="px-4 py-3 font-semibold text-text-primary">{p.amountPaid.toLocaleString()}</td>
              <td className="px-4 py-3 text-text-secondary">{p.paymentMethod}</td>
              <td className="px-4 py-3 text-text-secondary">{new Date(p.paymentDate).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                {p.status === 'voided' ? <StatusBadge status="danger" label="Voided" /> : <StatusBadge status="success" label="Paid" />}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button title="View receipt" onClick={() => setReceiptId(p.id)} className="p-2 rounded-input hover:bg-primary-light text-primary">
                    <Receipt className="h-4 w-4" />
                  </button>
                  {p.status !== 'voided' && (
                    <button title="Void payment" onClick={() => setVoidFor(p)} className="p-2 rounded-input hover:bg-red-50 text-red-500">
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-text-muted">No payments recorded for this filter.</td></tr>
          )}
        </Table>
      </Card>

      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />

      <Modal open={!!voidFor} onClose={() => setVoidFor(null)} title={`Void Payment ${voidFor?.receiptNumber ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Voiding keeps the record for audit but removes it from balances. This cannot be undone.</p>
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Entered in error / duplicate entry" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setVoidFor(null)}>Cancel</Button>
            <Button variant="danger" onClick={doVoid} disabled={busy || reason.trim().length < 3} loading={busy}>Void Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ReceiptModal({ paymentId, onClose }: { paymentId: string | null; onClose: () => void }) {
  const [data, setData] = useState<{ payment: any; settings: any } | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    fin.fetchReceipt(paymentId).then(setData).catch(console.error);
  }, [paymentId]);

  const p = data?.payment;
  const s = data?.settings;

  return (
    <Modal open={!!paymentId} onClose={onClose} title="Payment Receipt" wide>
      <div className="flex justify-end mb-3 no-print">
        <Button variant="secondary" onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>Print / Save as PDF</Button>
      </div>
      {p && (
        <div className="print-area bg-white text-black text-[12px] p-6 border border-border">
          <div className="text-center mb-3">
            {s?.logoUrl && <img src={assetUrl(s.logoUrl)!} alt="logo" className="h-14 mx-auto mb-1" />}
            <div className="text-lg font-extrabold uppercase">{s?.schoolName ?? 'School Name'}</div>
            {s?.motto && <div className="italic">Motto: {s.motto}</div>}
            <div className="text-[11px]">{[s?.address, s?.phone, s?.email].filter(Boolean).join(' | ')}</div>
            <div className="font-bold underline mt-2">OFFICIAL PAYMENT RECEIPT</div>
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr><td className="border border-black px-2 py-1 w-40 font-semibold">Receipt No</td><td className="border border-black px-2 py-1">{p.receiptNumber}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Reference</td><td className="border border-black px-2 py-1">{p.paymentReference}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Date</td><td className="border border-black px-2 py-1">{new Date(p.paymentDate).toLocaleDateString()}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Received From</td><td className="border border-black px-2 py-1">{p.parent?.user?.fullName ?? p.student.fullName}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Student</td><td className="border border-black px-2 py-1">{p.student.fullName} ({p.student.studentId}) — {p.student.class?.name}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Fee Item</td><td className="border border-black px-2 py-1">{p.feeStructure.feeType}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Amount Paid</td><td className="border border-black px-2 py-1 font-bold">{Number(p.amountPaid).toLocaleString()}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Method</td><td className="border border-black px-2 py-1">{p.paymentMethod}</td></tr>
              <tr><td className="border border-black px-2 py-1 font-semibold">Status</td><td className="border border-black px-2 py-1 uppercase">{p.status}</td></tr>
            </tbody>
          </table>
          <div className="mt-8 grid grid-cols-2 gap-8 text-[11px]">
            <div className="text-center"><div className="border-b border-black h-10"></div>Received by: {p.recorder?.fullName ?? ''}</div>
            <div className="text-center"><div className="border-b border-black h-10"></div>Signature / Stamp</div>
          </div>
          <div className="text-[10px] text-center mt-4 italic">Computer-generated receipt — valid without hand signature when printed from the portal.</div>
        </div>
      )}
    </Modal>
  );
}
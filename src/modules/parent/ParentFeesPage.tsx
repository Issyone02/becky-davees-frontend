import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMyChildren, fetchChildFees, ParentChild } from '../../api/parent';
import { fetchTerms, TermItem } from '../../api/academic';
import { ReceiptModal } from '../finance/FinancePage';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';
import { Receipt } from 'lucide-react';

export function ParentFeesPage() {
  const [params] = useSearchParams();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [childId, setChildId] = useState('');
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [termId, setTermId] = useState('');
  const [data, setData] = useState<any>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyChildren().then((c) => { setChildren(c); setChildId(params.get('child') ?? c[0]?.id ?? ''); }).catch(console.error);
    fetchTerms().then((t) => { setTerms(t); const cur = t.find((x) => x.isCurrent); if (cur) setTermId(cur.id); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!childId || !termId) return;
    fetchChildFees(childId, termId).then(setData).catch(console.error);
  }, [childId, termId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Fees</h1>
        <p className="text-text-secondary">Fee obligations and payment history. Payments are recorded at the school office.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)}
          options={children.map((c) => ({ value: c.id, label: `${c.fullName} — ${c.className}` }))} placeholder="Select child" />
        <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)}
          options={terms.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select term" />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card><div className="text-xs text-text-muted">Total Billed</div><div className="text-lg font-bold text-text-primary">{data.totalBilled.toLocaleString()}</div></Card>
            <Card><div className="text-xs text-text-muted">Total Paid</div><div className="text-lg font-bold text-green-600">{data.totalPaid.toLocaleString()}</div></Card>
            <Card><div className="text-xs text-text-muted">Outstanding Balance</div>
              <div className={`text-lg font-bold ${data.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>{data.balance.toLocaleString()}</div>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden mb-4">
            <Table headers={['Fee Item', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status']}>
              {data.lines.map((l: any) => (
                <tr key={l.structure.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-text-primary">{l.structure.feeType}</td>
                  <td className="px-4 py-3">{l.structure.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">{l.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">{l.balance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(l.structure.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {l.balance <= 0 ? <StatusBadge status="success" label="Paid" /> : l.paid > 0 ? <StatusBadge status="warning" label="Partial" /> : <StatusBadge status="danger" label="Unpaid" />}
                  </td>
                </tr>
              ))}
              {data.lines.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No fee structure published for this term yet.</td></tr>
              )}
            </Table>
          </Card>

          <h2 className="font-semibold text-text-primary mb-2">Payment History</h2>
          <Card className="p-0 overflow-hidden">
            <Table headers={['Receipt No', 'Fee Item', 'Amount', 'Method', 'Date', 'Status', '']}>
              {data.payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-text-primary">{p.receiptNumber}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.feeStructure.feeType}</td>
                  <td className="px-4 py-3 font-semibold">{p.amountPaid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.paymentMethod}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {p.status === 'voided' ? <StatusBadge status="danger" label="Voided" /> : <StatusBadge status="success" label="Paid" />}
                  </td>
                  <td className="px-4 py-3">
                    {p.status !== 'voided' && (
                      <button title="View receipt" onClick={() => setReceiptId(p.id)} className="p-2 rounded-input hover:bg-primary-light text-primary">
                        <Receipt className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data.payments.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-text-muted">No payments recorded yet.</td></tr>
              )}
            </Table>
          </Card>
        </>
      )}

      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
    </div>
  );
}
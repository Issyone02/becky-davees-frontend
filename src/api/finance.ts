import client from './client';

export interface FeeStructure {
  id: number; classId: string; sessionId: string; termId: string;
  feeType: string; amount: number; dueDate: string;
  class?: { id: string; name: string }; term?: { id: string; name: string }; session?: { id: string; name: string };
}
export interface BalanceRow {
  student: { id: string; studentId: string; fullName: string };
  totalBilled: number; totalPaid: number; balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'unbilled';
}
export interface LedgerLine { structure: FeeStructure; paid: number; balance: number }
export interface PaymentRow {
  id: string; receiptNumber: string | null; paymentReference: string;
  amountPaid: number; paymentMethod: string; paymentDate: string; status: string;
  student: { id: string; studentId: string; fullName: string };
  feeStructure: { id: number; feeType: string };
  recorder: { fullName: string };
}

export async function fetchFeeStructures(params: { sessionId?: string; termId?: string; classId?: string }) {
  const { data } = await client.get('/finance/fee-structures', { params });
  return data.data as FeeStructure[];
}
export async function createFeeStructure(input: Record<string, unknown>) {
  const { data } = await client.post('/finance/fee-structures', input);
  return data.data;
}
export async function updateFeeStructure(id: number, input: Record<string, unknown>) {
  const { data } = await client.patch(`/finance/fee-structures/${id}`, input);
  return data.data;
}
export async function fetchBalances(params: { classId: string; termId: string }) {
  const { data } = await client.get('/finance/balances', { params });
  return data.data as { rows: BalanceRow[]; structures: FeeStructure[] };
}
export async function fetchLedger(params: { studentId: string; termId: string }) {
  const { data } = await client.get('/finance/ledger', { params });
  return data.data as { student: any; lines: LedgerLine[]; payments: PaymentRow[] };
}
export async function fetchPayments(params: { termId?: string; classId?: string }) {
  const { data } = await client.get('/finance/payments', { params });
  return data.data as PaymentRow[];
}
export async function recordPayment(input: Record<string, unknown>) {
  const { data } = await client.post('/finance/payments', input);
  return data.data;
}
export async function voidPayment(id: string, reason: string) {
  const { data } = await client.post(`/finance/payments/${id}/void`, { reason });
  return data.data;
}
export async function fetchReceipt(id: string) {
  const { data } = await client.get(`/finance/payments/${id}/receipt`);
  return data.data as { payment: any; settings: any };
}

export async function carryForwardFeeStructures(input: { fromSessionId: string; fromTermId: string; toSessionId: string; toTermId: string; classId?: string }) {
  const { data } = await client.post('/finance/fee-structures/carry-forward', input);
  return data.data as { created: number; skipped: number };
}
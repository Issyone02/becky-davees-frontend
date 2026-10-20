import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold text-gray-900 text-right">{v ?? '—'}</span>
    </div>
  );
}

export function VerifyPage({ kind }: { kind: 'receipt' | 'report-card' }) {
  const params = useParams();
  const [data, setData] = useState<any | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'bad'>('loading');

  useEffect(() => {
    const url = kind === 'receipt'
      ? `${import.meta.env.VITE_API_URL}/public/verify/receipt/${params.id}`
      : `${import.meta.env.VITE_API_URL}/public/verify/report-card/${params.studentId}/${params.termId}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { setData(j.data ?? j); setState('ok'); })
      .catch(() => setState('bad'));
  }, [kind, params.id, params.studentId, params.termId]);

  const d = data;
  const voided = d?.status === 'voided';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        {state === 'loading' && <p className="text-sm text-gray-500">Verifying document…</p>}

        {state === 'bad' && (
          <>
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold">✕</div>
            <h1 className="text-xl font-extrabold text-red-600 uppercase">Not verified</h1>
            <p className="text-sm text-gray-600 mt-2">
              This document could not be verified. It may be forged, altered, or the verification link is incomplete.
            </p>
          </>
        )}

        {state === 'ok' && (
          <>
            {d.logoUrl && <img src={d.logoUrl} alt="school logo" className="h-16 w-16 object-contain mx-auto mb-2" />}
            <div className="text-lg font-extrabold uppercase text-gray-900">{d.schoolName}</div>
            {d.motto && <div className="text-xs italic text-gray-500 mb-4">{d.motto}</div>}
            <div className={`mx-auto mb-4 px-4 py-2 rounded-full text-sm font-bold uppercase ${voided ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {voided ? 'Voided document' : 'Genuine document'}
            </div>
            <div className="text-left text-sm space-y-1 border-t border-gray-200 pt-4 text-gray-700">
              {kind === 'receipt' ? (
                <>
                  <Row k="Receipt No" v={d.receiptNumber} />
                  <Row k="Student" v={d.studentName} />
                  <Row k="Class" v={d.className} />
                  <Row k="Fee item" v={d.feeType} />
                  <Row k="Amount" v={Number(d.amountPaid).toLocaleString()} />
                  <Row k="Method" v={d.paymentMethod} />
                  <Row k="Paid on" v={new Date(d.paymentDate).toLocaleDateString()} />
                  <Row k="Status" v={String(d.status).toUpperCase()} />
                </>
              ) : (
                <>
                  <Row k="Student" v={d.studentName} />
                  <Row k="Student ID" v={d.studentCode} />
                  <Row k="Class" v={d.className} />
                  <Row k="Term" v={d.termName} />
                  <Row k="Session" v={d.sessionName} />
                  {d.generatedAt && <Row k="Issued" v={new Date(d.generatedAt).toLocaleDateString()} />}
                </>
              )}
              <Row k="Verified on" v={new Date().toLocaleString()} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
import client from './client';

export async function fetchPromotionPreview(fromSessionId: string) {
  const { data } = await client.get('/promotions/preview', { params: { fromSessionId } });
  return data.data as {
    classes: { classId: string; className: string; defaultDecision: string; students: { id: string; studentId: string; fullName: string }[] }[];
    allClasses: { id: string; name: string }[];
  };
}
export async function applyPromotion(input: { fromSessionId: string; toSessionId: string | null; entries: { studentId: string; decision: string; toClassId?: string | null }[] }) {
  const { data } = await client.post('/promotions/apply', input);
  return data.data;
}
export async function fetchPromotionBatches() { const { data } = await client.get('/promotions/batches'); return data.data as any[]; }
export async function fetchAlumni() { const { data } = await client.get('/promotions/alumni'); return data.data as any[]; }
export async function fetchTranscript(studentId: string) { const { data } = await client.get('/promotions/transcript', { params: { studentId } }); return data.data as any; }
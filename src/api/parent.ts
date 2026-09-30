import client from './client';

export interface ParentChild {
  id: string; studentId: string; fullName: string; gender: string;
  className: string; classId: string; relationship: string; isPrimary: boolean;
  attendanceRate: number | null; average: number | null;
  photoUrl?: string | null;
}

export async function fetchMyChildren() { const { data } = await client.get('/parent/children'); return data.data as ParentChild[]; }
export async function fetchChildAttendance(childId: string, termId?: string) { const { data } = await client.get('/parent/attendance', { params: { childId, termId } }); return data.data; }
export async function fetchChildResults(childId: string, termId?: string) { const { data } = await client.get('/parent/results', { params: { childId, termId } }); return data.data; }
export async function fetchChildFees(childId: string, termId?: string) { const { data } = await client.get('/parent/fees', { params: { childId, termId } }); return data.data; }
export async function fetchChildReportCard(childId: string, termId: string) { const { data } = await client.get('/parent/report-card', { params: { childId, termId } }); return data.data; }
export async function fetchParentTerms() {
  const { data } = await client.get('/parent/terms');
  return data.data as { id: string; name: string; isCurrent: boolean; session?: { id: string; name: string } }[];
}
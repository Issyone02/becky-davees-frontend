import client from './client';
export interface EntryStudent { id: string; studentId: string; fullName: string }
export interface EntryResult {
  id: string; studentId: string; testScore: number; examScore: number; totalScore: number;
  grade: string | null; position: number | null; teacherComment: string | null; locked: boolean;
}
export interface EntrySheet {
  students: EntryStudent[]; results: EntryResult[];
  subject: { id: string; name: string } | null;
  term: { id: string; name: string; session: { name: string } } | null;
  locked: boolean;
}
export interface ClassSheet {
  students: EntryStudent[];
  results: (EntryResult & { subject: { id: string; name: string } })[];
  subjects: { id: string; name: string; code?: string }[];
}
export interface ReportCardData {
  student: { id: string; studentId: string; fullName: string; gender: string; class: { name: string } };
  term: { name: string; startDate: string; endDate: string; session: { name: string } };
  results: (EntryResult & { subject: { name: string; code: string }; teacherComment: string | null })[];
  average: number; grade: string | null; remark: string | null;
  position: number; classSize: number;
  settings: { schoolName: string; headTeacherName: string | null } | null;
}

export async function getEntrySheet(params: { classId: string; subjectId: string; termId: string }) {
  const { data } = await client.get('/results/entry-sheet', { params });
  return data.data as EntrySheet;
}
export async function saveScores(input: { classId: string; subjectId: string; termId: string; entries: { studentId: string; testScore: number; examScore: number; teacherComment?: string }[] }) {
  const { data } = await client.post('/results/bulk', input);
  return data.data;
}
export async function setLock(input: { classId: string; subjectId: string; termId: string; locked: boolean }) {
  const { data } = await client.post('/results/lock', input);
  return data.data;
}
export async function getClassSheet(params: { classId: string; termId: string }) {
  const { data } = await client.get('/results/class-sheet', { params });
  return data.data as ClassSheet;
}
export async function getReportCard(params: { studentId: string; termId: string }) {
  const { data } = await client.get('/results/report-card', { params });
  return data.data as ReportCardData;
}
export async function generateReportCards(input: { classId: string; termId: string }) {
  const { data } = await client.post('/results/report-cards/generate', input);
  return data.data;
}
export async function saveConduct(input: { studentId: string; termId: string; ratings: { category: 'quality' | 'activity'; item: string; rating: 'exc' | 'good' | 'fair' | 'poor' }[] }) {
  const { data } = await client.post('/results/conduct', input);
  return data.data;
}
export async function saveRemarks(input: { studentId: string; termId: string; teacherComment?: string; headTeacherComment?: string; parentComment?: string; healthComment?: string }) {
  const { data } = await client.post('/results/remarks', input);
  return data.data;
}
export async function fetchSettings() {
  const { data } = await client.get('/settings');
  return data.data as { id: number; schoolName: string; motto: string | null; address: string | null; phone: string | null; email: string | null; headTeacherName: string | null } | null;
}
export async function updateSettings(input: Record<string, unknown>) {
  const { data } = await client.patch('/settings', input);
  return data.data;
}
export async function updateMySignature(url: string) {
  const { data } = await client.patch('/teachers/my-signature', { url });
  return data.data;
}

export async function saveStudentScores(input: {
  studentId: string; classId: string; termId: string;
  entries: { subjectId: string; testScore: number; examScore: number }[];
}) {
  const { data } = await client.post('/results/bulk-student', input);
  return data.data;
}

export async function saveClassScores(input: {
  classId: string; termId: string;
  students: { studentId: string; entries: { subjectId: string; testScore: number; examScore: number }[] }[];
}) {
  const { data } = await client.post('/results/bulk-class', input);
  return data.data as { students: number; scores: number };
}

export async function fetchReportCardsBulk(params: { classId: string; termId: string }) {
  const { data } = await client.get('/results/report-cards-bulk', { params });
  return data.data as any[];
}

export async function fetchClassRoster(params: { classId: string; termId: string }) {
  const { data } = await client.get('/results/roster', { params });
  return data.data as { id: string; studentId: string; fullName: string }[];
}
import client from './client';

export interface RegisterStudent { id: string; studentId: string; fullName: string; gender: string }
export interface RegisterRecord { id: string; studentId: string; status: string; markedAt: string; markedBy: string; editCount: number; marker?: { fullName: string } }
export interface RegisterData { students: RegisterStudent[]; records: RegisterRecord[] }
export interface MyClass {
  classId: string; className: string;
  subjects: { id: string; name: string }[];
  terms: { id: string; name: string; sessionId: string; sessionName: string }[];
}
export interface ReportRow {
  student: { id: string; studentId: string; fullName: string };
  present: number; absent: number; late: number; excused: number; total: number; rate: number;
}

export async function fetchMyClasses(termId?: string) {
  const { data } = await client.get('/attendance/my-classes', { params: termId ? { termId } : {} });
  return data.data as MyClass[];
}
export async function fetchRegister(params: { classId: string; date: string; termId: string }) {
  const { data } = await client.get('/attendance/register', { params });
  return data.data as RegisterData;
}
export async function saveRegister(input: {
  classId: string; sessionId: string; termId: string; date: string;
  entries: { studentId: string; status: string }[]; reason?: string;
}) {
  const { data } = await client.post('/attendance/register', input);
  return data.data;
}
export async function fetchAttendanceReport(params: { classId: string; termId: string; from?: string; to?: string }) {
  const { data } = await client.get('/attendance/report', { params });
  return data.data as ReportRow[];
}
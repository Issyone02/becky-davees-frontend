import client from './client';

export interface TermItem { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; sessionId: string; session?: { name: string } }
export interface SessionFull { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; terms: TermItem[]; _count?: { students: number } }
export interface ClassFull { id: string; name: string; level: string; capacity: number | null; department?: string | null; _count?: { students: number; classSubjects: number } }
export interface SubjectItem { id: string; name: string; code: string; description: string | null; _count?: { classSubjects: number } }
export interface ClassSubjectItem { id: number; subjectId: string; subject: { id: string; name: string; code: string } }
export interface AssignmentItem {
  id: number;
  teacherId: string;
  classId: string;
  subjectId: string;
  sessionId: string;
  termId: string;
  teacher: { id: string; teacherCode: string; user: { fullName: string } };
  class: { id: string; name: string };
  subject: { id: string; name: string; code?: string };
  term?: { id: string; name: string };
}

const actor = () => ({});

export async function fetchSessionsFull() {
  const { data } = await client.get('/academic/sessions');
  return data.data as SessionFull[];
}
export async function createSession(input: { name: string; startDate: string; endDate: string }) {
  const { data } = await client.post('/academic/sessions', input);
  return data.data;
}
export async function setCurrentSession(id: string) {
  const { data } = await client.post(`/academic/sessions/${id}/set-current`);
  return data.data;
}
export async function fetchTerms(sessionId?: string) {
  const { data } = await client.get('/academic/terms', { params: sessionId ? { sessionId } : {} });
  return data.data as TermItem[];
}
export async function createTerm(input: { sessionId: string; name: string; startDate: string; endDate: string }) {
  const { data } = await client.post('/academic/terms', input);
  return data.data;
}
export async function setCurrentTerm(id: string) {
  const { data } = await client.post(`/academic/terms/${id}/set-current`);
  return data.data;
}
export async function fetchClassesFull() {
  const { data } = await client.get('/academic/classes');
  return data.data as ClassFull[];
}
export async function createClass(input: { name: string; level: string; capacity?: number }) {
  const { data } = await client.post('/academic/classes', input);
  return data.data;
}
export async function updateClass(id: string, input: Record<string, unknown>) {
  const { data } = await client.patch(`/academic/classes/${id}`, input);
  return data.data;
}
export async function fetchSubjects() {
  const { data } = await client.get('/academic/subjects');
  return data.data as SubjectItem[];
}
export async function createSubject(input: { name: string; code: string; description?: string }) {
  const { data } = await client.post('/academic/subjects', input);
  return data.data;
}
export async function updateSubject(id: string, input: Record<string, unknown>) {
  const { data } = await client.patch(`/academic/subjects/${id}`, input);
  return data.data;
}
export async function fetchClassSubjects(classId: string) {
  const { data } = await client.get(`/academic/classes/${classId}/subjects`);
  return data.data as ClassSubjectItem[];
}
export async function assignSubject(classId: string, subjectId: string) {
  const { data } = await client.post(`/academic/classes/${classId}/subjects`, { subjectId });
  return data.data;
}
export async function removeSubject(classId: string, subjectId: string) {
  const { data } = await client.delete(`/academic/classes/${classId}/subjects/${subjectId}`);
  return data.data;
}
export async function fetchAssignments(params: { classId?: string; termId?: string }) {
  const { data } = await client.get('/academic/assignments', { params });
  return data.data as AssignmentItem[];
}
export async function createAssignment(input: { teacherId: string; classId: string; subjectId: string; sessionId: string; termId: string }) {
  const { data } = await client.post('/academic/assignments', input);
  return data.data;
}
export async function deleteAssignment(id: number) {
  const { data } = await client.delete(`/academic/assignments/${id}`);
  return data.data;
}
export async function deleteClass(id: string) {
  const { data } = await client.delete(`/academic/classes/${id}`);
  return data.data;
}
export async function updateSession(id: string, input: Record<string, unknown>) {
  const { data } = await client.patch(`/academic/sessions/${id}`, input);
  return data.data;
}
export async function updateTerm(id: string, input: Record<string, unknown>) {
  const { data } = await client.patch(`/academic/terms/${id}`, input);
  return data.data;
}
export interface GradingScaleItem { id: number; minScore: number; maxScore: number; grade: string; remark: string; sessionId: string | null }
export async function fetchGradingScale(sessionId?: string) {
  const { data } = await client.get('/academic/grading-scale', { params: sessionId ? { sessionId } : {} });
  return data.data as GradingScaleItem[];
}
export async function createGradingScale(input: Record<string, unknown>) { const { data } = await client.post('/academic/grading-scale', input); return data.data; }
export async function updateGradingScale(id: number, input: Record<string, unknown>) { const { data } = await client.patch(`/academic/grading-scale/${id}`, input); return data.data; }
export async function deleteGradingScale(id: number) { const { data } = await client.delete(`/academic/grading-scale/${id}`); return data.data; }
export async function assignSubjectsBulk(classId: string, subjectIds: string[]) {
  const { data } = await client.post(`/academic/classes/${classId}/subjects/bulk`, { subjectIds });
  return data.data as { created: number; skipped: number };
}
export async function createAssignmentsBulk(input: { teacherId: string; classId: string; subjectIds: string[]; sessionId: string; termId: string }) {
  const { data } = await client.post('/academic/assignments/bulk', input);
  return data.data as { created: number; skipped: number };
}
import client from './client';

export interface PageMeta { page: number; pageSize: number; total: number; totalPages: number; }

export interface Student {
  id: string;
  studentId: string;
  admissionNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  sessionId: string;
  status: string;
  class?: { id: string; name: string };
  session?: { id: string; name: string };
  photoUrl?: string | null;
  parents?: {
  parentId: string; relationship: string; isPrimary: boolean;
  parent: { id: string; parentCode: string; user: { id: string; fullName: string; email: string } };
  }[];
}

export interface ClassItem { id: string; name: string; level: string; _count?: { students: number } }
export interface SessionItem { id: string; name: string; isCurrent: boolean }

export interface TeacherItem {
  id: string; teacherCode: string;
  user: { id: string; fullName: string; email: string; phone: string | null; status: string };
}

export interface ParentItem {
  id: string; parentCode: string;
  user: { id: string; fullName: string; email: string; phone: string | null; status: string };
  students: { studentId: string; relationship: string; student: { id: string; studentId: string; fullName: string } }[];
}

export interface RegistrationItem {
  id: number; userId: string; role: string; status: string; createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string | null; role: string; createdAt: string };
}

// ---------- Students ----------
export async function fetchStudents(params: { page?: number; pageSize?: number; search?: string; classId?: string; sessionId?: string }) {
  const { data } = await client.get('/students', { params });
  return { items: data.data as Student[], meta: data.meta as PageMeta };
}

export async function fetchStudent(id: string) {
  const { data } = await client.get(`/students/${id}`);
  return data.data as Student;
}

export async function createStudent(input: Record<string, unknown>) {
  const { data } = await client.post('/students', input);
  return data.data;
}

export async function updateStudent(id: string, input: Record<string, unknown>) {
  const { data } = await client.patch(`/students/${id}`, input);
  return data.data;
}

export async function linkParent(studentId: string, input: { parentId: string; relationship: string; isPrimary: boolean }) {
  const { data } = await client.post(`/students/${studentId}/parents`, input);
  return data.data;
}

export async function unlinkParent(studentId: string, parentId: string) {
  const { data } = await client.delete(`/students/${studentId}/parents/${parentId}`);
  return data.data;
}

// ---------- Academic dropdowns ----------
export async function fetchClasses() {
  const { data } = await client.get('/academic/classes');
  return data.data as ClassItem[];
}

export async function fetchSessions() {
  const { data } = await client.get('/academic/sessions');
  return data.data as SessionItem[];
}

// ---------- Teachers & Parents ----------
export async function fetchTeachers(params: { page?: number; pageSize?: number; search?: string }) {
  const { data } = await client.get('/teachers', { params });
  return { items: data.data as TeacherItem[], meta: data.meta as PageMeta };
}

export async function fetchParents(params: { page?: number; pageSize?: number; search?: string }) {
  const { data } = await client.get('/parents', { params });
  return { items: data.data as ParentItem[], meta: data.meta as PageMeta };
}

export async function createUser(input: { email: string; fullName: string; role: 'ADMIN' | 'TEACHER' | 'PARENT'; password: string; phone?: string }) {
  const { data } = await client.post('/users', input);
  return data.data;
}

// ---------- Registrations ----------
export async function fetchPendingRegistrations() {
  const { data } = await client.get('/registrations/pending');
  return data.data as RegistrationItem[];
}

export async function approveRegistration(userId: string) {
  const { data } = await client.post(`/registrations/${userId}/approve`);
  return data.data;
}

export async function rejectRegistration(userId: string, reason: string) {
  const { data } = await client.post(`/registrations/${userId}/reject`, { reason });
  return data.data;
}

export async function updateAccountStatus(userId: string, status: 'ACTIVE' | 'DEACTIVATED' | 'SUSPENDED') {
  const { data } = await client.patch(`/users/${userId}/account-status`, { status });
  return data.data;
}

export async function deleteAccount(userId: string) {
  const { data } = await client.delete(`/users/${userId}/account`);
  return data.data;
}

export async function downloadBulkTemplate(classFilter?: string) {
  const { data } = await client.get('/students/bulk-template', {
    params: classFilter ? { classFilter } : {},
    responseType: 'blob',
  });
  return data as Blob;
}

export async function bulkImportStudents(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/students/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as { status: 'success' | 'error'; created?: number; guardiansLinked?: number; errors?: string[] };
}

export async function updateStudentPhoto(studentId: string, photoUrl: string | null) {
  const { data } = await client.patch(`/students/${studentId}/photo`, { photoUrl });
  return data.data;
}
import client from './client';

export interface TimetableEntry {
  id: number; classId: string; subjectId: string; teacherId: string;
  dayOfWeek: number; startTime: string; endTime: string; sessionId: string; termId: string;
  class: { id: string; name: string };
  subject: { id: string; name: string; code?: string };
  teacher: { id: string; teacherCode: string; user: { fullName: string } };
}

export async function fetchTimetable(params: { classId?: string; termId?: string; mine?: string }) {
  const { data } = await client.get('/timetable', { params });
  return data.data as TimetableEntry[];
}
export async function createTimetableEntry(input: Record<string, unknown>) {
  const { data } = await client.post('/timetable', input);
  return data.data;
}
export async function updateTimetableEntry(id: number, input: Record<string, unknown>) {
  const { data } = await client.patch(`/timetable/${id}`, input);
  return data.data;
}
export async function deleteTimetableEntry(id: number) {
  const { data } = await client.delete(`/timetable/${id}`);
  return data.data;
}
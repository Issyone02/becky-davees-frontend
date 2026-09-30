import client from './client';

export interface ReplyItem { id: string; message: string; createdAt: string; user: { fullName: string; role: string } }
export interface FeedbackItem {
  id: string; category: string; priority: string; subject: string; message: string;
  status: string; attachmentUrl: string | null; createdAt: string;
  user?: { id?: string; fullName: string; role: string; email?: string };
  replies?: ReplyItem[];
  _count?: { replies: number };
}

export async function fetchMyFeedback() { const { data } = await client.get('/feedback/mine'); return data.data as FeedbackItem[]; }
export async function createFeedback(input: { category: string; priority: string; subject: string; message: string; attachmentUrl?: string | null }) { const { data } = await client.post('/feedback', input); return data.data; }
export async function fetchFeedbackAdmin(params: Record<string, unknown>) { const { data } = await client.get('/feedback', { params }); return { items: data.data as FeedbackItem[], meta: data.meta }; }
export async function fetchFeedback(id: string) { const { data } = await client.get(`/feedback/${id}`); return data.data as FeedbackItem; }
export async function replyFeedback(id: string, message: string) { const { data } = await client.post(`/feedback/${id}/replies`, { message }); return data.data; }
export async function setFeedbackStatus(id: string, status: string) { const { data } = await client.patch(`/feedback/${id}/status`, { status }); return data.data; }
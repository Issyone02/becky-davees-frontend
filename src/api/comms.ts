import client from './client';

export interface NewsItem {
  id: string; title: string; body: string; audience: string; status: string;
  publishedAt: string | null; createdAt: string; author: { fullName: string };
}
export interface EventItem {
  id: string; title: string; description: string | null; location: string | null;
  startDate: string; endDate: string | null; audience: string;
}
export interface NotificationItem {
  id: string; type: string; title: string; body: string | null; read: boolean; createdAt: string;
}

export async function fetchNewsFeed() { const { data } = await client.get('/comms/news'); return data.data as NewsItem[]; }
export async function fetchNewsManage() { const { data } = await client.get('/comms/news', { params: { manage: '1' } }); return data.data as NewsItem[]; }
export async function createNews(input: { title: string; body: string; audience: string; publish?: boolean }) { const { data } = await client.post('/comms/news', input); return data.data; }
export async function updateNews(id: string, input: Record<string, unknown>) { const { data } = await client.patch(`/comms/news/${id}`, input); return data.data; }
export async function publishNews(id: string) { const { data } = await client.post(`/comms/news/${id}/publish`); return data.data; }
export async function unpublishNews(id: string) { const { data } = await client.post(`/comms/news/${id}/unpublish`); return data.data; }
export async function deleteNews(id: string) { const { data } = await client.delete(`/comms/news/${id}`); return data.data; }
export async function fetchEvents() { const { data } = await client.get('/comms/events'); return data.data as EventItem[]; }
export async function createEvent(input: Record<string, unknown>) { const { data } = await client.post('/comms/events', input); return data.data; }
export async function updateEvent(id: string, input: Record<string, unknown>) { const { data } = await client.patch(`/comms/events/${id}`, input); return data.data; }
export async function deleteEvent(id: string) { const { data } = await client.delete(`/comms/events/${id}`); return data.data; }
export async function fetchNotifications() { const { data } = await client.get('/notifications'); return data.data as NotificationItem[]; }
export async function fetchUnreadCount() { const { data } = await client.get('/notifications/unread-count'); return data.data as number; }
export async function markNotificationRead(id: string) { const { data } = await client.post(`/notifications/${id}/read`); return data.data; }
export async function markAllNotificationsRead() { const { data } = await client.post('/notifications/read-all'); return data.data; }
import client from './client';

export interface DashboardStats {
  role: string;
  currentSession: { id: string; name: string } | null;
  currentTerm: { id: string; name: string } | null;
  totals?: {
    students: number; classes: number; teachers: number; pendingRegistrations: number;
    todayAttendance: Record<string, number>;
    finance: { collected: number; outstanding: number };
  };
  my?: Record<string, any>;
}

export interface ChartPoint { date: string; present: number; absent: number; late: number; excused: number }
export interface AnnouncementItem { id: string; title: string; body: string; audience: string; publishedAt: string; author: { fullName: string } }
export interface EventItem { id: string; title: string; startDate: string; endDate: string | null; location: string | null; audience: string }

export const fetchDashboardStats = async () => (await client.get('/dashboard/stats')).data.data as DashboardStats;
export const fetchAttendanceChart = async (days: number) => (await client.get('/dashboard/attendance-chart', { params: { days } })).data.data as ChartPoint[];
export const fetchRecentAnnouncements = async () => (await client.get('/dashboard/announcements')).data.data as AnnouncementItem[];
export const fetchUpcomingEvents = async () => (await client.get('/dashboard/events')).data.data as EventItem[];
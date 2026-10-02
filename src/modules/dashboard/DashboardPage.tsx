import { fetchMyChildren, fetchChildAttendance, fetchParentTerms, ParentChild } from '../../api/parent';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { fetchDashboardStats, fetchAttendanceChart, fetchRecentAnnouncements, fetchUpcomingEvents, DashboardStats, ChartPoint, AnnouncementItem, EventItem } from '../../api/dashboard';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Users, BookOpen, UserCheck, UserX, UserPlus, DollarSign, CalendarDays, Megaphone, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [days, setDays] = useState(14);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [news, setNews] = useState<AnnouncementItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
    fetchRecentAnnouncements().then(setNews).catch(() => {});
    fetchUpcomingEvents().then(setEvents).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role === 'PARENT') return;   // parents never request school-wide aggregates
    fetchAttendanceChart(days).then(setChart).catch(() => {});
  }, [days, user?.role]);

  if (error) return <Card><div className="text-sm text-red-500">{error}</div></Card>;
  if (!stats) return <Card><div className="text-sm text-text-muted">Loading dashboard…</div></Card>;

  const role = stats.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user?.fullName.split(' ')[0]} 👋</h1>
        <p className="text-text-secondary">
          {stats.currentSession?.name ?? '—'} · {stats.currentTerm?.name ?? '—'} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isAdmin && (
          <>
            <StatCard icon={<Users className="h-5 w-5" />} label="Active Students" value={stats.totals?.students ?? 0} tone="primary" link="/students" />
            <StatCard icon={<BookOpen className="h-5 w-5" />} label="Classes" value={stats.totals?.classes ?? 0} tone="info" link="/academics" />
            <StatCard icon={<UserCheck className="h-5 w-5" />} label="Teachers" value={stats.totals?.teachers ?? 0} tone="success" link="/teachers" />
            <StatCard icon={<UserPlus className="h-5 w-5" />} label="Pending Registrations" value={stats.totals?.pendingRegistrations ?? 0} tone="warning" link="/registrations" />
          </>
        )}
        {isTeacher && (
          <>
            <StatCard icon={<BookOpen className="h-5 w-5" />} label="My Classes" value={stats.my?.classes ?? 0} tone="primary" link="/timetable" />
            <StatCard icon={<Users className="h-5 w-5" />} label="My Students" value={stats.my?.students ?? 0} tone="info" link="/students" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Periods Today" value={stats.my?.todayPeriods ?? 0} tone="success" link="/attendance" />
          </>
        )}
        {isParent && (
          <>
            <StatCard icon={<Users className="h-5 w-5" />} label="My Children" value={stats.my?.children ?? 0} tone="primary" link="/children" />
            <StatCard icon={<BookOpen className="h-5 w-5" />} label="Classes" value={new Set(stats.my?.names?.map((n: any) => n.className)).size ?? 0} tone="info" link="/timetable" />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Attendance: calendar for parents, trend chart for staff */}
        {isParent && <ParentAttendanceCalendar />}
        {!isParent && (
        <Card className="lg:col-span-2 min-w-0 w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold text-text-primary">Attendance Trend</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {(['area', 'bar'] as const).map((t) => (
                  <button key={t} onClick={() => setChartType(t)} title={`Switch to ${t} chart`}
                    className={`px-3 py-1 rounded-input text-xs font-medium capitalize ${chartType === t ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {[7, 14, 30].map((d) => (
                  <button key={d} onClick={() => setDays(d)}
                    className={`px-3 py-1 rounded-input text-xs font-medium ${days === d ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Legend verticalAlign="top" height={30} />
                  <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#gPresent)" name="Present" />
                  <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="url(#gLate)" name="Late" />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#gAbsent)" name="Absent" />
                </AreaChart>
              ) : (
                <BarChart data={chart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Legend verticalAlign="top" height={30} />
                  <Bar dataKey="present" fill="#10b981" name="Present" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>
        )}

        {/* Recent announcements */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text-primary">Recent Announcements</h2>
            {isAdmin && <Link to="/communications" className="text-xs text-primary hover:underline">View all</Link>}
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {news.length === 0 && <p className="text-sm text-text-muted">No announcements yet.</p>}
            {news.map((n) => (
              <div key={n.id} className="border-l-2 border-primary pl-3">
                <div className="text-sm font-medium text-text-primary">{n.title}</div>
                <div className="text-xs text-text-secondary line-clamp-2">{n.body}</div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  {new Date(n.publishedAt).toLocaleDateString()} · {n.author.fullName}
                  <span className="badge badge-info ml-1">{n.audience}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

            {/* Role-specific bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isAdmin && (
          <>
            <Card>
              <h2 className="font-semibold text-text-primary mb-3">Finance Snapshot (This Term)</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-input bg-green-50">
                  <div className="text-xs text-text-muted">Collected</div>
                  <div className="text-lg font-bold text-green-700">{(stats.totals?.finance.collected ?? 0).toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-input bg-amber-50">
                  <div className="text-xs text-text-muted">Outstanding</div>
                  <div className="text-lg font-bold text-amber-700">{(stats.totals?.finance.outstanding ?? 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link to="/finance" className="btn-primary text-xs inline-flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Open Finance
                </Link>
              </div>
            </Card>

            <Link to="/attendance" className="block">
              <Card className="cursor-pointer hover:shadow-elevated transition-shadow">
                <h2 className="font-semibold text-text-primary mb-3">Today's Attendance</h2>
                <div className="space-y-2">
                  <TodayRow icon={<UserCheck className="h-4 w-4 text-green-600" />} label="Present" value={stats.totals?.todayAttendance?.present ?? 0} />
                  <TodayRow icon={<Clock className="h-4 w-4 text-amber-600" />} label="Late" value={stats.totals?.todayAttendance?.late ?? 0} />
                  <TodayRow icon={<UserX className="h-4 w-4 text-red-600" />} label="Absent" value={stats.totals?.todayAttendance?.absent ?? 0} />
                  <TodayRow icon={<AlertCircle className="h-4 w-4 text-blue-600" />} label="Excused" value={stats.totals?.todayAttendance?.excused ?? 0} />
                </div>
              </Card>
            </Link>
          </>
        )}

        {isTeacher && (
          <Link to="/communications" className="block lg:col-span-2">
            <Card className="cursor-pointer hover:shadow-elevated transition-shadow">
              <h2 className="font-semibold text-text-primary mb-3">Upcoming Events</h2>
              {events.length === 0 ? (
                <p className="text-sm text-text-muted">No upcoming events.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 bg-gray-50 rounded-input px-3 py-2">
                      <CalendarDays className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{e.title}</div>
                        <div className="text-xs text-text-muted">
                          {new Date(e.startDate).toLocaleDateString()}
                          {e.location ? ` · ${e.location}` : ''}
                        </div>
                      </div>
                      <span className="badge badge-info">{e.audience}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Link>
        )}

        {isParent && (
          <Link to="/children" className="block lg:col-span-2">
            <Card className="cursor-pointer hover:shadow-elevated transition-shadow">
              <h2 className="font-semibold text-text-primary mb-3">My Children</h2>
              {(stats.my?.names ?? []).length === 0 ? (
                <p className="text-sm text-text-muted">No children linked to your account yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stats.my.names.map((k: any) => (
                    <div key={k.id} className="flex items-center gap-3 bg-gray-50 rounded-input px-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-primary-light text-primary font-semibold flex items-center justify-center">
                        {k.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{k.name}</div>
                        <div className="text-xs text-text-muted">{k.className}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone, link }: { icon: React.ReactNode; label: string; value: number; tone: 'primary' | 'info' | 'success' | 'warning'; link?: string }) {
  const bg = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
  }[tone];
  const inner = (
    <Card className="cursor-pointer hover:shadow-elevated transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-input flex items-center justify-center ${bg}`}>{icon}</div>
        <div>
          <div className="text-xs text-text-muted">{label}</div>
          <div className="text-xl font-bold text-text-primary">{value.toLocaleString()}</div>
        </div>
      </div>
    </Card>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}

function TodayRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-input px-3 py-2">
      <div className="flex items-center gap-2">{icon}<span className="text-sm text-text-primary">{label}</span></div>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function dayKey(value: string): string | null {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${+m[1]}-${+m[2] - 1}-${+m[3]}`; // date-only string → local-day key
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function ParentAttendanceCalendar() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [childId, setChildId] = useState('');
  const [records, setRecords] = useState<{ date: string; status: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  useEffect(() => {
    fetchMyChildren()
      .then((kids) => { setChildren(kids); if (kids.length) setChildId(kids[0].id); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!childId) return;
      setLoading(true);
      try {
        const terms = await fetchParentTerms().catch(() => [] as any[]);
        const current = (terms as any[]).find((t) => t.isCurrent) ?? (terms as any[])[0];
        const res: any = await fetchChildAttendance(childId, current?.id);
        const list: any[] = Array.isArray(res)
          ? res
          : (res?.records ?? res?.items ?? res?.data ?? res?.attendance ?? []);
        const mapped = list
          .map((r: any) => ({
            date: r.date ?? r.attendanceDate ?? r.day ?? r.createdAt,
            status: String(r.status ?? '').toLowerCase(),
          }))
          .filter((r: any) => !!r.date);
        if (!cancelled) setRecords(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [childId]);

  const byDay = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of records) {
      const key = dayKey(r.date);
      if (key) map.set(key, r.status);
    }
    return map;
  }, [records]);

  const first = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const leadBlanks = (first.getDay() + 6) % 7; // Monday-first grid
  const monthName = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const counts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0 };
  for (let d = 1; d <= daysInMonth; d++) {
    const s = byDay.get(`${cursor.y}-${cursor.m}-${d}`);
    if (s && counts[s] !== undefined) counts[s]++;
  }
  const marked = counts.present + counts.absent + counts.late + counts.excused;
  const pct = marked ? Math.round(((counts.present + counts.late) / marked) * 100) : null;

  const color: Record<string, string> = {
    present: 'bg-green-100 text-green-700 border border-green-300',
    absent: 'bg-red-100 text-red-700 border border-red-300',
    late: 'bg-amber-100 text-amber-700 border border-amber-300',
    excused: 'bg-blue-100 text-blue-700 border border-blue-300',
  };

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold text-text-primary">Attendance Calendar</h2>
        {children.length > 1 && (
          <select className="input-field h-9 text-sm" value={childId} onChange={(e) => setChildId(e.target.value)}>
            {children.map((k) => (
              <option key={k.id} value={k.id}>{k.fullName}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 rounded-input bg-surface border border-border text-text-secondary hover:bg-primary-light" onClick={() => shift(-1)}>‹</button>
          <span className="text-sm font-medium text-text-primary w-36 text-center">{monthName}</span>
          <button className="px-2 py-1 rounded-input bg-surface border border-border text-text-secondary hover:bg-primary-light" onClick={() => shift(1)}>›</button>
        </div>
      </div>

      {children.length === 1 && (
        <div className="text-xs text-text-muted mb-2">{children[0].fullName} · {children[0].className}</div>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-text-muted mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadBlanks }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const status = byDay.get(`${cursor.y}-${cursor.m}-${day}`);
          const weekend = [0, 6].includes(new Date(cursor.y, cursor.m, day).getDay());
          return (
            <div
              key={day}
              title={status ? `${day} — ${status}` : undefined}
              className={`h-9 rounded-input flex items-center justify-center text-xs font-medium ${
                status && color[status]
                  ? color[status]
                  : weekend
                    ? 'bg-gray-100 text-text-muted'
                    : 'bg-surface border border-border text-text-secondary'}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-text-secondary">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-200 border border-green-300" /> Present {counts.present}</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-200 border border-amber-300" /> Late {counts.late}</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-200 border border-red-300" /> Absent {counts.absent}</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-200 border border-blue-300" /> Excused {counts.excused}</span>
        {pct !== null && <span className="ml-auto font-semibold text-text-primary">Month attendance: {pct}%</span>}
      </div>
      {loading && <p className="text-xs text-text-muted mt-2">Loading attendance…</p>}
      {!loading && marked === 0 && (
        <p className="text-xs text-text-muted mt-2">No register entries for {monthName}. Use ‹ › to check other months.</p>
      )}
    </Card>
  );
}
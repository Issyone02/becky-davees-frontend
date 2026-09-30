import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchAttendanceTrend, TrendPoint } from '../../api/dashboard';
import { Card } from '../ui/Card';

export function AttendanceChart() {
  const [days, setDays] = useState('7');
  const [data, setData] = useState<TrendPoint[]>([]);

  useEffect(() => {
    fetchAttendanceTrend(Number(days)).then(setData).catch(() => setData([]));
  }, [days]);

  const chart = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  }));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary">Attendance Overview</h3>
        <select className="input-field h-9 w-32" value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>
      <div className="h-64">
        {chart.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-text-muted">
            No attendance records in this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: any, name: any) => (name === 'rate' ? [`${v}%`, 'Attendance rate'] : [v, name])} />
              <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} fill="url(#rateGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
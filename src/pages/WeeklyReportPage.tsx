import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { useWeeklyStats } from '@/hooks/useStudySessions';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, TrendingUp, Calendar, Target, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function WeeklyReportPage() {
  const { loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useWeeklyStats();

  const chartData = (stats?.dailyTotals || []).map(day => ({
    date: format(parseISO(day.date), 'EEE'),
    fullDate: format(parseISO(day.date), 'MMM d'),
    minutes: day.minutes,
    hours: (day.minutes / 60).toFixed(1),
  }));

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  const mostProductiveDayFormatted = stats?.mostProductiveDay 
    ? format(parseISO(stats.mostProductiveDay), 'EEEE')
    : '—';

  // Calculate trend
  const dailyTotals = stats?.dailyTotals || [];
  const lastThreeDays = dailyTotals.slice(-3);
  const firstThreeDays = dailyTotals.slice(0, 3);
  const recentAvg = lastThreeDays.reduce((a, b) => a + b.minutes, 0) / 3;
  const earlierAvg = firstThreeDays.reduce((a, b) => a + b.minutes, 0) / 3;
  const trend = recentAvg > earlierAvg ? 'up' : recentAvg < earlierAvg ? 'down' : 'stable';

  if (authLoading || statsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-display font-bold">Weekly Report</h1>
          <p className="text-muted-foreground mt-1">
            Your study progress over the past 7 days
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Study Time"
            value={formatTime(stats?.totalMinutes || 0)}
            subtitle="This week"
            icon={<Clock className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            title="Daily Average"
            value={formatTime(stats?.averageMinutes || 0)}
            subtitle="Per day"
            icon={<Target className="w-6 h-6" />}
          />
          <StatCard
            title="Most Productive"
            value={mostProductiveDayFormatted}
            subtitle="Best day this week"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard
            title="Weekly Trend"
            value={trend === 'up' ? '📈 Improving' : trend === 'down' ? '📉 Declining' : '➡️ Stable'}
            subtitle="Compared to start of week"
            icon={<Calendar className="w-6 h-6" />}
          />
        </div>

        {/* Bar Chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-lg mb-6">Daily Study Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tickFormatter={(v) => `${v}m`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} minutes`, 'Study Time']}
                labelFormatter={(label) => chartData.find(d => d.date === label)?.fullDate || label}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="minutes" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-lg mb-6">Study Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tickFormatter={(v) => `${v}m`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} minutes`, 'Study Time']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="minutes" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMinutes)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Details */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Daily Breakdown</h3>
          <div className="space-y-3">
            {(stats?.dailyTotals || []).map((day, index) => {
              const maxMinutes = Math.max(...(stats?.dailyTotals || []).map(d => d.minutes));
              const percentage = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
              const isToday = index === (stats?.dailyTotals || []).length - 1;
              
              return (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-muted-foreground">
                    {format(parseISO(day.date), 'EEE, MMM d')}
                  </div>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                    <div 
                      className={`h-full rounded-lg transition-all duration-500 ${
                        isToday ? 'gradient-primary' : 'bg-primary/60'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    {isToday && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-primary">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="w-16 text-right font-medium">
                    {formatTime(day.minutes)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { useDailyStats } from '@/hooks/useStudySessions';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/contexts/AuthContexts';
import { Clock, BookOpen, TrendingUp, Target, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { format } from 'date-fns';

export default function DailyReportPage() {
  const { loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDailyStats();
  const { data: subjects = [] } = useSubjects();

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getSubjectColor = (id: string) => subjects.find(s => s.id === id)?.color || 'hsl(var(--muted))';

  const chartData = (stats?.subjectBreakdown || [])
    .sort((a, b) => b.minutes - a.minutes)
    .map(item => ({
      name: getSubjectName(item.subjectId),
      minutes: item.minutes,
      color: getSubjectColor(item.subjectId),
    }));

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

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
          <h1 className="text-3xl font-display font-bold">Daily Report</h1>
          <p className="text-muted-foreground mt-1">
            Your study summary for {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Study Time"
            value={formatTime(stats?.totalMinutes || 0)}
            icon={<Clock className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            title="Sessions Completed"
            value={stats?.sessionCount || 0}
            subtitle="Study sessions"
            icon={<Target className="w-6 h-6" />}
          />
          <StatCard
            title="Subjects Covered"
            value={stats?.subjectBreakdown.length || 0}
            subtitle="Different subjects"
            icon={<BookOpen className="w-6 h-6" />}
          />
          <StatCard
            title="Most Studied"
            value={stats?.mostStudiedSubject ? getSubjectName(stats.mostStudiedSubject) : '—'}
            subtitle="Top subject today"
            icon={<TrendingUp className="w-6 h-6" />}
          />
        </div>

        {/* Main Chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold text-lg mb-6">Study Time by Subject</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tickFormatter={(v) => `${v}m`}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} minutes`, 'Time']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground">
              <BookOpen className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No study sessions today</p>
              <p className="text-sm">Start the timer to begin tracking your progress</p>
            </div>
          )}
        </div>

        {/* Subject Details */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Subject Breakdown</h3>
            <div className="space-y-4">
              {chartData.map((item, index) => {
                const percentage = (stats?.totalMinutes || 0) > 0 
                  ? Math.round((item.minutes / (stats?.totalMinutes || 1)) * 100) 
                  : 0;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatTime(item.minutes)} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

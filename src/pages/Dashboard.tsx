import { Link } from 'react-router-dom';
import { Clock, CheckSquare, ListTodo, TrendingUp, BookOpen, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { useDailyStats } from '@/hooks/useStudySessions';
import { useSubjects } from '@/hooks/useSubjects';
import { useHabits, useHabitLogs } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContexts';
import { AppLayout } from '@/components/layout/AppLayout';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const { loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDailyStats();
  const { data: subjects = [] } = useSubjects();
  const { data: habits = [] } = useHabits();
  const { data: habitLogs = [] } = useHabitLogs();
  const { data: tasks = [] } = useTasks();

  const today = format(new Date(), 'yyyy-MM-dd');
  const completedHabits = habitLogs.filter(l => l.date === today).length;
  const pendingTasks = tasks.filter(t => !t.completed && t.due_date <= today).length;

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getSubjectColor = (id: string) => subjects.find(s => s.id === id)?.color || 'hsl(var(--muted))';

  const chartData = (stats?.subjectBreakdown || []).map(item => ({
    name: getSubjectName(item.subjectId),
    minutes: item.minutes,
    color: getSubjectColor(item.subjectId),
  }));

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your study progress for {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Study Time Today"
            value={formatTime(stats?.totalMinutes || 0)}
            subtitle={`${stats?.sessionCount || 0} sessions`}
            icon={<Clock className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            title="Habits Completed"
            value={`${completedHabits}/${habits.length}`}
            subtitle={habits.length > 0 ? `${Math.round((completedHabits / habits.length) * 100)}% done` : 'No habits yet'}
            icon={<CheckSquare className="w-6 h-6" />}
          />
          <StatCard
            title="Pending Tasks"
            value={pendingTasks}
            subtitle="Due today or overdue"
            icon={<ListTodo className="w-6 h-6" />}
          />
          <StatCard
            title="Top Subject"
            value={stats?.mostStudiedSubject ? getSubjectName(stats.mostStudiedSubject) : '—'}
            subtitle={stats?.mostStudiedSubject ? 'Most studied today' : 'Start studying!'}
            icon={<TrendingUp className="w-6 h-6" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Breakdown */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Today's Subject Breakdown</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `${v}m`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Bar dataKey="minutes" radius={[0, 8, 8, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mb-3 opacity-30" />
                <p>No study sessions today</p>
                <p className="text-sm">Start the timer to track your progress</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/timer" 
                className="p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-center group"
              >
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                <p className="font-medium text-sm">Start Studying</p>
              </Link>
              <Link 
                to="/habits" 
                className="p-4 rounded-xl bg-success/10 hover:bg-success/20 transition-colors text-center group"
              >
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-success group-hover:scale-110 transition-transform" />
                <p className="font-medium text-sm">Check Habits</p>
              </Link>
              <Link 
                to="/tasks" 
                className="p-4 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors text-center group"
              >
                <ListTodo className="w-8 h-8 mx-auto mb-2 text-accent group-hover:scale-110 transition-transform" />
                <p className="font-medium text-sm">View Tasks</p>
              </Link>
              <Link 
                to="/weekly" 
                className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-center group"
              >
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground group-hover:scale-110 transition-transform" />
                <p className="font-medium text-sm">Weekly Report</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

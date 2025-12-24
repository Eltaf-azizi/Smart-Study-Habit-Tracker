import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHabits, useHabitLogs, useAddHabit, useDeleteHabit, useToggleHabitLog, getHabitStreak } from '@/hooks/useHabits';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Flame, Check, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function HabitsPage() {
  const { loading: authLoading } = useAuth();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: logs = [] } = useHabitLogs();
  const addHabit = useAddHabit();
  const deleteHabit = useDeleteHabit();
  const toggleLog = useToggleHabitLog();

  const [newHabitName, setNewHabitName] = useState('');

  const handleAddHabit = () => {
    if (!newHabitName.trim()) {
      toast({ title: 'Enter a habit name', variant: 'destructive' });
      return;
    }

    addHabit.mutate(newHabitName.trim());
    setNewHabitName('');
  };

  const handleDeleteHabit = (id: string) => {
    deleteHabit.mutate(id);
  };

  const handleToggle = (habitId: string, date: string) => {
    toggleLog.mutate({ habitId, date });
  };

  const isCompleted = (habitId: string, date: string) => {
    return logs.some(l => l.habit_id === habitId && l.date === date);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }
    return days;
  };

  const last7Days = getLast7Days();
  const today = format(new Date(), 'yyyy-MM-dd');

  if (authLoading || habitsLoading) {
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
          <h1 className="text-3xl font-display font-bold">Habit Tracker</h1>
          <p className="text-muted-foreground mt-1">Build consistency, one day at a time</p>
        </div>

        {/* Add Habit */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Create New Habit</h3>
          <div className="flex gap-3">
            <Input
              placeholder="e.g., Read for 30 minutes"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddHabit} 
              className="gradient-primary text-primary-foreground"
              disabled={addHabit.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </div>

        {/* Habits List */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {habits.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Check className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-medium">No habits yet</p>
              <p className="text-sm">Create your first habit to start tracking</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Header */}
              <div className="flex items-center p-4 bg-muted/50">
                <div className="flex-1 font-medium text-sm text-muted-foreground">Habit</div>
                <div className="flex gap-1 mr-12">
                  {last7Days.map(date => (
                    <div 
                      key={date} 
                      className={`w-10 text-center text-xs ${
                        date === today ? 'font-bold text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(date), 'EEE')}
                    </div>
                  ))}
                </div>
                <div className="w-16 text-center text-sm text-muted-foreground">Streak</div>
                <div className="w-10"></div>
              </div>

              {/* Habit Rows */}
              {habits.map(habit => {
                const streak = getHabitStreak(habit.id, logs);
                return (
                  <div key={habit.id} className="flex items-center p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{habit.name}</p>
                    </div>
                    <div className="flex gap-1 mr-12">
                      {last7Days.map(date => {
                        const completed = isCompleted(habit.id, date);
                        return (
                          <button
                            key={date}
                            onClick={() => handleToggle(habit.id, date)}
                            disabled={toggleLog.isPending}
                            className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                              completed
                                ? 'bg-success border-success text-success-foreground scale-105'
                                : 'border-border hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            {completed && <Check className="w-5 h-5" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="w-16 text-center">
                      {streak > 0 && (
                        <div className="flex items-center justify-center gap-1 text-accent">
                          <Flame className="w-4 h-4" />
                          <span className="font-bold">{streak}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHabit(habit.id)}
                      disabled={deleteHabit.isPending}
                      className="w-10 h-10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        {habits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-3xl font-display font-bold text-primary">{habits.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Active Habits</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-3xl font-display font-bold text-success">
                {logs.filter(l => l.date === today).length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Completed Today</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-3xl font-display font-bold text-accent">
                {Math.max(...habits.map(h => getHabitStreak(h.id, logs)), 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Longest Streak</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

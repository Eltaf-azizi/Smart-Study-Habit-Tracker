import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/superbase/client';
import { useAuth } from '@/contexts/AuthContexts';
import { toast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

export interface Habit {
  id: string;
  name: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
}

export function useHabits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });
}

export function useHabitLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habit_logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as HabitLog[];
    },
    enabled: !!user,
  });
}

export function useAddHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('habits')
        .insert({ name, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({ title: 'Habit created! 🎯' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create habit', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete logs first
      await supabase.from('habit_logs').delete().eq('habit_id', id);
      
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit_logs'] });
      toast({ title: 'Habit deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete habit', description: error.message, variant: 'destructive' });
    },
  });
}

export function useToggleHabitLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      // Check if log exists
      const { data: existing } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        // Delete the log
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new log
        const { error } = await supabase
          .from('habit_logs')
          .insert({ habit_id: habitId, date, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit_logs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update habit', description: error.message, variant: 'destructive' });
    },
  });
}

export function getHabitStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs.filter((l) => l.habit_id === habitId);
  if (habitLogs.length === 0) return 0;

  const today = format(new Date(), 'yyyy-MM-dd');
  const sortedDates = habitLogs.map((l) => l.date).sort().reverse();

  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date();

  if (!sortedDates.includes(today)) {
    checkDate = subDays(checkDate, 1);
  }

  while (sortedDates.includes(format(checkDate, 'yyyy-MM-dd'))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  return streak;
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format, startOfDay, endOfDay, subDays, parseISO, isWithinInterval } from 'date-fns';

export interface StudySession {
  id: string;
  subject_id: string;
  start_time: string;
  end_time: string;
  duration: number;
}

export function useStudySessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study_sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as StudySession[];
    },
    enabled: !!user,
  });
}

export function useTodaySessions() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['study_sessions', 'today', user?.id, today],
    queryFn: async () => {
      const start = startOfDay(new Date()).toISOString();
      const end = endOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as StudySession[];
    },
    enabled: !!user,
  });
}

export function useAddStudySession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (session: {
      subject_id: string;
      start_time: string;
      end_time: string;
      duration: number;
    }) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({ ...session, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_sessions'] });
      toast({ title: 'Session saved! 🎉' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save session', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDailyStats(date: Date = new Date()) {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['daily_stats', user?.id, dateStr],
    queryFn: async () => {
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();

      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .gte('start_time', start)
        .lte('start_time', end);

      if (error) throw error;

      const totalSeconds = (sessions || []).reduce((acc, s) => acc + s.duration, 0);
      const totalMinutes = Math.round(totalSeconds / 60);

      // Group by subject
      const subjectMap = new Map<string, number>();
      (sessions || []).forEach((session) => {
        const current = subjectMap.get(session.subject_id) || 0;
        subjectMap.set(session.subject_id, current + session.duration);
      });

      const subjectBreakdown = Array.from(subjectMap.entries()).map(([subjectId, seconds]) => ({
        subjectId,
        minutes: Math.round(seconds / 60),
      }));

      // Find most studied
      let mostStudiedSubject: string | null = null;
      let maxMinutes = 0;
      subjectBreakdown.forEach((item) => {
        if (item.minutes > maxMinutes) {
          maxMinutes = item.minutes;
          mostStudiedSubject = item.subjectId;
        }
      });

      return {
        totalMinutes,
        sessionCount: (sessions || []).length,
        subjectBreakdown,
        mostStudiedSubject,
      };
    },
    enabled: !!user,
  });
}

export function useWeeklyStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly_stats', user?.id],
    queryFn: async () => {
      const today = new Date();
      const weekStart = startOfDay(subDays(today, 6)).toISOString();
      const weekEnd = endOfDay(today).toISOString();

      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .gte('start_time', weekStart)
        .lte('start_time', weekEnd);

      if (error) throw error;

      const dailyTotals: { date: string; minutes: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const start = startOfDay(date);
        const end = endOfDay(date);

        const daySessions = (sessions || []).filter((session) => {
          const sessionDate = parseISO(session.start_time);
          return isWithinInterval(sessionDate, { start, end });
        });

        const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration, 0);

        dailyTotals.push({
          date: format(date, 'yyyy-MM-dd'),
          minutes: Math.round(totalSeconds / 60),
        });
      }

      const totalMinutes = dailyTotals.reduce((acc, d) => acc + d.minutes, 0);
      const averageMinutes = Math.round(totalMinutes / 7);

      let mostProductiveDay: string | null = null;
      let maxMinutes = 0;
      dailyTotals.forEach((day) => {
        if (day.minutes > maxMinutes) {
          maxMinutes = day.minutes;
          mostProductiveDay = day.date;
        }
      });

      return {
        dailyTotals,
        totalMinutes,
        averageMinutes,
        mostProductiveDay,
      };
    },
    enabled: !!user,
  });
}
 
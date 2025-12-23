import { format, startOfDay, endOfDay, subDays, parseISO, isWithinInterval } from 'date-fns';
import { getSessions, getHabitLogs, getSubjects } from './storage';
import { DailyStats, WeeklyStats } from '@/types';

export function getTodaysSessions() {
  const sessions = getSessions();
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);
  
  return sessions.filter(session => {
    const sessionDate = parseISO(session.startTime);
    return isWithinInterval(sessionDate, { start, end });
  });
}

export function getDailyStats(date: Date = new Date()): DailyStats {
  const sessions = getSessions();
  const start = startOfDay(date);
  const end = endOfDay(date);
  
  const todaySessions = sessions.filter(session => {
    const sessionDate = parseISO(session.startTime);
    return isWithinInterval(sessionDate, { start, end });
  });
  
  const totalSeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  
  // Group by subject
  const subjectMap = new Map<string, number>();
  todaySessions.forEach(session => {
    const current = subjectMap.get(session.subjectId) || 0;
    subjectMap.set(session.subjectId, current + session.duration);
  });
  
  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subjectId, seconds]) => ({
    subjectId,
    minutes: Math.round(seconds / 60),
  }));
  
  // Find most studied
  let mostStudiedSubject: string | null = null;
  let maxMinutes = 0;
  subjectBreakdown.forEach(item => {
    if (item.minutes > maxMinutes) {
      maxMinutes = item.minutes;
      mostStudiedSubject = item.subjectId;
    }
  });
  
  return {
    totalMinutes,
    sessionCount: todaySessions.length,
    subjectBreakdown,
    mostStudiedSubject,
  };
}

export function getWeeklyStats(): WeeklyStats {
  const sessions = getSessions();
  const today = new Date();
  
  const dailyTotals: { date: string; minutes: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    const daySessions = sessions.filter(session => {
      const sessionDate = parseISO(session.startTime);
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
  dailyTotals.forEach(day => {
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
}

export function getHabitStreak(habitId: string): number {
  const logs = getHabitLogs().filter(l => l.habitId === habitId);
  if (logs.length === 0) return 0;
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const sortedDates = logs.map(l => l.date).sort().reverse();
  
  // Check if today or yesterday is logged
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
    return 0;
  }
  
  let streak = 0;
  let checkDate = new Date();
  
  // If today isn't logged, start from yesterday
  if (!sortedDates.includes(today)) {
    checkDate = subDays(checkDate, 1);
  }
  
  while (sortedDates.includes(format(checkDate, 'yyyy-MM-dd'))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }
  
  return streak;
}

export function getTodaysCompletedHabits(): number {
  const logs = getHabitLogs();
  const today = format(new Date(), 'yyyy-MM-dd');
  return logs.filter(l => l.date === today).length;
}

export function getSubjectName(subjectId: string): string {
  const subjects = getSubjects();
  return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
}

export function getSubjectColor(subjectId: string): string {
  const subjects = getSubjects();
  return subjects.find(s => s.id === subjectId)?.color || 'hsl(var(--muted))';
}

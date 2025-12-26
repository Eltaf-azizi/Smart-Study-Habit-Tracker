export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

export interface Habit {
  id: string;
  name: string;
  createdDate: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string | null;
  dueDate: string;
  completed: boolean;
  createdDate: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
}

export interface DailyStats {
  totalMinutes: number;
  sessionCount: number;
  subjectBreakdown: { subjectId: string; minutes: number }[];
  mostStudiedSubject: string | null;
}

export interface WeeklyStats {
  dailyTotals: { date: string; minutes: number }[];
  totalMinutes: number;
  averageMinutes: number;
  mostProductiveDay: string | null;
}

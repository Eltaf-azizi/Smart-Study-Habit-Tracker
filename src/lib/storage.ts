import { Subject, StudySession, Habit, HabitLog, Task, AppSettings } from '@/types';

const STORAGE_KEYS = {
  subjects: 'studytracker_subjects',
  sessions: 'studytracker_sessions',
  habits: 'studytracker_habits',
  habitLogs: 'studytracker_habitLogs',
  tasks: 'studytracker_tasks',
  settings: 'studytracker_settings',
};

const DEFAULT_SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', color: 'hsl(173 58% 39%)' },
  { id: '2', name: 'Physics', color: 'hsl(38 92% 50%)' },
  { id: '3', name: 'Chemistry', color: 'hsl(262 83% 58%)' },
  { id: '4', name: 'Biology', color: 'hsl(152 69% 40%)' },
  { id: '5', name: 'English', color: 'hsl(0 72% 51%)' },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
};

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Subjects
export function getSubjects(): Subject[] {
  return getItem(STORAGE_KEYS.subjects, DEFAULT_SUBJECTS);
}

export function saveSubjects(subjects: Subject[]): void {
  setItem(STORAGE_KEYS.subjects, subjects);
}

export function addSubject(subject: Subject): void {
  const subjects = getSubjects();
  subjects.push(subject);
  saveSubjects(subjects);
}

export function removeSubject(id: string): void {
  const subjects = getSubjects().filter(s => s.id !== id);
  saveSubjects(subjects);
}

// Study Sessions
export function getSessions(): StudySession[] {
  return getItem(STORAGE_KEYS.sessions, []);
}

export function saveSessions(sessions: StudySession[]): void {
  setItem(STORAGE_KEYS.sessions, sessions);
}

export function addSession(session: StudySession): void {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
}

// Habits
export function getHabits(): Habit[] {
  return getItem(STORAGE_KEYS.habits, []);
}

export function saveHabits(habits: Habit[]): void {
  setItem(STORAGE_KEYS.habits, habits);
}

export function addHabit(habit: Habit): void {
  const habits = getHabits();
  habits.push(habit);
  saveHabits(habits);
}

export function removeHabit(id: string): void {
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
  // Also remove logs
  const logs = getHabitLogs().filter(l => l.habitId !== id);
  saveHabitLogs(logs);
}

// Habit Logs
export function getHabitLogs(): HabitLog[] {
  return getItem(STORAGE_KEYS.habitLogs, []);
}

export function saveHabitLogs(logs: HabitLog[]): void {
  setItem(STORAGE_KEYS.habitLogs, logs);
}

export function toggleHabitLog(habitId: string, date: string): void {
  const logs = getHabitLogs();
  const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === date);
  
  if (existingIndex >= 0) {
    logs.splice(existingIndex, 1);
  } else {
    logs.push({ id: crypto.randomUUID(), habitId, date });
  }
  
  saveHabitLogs(logs);
}

// Tasks
export function getTasks(): Task[] {
  return getItem(STORAGE_KEYS.tasks, []);
}

export function saveTasks(tasks: Task[]): void {
  setItem(STORAGE_KEYS.tasks, tasks);
}

export function addTask(task: Task): void {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const tasks = getTasks().map(t => t.id === id ? { ...t, ...updates } : t);
  saveTasks(tasks);
}

export function removeTask(id: string): void {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

// Settings
export function getSettings(): AppSettings {
  return getItem(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  setItem(STORAGE_KEYS.settings, settings);
}

// Export all data
export function exportData(): string {
  return JSON.stringify({
    subjects: getSubjects(),
    sessions: getSessions(),
    habits: getHabits(),
    habitLogs: getHabitLogs(),
    tasks: getTasks(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

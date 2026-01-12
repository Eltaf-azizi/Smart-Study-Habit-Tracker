import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Timer, 
  BarChart3, 
  CalendarDays, 
  CheckSquare, 
  ListTodo, 
  Settings,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/timer', icon: Timer, label: 'Study Timer' },
  { to: '/daily', icon: BarChart3, label: 'Daily Report' },
  { to: '/weekly', icon: CalendarDays, label: 'Weekly Report' },
  { to: '/habits', icon: CheckSquare, label: 'Habits' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">StudyFlow</h1>
            <p className="text-xs text-muted-foreground">Track your progress</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <p className="text-xs text-muted-foreground mb-1">Pro tip</p>
        <p className="text-sm font-medium text-foreground">
          Consistent study beats cramming. Aim for 2-3 hours daily! 📚
        </p>
      </div>
    </aside>
  );
}

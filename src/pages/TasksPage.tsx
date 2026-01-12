import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks, useAddTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';
import { useAuth } from '@/contexts/AuthContexts';
import { Plus, Trash2, Check, Circle, Calendar, Loader2 } from 'lucide-react';
import { format, isToday, isPast, isTomorrow, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function TasksPage() {
  const { loading: authLoading } = useAuth();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: subjects = [] } = useSubjects();
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const handleAddTask = () => {
    if (!newTitle.trim()) {
      toast({ title: 'Enter a task title', variant: 'destructive' });
      return;
    }

    addTask.mutate({
      title: newTitle.trim(),
      subject_id: newSubject || null,
      due_date: newDueDate,
    });
    setNewTitle('');
    setNewSubject('');
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateTask.mutate({ id, completed: !completed });
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id);
  };

  const getSubjectName = (id: string | null) => {
    if (!id) return null;
    return subjects.find(s => s.id === id)?.name;
  };

  const getSubjectColor = (id: string | null) => {
    if (!id) return 'hsl(var(--muted))';
    return subjects.find(s => s.id === id)?.color || 'hsl(var(--muted))';
  };

  const getDueDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Overdue';
    return format(date, 'MMM d');
  };

  const getDueDateClass = (dateStr: string, completed: boolean) => {
    if (completed) return 'text-muted-foreground';
    const date = parseISO(dateStr);
    if (isPast(date) && !isToday(date)) return 'text-destructive font-medium';
    if (isToday(date)) return 'text-accent font-medium';
    return 'text-muted-foreground';
  };

  const filteredTasks = tasks
    .filter(t => {
      if (filter === 'pending') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  const overdueCount = tasks.filter(t => !t.completed && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))).length;

  if (authLoading || tasksLoading) {
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
          <h1 className="text-3xl font-display font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your to-dos and assignments</p>
        </div>

        {/* Add Task */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Add New Task</h3>
          <div className="space-y-4">
            <Input
              placeholder="What do you need to do?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <div className="flex gap-3">
              <Select value={newSubject} onValueChange={setNewSubject}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color }} 
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-40"
              />
              <Button 
                onClick={handleAddTask} 
                className="gradient-primary text-primary-foreground"
                disabled={addTask.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
            <span className="text-sm text-muted-foreground">Pending:</span>
            <span className="font-bold">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10">
            <span className="text-sm text-success">Completed:</span>
            <span className="font-bold text-success">{completedCount}</span>
          </div>
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10">
              <span className="text-sm text-destructive">Overdue:</span>
              <span className="font-bold text-destructive">{overdueCount}</span>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'gradient-primary text-primary-foreground' : ''}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Check className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-medium">No tasks found</p>
              <p className="text-sm">
                {filter === 'all' ? 'Add a task to get started' : `No ${filter} tasks`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    onClick={() => handleToggleComplete(task.id, task.completed)}
                    disabled={updateTask.isPending}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed 
                        ? 'bg-success border-success text-success-foreground' 
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {task.completed ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3 opacity-0" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    {task.subject_id && (
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getSubjectColor(task.subject_id) }} 
                        />
                        <span className="text-sm text-muted-foreground">
                          {getSubjectName(task.subject_id)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`flex items-center gap-1 ${getDueDateClass(task.due_date, task.completed)}`}>
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{getDueDateLabel(task.due_date)}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                    disabled={deleteTask.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

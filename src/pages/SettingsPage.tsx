import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubjects, useAddSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useAuth } from '@/contexts/AuthContexts';
import { useTheme } from 'next-themes';
import { Plus, Trash2, Download, Palette, Moon, Sun, Loader2, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PRESET_COLORS = [
  'hsl(173 58% 39%)', // Teal
  'hsl(38 92% 50%)',  // Amber
  'hsl(262 83% 58%)', // Purple
  'hsl(152 69% 40%)', // Green
  'hsl(0 72% 51%)',   // Red
  'hsl(221 83% 53%)', // Blue
  'hsl(316 72% 51%)', // Pink
  'hsl(24 95% 53%)',  // Orange
];

export default function SettingsPage() {
  const { loading: authLoading, signOut, user } = useAuth();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const addSubject = useAddSubject();
  const deleteSubject = useDeleteSubject();
  const { theme, setTheme } = useTheme();

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(PRESET_COLORS[0]);

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      toast({ title: 'Enter a subject name', variant: 'destructive' });
      return;
    }

    addSubject.mutate({ name: newSubjectName.trim(), color: newSubjectColor });
    setNewSubjectName('');
    setNewSubjectColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  };

  const handleRemoveSubject = (id: string) => {
    deleteSubject.mutate(id);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({ title: `Switched to ${newTheme} mode` });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out successfully' });
  };

  if (authLoading || subjectsLoading) {
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
      <div className="space-y-8 animate-slide-up max-w-2xl">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your study experience</p>
        </div>

        {/* Account */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Account</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Signed in</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-muted-foreground" />
            Appearance
          </h3>
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('light')}
              className={theme === 'light' ? 'gradient-primary text-primary-foreground' : ''}
            >
              <Sun className="w-4 h-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('dark')}
              className={theme === 'dark' ? 'gradient-primary text-primary-foreground' : ''}
            >
              <Moon className="w-4 h-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('system')}
              className={theme === 'system' ? 'gradient-primary text-primary-foreground' : ''}
            >
              <Palette className="w-4 h-4 mr-2" />
              System
            </Button>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-4">Manage Subjects</h3>
          
          {/* Add Subject */}
          <div className="space-y-4 mb-6">
            <Input
              placeholder="Subject name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Color:</span>
              <div className="flex gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewSubjectColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      newSubjectColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button 
              onClick={handleAddSubject} 
              className="w-full gradient-primary text-primary-foreground"
              disabled={addSubject.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>

          {/* Subject List */}
          <div className="space-y-2">
            {subjects.map(subject => (
              <div 
                key={subject.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: subject.color }} 
                  />
                  <span className="font-medium">{subject.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSubject(subject.id)}
                  disabled={deleteSubject.isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-display font-semibold mb-2">About StudyFlow</h3>
          <p className="text-sm text-muted-foreground">
            A student productivity app to track study time, build habits, and manage tasks.
            Built with ❤️ for focused learners.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Version 1.0.0
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

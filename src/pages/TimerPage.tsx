import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubjects } from '@/hooks/useSubjects';
import { useTodaySessions, useAddStudySession } from '@/hooks/useStudySessions';
import { useAuth } from '@/contexts/AuthContexts';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function TimerPage() {
  const { loading: authLoading } = useAuth();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: todaySessions = [] } = useTodaySessions();
  const addSession = useAddStudySession();

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedSubject) {
      toast({ title: 'Select a subject', description: 'Please choose a subject before starting.' });
      return;
    }
    setStartTime(new Date());
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    if (seconds < 60) {
      toast({ title: 'Session too short', description: 'Sessions must be at least 1 minute.' });
      setIsRunning(false);
      setSeconds(0);
      setStartTime(null);
      return;
    }

    const endTime = new Date();
    addSession.mutate({
      subject_id: selectedSubject,
      start_time: startTime?.toISOString() || new Date().toISOString(),
      end_time: endTime.toISOString(),
      duration: seconds,
    });

    setIsRunning(false);
    setSeconds(0);
    setStartTime(null);
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getSubjectColor = (id: string) => subjects.find(s => s.id === id)?.color || 'hsl(var(--muted))';

  if (authLoading || subjectsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const recentSessions = todaySessions.slice(0, 5);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold">Study Timer</h1>
          <p className="text-muted-foreground mt-1">Focus on what matters</p>
        </div>

        {/* Subject Selector */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select Subject
          </label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isRunning}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a subject to study" />
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
        </div>

        {/* Timer Display */}
        <div className="bg-card rounded-3xl border border-border p-12 text-center">
          <div 
            className={`text-7xl font-display font-bold tracking-tight transition-colors ${
              isRunning ? 'text-primary' : 'text-foreground'
            }`}
          >
            {formatTime(seconds)}
          </div>
          
          {isRunning && selectedSubject && (
            <p className="mt-4 text-muted-foreground flex items-center justify-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse-soft" 
                style={{ backgroundColor: getSubjectColor(selectedSubject) }} 
              />
              Studying {getSubjectName(selectedSubject)}
            </p>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {!isRunning && seconds === 0 && (
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-glow hover:shadow-glow"
                onClick={handleStart}
              >
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
            )}
            
            {isRunning && (
              <>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-6 py-6 rounded-xl"
                  onClick={handlePause}
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="px-6 py-6 rounded-xl"
                  onClick={handleStop}
                  disabled={addSession.isPending}
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop & Save
                </Button>
              </>
            )}

            {!isRunning && seconds > 0 && (
              <>
                <Button 
                  size="lg" 
                  className="gradient-primary text-primary-foreground px-6 py-6 rounded-xl"
                  onClick={() => setIsRunning(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-6 py-6 rounded-xl"
                  onClick={handleStop}
                  disabled={addSession.isPending}
                >
                  <Square className="w-5 h-5 mr-2" />
                  Save Session
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Sessions Today
            </h3>
            <div className="space-y-3">
              {recentSessions.map(session => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-8 rounded-full" 
                      style={{ backgroundColor: getSubjectColor(session.subject_id) }} 
                    />
                    <div>
                      <p className="font-medium">{getSubjectName(session.subject_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.start_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <p className="font-display font-semibold">
                    {Math.round(session.duration / 60)}m
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

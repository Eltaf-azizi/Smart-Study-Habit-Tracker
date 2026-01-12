import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useSubjects } from '@/hooks/useSubjects';
import { format, isSameDay } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';

export default function CalendarPage() {
  const { data: sessions = [] } = useStudySessions();
  const { data: subjects = [] } = useSubjects();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => isSameDay(new Date(session.start_time), date));
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getSubjectColor = (id: string) => subjects.find(s => s.id === id)?.color || 'hsl(var(--muted))';

  const selectedSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  // Get dates with sessions for highlighting
  const sessionDates = sessions.map(session => new Date(session.start_time));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold">Study Calendar</h1>
          <p className="text-muted-foreground mt-1">View your study sessions over time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasSession: sessionDates
                  }}
                  modifiersStyles={{
                    hasSession: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sessions for selected date */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No study sessions on this date
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedSessions.map(session => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getSubjectColor(session.subject_id) }}
                          />
                          <div>
                            <p className="font-medium">{getSubjectName(session.subject_id)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(session.start_time), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(session.duration / 60)}m
                        </Badge>
                      </div>
                    ))}
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Total: {Math.round(selectedSessions.reduce((sum, s) => sum + s.duration, 0) / 60)} minutes
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
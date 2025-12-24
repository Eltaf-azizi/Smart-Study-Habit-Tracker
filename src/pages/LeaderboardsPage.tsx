import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trophy, Users, Clock, Target, TrendingUp, Crown, Trash2 } from 'lucide-react';
import { useLeaderboards, useCreateLeaderboard, useDeleteLeaderboard, RankingMetric } from '@/hooks/useLeaderboards';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const metricLabels: Record<RankingMetric, { label: string; icon: typeof Clock; description: string }> = {
  study_time: { label: 'Study Time', icon: Clock, description: 'Weekly total study minutes' },
  habit_completion: { label: 'Habit Completion', icon: Target, description: 'Weekly habit completion %' },
  productivity_score: { label: 'Productivity Score', icon: TrendingUp, description: 'Combined study + habits score' },
};

export default function LeaderboardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: leaderboards, isLoading } = useLeaderboards();
  const createLeaderboard = useCreateLeaderboard();
  const deleteLeaderboard = useDeleteLeaderboard();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [metric, setMetric] = useState<RankingMetric>('study_time');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createLeaderboard.mutateAsync({ name: name.trim(), ranking_metric: metric });
    setIsCreateOpen(false);
    setName('');
    setMetric('study_time');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this leaderboard?')) {
      await deleteLeaderboard.mutateAsync(id);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Leaderboards</h1>
            <p className="text-muted-foreground mt-1">Compete with friends and family</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Leaderboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Leaderboard</DialogTitle>
                <DialogDescription>
                  Create a private leaderboard and invite friends to compete.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Leaderboard Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Family Study League"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ranking Metric</Label>
                  <Select value={metric} onValueChange={(v) => setMetric(v as RankingMetric)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(metricLabels).map(([key, { label, description }]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">{description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!name.trim() || createLeaderboard.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : leaderboards?.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Leaderboards Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first leaderboard to start competing with friends!
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Leaderboard
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaderboards?.map((board) => {
              const metricInfo = metricLabels[board.ranking_metric];
              const MetricIcon = metricInfo.icon;
              const isAdmin = board.admin_user_id === user?.id;

              return (
                <Card 
                  key={board.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors relative group"
                  onClick={() => navigate(`/leaderboards/${board.id}`)}
                >
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(board.id, e)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {board.name}
                          {isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MetricIcon className="w-3 h-3" />
                          {metricInfo.label}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      Click to view rankings
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

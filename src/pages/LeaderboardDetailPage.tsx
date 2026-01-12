import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, Trophy, UserPlus, Crown, Clock, Target, TrendingUp, 
  Copy, Check, Mail, LogOut, Trash2, Users
} from 'lucide-react';
import { 
  useLeaderboard, 
  useLeaderboardMembers, 
  useLeaderboardInvitations,
  useSendInvitation,
  useLeaveLeaderboard,
  useRemoveMember,
  RankingMetric 
} from '@/hooks/useLeaderboards';
import { useAuth } from '@/contexts/AuthContexts';
import { toast } from '@/hooks/use-toast';

const metricLabels: Record<RankingMetric, { label: string; icon: typeof Clock; unit: string }> = {
  study_time: { label: 'Study Time', icon: Clock, unit: 'min' },
  habit_completion: { label: 'Habit Completion', icon: Target, unit: '%' },
  productivity_score: { label: 'Productivity Score', icon: TrendingUp, unit: 'pts' },
};

export default function LeaderboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: leaderboard, isLoading: loadingBoard } = useLeaderboard(id || '');
  const { data: members, isLoading: loadingMembers } = useLeaderboardMembers(id || '');
  const { data: invitations } = useLeaderboardInvitations(id || '');
  
  const sendInvitation = useSendInvitation();
  const leaveLeaderboard = useLeaveLeaderboard();
  const removeMember = useRemoveMember();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isAdmin = leaderboard?.admin_user_id === user?.id;
  const metricInfo = leaderboard ? metricLabels[leaderboard.ranking_metric] : null;
  const MetricIcon = metricInfo?.icon || Clock;

  const handleInvite = async () => {
    if (!email.trim() || !id) return;
    await sendInvitation.mutateAsync({ leaderboardId: id, email: email.trim() });
    setEmail('');
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/join-leaderboard?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast({ title: 'Link copied!', description: 'Share this link with the person you invited.' });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleLeave = async () => {
    if (!id) return;
    if (isAdmin) {
      toast({ title: 'Cannot leave', description: 'Admins must delete the leaderboard instead.', variant: 'destructive' });
      return;
    }
    if (confirm('Are you sure you want to leave this leaderboard?')) {
      await leaveLeaderboard.mutateAsync(id);
      navigate('/leaderboards');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember.mutateAsync({ leaderboardId: id, memberId });
    }
  };

  const formatScore = (score: number) => {
    if (!metricInfo) return score;
    if (metricInfo.unit === 'min') {
      const hours = Math.floor(score / 60);
      const mins = score % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
    return `${score}${metricInfo.unit}`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-yellow-500 text-yellow-950">🥇 1st</Badge>;
    if (index === 1) return <Badge className="bg-gray-400 text-gray-900">🥈 2nd</Badge>;
    if (index === 2) return <Badge className="bg-amber-600 text-amber-950">🥉 3rd</Badge>;
    return <Badge variant="outline">{index + 1}th</Badge>;
  };

  if (loadingBoard) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (!leaderboard) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Leaderboard Not Found</h3>
          <Button variant="outline" onClick={() => navigate('/leaderboards')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leaderboards
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leaderboards')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold text-foreground">{leaderboard.name}</h1>
              {isAdmin && (
                <Badge variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <MetricIcon className="w-4 h-4" />
              <span>{metricInfo?.label} (Weekly)</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite to Leaderboard</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join "{leaderboard.name}". They'll need to accept to join.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          placeholder="friend@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button onClick={handleInvite} disabled={!email.trim() || sendInvitation.isPending}>
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {invitations && invitations.length > 0 && (
                      <div className="space-y-2">
                        <Label>Pending Invitations</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {invitations.filter(i => i.status === 'pending').map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                              <span className="truncate">{inv.email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(inv.token)}
                              >
                                {copiedToken === inv.token ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {!isAdmin && (
              <Button variant="outline" onClick={handleLeave}>
                <LogOut className="w-4 h-4 mr-2" />
                Leave
              </Button>
            )}
          </div>
        </div>

        {/* Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Rankings
            </CardTitle>
            <CardDescription>Updated based on last 7 days of activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : members?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No members yet. Invite some friends!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    {isAdmin && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member, index) => {
                    const displayName = member.profile?.first_name 
                      ? `${member.profile.first_name} ${member.profile.last_name || ''}`.trim()
                      : member.profile?.email || 'Unknown User';
                    const isCurrentUser = member.user_id === user?.id;

                    return (
                      <TableRow key={member.id} className={isCurrentUser ? 'bg-primary/5' : ''}>
                        <TableCell>{getRankBadge(index)}</TableCell>
                        <TableCell className="font-medium">
                          {displayName}
                          {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatScore(member.score)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {!isCurrentUser && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

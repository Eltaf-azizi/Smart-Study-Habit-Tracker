import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Target, TrendingUp, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/superbase/client';
import { Database } from '@/integrations/superbase/types';
import { useAuth } from '@/contexts/AuthContexts';
import { useAcceptInvitation, RankingMetric } from '@/hooks/useLeaderboards';
import { toast } from '@/hooks/use-toast';

const metricLabels: Record<RankingMetric, { label: string; icon: typeof Clock; description: string }> = {
  study_time: { label: 'Study Time', icon: Clock, description: 'Weekly total study minutes' },
  habit_completion: { label: 'Habit Completion', icon: Target, description: 'Weekly habit completion %' },
  productivity_score: { label: 'Productivity Score', icon: TrendingUp, description: 'Combined study + habits' },
};

interface InvitationDetails {
  leaderboardName: string;
  rankingMetric: RankingMetric;
  inviterName: string;
  memberCount: number;
  expired: boolean;
}

export default function JoinLeaderboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  
  const acceptInvitation = useAcceptInvitation();

  useEffect(() => {
    async function fetchInvitationDetails() {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        // Fetch invitation details (public access needed, so we use a different approach)
        const { data: invitation, error: invError } = await supabase
          .from('leaderboard_invitations')
          .select('*, leaderboards(*)')
          .eq('token', token)
          .maybeSingle();

        if (invError || !invitation) {
          setError('Invitation not found');
          setLoading(false);
          return;
        }

        const leaderboard = invitation.leaderboards as Database['public']['Tables']['leaderboards']['Row'];
        
        // Check expiry
        const expired = new Date(invitation.expires_at) < new Date();

        // Get inviter profile
        const { data: inviterProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', invitation.invited_by)
          .maybeSingle();

        // Get member count
        const { count } = await supabase
          .from('leaderboard_members')
          .select('*', { count: 'exact', head: true })
          .eq('leaderboard_id', invitation.leaderboard_id);

        setDetails({
          leaderboardName: leaderboard?.name || 'Unknown',
          rankingMetric: leaderboard?.ranking_metric || 'study_time',
          inviterName: inviterProfile 
            ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || 'Someone'
            : 'Someone',
          memberCount: count || 0,
          expired: expired || invitation.status !== 'pending',
        });
      } catch (e) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchInvitationDetails();
    }
  }, [token, authLoading]);

  const handleAccept = async () => {
    if (!token) return;
    
    try {
      await acceptInvitation.mutateAsync(token);
      navigate('/leaderboards');
    } catch (e) {
      // Error handled in mutation
    }
  };

  const handleDecline = () => {
    toast({ title: 'Invitation declined' });
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <Trophy className="w-12 h-12 mx-auto text-primary mb-2" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in or register to accept this leaderboard invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Sign In / Register
            </Button>
          </CardFooter>
        </Card>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-2" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </AppLayout>
    );
  }

  if (!details) return null;

  const metricInfo = metricLabels[details.rankingMetric];
  const MetricIcon = metricInfo.icon;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription>
              {details.inviterName} invited you to join a leaderboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {details.expired ? (
              <div className="p-4 bg-destructive/10 rounded-lg text-center">
                <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="font-medium text-destructive">This invitation has expired or already been used.</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Leaderboard</span>
                    <span className="font-semibold">{details.leaderboardName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ranking By</span>
                    <Badge variant="secondary" className="gap-1">
                      <MetricIcon className="w-3 h-3" />
                      {metricInfo.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Members</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {details.memberCount}
                    </span>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">What data will be shared?</h4>
                  <p className="text-sm text-muted-foreground">
                    {details.rankingMetric === 'study_time' && 
                      'Only your weekly total study time will be visible to other members.'}
                    {details.rankingMetric === 'habit_completion' && 
                      'Only your weekly habit completion percentage will be visible to other members.'}
                    {details.rankingMetric === 'productivity_score' && 
                      'Only your combined productivity score will be visible to other members.'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your personal notes, exact session times, and other private data are never shared.
                  </p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex gap-3">
            {details.expired ? (
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Go Home
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={handleDecline}>
                  Decline
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={handleAccept}
                  disabled={acceptInvitation.isPending}
                >
                  {acceptInvitation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Accept & Join
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}

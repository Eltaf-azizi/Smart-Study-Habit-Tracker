import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type RankingMetric = 'study_time' | 'habit_completion' | 'productivity_score';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface Leaderboard {
  id: string;
  name: string;
  ranking_metric: RankingMetric;
  admin_user_id: string;
  created_at: string;
}

export interface LeaderboardMember {
  id: string;
  leaderboard_id: string;
  user_id: string;
  joined_at: string;
}

export interface LeaderboardInvitation {
  id: string;
  leaderboard_id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

export interface MemberWithProfile {
  id: string;
  user_id: string;
  joined_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  score: number;
}

// Fetch all leaderboards user is part of (as admin or member)
export function useLeaderboards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leaderboards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Leaderboard[];
    },
    enabled: !!user,
  });
}

// Fetch single leaderboard details
export function useLeaderboard(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leaderboard', id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Leaderboard | null;
    },
    enabled: !!user && !!id,
  });
}

// Fetch leaderboard members with their profiles and scores
export function useLeaderboardMembers(leaderboardId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leaderboard-members', leaderboardId],
    queryFn: async () => {
      if (!user || !leaderboardId) return [];
      
      // Get members
      const { data: members, error: membersError } = await supabase
        .from('leaderboard_members')
        .select('*')
        .eq('leaderboard_id', leaderboardId);

      if (membersError) throw membersError;

      // Get leaderboard to know the metric
      const { data: leaderboard } = await supabase
        .from('leaderboards')
        .select('ranking_metric')
        .eq('id', leaderboardId)
        .single();

      // Get profiles and scores for each member
      const membersWithData = await Promise.all(
        (members || []).map(async (member) => {
          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', member.user_id)
            .maybeSingle();

          // Calculate score based on metric (last 7 days)
          let score = 0;
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          if (leaderboard?.ranking_metric === 'study_time') {
            const { data: sessions } = await supabase
              .from('study_sessions')
              .select('duration')
              .eq('user_id', member.user_id)
              .gte('start_time', weekAgo.toISOString());
            
            score = (sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0);
          } else if (leaderboard?.ranking_metric === 'habit_completion') {
            const { data: habits } = await supabase
              .from('habits')
              .select('id')
              .eq('user_id', member.user_id);
            
            const { data: logs } = await supabase
              .from('habit_logs')
              .select('id')
              .eq('user_id', member.user_id)
              .gte('date', weekAgo.toISOString().split('T')[0]);
            
            const totalPossible = (habits?.length || 0) * 7;
            score = totalPossible > 0 ? Math.round(((logs?.length || 0) / totalPossible) * 100) : 0;
          } else if (leaderboard?.ranking_metric === 'productivity_score') {
            // Productivity = study minutes + (habit completion % * 100)
            const { data: sessions } = await supabase
              .from('study_sessions')
              .select('duration')
              .eq('user_id', member.user_id)
              .gte('start_time', weekAgo.toISOString());
            
            const studyMinutes = (sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0);
            
            const { data: habits } = await supabase
              .from('habits')
              .select('id')
              .eq('user_id', member.user_id);
            
            const { data: logs } = await supabase
              .from('habit_logs')
              .select('id')
              .eq('user_id', member.user_id)
              .gte('date', weekAgo.toISOString().split('T')[0]);
            
            const totalPossible = (habits?.length || 0) * 7;
            const habitScore = totalPossible > 0 ? ((logs?.length || 0) / totalPossible) * 100 : 0;
            
            score = Math.round(studyMinutes + habitScore);
          }

          return {
            id: member.id,
            user_id: member.user_id,
            joined_at: member.joined_at,
            profile,
            score,
          };
        })
      );

      // Sort by score descending
      return membersWithData.sort((a, b) => b.score - a.score) as MemberWithProfile[];
    },
    enabled: !!user && !!leaderboardId,
  });
}

// Fetch invitations for a leaderboard
export function useLeaderboardInvitations(leaderboardId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leaderboard-invitations', leaderboardId],
    queryFn: async () => {
      if (!user || !leaderboardId) return [];
      
      const { data, error } = await supabase
        .from('leaderboard_invitations')
        .select('*')
        .eq('leaderboard_id', leaderboardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeaderboardInvitation[];
    },
    enabled: !!user && !!leaderboardId,
  });
}

// Create a new leaderboard
export function useCreateLeaderboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, ranking_metric }: { name: string; ranking_metric: RankingMetric }) => {
      if (!user) throw new Error('Not authenticated');

      // Create leaderboard
      const { data: leaderboard, error: leaderboardError } = await supabase
        .from('leaderboards')
        .insert({ name, ranking_metric, admin_user_id: user.id })
        .select()
        .single();

      if (leaderboardError) throw leaderboardError;

      // Automatically add creator as member
      const { error: memberError } = await supabase
        .from('leaderboard_members')
        .insert({ leaderboard_id: leaderboard.id, user_id: user.id });

      if (memberError) throw memberError;

      return leaderboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      toast({ title: 'Leaderboard created!', description: 'You can now invite members.' });
    },
    onError: (error) => {
      toast({ title: 'Error creating leaderboard', description: error.message, variant: 'destructive' });
    },
  });
}

// Delete a leaderboard
export function useDeleteLeaderboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leaderboards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      toast({ title: 'Leaderboard deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting leaderboard', description: error.message, variant: 'destructive' });
    },
  });
}

// Send invitation
export function useSendInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ leaderboardId, email }: { leaderboardId: string; email: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('leaderboard_invitations')
        .insert({ leaderboard_id: leaderboardId, email, invited_by: user.id })
        .select()
        .single();

      if (error) throw error;

      // Try to send email via edge function (will fail silently if not configured)
      try {
        await supabase.functions.invoke('send-leaderboard-invite', {
          body: { invitationId: data.id },
        });
      } catch (e) {
        console.log('Email sending not configured, using invite link instead');
      }

      return data;
    },
    onSuccess: (_, { leaderboardId }) => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard-invitations', leaderboardId] });
      toast({ title: 'Invitation sent!', description: 'Share the invite link with the person.' });
    },
    onError: (error) => {
      toast({ title: 'Error sending invitation', description: error.message, variant: 'destructive' });
    },
  });
}

// Accept invitation (for invited users)
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get invitation by token
      const { data: invitation, error: inviteError } = await supabase
        .from('leaderboard_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteError) throw inviteError;
      if (!invitation) throw new Error('Invitation not found or already used');

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('leaderboard_members')
        .insert({ leaderboard_id: invitation.leaderboard_id, user_id: user.id });

      if (memberError) throw memberError;

      // Update invitation status - need to use service role or RPC for this
      // For now, we'll handle this via the invitation being used
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      toast({ title: 'You joined the leaderboard!' });
    },
    onError: (error) => {
      toast({ title: 'Error joining leaderboard', description: error.message, variant: 'destructive' });
    },
  });
}

// Leave a leaderboard
export function useLeaveLeaderboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leaderboardId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('leaderboard_members')
        .delete()
        .eq('leaderboard_id', leaderboardId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      toast({ title: 'You left the leaderboard' });
    },
    onError: (error) => {
      toast({ title: 'Error leaving leaderboard', description: error.message, variant: 'destructive' });
    },
  });
}

// Remove a member (admin only)
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leaderboardId, memberId }: { leaderboardId: string; memberId: string }) => {
      const { error } = await supabase
        .from('leaderboard_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, { leaderboardId }) => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard-members', leaderboardId] });
      toast({ title: 'Member removed' });
    },
    onError: (error) => {
      toast({ title: 'Error removing member', description: error.message, variant: 'destructive' });
    },
  });
}

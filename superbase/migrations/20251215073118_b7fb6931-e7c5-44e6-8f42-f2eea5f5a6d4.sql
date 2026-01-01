-- Allow anyone to view invitation details by token (for the join page)
CREATE POLICY "Anyone can view invitations by token"
ON public.leaderboard_invitations FOR SELECT
USING (true);

-- Allow users to update invitation status when accepting (matching their email)
CREATE POLICY "Users can accept invitations sent to their email"
ON public.leaderboard_invitations FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Drop the overly restrictive select policy and recreate
DROP POLICY IF EXISTS "Admins can view invitations for their leaderboards" ON public.leaderboard_invitations;
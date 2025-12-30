-- Create enum for ranking metrics
CREATE TYPE public.ranking_metric AS ENUM ('study_time', 'habit_completion', 'productivity_score');

-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Create leaderboards table
CREATE TABLE public.leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ranking_metric ranking_metric NOT NULL DEFAULT 'study_time',
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaderboard members table
CREATE TABLE public.leaderboard_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_id UUID NOT NULL REFERENCES public.leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (leaderboard_id, user_id)
);

-- Create leaderboard invitations table
CREATE TABLE public.leaderboard_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_id UUID NOT NULL REFERENCES public.leaderboards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_invitations ENABLE ROW LEVEL SECURITY;

-- Leaderboards policies
CREATE POLICY "Users can view leaderboards they admin or are members of"
ON public.leaderboards FOR SELECT
USING (
  auth.uid() = admin_user_id OR
  EXISTS (
    SELECT 1 FROM public.leaderboard_members 
    WHERE leaderboard_id = leaderboards.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create leaderboards"
ON public.leaderboards FOR INSERT
WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Admins can update their leaderboards"
ON public.leaderboards FOR UPDATE
USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can delete their leaderboards"
ON public.leaderboards FOR DELETE
USING (auth.uid() = admin_user_id);

-- Leaderboard members policies
CREATE POLICY "Members can view other members of their leaderboards"
ON public.leaderboard_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboard_members m
    WHERE m.leaderboard_id = leaderboard_members.leaderboard_id AND m.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.leaderboards l
    WHERE l.id = leaderboard_members.leaderboard_id AND l.admin_user_id = auth.uid()
  )
);

CREATE POLICY "Users can join leaderboards (via invitation acceptance)"
ON public.leaderboard_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave leaderboards"
ON public.leaderboard_members FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.leaderboards l
    WHERE l.id = leaderboard_members.leaderboard_id AND l.admin_user_id = auth.uid()
  )
);

-- Invitation policies
CREATE POLICY "Admins can view invitations for their leaderboards"
ON public.leaderboard_invitations FOR SELECT
USING (
  auth.uid() = invited_by OR
  EXISTS (
    SELECT 1 FROM public.leaderboards l
    WHERE l.id = leaderboard_invitations.leaderboard_id AND l.admin_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create invitations for their leaderboards"
ON public.leaderboard_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leaderboards l
    WHERE l.id = leaderboard_invitations.leaderboard_id AND l.admin_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update invitations for their leaderboards"
ON public.leaderboard_invitations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboards l
    WHERE l.id = leaderboard_invitations.leaderboard_id AND l.admin_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete invitations"
ON public.leaderboard_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.leaderboards l
    WHERE l.id = leaderboard_invitations.leaderboard_id AND l.admin_user_id = auth.uid()
  )
);
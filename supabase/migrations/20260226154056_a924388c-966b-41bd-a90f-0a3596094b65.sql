
-- Fix RLS on support_teams: Drop restrictive ALL policy, replace with individual permissive policies for master
DROP POLICY IF EXISTS "Master can manage teams" ON public.support_teams;
DROP POLICY IF EXISTS "Staff can view teams" ON public.support_teams;

CREATE POLICY "Staff can view teams" ON public.support_teams
  FOR SELECT USING (
    has_role(auth.uid(), 'support'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'master'::app_role)
  );

CREATE POLICY "Master can insert teams" ON public.support_teams
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can update teams" ON public.support_teams
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can delete teams" ON public.support_teams
  FOR DELETE USING (has_role(auth.uid(), 'master'::app_role));

-- Fix RLS on support_tags
DROP POLICY IF EXISTS "Master can manage tags" ON public.support_tags;
DROP POLICY IF EXISTS "Staff can view tags" ON public.support_tags;

CREATE POLICY "Staff can view tags" ON public.support_tags
  FOR SELECT USING (
    has_role(auth.uid(), 'support'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'master'::app_role)
  );

CREATE POLICY "Master can insert tags" ON public.support_tags
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can update tags" ON public.support_tags
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can delete tags" ON public.support_tags
  FOR DELETE USING (has_role(auth.uid(), 'master'::app_role));

-- Fix RLS on support_team_members
DROP POLICY IF EXISTS "Master can manage team members" ON public.support_team_members;
DROP POLICY IF EXISTS "Staff can view team members" ON public.support_team_members;

CREATE POLICY "Staff can view team members" ON public.support_team_members
  FOR SELECT USING (
    has_role(auth.uid(), 'support'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'master'::app_role)
  );

CREATE POLICY "Master can insert team members" ON public.support_team_members
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can update team members" ON public.support_team_members
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can delete team members" ON public.support_team_members
  FOR DELETE USING (has_role(auth.uid(), 'master'::app_role));

-- Fix RLS on support_welcome_messages
DROP POLICY IF EXISTS "Master can manage welcome messages" ON public.support_welcome_messages;
DROP POLICY IF EXISTS "Staff can view welcome messages" ON public.support_welcome_messages;

CREATE POLICY "Staff can view welcome messages" ON public.support_welcome_messages
  FOR SELECT USING (
    has_role(auth.uid(), 'support'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'master'::app_role)
  );

CREATE POLICY "Master can insert welcome messages" ON public.support_welcome_messages
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can update welcome messages" ON public.support_welcome_messages
  FOR UPDATE USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can delete welcome messages" ON public.support_welcome_messages
  FOR DELETE USING (has_role(auth.uid(), 'master'::app_role));


-- 1. Support Teams
CREATE TABLE public.support_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view teams" ON public.support_teams
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Master can manage teams" ON public.support_teams
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'))
  WITH CHECK (has_role(auth.uid(), 'master'));

-- 2. Team Members
CREATE TABLE public.support_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.support_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'supervisor', 'lead')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.support_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view team members" ON public.support_team_members
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Master can manage team members" ON public.support_team_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'))
  WITH CHECK (has_role(auth.uid(), 'master'));

-- 3. Add team_id to conversations for routing
ALTER TABLE public.support_conversations ADD COLUMN team_id UUID REFERENCES public.support_teams(id);

-- 4. Chat Transfers
CREATE TABLE public.chat_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID,
  to_team_id UUID REFERENCES public.support_teams(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view transfers" ON public.chat_transfers
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Staff can create transfers" ON public.chat_transfers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id AND (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master')));

-- 5. Internal Notes (staff-only messages, invisible to clients)
CREATE TABLE public.support_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view internal notes" ON public.support_internal_notes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Staff can create internal notes" ON public.support_internal_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master')));

-- 6. Predefined Tags
CREATE TABLE public.support_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tags" ON public.support_tags
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Master can manage tags" ON public.support_tags
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'))
  WITH CHECK (has_role(auth.uid(), 'master'));

-- 7. Conversation Tags (junction table)
CREATE TABLE public.conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.support_tags(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);

ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view conversation tags" ON public.conversation_tags
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Staff can manage conversation tags" ON public.conversation_tags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master')));

CREATE POLICY "Staff can delete conversation tags" ON public.conversation_tags
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

-- 8. Welcome Messages
CREATE TABLE public.support_welcome_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.support_teams(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  schedule_start TIME,
  schedule_end TIME,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_welcome_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view welcome messages" ON public.support_welcome_messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Master can manage welcome messages" ON public.support_welcome_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master'))
  WITH CHECK (has_role(auth.uid(), 'master'));

-- 9. Add first_response_at and closed_at to conversations for metrics
ALTER TABLE public.support_conversations 
  ADD COLUMN first_response_at TIMESTAMPTZ,
  ADD COLUMN closed_at TIMESTAMPTZ;

-- 10. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_internal_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_transfers;

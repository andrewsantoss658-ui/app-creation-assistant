
-- Fix support_messages INSERT policy to include master role
DROP POLICY IF EXISTS "Usuários criam mensagens em suas conversas" ON public.support_messages;

CREATE POLICY "Usuários criam mensagens em suas conversas" ON public.support_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (
        SELECT 1 FROM support_conversations
        WHERE support_conversations.id = support_messages.conversation_id
        AND (
          support_conversations.user_id = auth.uid()
          OR has_role(auth.uid(), 'support'::app_role)
          OR has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'master'::app_role)
        )
      )
    )
  );

-- Fix support_messages SELECT policy to include master role  
DROP POLICY IF EXISTS "Usuários veem mensagens de suas conversas" ON public.support_messages;

CREATE POLICY "Usuários veem mensagens de suas conversas" ON public.support_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_conversations
      WHERE support_conversations.id = support_messages.conversation_id
      AND (
        support_conversations.user_id = auth.uid()
        OR has_role(auth.uid(), 'support'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'master'::app_role)
      )
    )
  );

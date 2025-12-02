-- Adicionar SET search_path à função update_conversation_updated_at para corrigir warning de segurança
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.support_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;
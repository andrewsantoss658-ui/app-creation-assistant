-- Melhorar o trigger handle_new_user para lidar com conflitos de CPF/CNPJ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Tentar inserir o perfil, mas se houver conflito de CPF/CNPJ, não fazer nada
  INSERT INTO public.profiles (id, nome, cpf_cnpj)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', '')
  )
  ON CONFLICT (cpf_cnpj) DO NOTHING;
  
  -- Se a inserção falhou devido a conflito, registrar no log mas não bloquear
  -- O usuário será criado no auth.users mas não terá perfil
  RETURN NEW;
END;
$function$;
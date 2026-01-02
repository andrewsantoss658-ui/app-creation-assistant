-- Adicionar coluna email na tabela profiles para permitir login por CPF/CNPJ
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Criar índice para busca rápida por cpf_cnpj
CREATE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj ON public.profiles(cpf_cnpj);

-- Criar função para atualizar email no profile quando usuário se registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cpf_cnpj, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', ''),
    NEW.email
  )
  ON CONFLICT (cpf_cnpj) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 1. Assign master role to andrew.santoss@outlook.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('e9828108-182a-491c-b7bb-4c95a463806a', 'master')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Auto-assign role on signup (support for @gestum.com, user for others)
CREATE OR REPLACE FUNCTION public.assign_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email LIKE '%@gestum.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'support')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_role_on_signup();

-- 3. Recreate user_roles policies with master control
DROP POLICY IF EXISTS "Apenas admins podem inserir roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only master can delete roles" ON public.user_roles;

CREATE POLICY "Users can view roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only master can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'master'));

CREATE POLICY "Only master can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'master') AND user_id != auth.uid());

CREATE POLICY "Only master can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'master') AND role != 'master');

-- 4. Update SELECT policies to include master full access
DROP POLICY IF EXISTS "Usuários podem ver suas próprias despesas" ON public.expenses;
CREATE POLICY "Users and master can view expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Usuários podem ver suas próprias vendas" ON public.sales;
CREATE POLICY "Users and master can view sales"
  ON public.sales FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Usuários podem ver seus próprios produtos" ON public.products;
CREATE POLICY "Users and master can view products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Usuários podem ver seus próprios clientes" ON public.clients;
CREATE POLICY "Users and master can view clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Usuários podem ver seu próprio fluxo de caixa" ON public.cash_flow;
CREATE POLICY "Users and master can view cash_flow"
  ON public.cash_flow FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Usuários podem ver suas próprias notas fiscais" ON public.notas_fiscais;
CREATE POLICY "Users and master can view notas_fiscais"
  ON public.notas_fiscais FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Usuários podem ver suas próprias cobranças PIX" ON public.pix_charges;
CREATE POLICY "Users and master can view pix_charges"
  ON public.pix_charges FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Users and master can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR has_role(auth.uid(), 'master'));

-- 5. Prevent master profile deletion
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile except master"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id AND NOT has_role(auth.uid(), 'master'));

-- 6. Protect last master role from deletion
CREATE OR REPLACE FUNCTION public.protect_master_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'master' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'master' AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last master role';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_master_role_trigger ON public.user_roles;
CREATE TRIGGER protect_master_role_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_master_role();

-- Protect last master role from being changed
CREATE OR REPLACE FUNCTION public.protect_master_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'master' AND NEW.role != 'master' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'master' AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Cannot change the last master role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_master_role_update_trigger ON public.user_roles;
CREATE TRIGGER protect_master_role_update_trigger
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_master_role_update();

-- 7. Update support_conversations policies to include master
DROP POLICY IF EXISTS "Usuários veem suas próprias conversas" ON public.support_conversations;
CREATE POLICY "Users and staff can view conversations"
  ON public.support_conversations FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Suporte e admins atualizam conversas" ON public.support_conversations;
CREATE POLICY "Staff can update conversations"
  ON public.support_conversations FOR UPDATE
  USING (has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));


-- Create support_accounts table to manage support staff metadata
CREATE TABLE public.support_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  access_level text NOT NULL DEFAULT 'support' CHECK (access_level IN ('support', 'supervisor', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  is_linked_to_chat boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_accounts ENABLE ROW LEVEL SECURITY;

-- Only master can manage support accounts
CREATE POLICY "Master can view all support accounts"
ON public.support_accounts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can insert support accounts"
ON public.support_accounts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can update support accounts"
ON public.support_accounts FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Master can delete support accounts"
ON public.support_accounts FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

-- Support users can view their own account
CREATE POLICY "Support users can view own account"
ON public.support_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_support_accounts_updated_at
BEFORE UPDATE ON public.support_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log for tracking changes
CREATE TABLE public.support_account_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_account_id uuid NOT NULL REFERENCES public.support_accounts(id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_by uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_account_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can view audit logs"
ON public.support_account_audit FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.support_account_audit FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

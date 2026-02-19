import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SupportAccount {
  id: string;
  user_id: string;
  email: string;
  access_level: string;
  is_active: boolean;
  is_linked_to_chat: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  support_account_id: string;
  action: string;
  changed_by: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

export const useSupportAccounts = () => {
  const [accounts, setAccounts] = useState<SupportAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_accounts" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts((data || []) as unknown as SupportAccount[]);
    } catch (error) {
      console.error("Erro ao buscar contas de suporte:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (email: string, accessLevel: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Find user_id by email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (profileError || !profile) throw new Error("Usuário não encontrado com este e-mail");

    const { error } = await supabase.from("support_accounts" as any).insert({
      user_id: profile.id,
      email,
      access_level: accessLevel,
      is_active: true,
      is_linked_to_chat: false,
      created_by: user.id,
    } as any);

    if (error) throw error;

    // Log audit
    await logAudit(null, "create", { email, access_level: accessLevel });
    await fetchAccounts();
  };

  const updateAccount = async (
    accountId: string,
    updates: Partial<Pick<SupportAccount, "access_level" | "is_active" | "is_linked_to_chat">>
  ) => {
    const oldAccount = accounts.find((a) => a.id === accountId);

    const { error } = await supabase
      .from("support_accounts" as any)
      .update(updates as any)
      .eq("id", accountId);

    if (error) throw error;

    await logAudit(accountId, "update", updates, oldAccount ? {
      access_level: oldAccount.access_level,
      is_active: oldAccount.is_active,
      is_linked_to_chat: oldAccount.is_linked_to_chat,
    } : null);
    await fetchAccounts();
  };

  const deleteAccount = async (accountId: string) => {
    const oldAccount = accounts.find((a) => a.id === accountId);
    
    await logAudit(accountId, "delete", null, oldAccount ? { email: oldAccount.email } : null);

    const { error } = await supabase
      .from("support_accounts" as any)
      .delete()
      .eq("id", accountId);

    if (error) throw error;
    await fetchAccounts();
  };

  const logAudit = async (
    accountId: string | null,
    action: string,
    newValues: any,
    oldValues?: any
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await (supabase.from("support_account_audit" as any) as any).insert({
        support_account_id: accountId || "00000000-0000-0000-0000-000000000000",
        action,
        changed_by: user.id,
        old_values: oldValues || null,
        new_values: newValues,
      });
    } catch (e) {
      console.error("Erro ao registrar auditoria:", e);
    }
  };

  return { accounts, loading, createAccount, updateAccount, deleteAccount, refetch: fetchAccounts };
};

export const useSupportAuditLog = (accountId?: string) => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAudit = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_account_audit" as any)
        .select("*")
        .eq("support_account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries((data || []) as unknown as AuditEntry[]);
    } catch (e) {
      console.error("Erro ao buscar auditoria:", e);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return { entries, loading };
};

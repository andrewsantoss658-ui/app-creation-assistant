/**
 * =============================================================================
 * ARQUIVO: useSupportAccounts.ts
 * =============================================================================
 *
 * PROPÓSITO GERAL:
 * Hooks React para gerenciar contas de suporte e auditoria no GESTUM.
 * As contas de suporte são perfis de atendentes vinculados ao sistema
 * de chat ao vivo. Inclui:
 *   - CRUD de contas de suporte
 *   - Log de auditoria (quem fez o quê e quando)
 *
 * SEGURANÇA:
 * Apenas usuários com role "master" podem criar, editar e excluir contas.
 * As contas são vinculadas a emails @gestum.com.
 *
 * =============================================================================
 */

// ==================== IMPORTAÇÕES ====================
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// SEÇÃO 1: INTERFACES
// =============================================================================

/**
 * Interface que define a estrutura de uma conta de suporte
 * @property id - Identificador único da conta (UUID)
 * @property user_id - UUID do usuário no sistema de autenticação
 * @property email - Email da conta (deve ser @gestum.com)
 * @property access_level - Nível de acesso: "support", "supervisor" ou "admin"
 * @property is_active - Se a conta está ativa (pode fazer login e atender)
 * @property is_linked_to_chat - Se a conta está vinculada ao chat ao vivo
 * @property created_by - UUID do admin que criou esta conta
 * @property created_at - Data/hora de criação
 * @property updated_at - Data/hora da última atualização
 */
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

/**
 * Interface que define a estrutura de uma entrada de auditoria
 * Registra todas as ações realizadas sobre contas de suporte
 * @property id - Identificador único do log
 * @property support_account_id - UUID da conta afetada
 * @property action - Tipo de ação: "create", "update" ou "delete"
 * @property changed_by - UUID do admin que realizou a ação
 * @property old_values - Valores anteriores à mudança (para updates)
 * @property new_values - Novos valores aplicados
 * @property created_at - Data/hora da ação
 */
export interface AuditEntry {
  id: string;
  support_account_id: string;
  action: string;
  changed_by: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

// =============================================================================
// SEÇÃO 2: HOOK - useSupportAccounts
// =============================================================================

/**
 * Hook: useSupportAccounts
 *
 * Gerencia o CRUD completo de contas de suporte com auditoria automática.
 * Cada ação (criar, editar, excluir) registra um log de auditoria.
 *
 * @returns {Object} Objeto contendo:
 *   - accounts: Lista de contas de suporte
 *   - loading: Indicador de carregamento
 *   - createAccount: Cria uma nova conta
 *   - updateAccount: Atualiza uma conta existente
 *   - deleteAccount: Exclui uma conta
 *   - refetch: Recarrega a lista manualmente
 */
export const useSupportAccounts = () => {
  // Lista de contas de suporte
  const [accounts, setAccounts] = useState<SupportAccount[]>([]);
  // Indicador de carregamento
  const [loading, setLoading] = useState(true);

  /**
   * Busca todas as contas de suporte do banco de dados
   * useCallback garante que a referência da função seja estável
   * para evitar re-renders desnecessários
   */
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_accounts")
        .select("*")
        .order("created_at", { ascending: false }); // Mais recente primeiro

      if (error) throw error;
      // Cast necessário pois o tipo do Supabase pode divergir da interface local
      setAccounts((data || []) as unknown as SupportAccount[]);
    } catch (error) {
      console.error("Erro ao buscar contas de suporte:", error);
      // Garante array vazio em caso de erro para evitar crash na UI
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega as contas ao montar o componente
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  /**
   * Cria uma nova conta de suporte
   *
   * FLUXO:
   * 1. Busca o perfil do usuário pelo email na tabela profiles
   * 2. Se encontrado, cria a conta de suporte vinculada ao user_id
   * 3. Registra a ação no log de auditoria
   * 4. Recarrega a lista de contas
   *
   * @param email - Email do novo atendente (deve ser @gestum.com)
   * @param accessLevel - Nível de acesso: "support", "supervisor" ou "admin"
   * @throws Error se o usuário não for encontrado ou não estiver autenticado
   */
  const createAccount = async (email: string, accessLevel: string) => {
    // Obtém o admin autenticado que está criando a conta
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Busca o perfil do novo atendente pelo email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (profileError || !profile) throw new Error("Usuário não encontrado com este e-mail");

    // Insere a nova conta de suporte
    const { error } = await supabase.from("support_accounts").insert({
      user_id: profile.id,
      email,
      access_level: accessLevel,
      is_active: true,                // Conta começa ativa por padrão
      is_linked_to_chat: false,       // Não vinculada ao chat por padrão
      created_by: user.id,
    } as any);

    if (error) throw error;

    // Registra a criação no log de auditoria
    await logAudit(null, "create", { email, access_level: accessLevel });
    // Recarrega a lista
    await fetchAccounts();
  };

  /**
   * Atualiza uma conta de suporte existente
   *
   * @param accountId - UUID da conta a ser atualizada
   * @param updates - Campos a serem atualizados (access_level, is_active, is_linked_to_chat)
   */
  const updateAccount = async (
    accountId: string,
    updates: Partial<Pick<SupportAccount, "access_level" | "is_active" | "is_linked_to_chat">>
  ) => {
    // Guarda os valores antigos para o log de auditoria
    const oldAccount = accounts.find((a) => a.id === accountId);

    // Aplica a atualização no banco
    const { error } = await supabase
      .from("support_accounts")
      .update(updates as any)
      .eq("id", accountId);

    if (error) throw error;

    // Registra no log com valores antigos e novos
    await logAudit(accountId, "update", updates, oldAccount ? {
      access_level: oldAccount.access_level,
      is_active: oldAccount.is_active,
      is_linked_to_chat: oldAccount.is_linked_to_chat,
    } : null);

    await fetchAccounts();
  };

  /**
   * Exclui uma conta de suporte
   * ATENÇÃO: Ação irreversível. Registra auditoria ANTES da exclusão.
   *
   * @param accountId - UUID da conta a ser excluída
   */
  const deleteAccount = async (accountId: string) => {
    const oldAccount = accounts.find((a) => a.id === accountId);
    // Registra a auditoria antes de excluir (senão perdemos a referência)
    await logAudit(accountId, "delete", null, oldAccount ? { email: oldAccount.email } : null);

    const { error } = await supabase
      .from("support_accounts")
      .delete()
      .eq("id", accountId);

    if (error) throw error;
    await fetchAccounts();
  };

  /**
   * Registra uma ação no log de auditoria
   * Função interna usada por createAccount, updateAccount e deleteAccount
   *
   * @param accountId - UUID da conta afetada (null para criação)
   * @param action - Tipo de ação: "create", "update" ou "delete"
   * @param newValues - Novos valores aplicados
   * @param oldValues - Valores anteriores (para updates e deletes)
   */
  const logAudit = async (accountId: string | null, action: string, newValues: any, oldValues?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await (supabase.from("support_account_audit") as any).insert({
        // Usa UUID zerado como placeholder quando accountId é null (criação)
        support_account_id: accountId || "00000000-0000-0000-0000-000000000000",
        action,
        changed_by: user.id,
        old_values: oldValues || null,
        new_values: newValues,
      });
    } catch (e) {
      // Erro de auditoria não deve impedir a operação principal
      console.error("Erro ao registrar auditoria:", e);
    }
  };

  return { accounts, loading, createAccount, updateAccount, deleteAccount, refetch: fetchAccounts };
};

// =============================================================================
// SEÇÃO 3: HOOK - useSupportAuditLog
// =============================================================================

/**
 * Hook: useSupportAuditLog
 *
 * Carrega o histórico de auditoria de uma conta de suporte específica.
 * Exibe quem fez o quê e quando em cada conta.
 *
 * @param accountId - UUID da conta de suporte (undefined = não carrega)
 * @returns {Object} Objeto contendo:
 *   - entries: Lista de entradas de auditoria (máx. 50)
 *   - loading: Indicador de carregamento
 */
export const useSupportAuditLog = (accountId?: string) => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Busca o histórico de auditoria da conta selecionada
   * Limitado a 50 registros mais recentes para performance
   */
  const fetchAudit = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_account_audit")
        .select("*")
        .eq("support_account_id", accountId)
        .order("created_at", { ascending: false })  // Mais recente primeiro
        .limit(50);                                  // Máximo 50 registros

      if (error) throw error;
      setEntries((data || []) as unknown as AuditEntry[]);
    } catch (e) {
      console.error("Erro ao buscar auditoria:", e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Recarrega quando a conta selecionada muda
  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  return { entries, loading };
};

/**
 * =============================================================================
 * RESUMO DO FLUXO COMPLETO
 * =============================================================================
 *
 * 1. Admin Master acessa "Gestão de Suporte" → useSupportAccounts carrega contas
 * 2. Admin cria conta com email @gestum.com → createAccount():
 *    a. Busca o user_id pela tabela profiles
 *    b. Insere em support_accounts
 *    c. Registra em support_account_audit
 * 3. Admin ativa/desativa conta ou vincula ao chat → updateAccount()
 * 4. Admin visualiza histórico → useSupportAuditLog carrega logs
 * 5. Admin exclui conta → deleteAccount() registra auditoria antes de excluir
 *
 * =============================================================================
 */

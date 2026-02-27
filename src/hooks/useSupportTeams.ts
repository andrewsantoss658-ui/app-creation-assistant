/**
 * =============================================================================
 * ARQUIVO: useSupportTeams.ts
 * =============================================================================
 *
 * PROPÓSITO GERAL:
 * Hooks React para gerenciar equipes de suporte e seus membros no GESTUM.
 * Permite criar equipes especializadas (ex: Financeiro, Técnico) e
 * adicionar atendentes como membros dessas equipes.
 *
 * Contém dois hooks:
 *   - useSupportTeams: CRUD de equipes
 *   - useTeamMembers: CRUD de membros dentro de uma equipe
 *
 * =============================================================================
 */

// ==================== IMPORTAÇÕES ====================
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// SEÇÃO 1: INTERFACES
// =============================================================================

/**
 * Interface que define a estrutura de uma equipe de suporte
 * @property id - Identificador único da equipe (UUID)
 * @property name - Nome da equipe (ex: "Financeiro", "Técnico")
 * @property description - Descrição opcional da equipe
 * @property created_by - UUID do usuário que criou a equipe
 * @property created_at - Data/hora de criação
 * @property updated_at - Data/hora da última atualização
 */
export interface SupportTeam {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface que define a estrutura de um membro de equipe
 * @property id - Identificador único da associação membro-equipe
 * @property team_id - UUID da equipe à qual o membro pertence
 * @property user_id - UUID do usuário (atendente) que é membro
 * @property role - Função do membro na equipe: "member", "supervisor" ou "lead"
 * @property created_at - Data/hora em que foi adicionado à equipe
 */
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

// =============================================================================
// SEÇÃO 2: HOOK - useSupportTeams
// =============================================================================

/**
 * Hook: useSupportTeams
 *
 * Gerencia o CRUD completo de equipes de suporte.
 * Apenas usuários com role "master" podem criar, editar e excluir equipes.
 *
 * @returns {Object} Objeto contendo:
 *   - teams: Lista de equipes ordenadas por nome
 *   - loading: Indicador de carregamento
 *   - createTeam: Cria uma nova equipe
 *   - updateTeam: Atualiza nome/descrição de uma equipe
 *   - deleteTeam: Exclui uma equipe
 *   - refetch: Recarrega a lista manualmente
 */
export const useSupportTeams = () => {
  // Lista de equipes carregadas do banco
  const [teams, setTeams] = useState<SupportTeam[]>([]);
  // Indicador de carregamento inicial
  const [loading, setLoading] = useState(true);

  // Carrega as equipes ao montar o componente
  useEffect(() => { fetchTeams(); }, []);

  /**
   * Busca todas as equipes de suporte do banco de dados
   * Ordenadas alfabeticamente pelo nome
   */
  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("support_teams")
        .select("*")
        .order("name");    // Ordem alfabética A-Z

      if (error) throw error;
      setTeams(data || []);
    } catch (e) {
      console.error("Erro ao buscar equipes:", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria uma nova equipe de suporte
   * @param name - Nome da equipe (obrigatório)
   * @param description - Descrição da equipe (opcional)
   * @throws Error se o usuário não estiver autenticado
   */
  const createTeam = async (name: string, description?: string) => {
    // Obtém o usuário autenticado para registrar o criador
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("support_teams")
      .insert({
        name,
        description: description || null,  // Converte string vazia para null
        created_by: user.id
      });

    if (error) throw error;
    // Recarrega para incluir a nova equipe na lista
    await fetchTeams();
  };

  /**
   * Atualiza os dados de uma equipe existente
   * @param id - UUID da equipe a ser atualizada
   * @param updates - Campos a serem atualizados (nome e/ou descrição)
   */
  const updateTeam = async (id: string, updates: Partial<Pick<SupportTeam, "name" | "description">>) => {
    const { error } = await supabase
      .from("support_teams")
      .update({
        ...updates,
        updated_at: new Date().toISOString()  // Atualiza o timestamp de modificação
      })
      .eq("id", id);

    if (error) throw error;
    await fetchTeams();
  };

  /**
   * Exclui uma equipe de suporte
   * ATENÇÃO: Também remove todos os membros associados (cascade no banco)
   * @param id - UUID da equipe a ser excluída
   */
  const deleteTeam = async (id: string) => {
    const { error } = await supabase
      .from("support_teams")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchTeams();
  };

  return { teams, loading, createTeam, updateTeam, deleteTeam, refetch: fetchTeams };
};

// =============================================================================
// SEÇÃO 3: HOOK - useTeamMembers
// =============================================================================

/**
 * Hook: useTeamMembers
 *
 * Gerencia os membros de uma equipe de suporte específica.
 * Permite listar, adicionar, atualizar função e remover membros.
 *
 * @param teamId - UUID da equipe selecionada (undefined = nenhuma)
 * @returns {Object} Objeto contendo:
 *   - members: Lista de membros da equipe
 *   - loading: Indicador de carregamento
 *   - addMember: Adiciona um membro à equipe
 *   - updateMemberRole: Atualiza a função de um membro
 *   - removeMember: Remove um membro da equipe
 *   - refetch: Recarrega a lista de membros
 */
export const useTeamMembers = (teamId?: string) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se nenhuma equipe está selecionada, limpa a lista
    if (!teamId) { setMembers([]); setLoading(false); return; }
    fetchMembers();
  }, [teamId]); // Re-executa quando a equipe selecionada muda

  /**
   * Busca todos os membros de uma equipe específica
   */
  const fetchMembers = async () => {
    if (!teamId) return;
    try {
      const { data, error } = await supabase
        .from("support_team_members")
        .select("*")
        .eq("team_id", teamId);    // Filtra pela equipe selecionada

      if (error) throw error;
      setMembers(data || []);
    } catch (e) {
      console.error("Erro ao buscar membros:", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Adiciona um novo membro à equipe
   * @param userId - UUID do usuário (atendente) a ser adicionado
   * @param role - Função na equipe: "member" (padrão), "supervisor" ou "lead"
   */
  const addMember = async (userId: string, role: string = "member") => {
    if (!teamId) return;
    const { error } = await supabase
      .from("support_team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
        role
      });

    if (error) throw error;
    await fetchMembers();
  };

  /**
   * Atualiza a função/papel de um membro na equipe
   * @param memberId - UUID do registro de membro (não do usuário)
   * @param role - Nova função: "member", "supervisor" ou "lead"
   */
  const updateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase
      .from("support_team_members")
      .update({ role })
      .eq("id", memberId);

    if (error) throw error;
    await fetchMembers();
  };

  /**
   * Remove um membro da equipe
   * @param memberId - UUID do registro de membro a ser removido
   */
  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("support_team_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;
    await fetchMembers();
  };

  return { members, loading, addMember, updateMemberRole, removeMember, refetch: fetchMembers };
};

/**
 * =============================================================================
 * RESUMO DO FLUXO COMPLETO
 * =============================================================================
 *
 * 1. Admin acessa a página de Equipes → useSupportTeams carrega a lista
 * 2. Admin cria nova equipe → createTeam() insere e recarrega
 * 3. Admin seleciona uma equipe → teamId é passado para useTeamMembers
 * 4. useTeamMembers carrega os membros da equipe selecionada
 * 5. Admin adiciona/remove membros → addMember()/removeMember()
 * 6. As conversas podem ser transferidas para equipes via useChatTransfers
 *
 * =============================================================================
 */

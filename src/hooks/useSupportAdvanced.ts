/**
 * =============================================================================
 * ARQUIVO: useSupportAdvanced.ts
 * =============================================================================
 *
 * PROPÓSITO GERAL:
 * Este arquivo contém hooks React avançados para o sistema de suporte ao vivo
 * do GESTUM. Ele gerencia funcionalidades como:
 *   - Tags de atendimento (etiquetas para categorizar conversas)
 *   - Notas internas (mensagens visíveis apenas para a equipe de suporte)
 *   - Transferências de chat (redirecionar conversas entre atendentes/equipes)
 *   - Mensagens de boas-vindas (mensagens automáticas para novos chats)
 *   - Métricas de suporte (KPIs e indicadores de desempenho)
 *
 * FLUXO COMPLETO:
 * 1. Os hooks são importados pelas páginas de administração do suporte
 * 2. Cada hook se conecta ao banco de dados via Supabase
 * 3. Os dados são carregados na montagem do componente (useEffect)
 * 4. Funções de criação/edição/exclusão fazem mutations e recarregam os dados
 * 5. Alguns hooks (como useInternalNotes) usam Realtime para atualizações em tempo real
 *
 * =============================================================================
 */

// ==================== IMPORTAÇÕES ====================
import { useState, useEffect } from "react";
// Cliente do Supabase para comunicação com o banco de dados
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// SEÇÃO 1: TAGS DE SUPORTE
// =============================================================================
// Tags são etiquetas coloridas que podem ser aplicadas às conversas
// para categorizá-las (ex: "urgente", "financeiro", "técnico")

/**
 * Interface que define a estrutura de uma tag de suporte
 * @property id - Identificador único da tag (UUID)
 * @property name - Nome exibido da tag (ex: "urgente")
 * @property color - Cor hexadecimal da tag (ex: "#ef4444")
 * @property created_by - UUID do usuário que criou a tag
 * @property created_at - Data/hora de criação em formato ISO
 */
export interface SupportTag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

/**
 * Interface que representa a associação entre uma conversa e uma tag
 * Uma conversa pode ter múltiplas tags e uma tag pode estar em várias conversas
 * @property id - Identificador único da associação
 * @property conversation_id - UUID da conversa vinculada
 * @property tag_id - UUID da tag vinculada
 * @property created_by - UUID do usuário que adicionou a tag à conversa
 * @property created_at - Data/hora em que a tag foi adicionada
 */
export interface ConversationTag {
  id: string;
  conversation_id: string;
  tag_id: string;
  created_by: string;
  created_at: string;
}

/**
 * Hook: useSupportTags
 *
 * Gerencia todas as tags de suporte disponíveis no sistema.
 * Permite listar, criar e excluir tags.
 *
 * @returns {Object} Objeto contendo:
 *   - tags: Lista de todas as tags cadastradas
 *   - loading: Se os dados ainda estão sendo carregados
 *   - createTag: Função para criar uma nova tag
 *   - deleteTag: Função para excluir uma tag existente
 *   - refetch: Função para recarregar a lista de tags manualmente
 */
export const useSupportTags = () => {
  // Estado que armazena a lista de tags carregadas do banco
  const [tags, setTags] = useState<SupportTag[]>([]);
  // Indicador de carregamento para exibir skeleton/spinner na UI
  const [loading, setLoading] = useState(true);

  // Carrega as tags automaticamente quando o componente monta
  useEffect(() => { fetchTags(); }, []);

  /**
   * Busca todas as tags de suporte do banco de dados
   * Ordena alfabeticamente pelo nome
   */
  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tags")    // Tabela de tags
        .select("*")             // Seleciona todos os campos
        .order("name");          // Ordena por nome A-Z

      if (error) throw error;
      // Define as tags no estado; se data for null, usa array vazio
      setTags(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      // Marca o carregamento como concluído, independente de sucesso ou erro
      setLoading(false);
    }
  };

  /**
   * Cria uma nova tag de suporte no banco de dados
   * @param name - Nome da tag (ex: "urgente")
   * @param color - Cor hexadecimal (ex: "#ef4444")
   * @throws Error se o usuário não estiver autenticado
   */
  const createTag = async (name: string, color: string) => {
    // Obtém o usuário autenticado atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Insere a nova tag vinculada ao usuário criador
    const { error } = await supabase
      .from("support_tags")
      .insert({ name, color, created_by: user.id });

    if (error) throw error;
    // Recarrega a lista para incluir a nova tag
    await fetchTags();
  };

  /**
   * Exclui uma tag de suporte do banco de dados
   * @param id - UUID da tag a ser excluída
   */
  const deleteTag = async (id: string) => {
    const { error } = await supabase
      .from("support_tags")
      .delete()
      .eq("id", id);      // Filtra pelo ID específico

    if (error) throw error;
    // Recarrega a lista sem a tag excluída
    await fetchTags();
  };

  // Retorna os dados e funções para uso nos componentes
  return { tags, loading, createTag, deleteTag, refetch: fetchTags };
};

/**
 * Hook: useConversationTags
 *
 * Gerencia as tags associadas a uma conversa específica.
 * Permite listar, adicionar e remover tags de uma conversa.
 *
 * @param conversationId - UUID da conversa (ou null se nenhuma selecionada)
 * @returns {Object} Objeto contendo:
 *   - conversationTags: Tags associadas à conversa selecionada
 *   - addTag: Função para adicionar uma tag à conversa
 *   - removeTag: Função para remover uma tag da conversa
 *   - refetch: Função para recarregar as tags manualmente
 */
export const useConversationTags = (conversationId: string | null) => {
  // Tags associadas à conversa atual
  const [conversationTags, setConversationTags] = useState<ConversationTag[]>([]);

  // Recarrega quando a conversa selecionada muda
  useEffect(() => {
    // Se não há conversa selecionada, limpa as tags
    if (!conversationId) { setConversationTags([]); return; }
    fetchConversationTags();
  }, [conversationId]);

  /**
   * Busca as tags associadas à conversa selecionada
   */
  const fetchConversationTags = async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
        .from("conversation_tags")
        .select("*")
        .eq("conversation_id", conversationId); // Filtra pela conversa atual

      if (error) throw error;
      setConversationTags(data || []);
    } catch (e) {
      console.error(e);
      // Em caso de erro, garante que o estado não fica com dados obsoletos
      setConversationTags([]);
    }
  };

  /**
   * Adiciona uma tag a uma conversa
   * @param tagId - UUID da tag a ser adicionada
   */
  const addTag = async (tagId: string) => {
    if (!conversationId) return;
    // Identifica o usuário que está adicionando a tag
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insere a associação entre conversa e tag
    await supabase.from("conversation_tags").insert({
      conversation_id: conversationId,
      tag_id: tagId,
      created_by: user.id
    });
    // Recarrega para refletir a mudança
    await fetchConversationTags();
  };

  /**
   * Remove uma tag de uma conversa
   * @param tagId - UUID da tag a ser removida
   */
  const removeTag = async (tagId: string) => {
    if (!conversationId) return;
    // Exclui a associação usando dois filtros: conversa + tag
    await supabase
      .from("conversation_tags")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("tag_id", tagId);

    await fetchConversationTags();
  };

  return { conversationTags, addTag, removeTag, refetch: fetchConversationTags };
};

// =============================================================================
// SEÇÃO 2: NOTAS INTERNAS
// =============================================================================
// Notas internas são mensagens entre membros da equipe de suporte
// que NÃO são visíveis para o cliente. Úteis para contexto e orientações.

/**
 * Interface que define a estrutura de uma nota interna
 * @property id - Identificador único da nota
 * @property conversation_id - UUID da conversa relacionada
 * @property sender_id - UUID do atendente que enviou a nota
 * @property message - Conteúdo textual da nota
 * @property mentioned_users - Array de UUIDs de usuários mencionados na nota
 * @property created_at - Data/hora de criação
 */
export interface InternalNote {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  mentioned_users: string[];
  created_at: string;
}

/**
 * Hook: useInternalNotes
 *
 * Gerencia notas internas de uma conversa de suporte.
 * Inclui suporte a Realtime para receber novas notas instantaneamente.
 *
 * @param conversationId - UUID da conversa (ou null se nenhuma selecionada)
 * @returns {Object} Objeto contendo:
 *   - notes: Lista de notas internas da conversa
 *   - loading: Indicador de carregamento
 *   - sendNote: Função para enviar uma nova nota interna
 */
export const useInternalNotes = (conversationId: string | null) => {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se não há conversa selecionada, limpa o estado
    if (!conversationId) { setNotes([]); return; }
    // Carrega as notas existentes
    fetchNotes();

    // ---- REALTIME: Inscreve-se para receber novas notas em tempo real ----
    // Quando outro atendente envia uma nota, ela aparece automaticamente
    const channel = supabase
      .channel(`internal-notes-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',                                    // Escuta apenas inserções
        schema: 'public',
        table: 'support_internal_notes',
        filter: `conversation_id=eq.${conversationId}`       // Filtra pela conversa
      },
        // Quando recebe uma nova nota, adiciona ao final da lista
        (payload) => setNotes(prev => [...prev, payload.new as InternalNote])
      ).subscribe();

    // Cleanup: remove o canal quando o componente desmonta ou a conversa muda
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  /**
   * Busca todas as notas internas de uma conversa, ordenadas cronologicamente
   */
  const fetchNotes = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_internal_notes")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }); // Ordem cronológica

      if (error) throw error;
      setNotes(data || []);
    } catch (e) {
      console.error(e);
      setNotes([]); // Limpa em caso de erro para evitar dados obsoletos
    }
    setLoading(false);
  };

  /**
   * Envia uma nova nota interna na conversa
   * @param message - Texto da nota
   * @param mentionedUsers - Array de UUIDs de usuários mencionados (opcional)
   * @throws Error se o usuário não estiver autenticado
   */
  const sendNote = async (message: string, mentionedUsers: string[] = []) => {
    if (!conversationId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase.from("support_internal_notes").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message,
      mentioned_users: mentionedUsers
    });
    if (error) throw error;
    // Nota: não precisa chamar fetchNotes() aqui pois o Realtime já atualiza
  };

  return { notes, loading, sendNote };
};

// =============================================================================
// SEÇÃO 3: TRANSFERÊNCIAS DE CHAT
// =============================================================================
// Transferências permitem redirecionar uma conversa de um atendente para
// outro atendente ou para uma equipe diferente.

/**
 * Interface que define a estrutura de uma transferência de chat
 * @property id - Identificador único da transferência
 * @property conversation_id - UUID da conversa transferida
 * @property from_user_id - UUID do atendente que realizou a transferência
 * @property to_user_id - UUID do atendente de destino (ou null se for para equipe)
 * @property to_team_id - UUID da equipe de destino (ou null se for para usuário)
 * @property reason - Motivo da transferência (opcional)
 * @property created_at - Data/hora da transferência
 */
export interface ChatTransfer {
  id: string;
  conversation_id: string;
  from_user_id: string;
  to_user_id: string | null;
  to_team_id: string | null;
  reason: string | null;
  created_at: string;
}

/**
 * Hook: useChatTransfers
 *
 * Gerencia as transferências de uma conversa de suporte.
 * Permite listar o histórico e realizar novas transferências.
 *
 * @param conversationId - UUID da conversa (ou null se nenhuma selecionada)
 * @returns {Object} Objeto contendo:
 *   - transfers: Histórico de transferências da conversa
 *   - transferChat: Função para realizar uma nova transferência
 *   - refetch: Função para recarregar o histórico
 */
export const useChatTransfers = (conversationId: string | null) => {
  const [transfers, setTransfers] = useState<ChatTransfer[]>([]);

  useEffect(() => {
    if (!conversationId) { setTransfers([]); return; }
    fetchTransfers();
  }, [conversationId]);

  /**
   * Busca o histórico de transferências da conversa
   * Ordenado do mais recente para o mais antigo
   */
  const fetchTransfers = async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
        .from("chat_transfers")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false }); // Mais recente primeiro

      if (error) throw error;
      setTransfers(data || []);
    } catch (e) {
      console.error(e);
      setTransfers([]);
    }
  };

  /**
   * Realiza a transferência de um chat para outro atendente ou equipe
   *
   * @param toUserId - UUID do atendente de destino (null se for para equipe)
   * @param toTeamId - UUID da equipe de destino (null se for para atendente)
   * @param reason - Motivo da transferência (opcional)
   * @throws Error se o usuário não estiver autenticado
   *
   * Fluxo:
   * 1. Registra a transferência na tabela chat_transfers
   * 2. Atualiza a conversa com o novo responsável (assigned_to e/ou team_id)
   * 3. Recarrega o histórico de transferências
   */
  const transferChat = async (toUserId: string | null, toTeamId: string | null, reason?: string) => {
    if (!conversationId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Passo 1: Registra a transferência no histórico
    const { error } = await supabase.from("chat_transfers").insert({
      conversation_id: conversationId,
      from_user_id: user.id,    // Quem está transferindo
      to_user_id: toUserId,      // Para quem vai
      to_team_id: toTeamId,      // Para qual equipe vai
      reason                     // Motivo informado
    });
    if (error) throw error;

    // Passo 2: Atualiza a conversa com o novo responsável
    const updates: Record<string, string> = {};
    if (toUserId) updates.assigned_to = toUserId;   // Atribui ao novo atendente
    if (toTeamId) updates.team_id = toTeamId;       // Atribui à nova equipe

    await supabase
      .from("support_conversations")
      .update(updates)
      .eq("id", conversationId);

    // Passo 3: Recarrega o histórico
    await fetchTransfers();
  };

  return { transfers, transferChat, refetch: fetchTransfers };
};

// =============================================================================
// SEÇÃO 4: MENSAGENS DE BOAS-VINDAS
// =============================================================================
// Mensagens automáticas exibidas quando um novo chat é iniciado.
// Podem ser configuradas por equipe e horário de funcionamento.

/**
 * Interface que define a estrutura de uma mensagem de boas-vindas
 * @property id - Identificador único
 * @property team_id - UUID da equipe associada (null = todas as equipes)
 * @property message - Texto da mensagem. Suporta {{nome}} como placeholder
 * @property is_active - Se a mensagem está ativa ou desativada
 * @property schedule_start - Horário de início (HH:mm) ou null para sempre
 * @property schedule_end - Horário de fim (HH:mm) ou null para sempre
 * @property created_by - UUID do criador
 * @property created_at - Data/hora de criação
 * @property updated_at - Data/hora da última atualização
 */
export interface WelcomeMessage {
  id: string;
  team_id: string | null;
  message: string;
  is_active: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook: useWelcomeMessages
 *
 * Gerencia as mensagens de boas-vindas do chat de suporte.
 * Permite criar, editar, ativar/desativar e excluir mensagens.
 *
 * @returns {Object} Objeto contendo:
 *   - messages: Lista de mensagens de boas-vindas
 *   - loading: Indicador de carregamento
 *   - createMessage: Cria uma nova mensagem
 *   - updateMessage: Atualiza uma mensagem existente
 *   - deleteMessage: Exclui uma mensagem
 *   - refetch: Recarrega a lista
 */
export const useWelcomeMessages = () => {
  const [messages, setMessages] = useState<WelcomeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMessages(); }, []);

  /**
   * Busca todas as mensagens de boas-vindas
   * Ordenadas da mais recente para a mais antiga
   */
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("support_welcome_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria uma nova mensagem de boas-vindas
   * @param msg - Objeto com os dados da mensagem
   * @param msg.message - Texto da mensagem (obrigatório)
   * @param msg.team_id - UUID da equipe (opcional, null = todas)
   * @param msg.schedule_start - Horário de início (opcional)
   * @param msg.schedule_end - Horário de fim (opcional)
   */
  const createMessage = async (msg: {
    message: string;
    team_id?: string | null;
    schedule_start?: string | null;
    schedule_end?: string | null;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("support_welcome_messages")
      .insert({ ...msg, created_by: user.id });

    if (error) throw error;
    await fetchMessages();
  };

  /**
   * Atualiza uma mensagem de boas-vindas existente
   * @param id - UUID da mensagem a ser atualizada
   * @param updates - Campos a serem atualizados (parcial)
   */
  const updateMessage = async (id: string, updates: Partial<WelcomeMessage>) => {
    const { error } = await supabase
      .from("support_welcome_messages")
      .update({ ...updates, updated_at: new Date().toISOString() }) // Atualiza o timestamp
      .eq("id", id);

    if (error) throw error;
    await fetchMessages();
  };

  /**
   * Exclui uma mensagem de boas-vindas
   * @param id - UUID da mensagem a ser excluída
   */
  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from("support_welcome_messages")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchMessages();
  };

  return { messages, loading, createMessage, updateMessage, deleteMessage, refetch: fetchMessages };
};

// =============================================================================
// SEÇÃO 5: MÉTRICAS DE SUPORTE
// =============================================================================
// Calcula KPIs e indicadores de desempenho do suporte:
// total de conversas, tempo médio de resposta, taxa de transferência, etc.

/**
 * Interface que define a estrutura das métricas de suporte
 * @property totalConversations - Número total de conversas registradas
 * @property openConversations - Número de conversas com status "open"
 * @property avgFirstResponseMinutes - Tempo médio até a primeira resposta (minutos)
 * @property avgResolutionMinutes - Tempo médio de resolução total (minutos)
 * @property chatsByAgent - Conversas agrupadas por atendente
 * @property chatsByTeam - Conversas agrupadas por equipe
 * @property transferRate - Taxa de transferência em porcentagem
 * @property chatsByTag - Conversas agrupadas por tag
 */
export interface SupportMetrics {
  totalConversations: number;
  openConversations: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  chatsByAgent: { userId: string; count: number }[];
  chatsByTeam: { teamId: string; teamName: string; count: number }[];
  transferRate: number;
  chatsByTag: { tagName: string; tagColor: string; count: number }[];
}

/**
 * Hook: useSupportMetrics
 *
 * Calcula métricas e KPIs do suporte a partir dos dados do banco.
 * Executa múltiplas queries para agregar informações de diferentes tabelas.
 *
 * @returns {Object} Objeto contendo:
 *   - metrics: Objeto com todas as métricas calculadas (ou null se carregando)
 *   - loading: Indicador de carregamento
 *   - refetch: Função para recalcular as métricas
 *
 * FLUXO DE CÁLCULO:
 * 1. Busca todas as conversas de suporte
 * 2. Calcula total e abertas
 * 3. Calcula tempo médio de primeira resposta (first_response_at - created_at)
 * 4. Calcula tempo médio de resolução (closed_at - created_at)
 * 5. Agrupa conversas por atendente (assigned_to)
 * 6. Agrupa conversas por equipe (team_id) com nome
 * 7. Calcula taxa de transferência (transferências / total × 100)
 * 8. Agrupa por tags utilizadas
 */
export const useSupportMetrics = () => {
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    try {
      // ---- Passo 1: Buscar todas as conversas ----
      const { data: conversations } = await supabase
        .from("support_conversations")
        .select("*");
      const convos = conversations || [];

      // ---- Passo 2: Contagens básicas ----
      const total = convos.length;
      const open = convos.filter(c => c.status === "open").length;

      // ---- Passo 3: Tempo médio de primeira resposta ----
      // Filtra apenas conversas que possuem first_response_at preenchido
      const withFirstResponse = convos.filter(c => c.first_response_at && c.created_at);
      const avgFirst = withFirstResponse.length > 0
        ? withFirstResponse.reduce((sum, c) => {
            // Calcula a diferença em milissegundos entre primeira resposta e criação
            return sum + (new Date(c.first_response_at!).getTime() - new Date(c.created_at!).getTime());
          }, 0) / withFirstResponse.length / 60000  // Converte ms para minutos
        : 0;

      // ---- Passo 4: Tempo médio de resolução ----
      // Filtra conversas que foram fechadas (possuem closed_at)
      const closed = convos.filter(c => c.closed_at && c.created_at);
      const avgRes = closed.length > 0
        ? closed.reduce((sum, c) => {
            return sum + (new Date(c.closed_at!).getTime() - new Date(c.created_at!).getTime());
          }, 0) / closed.length / 60000
        : 0;

      // ---- Passo 5: Conversas por atendente ----
      // Usa um Map para contar quantas conversas cada atendente possui
      const agentMap = new Map<string, number>();
      convos.forEach(c => {
        if (c.assigned_to) {
          agentMap.set(c.assigned_to, (agentMap.get(c.assigned_to) || 0) + 1);
        }
      });
      const chatsByAgent = Array.from(agentMap.entries()).map(([userId, count]) => ({
        userId,
        count
      }));

      // ---- Passo 6: Conversas por equipe ----
      // Busca os nomes das equipes para exibição
      const { data: teams } = await supabase
        .from("support_teams")
        .select("id, name");

      const teamMap = new Map<string, number>();
      convos.forEach(c => {
        if (c.team_id) {
          teamMap.set(c.team_id, (teamMap.get(c.team_id) || 0) + 1);
        }
      });
      const chatsByTeam = Array.from(teamMap.entries()).map(([teamId, count]) => {
        // Encontra o nome da equipe pelo ID
        const team = (teams || []).find(t => t.id === teamId);
        return { teamId, teamName: team?.name || "Desconhecido", count };
      });

      // ---- Passo 7: Taxa de transferência ----
      // Porcentagem de conversas que foram transferidas pelo menos uma vez
      const { data: transfersData } = await supabase
        .from("chat_transfers")
        .select("id");
      const transferRate = total > 0
        ? ((transfersData || []).length / total) * 100
        : 0;

      // ---- Passo 8: Conversas por tag ----
      // Busca todas as associações conversa-tag e conta por tag
      const { data: convTags } = await supabase
        .from("conversation_tags")
        .select("tag_id");
      const { data: allTags } = await supabase
        .from("support_tags")
        .select("id, name, color");

      const tagCountMap = new Map<string, number>();
      (convTags || []).forEach(ct => {
        tagCountMap.set(ct.tag_id, (tagCountMap.get(ct.tag_id) || 0) + 1);
      });
      const chatsByTag = Array.from(tagCountMap.entries()).map(([tagId, count]) => {
        const tag = (allTags || []).find(t => t.id === tagId);
        return {
          tagName: tag?.name || "?",
          tagColor: tag?.color || "#6366f1",
          count
        };
      });

      // ---- Monta o objeto final de métricas ----
      setMetrics({
        totalConversations: total,
        openConversations: open,
        avgFirstResponseMinutes: Math.round(avgFirst),     // Arredonda para inteiro
        avgResolutionMinutes: Math.round(avgRes),
        chatsByAgent,
        chatsByTeam,
        transferRate: Math.round(transferRate * 10) / 10,  // Uma casa decimal
        chatsByTag,
      });
    } catch (e) {
      console.error("Erro ao buscar métricas:", e);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, refetch: fetchMetrics };
};

/**
 * =============================================================================
 * RESUMO DO FLUXO COMPLETO
 * =============================================================================
 *
 * 1. useSupportTags → Gerencia etiquetas globais de categorização
 * 2. useConversationTags → Associa/desassocia tags a conversas específicas
 * 3. useInternalNotes → Chat interno da equipe com Realtime
 * 4. useChatTransfers → Transfere conversas entre atendentes/equipes
 * 5. useWelcomeMessages → Configura mensagens automáticas de boas-vindas
 * 6. useSupportMetrics → Calcula KPIs e indicadores de desempenho
 *
 * Todos os hooks seguem o padrão:
 *   - useState para gerenciar dados locais
 *   - useEffect para carregar dados na montagem
 *   - Funções async para CRUD via Supabase
 *   - Recarregamento automático após mutações
 * =============================================================================
 */

/**
 * =============================================================================
 * ARQUIVO: useSupportConversations.ts
 * =============================================================================
 *
 * PROPÓSITO GERAL:
 * Hooks React para gerenciar conversas e mensagens do sistema de suporte
 * ao vivo do GESTUM. Contém dois hooks principais:
 *   - useSupportConversations: Lista todas as conversas de suporte
 *   - useSupportMessages: Gerencia mensagens de uma conversa específica
 *
 * Ambos utilizam Supabase Realtime para atualizações em tempo real,
 * garantindo que novas conversas e mensagens apareçam automaticamente.
 *
 * =============================================================================
 */

// ==================== IMPORTAÇÕES ====================
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// SEÇÃO 1: INTERFACES (Definição de Tipos)
// =============================================================================

/**
 * Interface que define a estrutura de uma mensagem de suporte
 * @property id - Identificador único da mensagem (UUID)
 * @property conversation_id - UUID da conversa à qual a mensagem pertence
 * @property sender_id - UUID do usuário que enviou a mensagem
 * @property message - Conteúdo textual da mensagem
 * @property is_staff - true se foi enviada por um atendente, false se por cliente
 * @property created_at - Data/hora de envio em formato ISO
 */
export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

/**
 * Interface que define a estrutura de uma conversa de suporte
 * @property id - Identificador único da conversa (UUID)
 * @property user_id - UUID do cliente que iniciou a conversa
 * @property subject - Assunto/título da conversa
 * @property status - Estado atual: "open", "in_progress" ou "closed"
 * @property priority - Prioridade: "low", "normal" ou "high"
 * @property created_at - Data/hora de criação
 * @property updated_at - Data/hora da última atualização
 * @property assigned_to - UUID do atendente responsável (null = não atribuído)
 */
export interface SupportConversation {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
}

// =============================================================================
// SEÇÃO 2: HOOK - useSupportConversations
// =============================================================================

/**
 * Hook: useSupportConversations
 *
 * Lista todas as conversas de suporte com atualização em tempo real.
 * Utilizado pelo painel de administração para exibir a lista de chats.
 *
 * REALTIME: Escuta mudanças na tabela support_conversations (INSERT, UPDATE, DELETE)
 * e recarrega automaticamente a lista quando detecta alterações.
 *
 * @returns {Object} Objeto contendo:
 *   - conversations: Array de conversas ordenadas por data de atualização
 *   - loading: Indicador de carregamento inicial
 *   - refetch: Função para recarregar manualmente
 */
export const useSupportConversations = () => {
  // Estado que armazena a lista de conversas
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  // Indicador de carregamento para exibir skeleton/spinner
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega as conversas na montagem do componente
    fetchConversations();

    // ---- REALTIME: Escuta mudanças na tabela de conversas ----
    // Quando qualquer conversa é criada, atualizada ou excluída,
    // a lista é automaticamente recarregada
    const channel = supabase
      .channel('support-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',                      // Escuta todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'support_conversations'
        },
        () => {
          // Recarrega toda a lista quando detecta qualquer mudança
          fetchConversations();
        }
      )
      .subscribe();

    // Cleanup: Remove o canal de Realtime quando o componente desmonta
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Busca todas as conversas de suporte do banco de dados
   * Ordenadas pela última atualização (mais recente primeiro)
   */
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select('*')                                     // Todos os campos
        .order('updated_at', { ascending: false });       // Mais recente primeiro

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      // Marca carregamento como concluído
      setLoading(false);
    }
  };

  return { conversations, loading, refetch: fetchConversations };
};

// =============================================================================
// SEÇÃO 3: HOOK - useSupportMessages
// =============================================================================

/**
 * Hook: useSupportMessages
 *
 * Gerencia as mensagens de uma conversa de suporte específica.
 * Inclui:
 *   - Carregamento inicial das mensagens
 *   - Recebimento de novas mensagens em tempo real via Realtime
 *   - Envio de novas mensagens
 *
 * @param conversationId - UUID da conversa selecionada (null = nenhuma)
 * @returns {Object} Objeto contendo:
 *   - messages: Array de mensagens ordenadas cronologicamente
 *   - loading: Indicador de carregamento
 *   - sendMessage: Função para enviar uma nova mensagem
 */
export const useSupportMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se não há conversa selecionada, limpa as mensagens
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Carrega as mensagens existentes da conversa
    fetchMessages();

    // ---- REALTIME: Escuta novas mensagens em tempo real ----
    // Apenas escuta INSERTs (novas mensagens) filtrados pela conversa atual
    const channel = supabase
      .channel(`support-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',                                    // Apenas novas mensagens
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`       // Filtra pela conversa
        },
        (payload) => {
          // Adiciona a nova mensagem ao final da lista existente
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();

    // Cleanup: Remove o canal quando muda de conversa ou desmonta
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]); // Re-executa quando a conversa selecionada muda

  /**
   * Busca todas as mensagens de uma conversa, ordenadas cronologicamente
   */
  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)       // Filtra pela conversa
        .order('created_at', { ascending: true });     // Ordem cronológica (mais antiga primeiro)

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envia uma nova mensagem na conversa selecionada
   *
   * @param message - Texto da mensagem a ser enviada
   * @param isStaff - true se enviada por atendente, false se por cliente
   * @throws Error se o usuário não estiver autenticado ou se houver erro no banco
   *
   * NOTA: A mensagem aparecerá automaticamente na lista via Realtime,
   * então não é necessário chamar fetchMessages() após o envio.
   */
  const sendMessage = async (message: string, isStaff: boolean = false) => {
    if (!conversationId) return;

    try {
      // Obtém o usuário autenticado para registrar o sender_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Insere a mensagem no banco de dados
      const { error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message,
          is_staff: isStaff           // Diferencia mensagens de staff vs cliente
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;                    // Propaga o erro para tratamento na UI
    }
  };

  return { messages, loading, sendMessage };
};

/**
 * =============================================================================
 * RESUMO DO FLUXO COMPLETO
 * =============================================================================
 *
 * 1. O componente importa useSupportConversations para listar conversas
 * 2. O usuário seleciona uma conversa → conversationId é passado para useSupportMessages
 * 3. useSupportMessages carrega as mensagens e escuta novas via Realtime
 * 4. O usuário digita e clica "Enviar" → sendMessage() insere no banco
 * 5. O Realtime detecta o INSERT e adiciona a mensagem à lista automaticamente
 * 6. Quando a conversa é atualizada (status, prioridade), useSupportConversations
 *    recarrega automaticamente a lista via seu canal Realtime
 *
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

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

export const useSupportConversations = () => {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('support-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  return { conversations, loading, refetch: fetchConversations };
};

export const useSupportMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    const channel = supabase
      .channel(`support-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, isStaff: boolean = false) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message,
          is_staff: isStaff
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };

  return { messages, loading, sendMessage };
};

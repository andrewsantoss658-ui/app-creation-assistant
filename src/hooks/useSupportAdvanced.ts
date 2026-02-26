import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============= Tags =============
export interface SupportTag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface ConversationTag {
  id: string;
  conversation_id: string;
  tag_id: string;
  created_by: string;
  created_at: string;
}

export const useSupportTags = () => {
  const [tags, setTags] = useState<SupportTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTags(); }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.from("support_tags").select("*").order("name");
      if (error) throw error;
      setTags(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const createTag = async (name: string, color: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { error } = await supabase.from("support_tags").insert({ name, color, created_by: user.id });
    if (error) throw error;
    await fetchTags();
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from("support_tags").delete().eq("id", id);
    if (error) throw error;
    await fetchTags();
  };

  return { tags, loading, createTag, deleteTag, refetch: fetchTags };
};

export const useConversationTags = (conversationId: string | null) => {
  const [conversationTags, setConversationTags] = useState<ConversationTag[]>([]);

  useEffect(() => {
    if (!conversationId) { setConversationTags([]); return; }
    fetchConversationTags();
  }, [conversationId]);

  const fetchConversationTags = async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase.from("conversation_tags").select("*").eq("conversation_id", conversationId);
      if (error) throw error;
      setConversationTags(data || []);
    } catch (e) { console.error(e); setConversationTags([]); }
  };

  const addTag = async (tagId: string) => {
    if (!conversationId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("conversation_tags").insert({ conversation_id: conversationId, tag_id: tagId, created_by: user.id });
    await fetchConversationTags();
  };

  const removeTag = async (tagId: string) => {
    if (!conversationId) return;
    await supabase.from("conversation_tags").delete().eq("conversation_id", conversationId).eq("tag_id", tagId);
    await fetchConversationTags();
  };

  return { conversationTags, addTag, removeTag, refetch: fetchConversationTags };
};

// ============= Internal Notes =============
export interface InternalNote {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  mentioned_users: string[];
  created_at: string;
}

export const useInternalNotes = (conversationId: string | null) => {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) { setNotes([]); return; }
    fetchNotes();

    const channel = supabase
      .channel(`internal-notes-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_internal_notes', filter: `conversation_id=eq.${conversationId}` },
        (payload) => setNotes(prev => [...prev, payload.new as InternalNote])
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  const fetchNotes = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("support_internal_notes").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
      if (error) throw error;
      setNotes(data || []);
    } catch (e) { console.error(e); setNotes([]); }
    setLoading(false);
  };

  const sendNote = async (message: string, mentionedUsers: string[] = []) => {
    if (!conversationId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { error } = await supabase.from("support_internal_notes").insert({
      conversation_id: conversationId, sender_id: user.id, message, mentioned_users: mentionedUsers
    });
    if (error) throw error;
  };

  return { notes, loading, sendNote };
};

// ============= Chat Transfers =============
export interface ChatTransfer {
  id: string;
  conversation_id: string;
  from_user_id: string;
  to_user_id: string | null;
  to_team_id: string | null;
  reason: string | null;
  created_at: string;
}

export const useChatTransfers = (conversationId: string | null) => {
  const [transfers, setTransfers] = useState<ChatTransfer[]>([]);

  useEffect(() => {
    if (!conversationId) { setTransfers([]); return; }
    fetchTransfers();
  }, [conversationId]);

  const fetchTransfers = async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase.from("chat_transfers").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: false });
      if (error) throw error;
      setTransfers(data || []);
    } catch (e) { console.error(e); setTransfers([]); }
  };

  const transferChat = async (toUserId: string | null, toTeamId: string | null, reason?: string) => {
    if (!conversationId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    
    const { error } = await supabase.from("chat_transfers").insert({
      conversation_id: conversationId, from_user_id: user.id, to_user_id: toUserId, to_team_id: toTeamId, reason
    });
    if (error) throw error;

    // Update conversation assignment
    const updates: Record<string, string> = {};
    if (toUserId) updates.assigned_to = toUserId;
    if (toTeamId) updates.team_id = toTeamId;
    
    await supabase.from("support_conversations").update(updates).eq("id", conversationId);
    await fetchTransfers();
  };

  return { transfers, transferChat, refetch: fetchTransfers };
};

// ============= Welcome Messages =============
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

export const useWelcomeMessages = () => {
  const [messages, setMessages] = useState<WelcomeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.from("support_welcome_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const createMessage = async (msg: { message: string; team_id?: string | null; schedule_start?: string | null; schedule_end?: string | null }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { error } = await supabase.from("support_welcome_messages").insert({ ...msg, created_by: user.id });
    if (error) throw error;
    await fetchMessages();
  };

  const updateMessage = async (id: string, updates: Partial<WelcomeMessage>) => {
    const { error } = await supabase.from("support_welcome_messages").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await fetchMessages();
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("support_welcome_messages").delete().eq("id", id);
    if (error) throw error;
    await fetchMessages();
  };

  return { messages, loading, createMessage, updateMessage, deleteMessage, refetch: fetchMessages };
};

// ============= Support Metrics =============
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

export const useSupportMetrics = () => {
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    try {
      const { data: conversations } = await supabase.from("support_conversations").select("*");
      const convos = conversations || [];

      const total = convos.length;
      const open = convos.filter(c => c.status === "open").length;

      const withFirstResponse = convos.filter(c => c.first_response_at && c.created_at);
      const avgFirst = withFirstResponse.length > 0
        ? withFirstResponse.reduce((sum, c) => sum + (new Date(c.first_response_at!).getTime() - new Date(c.created_at!).getTime()), 0) / withFirstResponse.length / 60000
        : 0;

      const closed = convos.filter(c => c.closed_at && c.created_at);
      const avgRes = closed.length > 0
        ? closed.reduce((sum, c) => sum + (new Date(c.closed_at!).getTime() - new Date(c.created_at!).getTime()), 0) / closed.length / 60000
        : 0;

      const agentMap = new Map<string, number>();
      convos.forEach(c => {
        if (c.assigned_to) agentMap.set(c.assigned_to, (agentMap.get(c.assigned_to) || 0) + 1);
      });
      const chatsByAgent = Array.from(agentMap.entries()).map(([userId, count]) => ({ userId, count }));

      const { data: teams } = await supabase.from("support_teams").select("id, name");
      const teamMap = new Map<string, number>();
      convos.forEach(c => {
        if (c.team_id) teamMap.set(c.team_id, (teamMap.get(c.team_id) || 0) + 1);
      });
      const chatsByTeam = Array.from(teamMap.entries()).map(([teamId, count]) => {
        const team = (teams || []).find(t => t.id === teamId);
        return { teamId, teamName: team?.name || "Desconhecido", count };
      });

      const { data: transfersData } = await supabase.from("chat_transfers").select("id");
      const transferRate = total > 0 ? ((transfersData || []).length / total) * 100 : 0;

      const { data: convTags } = await supabase.from("conversation_tags").select("tag_id");
      const { data: allTags } = await supabase.from("support_tags").select("id, name, color");
      const tagCountMap = new Map<string, number>();
      (convTags || []).forEach(ct => {
        tagCountMap.set(ct.tag_id, (tagCountMap.get(ct.tag_id) || 0) + 1);
      });
      const chatsByTag = Array.from(tagCountMap.entries()).map(([tagId, count]) => {
        const tag = (allTags || []).find(t => t.id === tagId);
        return { tagName: tag?.name || "?", tagColor: tag?.color || "#6366f1", count };
      });

      setMetrics({
        totalConversations: total,
        openConversations: open,
        avgFirstResponseMinutes: Math.round(avgFirst),
        avgResolutionMinutes: Math.round(avgRes),
        chatsByAgent,
        chatsByTeam,
        transferRate: Math.round(transferRate * 10) / 10,
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

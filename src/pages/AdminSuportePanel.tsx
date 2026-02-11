import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSupportConversations, useSupportMessages } from "@/hooks/useSupportConversations";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSuportePanel() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const { conversations, loading: conversationsLoading } = useSupportConversations();
  const { messages, loading: messagesLoading, sendMessage } = useSupportMessages(selectedConversationId);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Erro ao verificar role:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      await sendMessage(newMessage, true);
      setNewMessage("");
      toast.success("Mensagem enviada com sucesso");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleStatusChange = async (conversationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({ status: newStatus })
        .eq('id', conversationId);

      if (error) throw error;
      toast.success("Status atualizado com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handlePriorityChange = async (conversationId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({ priority: newPriority })
        .eq('id', conversationId);

      if (error) throw error;
      toast.success("Prioridade atualizada com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar prioridade");
    }
  };

  // UI-only check for better UX - actual security is enforced by RLS policies
  // on support_conversations and support_messages tables using has_role()
  if (!userRole || (userRole !== 'support' && userRole !== 'admin' && userRole !== 'master')) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Você não tem permissão para acessar o painel de suporte.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { variant: "default" as const, icon: AlertCircle, label: "Aberto" },
      in_progress: { variant: "secondary" as const, icon: Clock, label: "Em andamento" },
      closed: { variant: "outline" as const, icon: CheckCircle2, label: "Fechado" }
    };
    const config = variants[status as keyof typeof variants] || variants.open;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: { variant: "secondary" as const, label: "Baixa" },
      normal: { variant: "default" as const, label: "Normal" },
      high: { variant: "destructive" as const, label: "Alta" }
    };
    const config = variants[priority as keyof typeof variants] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Painel de Suporte</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="open" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="open">Abertos</TabsTrigger>
                  <TabsTrigger value="in_progress">Em andamento</TabsTrigger>
                  <TabsTrigger value="closed">Fechados</TabsTrigger>
                </TabsList>
                {['open', 'in_progress', 'closed'].map((status) => (
                  <TabsContent key={status} value={status} className="m-0">
                    <ScrollArea className="h-[600px]">
                      {conversationsLoading ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Carregando...
                        </div>
                      ) : (
                        <div className="space-y-2 p-4">
                          {conversations
                            .filter(c => c.status === status)
                            .map((conversation) => (
                              <div
                                key={conversation.id}
                                onClick={() => setSelectedConversationId(conversation.id)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                                  selectedConversationId === conversation.id
                                    ? 'bg-primary/10 border-2 border-primary'
                                    : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-sm line-clamp-1">
                                    {conversation.subject}
                                  </h3>
                                  {getPriorityBadge(conversation.priority)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conversation.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </p>
                              </div>
                            ))}
                          {conversations.filter(c => c.status === status).length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                              Nenhuma conversa neste status
                            </p>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="lg:col-span-2">
            <CardHeader>
              {selectedConversation ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedConversation.subject}</CardTitle>
                    {getStatusBadge(selectedConversation.status)}
                  </div>
                  <div className="flex gap-4">
                    <Select
                      value={selectedConversation.status}
                      onValueChange={(value) => handleStatusChange(selectedConversation.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedConversation.priority}
                      onValueChange={(value) => handlePriorityChange(selectedConversation.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <CardTitle>Selecione uma conversa</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {selectedConversationId ? (
                <div className="space-y-4">
                  <ScrollArea className="h-[450px] border rounded-lg p-4 bg-muted/20">
                    {messagesLoading ? (
                      <div className="text-center text-muted-foreground">
                        Carregando mensagens...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.is_staff ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.is_staff
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-background border'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[80px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pressione Enter para enviar, Shift+Enter para quebrar linha
                  </p>
                </div>
              ) : (
                <div className="h-[550px] flex items-center justify-center text-muted-foreground">
                  Selecione uma conversa para começar
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

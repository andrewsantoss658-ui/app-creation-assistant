import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare, Send, Clock, CheckCircle2, AlertCircle, ArrowRightLeft,
  StickyNote, Tag, X,
} from "lucide-react";
import { toast } from "sonner";
import { useSupportConversations, useSupportMessages } from "@/hooks/useSupportConversations";
import {
  useInternalNotes, useChatTransfers, useSupportTags, useConversationTags,
} from "@/hooks/useSupportAdvanced";
import { useSupportTeams } from "@/hooks/useSupportTeams";
import { useSupportAccounts } from "@/hooks/useSupportAccounts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSuportePanel() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<"public" | "internal">("public");
  const [internalMsg, setInternalMsg] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");

  // Transfer state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferToUser, setTransferToUser] = useState("");
  const [transferToTeam, setTransferToTeam] = useState("");
  const [transferReason, setTransferReason] = useState("");

  const { conversations, loading: conversationsLoading } = useSupportConversations();
  const { messages, loading: messagesLoading, sendMessage } = useSupportMessages(selectedConversationId);
  const { notes, sendNote } = useInternalNotes(selectedConversationId);
  const { transfers, transferChat } = useChatTransfers(selectedConversationId);
  const { tags } = useSupportTags();
  const { conversationTags, addTag, removeTag } = useConversationTags(selectedConversationId);
  const { teams } = useSupportTeams();
  const { accounts } = useSupportAccounts();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
      setUserRole(data?.role || null);
    };
    checkRole();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    try {
      await sendMessage(newMessage, true);
      setNewMessage("");
    } catch { toast.error("Erro ao enviar"); }
  };

  const handleSendInternalNote = async () => {
    if (!internalMsg.trim() || !selectedConversationId) return;
    try {
      await sendNote(internalMsg);
      setInternalMsg("");
      toast.success("Nota interna enviada");
    } catch { toast.error("Erro ao enviar nota"); }
  };

  const handleTransfer = async () => {
    if (!transferToUser && !transferToTeam) { toast.error("Selecione destino"); return; }
    try {
      await transferChat(
        transferToUser || null,
        transferToTeam || null,
        transferReason || undefined
      );
      toast.success("Chat transferido");
      setTransferOpen(false);
      setTransferToUser("");
      setTransferToTeam("");
      setTransferReason("");
    } catch { toast.error("Erro na transferência"); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "closed") updates.closed_at = new Date().toISOString();
    await supabase.from("support_conversations").update(updates).eq("id", id);
  };

  const handlePriorityChange = async (id: string, priority: string) => {
    await supabase.from("support_conversations").update({ priority }).eq("id", id);
  };

  if (!userRole || !["support", "admin", "master"].includes(userRole)) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle className="text-center">Acesso Negado</CardTitle></CardHeader>
          <CardContent><p className="text-center text-muted-foreground">Sem permissão.</p></CardContent>
        </Card>
      </div>
    );
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Filter conversations by tag
  const filteredConversations = filterTag === "all"
    ? conversations
    : conversations; // Tag filter applied below per-status

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: "default" as const, icon: AlertCircle, label: "Aberto" },
      in_progress: { variant: "secondary" as const, icon: Clock, label: "Em andamento" },
      closed: { variant: "outline" as const, icon: CheckCircle2, label: "Fechado" },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    return <Badge variant={config.variant}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { variant: "secondary" as const, label: "Baixa" },
      normal: { variant: "default" as const, label: "Normal" },
      high: { variant: "destructive" as const, label: "Alta" },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Get tag names for the selected conversation
  const selectedConvoTagIds = conversationTags.map(ct => ct.tag_id);
  const availableTags = tags.filter(t => !selectedConvoTagIds.includes(t.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Painel de Suporte</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Conversas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="open">Abertos</TabsTrigger>
                <TabsTrigger value="in_progress">Andamento</TabsTrigger>
                <TabsTrigger value="closed">Fechados</TabsTrigger>
              </TabsList>
              {["open", "in_progress", "closed"].map(status => (
                <TabsContent key={status} value={status} className="m-0">
                  <ScrollArea className="h-[600px]">
                    {conversationsLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                    ) : (
                      <div className="space-y-2 p-4">
                        {filteredConversations.filter(c => c.status === status).map(conv => (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedConversationId(conv.id)}
                            className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedConversationId === conv.id ? "bg-primary/10 border-2 border-primary" : "bg-muted hover:bg-muted/80 border-2 border-transparent"}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-sm line-clamp-1">{conv.subject}</h3>
                              {getPriorityBadge(conv.priority)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.created_at || ""), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        ))}
                        {filteredConversations.filter(c => c.status === status).length === 0 && (
                          <p className="text-center text-muted-foreground py-8">Nenhuma conversa</p>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedConversation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedConversation.subject}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><ArrowRightLeft className="h-4 w-4 mr-1" />Transferir</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Transferir Chat</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Para Atendente</Label>
                            <Select value={transferToUser} onValueChange={setTransferToUser}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {accounts.filter(a => a.is_active && a.is_linked_to_chat).map(a => (
                                  <SelectItem key={a.user_id} value={a.user_id}>{a.email}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Para Equipe</Label>
                            <Select value={transferToTeam} onValueChange={setTransferToTeam}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {teams.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input placeholder="Motivo da transferência" value={transferReason} onChange={e => setTransferReason(e.target.value)} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancelar</Button>
                          <Button onClick={handleTransfer}>Transferir</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Status & Priority controls */}
                <div className="flex gap-4">
                  <Select value={selectedConversation.status} onValueChange={v => handleStatusChange(selectedConversation.id, v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedConversation.priority} onValueChange={v => handlePriorityChange(selectedConversation.id, v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {conversationTags.map(ct => {
                    const tag = tags.find(t => t.id === ct.tag_id);
                    if (!tag) return null;
                    return (
                      <Badge key={ct.id} variant="outline" className="gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        <button onClick={() => removeTag(ct.tag_id)}><X className="h-3 w-3" /></button>
                      </Badge>
                    );
                  })}
                  {availableTags.length > 0 && (
                    <Select onValueChange={v => addTag(v)}>
                      <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="+ Tag" /></SelectTrigger>
                      <SelectContent>
                        {availableTags.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Transfer history */}
                {transfers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRightLeft className="h-3 w-3" />
                    {transfers.length} transferência(s) realizada(s)
                  </div>
                )}
              </div>
            ) : (
              <CardTitle>Selecione uma conversa</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {selectedConversationId ? (
              <div className="space-y-4">
                {/* Chat mode toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={chatMode === "public" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChatMode("public")}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />Chat
                  </Button>
                  <Button
                    variant={chatMode === "internal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChatMode("internal")}
                  >
                    <StickyNote className="h-3 w-3 mr-1" />Notas Internas
                  </Button>
                </div>

                {chatMode === "public" ? (
                  <>
                    <ScrollArea className="h-[380px] border rounded-lg p-4 bg-muted/20">
                      {messagesLoading ? (
                        <div className="text-center text-muted-foreground">Carregando...</div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.is_staff ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.is_staff ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Responder ao cliente..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        className="flex-1 min-h-[60px]"
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="self-end">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <ScrollArea className="h-[380px] border rounded-lg p-4 bg-accent/20">
                      <div className="space-y-3">
                        {notes.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Nenhuma nota interna</p>
                        ) : notes.map(note => (
                          <div key={note.id} className="bg-accent/30 border border-accent rounded-lg px-4 py-2">
                            <p className="text-sm whitespace-pre-wrap">{note.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Nota interna (não visível ao cliente)..."
                        value={internalMsg}
                        onChange={e => setInternalMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendInternalNote(); } }}
                        className="flex-1 min-h-[60px] border-accent"
                      />
                      <Button variant="secondary" onClick={handleSendInternalNote} disabled={!internalMsg.trim()} className="self-end">
                        <StickyNote className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <StickyNote className="h-3 w-3" /> Notas internas são visíveis apenas para a equipe de suporte
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                Selecione uma conversa para começar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MessageSquareText, Plus, Trash2, Tag, Palette } from "lucide-react";
import { toast } from "sonner";
import { useSupportTags, useWelcomeMessages } from "@/hooks/useSupportAdvanced";
import { useSupportTeams } from "@/hooks/useSupportTeams";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

export default function SuporteConfiguracoes() {
  const { tags, createTag, deleteTag } = useSupportTags();
  const { messages: welcomeMessages, createMessage, updateMessage, deleteMessage } = useWelcomeMessages();
  const { teams } = useSupportTeams();

  // Tag creation
  const [tagOpen, setTagOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#6366f1");

  // Welcome message creation
  const [wmOpen, setWmOpen] = useState(false);
  const [wmMessage, setWmMessage] = useState("");
  const [wmTeamId, setWmTeamId] = useState<string>("none");
  const [wmStart, setWmStart] = useState("");
  const [wmEnd, setWmEnd] = useState("");

  const handleCreateTag = async () => {
    if (!tagName.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await createTag(tagName.trim(), tagColor);
      toast.success("Tag criada");
      setTagOpen(false);
      setTagName("");
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

  const handleCreateWelcome = async () => {
    if (!wmMessage.trim()) { toast.error("Mensagem obrigatória"); return; }
    try {
      await createMessage({
        message: wmMessage.trim(),
        team_id: wmTeamId === "none" ? null : wmTeamId,
        schedule_start: wmStart || null,
        schedule_end: wmEnd || null,
      });
      toast.success("Mensagem criada");
      setWmOpen(false);
      setWmMessage("");
      setWmTeamId("none");
      setWmStart("");
      setWmEnd("");
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquareText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configurações do Chat</h1>
          <p className="text-muted-foreground">Tags e mensagens de boas-vindas</p>
        </div>
      </div>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Etiquetas (Tags)</CardTitle>
              <CardDescription>Tags para categorizar atendimentos</CardDescription>
            </div>
            <Dialog open={tagOpen} onOpenChange={setTagOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Tag</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Tag</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Ex: urgente" value={tagName} onChange={e => setTagName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> Cor</Label>
                    <div className="flex gap-2 flex-wrap">
                      {TAG_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setTagColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${tagColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTagOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateTag}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma tag criada</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-1 border rounded-full px-3 py-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm">{tag.name}</span>
                  <button onClick={() => { deleteTag(tag.id); toast.success("Tag removida"); }} className="ml-1 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Messages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mensagens de Boas-vindas</CardTitle>
              <CardDescription>Mensagens automáticas no início do chat. Use {"{{nome}}"} para o nome do cliente.</CardDescription>
            </div>
            <Dialog open={wmOpen} onOpenChange={setWmOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Mensagem</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Mensagem de Boas-vindas</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea placeholder="Olá {{nome}}, como podemos ajudar?" value={wmMessage} onChange={e => setWmMessage(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Equipe (opcional)</Label>
                    <Select value={wmTeamId} onValueChange={setWmTeamId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas as equipes</SelectItem>
                        {teams.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horário início</Label>
                      <Input type="time" value={wmStart} onChange={e => setWmStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário fim</Label>
                      <Input type="time" value={wmEnd} onChange={e => setWmEnd(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWmOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateWelcome}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {welcomeMessages.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma mensagem configurada</p>
          ) : (
            <div className="space-y-3">
              {welcomeMessages.map(wm => {
                const team = teams.find(t => t.id === wm.team_id);
                return (
                  <div key={wm.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{wm.message}</p>
                        <div className="flex gap-2 mt-2">
                          {team && <Badge variant="outline">{team.name}</Badge>}
                          {wm.schedule_start && wm.schedule_end && (
                            <Badge variant="secondary">{wm.schedule_start} - {wm.schedule_end}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={wm.is_active}
                          onCheckedChange={v => updateMessage(wm.id, { is_active: v })}
                        />
                        <Button variant="ghost" size="icon" onClick={() => { deleteMessage(wm.id); toast.success("Removida"); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

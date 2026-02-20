import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useSupportTeams, useTeamMembers } from "@/hooks/useSupportTeams";
import { useSupportAccounts } from "@/hooks/useSupportAccounts";

const MEMBER_ROLES = [
  { value: "member", label: "Membro" },
  { value: "supervisor", label: "Supervisor" },
  { value: "lead", label: "Líder" },
];

export default function SuporteEquipes() {
  const { teams, loading, createTeam, deleteTeam } = useSupportTeams();
  const { accounts } = useSupportAccounts();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");

  const { members, addMember, updateMemberRole, removeMember } = useTeamMembers(selectedTeamId);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await createTeam(name.trim(), description.trim() || undefined);
      toast.success("Equipe criada");
      setCreateOpen(false);
      setName("");
      setDescription("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddMember = async () => {
    if (!newMemberUserId) return;
    try {
      await addMember(newMemberUserId, newMemberRole);
      toast.success("Membro adicionado");
      setAddMemberOpen(false);
      setNewMemberUserId("");
      setNewMemberRole("member");
    } catch (e: any) { toast.error(e.message || "Erro ao adicionar"); }
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Equipes de Suporte</h1>
            <p className="text-muted-foreground">Organize atendentes em equipes especializadas</p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Equipe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Equipe</DialogTitle>
              <DialogDescription>Crie uma nova equipe de suporte.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Ex: Financeiro" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descrição da equipe" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Equipes</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-center py-4">Carregando...</p> : teams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma equipe criada</p>
            ) : (
              <div className="space-y-2">
                {teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${selectedTeamId === team.id ? "border-primary bg-primary/5" : "border-transparent bg-muted hover:bg-muted/80"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{team.name}</h3>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover equipe?</AlertDialogTitle>
                            <AlertDialogDescription>A equipe "{team.name}" será removida permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTeam(team.id)}>Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {team.description && <p className="text-xs text-muted-foreground mt-1">{team.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTeam ? `Membros: ${selectedTeam.name}` : "Selecione uma equipe"}</CardTitle>
                {selectedTeam?.description && <CardDescription>{selectedTeam.description}</CardDescription>}
              </div>
              {selectedTeam && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Adicionar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Membro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Conta de Suporte</Label>
                        <Select value={newMemberUserId} onValueChange={setNewMemberUserId}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {accounts.filter(a => a.is_active).map(a => (
                              <SelectItem key={a.user_id} value={a.user_id}>{a.email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MEMBER_ROLES.map(r => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancelar</Button>
                      <Button onClick={handleAddMember} disabled={!newMemberUserId}>Adicionar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <p className="text-center text-muted-foreground py-12">Selecione uma equipe para ver os membros</p>
            ) : members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum membro nesta equipe</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(m => {
                    const account = accounts.find(a => a.user_id === m.user_id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{account?.email || m.user_id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Select value={m.role} onValueChange={v => updateMemberRole(m.id, v)}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MEMBER_ROLES.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

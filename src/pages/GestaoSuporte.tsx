import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck,
  UserPlus,
  Pencil,
  Trash2,
  MessageSquare,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useSupportAccounts, useSupportAuditLog, type SupportAccount } from "@/hooks/useSupportAccounts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const ACCESS_LEVELS = [
  { value: "support", label: "Suporte" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Administrador" },
];

export default function GestaoSuporte() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useSupportAccounts();

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newAccessLevel, setNewAccessLevel] = useState("support");
  const [creating, setCreating] = useState(false);

  // Edit dialog state
  const [editAccount, setEditAccount] = useState<SupportAccount | null>(null);
  const [editAccessLevel, setEditAccessLevel] = useState("");

  // Audit dialog state
  const [auditAccountId, setAuditAccountId] = useState<string | undefined>();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setUserRole(data?.role || null);
    } catch {
      console.error("Erro ao verificar role");
    } finally {
      setRoleLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (userRole !== "master") {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Apenas o Administrador Geral pode acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newEmail.endsWith("@gestum.com")) {
      toast.error("Apenas e-mails @gestum.com podem ser contas de suporte");
      return;
    }
    if (!newEmail.trim()) return;

    setCreating(true);
    try {
      await createAccount(newEmail.trim(), newAccessLevel);
      toast.success("Conta de suporte criada com sucesso");
      setCreateOpen(false);
      setNewEmail("");
      setNewAccessLevel("support");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta de suporte");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (account: SupportAccount) => {
    try {
      await updateAccount(account.id, { is_active: !account.is_active });
      toast.success(account.is_active ? "Conta desativada" : "Conta ativada");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleToggleChat = async (account: SupportAccount) => {
    try {
      await updateAccount(account.id, { is_linked_to_chat: !account.is_linked_to_chat });
      toast.success(account.is_linked_to_chat ? "Desvinculado do chat" : "Vinculado ao chat");
    } catch {
      toast.error("Erro ao atualizar vinculação");
    }
  };

  const handleEditSave = async () => {
    if (!editAccount) return;
    try {
      await updateAccount(editAccount.id, { access_level: editAccessLevel });
      toast.success("Nível de acesso atualizado");
      setEditAccount(null);
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      toast.success("Conta de suporte removida");
    } catch {
      toast.error("Erro ao remover conta");
    }
  };

  const getAccessBadge = (level: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      support: { variant: "secondary", label: "Suporte" },
      supervisor: { variant: "default", label: "Supervisor" },
      admin: { variant: "destructive", label: "Administrador" },
    };
    const c = config[level] || config.support;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Suporte</h1>
            <p className="text-muted-foreground">Gerencie contas e permissões do suporte ao vivo</p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Conta de Suporte</DialogTitle>
              <DialogDescription>
                Apenas e-mails @gestum.com podem ser vinculados como suporte.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  placeholder="usuario@gestum.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                {newEmail && !newEmail.endsWith("@gestum.com") && (
                  <p className="text-xs text-destructive">
                    O e-mail deve terminar com @gestum.com
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nível de Acesso</Label>
                <Select value={newAccessLevel} onValueChange={setNewAccessLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !newEmail.endsWith("@gestum.com")}
              >
                {creating ? "Criando..." : "Criar Conta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Contas</CardDescription>
            <CardTitle className="text-2xl">{accounts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contas Ativas</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {accounts.filter((a) => a.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vinculadas ao Chat</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {accounts.filter((a) => a.is_linked_to_chat).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contas de Suporte</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta de suporte cadastrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chat ao Vivo</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.email}</TableCell>
                    <TableCell>{getAccessBadge(account.access_level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={account.is_active}
                          onCheckedChange={() => handleToggleActive(account)}
                        />
                        <span className="text-sm">
                          {account.is_active ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={account.is_linked_to_chat}
                          onCheckedChange={() => handleToggleChat(account)}
                        />
                        <MessageSquare
                          className={`h-4 w-4 ${
                            account.is_linked_to_chat
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(account.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditAccount(account);
                            setEditAccessLevel(account.access_level);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAuditAccountId(account.id)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover conta de suporte?</AlertDialogTitle>
                              <AlertDialogDescription>
                                A conta de {account.email} será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(account.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editAccount} onOpenChange={(open) => !open && setEditAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nível de Acesso</DialogTitle>
            <DialogDescription>{editAccount?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nível de Acesso</Label>
            <Select value={editAccessLevel} onValueChange={setEditAccessLevel}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccount(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Dialog */}
      <AuditDialog accountId={auditAccountId} onClose={() => setAuditAccountId(undefined)} />
    </div>
  );
}

function AuditDialog({ accountId, onClose }: { accountId?: string; onClose: () => void }) {
  const { entries, loading } = useSupportAuditLog(accountId);

  const actionLabels: Record<string, string> = {
    create: "Criação",
    update: "Atualização",
    delete: "Remoção",
  };

  return (
    <Dialog open={!!accountId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum registro</div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{actionLabels[entry.action] || entry.action}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {entry.new_values && (
                    <pre className="text-xs bg-muted rounded p-2 overflow-auto">
                      {JSON.stringify(entry.new_values, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

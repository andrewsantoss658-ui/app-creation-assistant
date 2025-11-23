import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Bell, HelpCircle, LogOut, Moon } from "lucide-react";
import { logout } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Configuracoes() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast({
      title: "Sessão encerrada",
      description: "Você saiu com sucesso.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">Configurações</h1>

        <div className="space-y-4">
          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/minha-conta")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <User className="h-8 w-8 text-foreground" />
              <span className="text-xl font-medium">Minha Conta</span>
            </CardContent>
          </Card>

          <div className="h-px bg-border" />

          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/notificacoes")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <Bell className="h-8 w-8 text-foreground" />
              <span className="text-xl font-medium">Notificações</span>
            </CardContent>
          </Card>

          <div className="h-px bg-border" />

          <Card className="hover:bg-accent transition-colors">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Moon className="h-8 w-8 text-foreground" />
                <span className="text-xl font-medium">Tema Escuro</span>
              </div>
              <ThemeToggle />
            </CardContent>
          </Card>

          <div className="h-px bg-border" />

          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/suporte")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <HelpCircle className="h-8 w-8 text-foreground" />
              <span className="text-xl font-medium">Suporte e Ajuda</span>
            </CardContent>
          </Card>

          <div className="h-px bg-border" />

          <Card 
            className="cursor-pointer hover:bg-destructive/10 transition-colors border-destructive"
            onClick={handleLogout}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <LogOut className="h-8 w-8 text-destructive" />
              <span className="text-xl font-medium text-destructive">Sair</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

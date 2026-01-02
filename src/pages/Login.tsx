import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";
import logoGestum from "@/assets/logo_gestum.jpg";
import { formatCpfCnpj } from "@/lib/validators";

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Detecta se é CPF/CNPJ ou email
  const isEmail = (value: string) => value.includes("@");
  const isCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.length >= 11 && numbers.length <= 14;
  };

  const handleIdentifierChange = (value: string) => {
    // Se parecer com CPF/CNPJ (só números ou formatado), formata
    const numbers = value.replace(/\D/g, "");
    if (numbers.length > 0 && !value.includes("@")) {
      setIdentifier(formatCpfCnpj(value));
    } else {
      setIdentifier(value);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = identifier;

      // Se não for email, buscar o email pelo CPF/CNPJ
      if (!isEmail(identifier)) {
        const cpfCnpjNumbers = identifier.replace(/\D/g, "");
        
        if (!isCpfCnpj(identifier)) {
          throw new Error("Digite um email, CPF ou CNPJ válido");
        }

        // Buscar email associado ao CPF/CNPJ
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("cpf_cnpj", cpfCnpjNumbers)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          throw new Error("CPF/CNPJ não encontrado no sistema");
        }

        // Buscar o email do usuário via auth.users (precisamos do email)
        // Como não temos acesso direto, vamos buscar via função RPC ou email salvo
        // Alternativa: buscar o email via admin API ou armazenar no profile
        
        // Por enquanto, informamos que precisa usar email se não tivermos
        const { data: userData } = await supabase.auth.admin?.getUserById?.(profile.id) || { data: null };
        
        if (!userData?.user?.email) {
          // Tentar login direto com CPF como identificador alternativo
          // Supabase não suporta isso nativamente, então precisamos de uma abordagem diferente
          throw new Error("Use seu email para fazer login ou entre em contato com o suporte");
        }
        
        emailToUse = userData.user.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setTimeout(() => {
          supabase
            .from("profiles")
            .select("nome")
            .eq("id", data.user.id)
            .maybeSingle()
            .then(({ data: profile }) => {
              toast.success(`Bem-vindo, ${profile?.nome || ""}!`);
            });
        }, 0);
        
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Credenciais incorretas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url(${logoGestum})`,
          backgroundSize: '300px 120px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <Package className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">GESTUM</CardTitle>
            <CardDescription className="text-base mt-2">
              Gestão simples para MEI
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email, CPF ou CNPJ</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="seu@email.com ou CPF/CNPJ"
                value={identifier}
                onChange={(e) => handleIdentifierChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-sm p-0 h-auto"
              onClick={() => navigate("/recuperar-senha")}
            >
              Esqueceu sua senha?
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/cadastro")}
              >
                Criar conta
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { savePixCharge, getPixCharges, updatePixChargeStatus, PixCharge } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { ArrowLeft, QrCode, Share2, Check } from "lucide-react";
import { toast } from "sonner";

const Pix = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [charges, setCharges] = useState<PixCharge[]>([]);
  const [newCharge, setNewCharge] = useState<PixCharge | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const valor = searchParams.get("valor");
    if (valor) {
      const charge: PixCharge = {
        id: Math.random().toString(36).substr(2, 9),
        amount: parseFloat(valor),
        description: "Venda GESTUM",
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      savePixCharge(charge);
      setNewCharge(charge);
    }

    loadCharges();
  }, [navigate, searchParams]);

  const loadCharges = () => {
    setCharges(getPixCharges().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const handleMarkAsPaid = (id: string) => {
    updatePixChargeStatus(id, "paid");
    toast.success("Pagamento confirmado!");
    loadCharges();
    if (newCharge?.id === id) {
      setNewCharge(null);
    }
  };

  const handleShare = () => {
    toast.success("Link copiado para compartilhar!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Cobranças Pix</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {newCharge && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Nova Cobrança Pix</span>
                <Badge variant="outline" className="text-warning border-warning">
                  Pendente
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Valor da cobrança</p>
                  <p className="text-4xl font-bold text-foreground">
                    R$ {newCharge.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar Cobrança
                </Button>
                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => handleMarkAsPaid(newCharge.id)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            {charges.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma cobrança criada ainda
              </p>
            ) : (
              <div className="space-y-3">
                {charges.map(charge => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">R$ {charge.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(charge.createdAt).toLocaleDateString()} às{" "}
                        {new Date(charge.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge
                      variant={charge.status === "paid" ? "default" : "outline"}
                      className={charge.status === "paid" 
                        ? "bg-secondary text-secondary-foreground" 
                        : "text-warning border-warning"
                      }
                    >
                      {charge.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Pix;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSales } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { ShoppingCart, Package, FileText, DollarSign, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [todaySales, setTodaySales] = useState(0);
  const [last7DaysSales, setLast7DaysSales] = useState<number[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const sales = getSales();
    const today = new Date().toDateString();
    
    // Vendas de hoje
    const todayTotal = sales
      .filter(sale => new Date(sale.date).toDateString() === today)
      .reduce((sum, sale) => sum + sale.total, 0);
    
    setTodaySales(todayTotal);

    // Últimos 7 dias
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toDateString();
    });

    const salesByDay = last7Days.map(day =>
      sales
        .filter(sale => new Date(sale.date).toDateString() === day)
        .reduce((sum, sale) => sum + sale.total, 0)
    );

    setLast7DaysSales(salesByDay);
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("gestum_current_user");
    toast.success("Até logo!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">GESTUM</h1>
              <p className="text-xs text-muted-foreground">Olá, {user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Resumo do dia */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Vendas de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              R$ {todaySales.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Gráfico simples */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {last7DaysSales.map((value, index) => {
                const maxValue = Math.max(...last7DaysSales, 1);
                const height = (value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${height || 5}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {["D", "S", "T", "Q", "Q", "S", "S"][index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ações rápidas */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ações Rápidas</h2>
          
          <Button
            size="xl"
            className="w-full justify-start text-left h-auto py-6"
            onClick={() => navigate("/vendas/nova")}
          >
            <Plus className="w-6 h-6 mr-3" />
            <div>
              <p className="font-semibold text-base">Registrar Nova Venda</p>
              <p className="text-sm opacity-90">Adicione uma venda ao sistema</p>
            </div>
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="justify-start h-auto py-4"
              onClick={() => navigate("/estoque")}
            >
              <Package className="w-5 h-5 mr-3" />
              <span>Ver Estoque</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="justify-start h-auto py-4"
              onClick={() => navigate("/relatorios")}
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Ver Relatórios</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

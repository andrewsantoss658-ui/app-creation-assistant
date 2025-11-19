import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Inbox } from "lucide-react";
import { getCashFlowEntries, getSales, getExpenses } from "@/lib/storage";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FluxoCaixa() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"hoje" | "mes">("hoje");
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);

  useEffect(() => {
    calculateCashFlow();
  }, [period]);

  const calculateCashFlow = () => {
    const now = new Date();
    const sales = getSales();
    const expenses = getExpenses();
    
    let startDate: Date;
    let endDate: Date;

    if (period === "hoje") {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Calculate entradas (sales)
    const totalEntradas = sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate && sale.status === "completed";
      })
      .reduce((sum, sale) => sum + sale.total, 0);

    // Calculate saidas (expenses paid)
    const totalSaidas = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate >= startDate && expenseDate <= endDate && expense.status === "paid";
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    setEntradas(totalEntradas);
    setSaidas(totalSaidas);
  };

  const saldoAtual = entradas - saidas;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
              <span className="text-secondary-foreground font-bold">G</span>
            </div>
            <span className="text-2xl font-bold">GESTUM</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-8">Fluxo de Caixa</h1>

          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={period === "hoje" ? "default" : "outline"}
              onClick={() => setPeriod("hoje")}
              className="rounded-full"
            >
              <Inbox className="mr-2 h-4 w-4" />
              Hoje
            </Button>
            <Button
              variant={period === "mes" ? "secondary" : "outline"}
              onClick={() => setPeriod("mes")}
              className="rounded-full"
            >
              Mês #{format(new Date(), "MMM", { locale: ptBR }).toUpperCase()}
            </Button>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold mb-4">Saldo Atual</h2>
          <p className="text-6xl font-bold text-secondary" style={{ color: "hsl(142, 71%, 45%)" }}>
            R$ {saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-card p-6">
                <h3 className="text-2xl font-semibold text-center mb-4">Entradas</h3>
              </div>
              <div className="p-8 text-center" style={{ backgroundColor: "hsl(142, 71%, 45%)" }}>
                <p className="text-4xl font-bold text-white">
                  R$ {entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-card p-6">
                <h3 className="text-2xl font-semibold text-center mb-4">Saídas</h3>
              </div>
              <div className="p-8 text-center" style={{ backgroundColor: "hsl(0, 84%, 60%)" }}>
                <p className="text-4xl font-bold text-white">
                  R$ {saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

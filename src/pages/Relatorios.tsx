import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSales, getProducts } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign } from "lucide-react";

const Relatorios = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7");
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    topProduct: { name: "N/A", sales: 0 },
    recentSales: [] as any[],
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    calculateStats();
  }, [period, navigate]);

  const calculateStats = () => {
    const sales = getSales();
    const products = getProducts();
    const days = parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredSales = sales.filter(
      sale => new Date(sale.date) >= cutoffDate
    );

    const total = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const average = filteredSales.length > 0 ? total / days : 0;

    // Produto mais vendido
    const productSales: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      });
    });

    const topProductId = Object.keys(productSales).reduce((a, b) =>
      productSales[a] > productSales[b] ? a : b,
      ""
    );

    const topProduct = topProductId
      ? products.find(p => p.id === topProductId)
      : null;

    setStats({
      total,
      average,
      topProduct: topProduct
        ? { name: topProduct.name, sales: productSales[topProductId] }
        : { name: "N/A", sales: 0 },
      recentSales: filteredSales.slice(-10).reverse(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Relatórios</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Período</span>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos {period} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.average.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Por dia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mais Vendido</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{stats.topProduct.name}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.topProduct.sales} unidades
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda no período
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentSales.map(sale => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">R$ {sale.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString()} -{" "}
                        {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sale.items.length} item(ns)
                    </p>
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

export default Relatorios;

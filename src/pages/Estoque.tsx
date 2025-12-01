import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProducts, Product, getSales } from "@/lib/storage";
import { ArrowLeft, AlertTriangle, TrendingDown, Calendar } from "lucide-react";
import { calculateStockForecast } from "@/lib/export";

const Estoque = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const lowStockProducts = products.filter(p => p.quantity < 5);
  const sales = getSales();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Controle de Estoque</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showForecast ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowForecast(!showForecast)}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Previsão
            </Button>
            <Button onClick={() => navigate("/produtos")}>
              Gerenciar Produtos
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {lowStockProducts.length > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Alerta de Estoque Baixo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lowStockProducts.length} produto(s) com estoque abaixo de 5 unidades
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum produto no estoque.</p>
              <Button className="mt-4" onClick={() => navigate("/produtos")}>
                Cadastrar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const forecast = calculateStockForecast(product, sales);
              
              return (
                <Card key={product.id} className={product.quantity < 5 ? "border-warning" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{product.name}</h3>
                          {product.quantity < 5 && (
                            <Badge variant="outline" className="border-warning text-warning">
                              Estoque Baixo
                            </Badge>
                          )}
                          {showForecast && forecast.needsRestock && (
                            <Badge variant="outline" className="border-destructive text-destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Reabastecer em breve
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
                        
                        {showForecast && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-1">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Previsão de Estoque
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Média de vendas: <span className="font-medium text-foreground">
                                {forecast.averageDailySales.toFixed(1)} unid./dia
                              </span>
                            </p>
                            {forecast.daysUntilStockout !== Infinity ? (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  Estoque acaba em: <span className={`font-medium ${
                                    forecast.needsRestock ? "text-destructive" : "text-foreground"
                                  }`}>
                                    {forecast.daysUntilStockout} dias
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Data prevista: <span className="font-medium text-foreground">
                                    {forecast.forecastDate}
                                  </span>
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Sem vendas recentes para previsão
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-foreground">
                          {product.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">unidades</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Estoque;

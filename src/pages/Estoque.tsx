import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProducts, Product } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const Estoque = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setProducts(getProducts());
  }, [navigate]);

  const lowStockProducts = products.filter(p => p.quantity < 5);

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
          <Button onClick={() => navigate("/produtos")}>
            Gerenciar Produtos
          </Button>
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
            {products.map((product) => (
              <Card key={product.id} className={product.quantity < 5 ? "border-warning" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.quantity < 5 && (
                          <Badge variant="outline" className="border-warning text-warning">
                            Estoque Baixo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
                    </div>
                    <div className="text-right">
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Estoque;

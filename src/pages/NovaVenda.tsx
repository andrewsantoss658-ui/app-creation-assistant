import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProducts, saveSale, Product } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

const NovaVenda = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "pix" | "cartao">("dinheiro");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setProducts(getProducts());
  }, [navigate]);

  const addToCart = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto");
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existingItem = cart.find(item => item.productId === selectedProductId);

    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error("Quantidade maior que o estoque disponível");
        return;
      }
      setCart(cart.map(item =>
        item.productId === selectedProductId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
      }]);
    }

    setSelectedProductId("");
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    const item = cart.find(i => i.productId === productId);
    
    if (!product || !item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.quantity) {
      toast.error("Quantidade maior que o estoque disponível");
      return;
    }

    setCart(cart.map(i =>
      i.productId === productId ? { ...i, quantity: newQuantity } : i
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos à venda");
      return;
    }

    const sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: cart,
      total,
      paymentMethod,
      status: "completed" as const,
    };

    saveSale(sale);
    toast.success("Venda registrada com sucesso!");
    
    if (paymentMethod === "pix") {
      navigate(`/pix/novo?valor=${total}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Nova Venda</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Adicionar produto */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - R$ {product.price.toFixed(2)} (Estoque: {product.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addToCart}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Carrinho */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item adicionado
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {item.price.toFixed(2)} × {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total e Pagamento */}
        {cart.length > 0 && (
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total da Venda</span>
                <span className="text-3xl font-bold">R$ {total.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment" className="text-primary-foreground">
                  Forma de Pagamento
                </Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger id="payment" className="bg-primary-foreground text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleFinalizeSale}
              >
                Finalizar Venda
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default NovaVenda;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { getProducts } from "@/lib/storage";

export default function EstoqueBaixoAlert() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Array<{ name: string; quantity: number }>>([]);

  useEffect(() => {
    checkLowStock();
  }, []);

  const checkLowStock = () => {
    const products = getProducts();
    const criticalProducts = products.filter(p => p.quantity <= 10);
    
    if (criticalProducts.length > 0) {
      setLowStockProducts(criticalProducts.map(p => ({ name: p.name, quantity: p.quantity })));
      setOpen(true);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-warning" />
            </div>
          </div>
          <AlertDialogTitle className="text-3xl font-bold text-center">
            Estoque Baixo!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base pt-4">
            <p className="font-semibold text-foreground mb-2">Produtos Críticos:</p>
            {lowStockProducts.map((product, index) => (
              <p key={index} className="text-foreground">
                {product.name} ({product.quantity} unid.)
              </p>
            ))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              setOpen(false);
              navigate("/estoque");
            }}
            className="w-full h-12 text-lg"
          >
            Verificar Estoque
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

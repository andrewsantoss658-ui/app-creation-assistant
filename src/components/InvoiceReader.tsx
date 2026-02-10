import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ExtractedProduct {
  name: string;
  quantity: number;
  price: number;
  category: string;
  selected: boolean;
}

interface InvoiceReaderProps {
  onProductsConfirmed: (products: { name: string; quantity: number; price: number; category: string }[]) => void;
}

const InvoiceReader = ({ onProductsConfirmed }: InvoiceReaderProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const fileType = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpeg";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-invoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64, fileType }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao processar nota fiscal");
      }

      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        toast.error("Nenhum produto encontrado na nota fiscal.");
        return;
      }

      setProducts(data.products.map((p: any) => ({ ...p, selected: true })));
      setStep("review");
      toast.success(`${data.products.length} produto(s) encontrado(s)!`);
    } catch (error: any) {
      console.error("Erro ao ler nota fiscal:", error);
      toast.error(error.message || "Erro ao processar nota fiscal");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const toggleProduct = (index: number) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleConfirm = () => {
    const selected = products.filter((p) => p.selected);
    if (selected.length === 0) {
      toast.error("Selecione ao menos um produto.");
      return;
    }
    onProductsConfirmed(selected.map(({ selected: _, ...p }) => p));
    setOpen(false);
    setStep("upload");
    setProducts([]);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setStep("upload");
      setProducts([]);
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileText className="w-4 h-4 mr-2" />
        Ler Nota Fiscal
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {step === "upload" ? "Importar Nota Fiscal" : "Produtos Encontrados"}
            </DialogTitle>
          </DialogHeader>

          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envie uma foto ou PDF da nota fiscal. A IA vai extrair os produtos automaticamente.
              </p>

              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
                {loading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                    <span className="text-sm text-muted-foreground">Processando nota fiscal...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                    <span className="text-sm font-medium">Clique para enviar</span>
                    <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG ou WebP (máx. 10MB)</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Revise os produtos e desmarque os que não deseja cadastrar.
              </p>

              <div className="max-h-[350px] overflow-y-auto space-y-2">
                {products.map((product, index) => (
                  <Card key={index} className={`transition-opacity ${!product.selected ? "opacity-50" : ""}`}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <Checkbox
                        checked={product.selected}
                        onCheckedChange={() => toggleProduct(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>Qtd: {product.quantity}</span>
                          <span>R$ {product.price.toFixed(2)}</span>
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep("upload"); setProducts([]); }}>
                  Tentar novamente
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Cadastrar {products.filter((p) => p.selected).length} produto(s)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceReader;

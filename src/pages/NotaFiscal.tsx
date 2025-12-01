import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProducts, getNotasFiscais, saveNotaFiscal, updateNotaFiscalStatus, Product } from "@/lib/storage";
import { formatCpfCnpj, validateCpfCnpj } from "@/lib/validators";
import { ArrowLeft, FileText, Plus, Trash2, Download, X } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface NotaItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

const NotaFiscal = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  
  // Form state
  const [cliente, setCliente] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [items, setItems] = useState<NotaItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProducts());
    setNotas(getNotasFiscais());
  };

  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpj(value);
    setCpfCnpj(formatted);
  };

  const addItem = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (quantity > product.quantity) {
      toast.error("Quantidade indisponível em estoque");
      return;
    }

    const newItem: NotaItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      total: product.price * quantity,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setQuantity(1);
    toast.success("Item adicionado");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleEmitir = () => {
    if (!cliente.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }

    if (!validateCpfCnpj(cpfCnpj)) {
      toast.error("CPF/CNPJ inválido");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    const nota = {
      id: Date.now().toString(),
      numero: `NF-${Date.now().toString().slice(-6)}`,
      cliente,
      cpfCnpj,
      items,
      total: calculateTotal(),
      emitidaEm: new Date().toISOString(),
      status: "emitida" as const,
    };

    saveNotaFiscal(nota);
    generateNotaPDF(nota);
    
    // Reset form
    setCliente("");
    setCpfCnpj("");
    setItems([]);
    loadData();
    
    toast.success("Nota fiscal emitida com sucesso!");
  };

  const generateNotaPDF = (nota: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("NOTA FISCAL", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Número: ${nota.numero}`, 20, 40);
    doc.text(`Data: ${new Date(nota.emitidaEm).toLocaleDateString("pt-BR")}`, 20, 48);
    
    // Cliente
    doc.setFontSize(14);
    doc.text("DADOS DO CLIENTE", 20, 65);
    doc.setFontSize(11);
    doc.text(`Nome: ${nota.cliente}`, 20, 75);
    doc.text(`CPF/CNPJ: ${nota.cpfCnpj}`, 20, 82);
    
    // Items table
    const tableData = nota.items.map((item: NotaItem) => [
      item.productName,
      item.quantity.toString(),
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
    ]);
    
    (doc as any).autoTable({
      startY: 95,
      head: [["Produto", "Qtd", "Valor Unit.", "Total"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: R$ ${nota.total.toFixed(2)}`, 150, finalY, { align: "right" });
    
    doc.save(`nota-fiscal-${nota.numero}.pdf`);
  };

  const handleCancelar = (id: string) => {
    updateNotaFiscalStatus(id, "cancelada");
    loadData();
    toast.success("Nota fiscal cancelada");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Nota Fiscal</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Form de emissão */}
        <Card>
          <CardHeader>
            <CardTitle>Emitir Nova Nota Fiscal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente</Label>
                <Input
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={cpfCnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={18}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Adicionar Produtos</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Produto</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.price.toFixed(2)} (Estoque: {product.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">R$ {item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">TOTAL:</TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        R$ {calculateTotal().toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleEmitir} size="lg">
                <FileText className="w-4 h-4 mr-2" />
                Emitir Nota Fiscal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de notas emitidas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Fiscais Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            {notas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma nota fiscal emitida ainda
              </p>
            ) : (
              <div className="space-y-3">
                {notas.map((nota) => (
                  <div
                    key={nota.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{nota.numero}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          nota.status === "emitida" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100" 
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                        }`}>
                          {nota.status === "emitida" ? "Emitida" : "Cancelada"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {nota.cliente} - {nota.cpfCnpj}
                      </p>
                      <p className="text-sm">
                        {new Date(nota.emitidaEm).toLocaleDateString("pt-BR")} - R$ {nota.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateNotaPDF(nota)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      {nota.status === "emitida" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelar(nota.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>
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

export default NotaFiscal;

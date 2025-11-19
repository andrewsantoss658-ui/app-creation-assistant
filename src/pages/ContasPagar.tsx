import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, ShoppingCart, Droplet, FileText, DollarSign } from "lucide-react";
import { getExpenses, saveExpense, type Expense } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from "date-fns";

export default function ContasPagar() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    dueDate: "",
    category: "",
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const allExpenses = getExpenses();
    // Update overdue status
    const updatedExpenses = allExpenses.map(expense => {
      if (expense.status === "pending" && new Date(expense.dueDate) < new Date()) {
        return { ...expense, status: "overdue" as const };
      }
      return expense;
    });
    setExpenses(updatedExpenses.filter(e => e.status !== "paid"));
  };

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.dueDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      dueDate: newExpense.dueDate,
      status: "pending",
      category: newExpense.category,
      createdAt: new Date().toISOString(),
    };

    saveExpense(expense);
    loadExpenses();
    setIsDialogOpen(false);
    setNewExpense({ name: "", amount: "", dueDate: "", category: "" });
    toast({
      title: "Despesa registrada",
      description: "Despesa adicionada com sucesso",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "aluguel":
        return <Calendar className="h-6 w-6" />;
      case "mercadoria":
        return <ShoppingCart className="h-6 w-6" />;
      case "água":
      case "agua":
        return <Droplet className="h-6 w-6" />;
      case "das":
        return <FileText className="h-6 w-6" />;
      default:
        return <DollarSign className="h-6 w-6" />;
    }
  };

  const getExpenseStatus = (expense: Expense) => {
    if (expense.status === "overdue") {
      return { label: "Vencida", className: "bg-destructive text-destructive-foreground" };
    }
    
    const daysUntilDue = differenceInDays(parseISO(expense.dueDate), new Date());
    if (daysUntilDue <= 5 && daysUntilDue >= 0) {
      return { label: `A Vencer (${daysUntilDue} dias)`, className: "bg-warning text-warning-foreground" };
    }
    
    return null;
  };

  const generateColorCode = (id: string) => {
    const colors = ["#343A40", "#007BFF", "#28A745", "#FFC107"];
    const index = parseInt(id) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary font-bold text-xl">GE</span>
            <span className="text-muted-foreground font-bold text-xl">STUM</span>
          </div>
          <h1 className="text-4xl font-bold">Contas a Pagar</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Acontas pendings</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              {expenses.map((expense) => {
                const status = getExpenseStatus(expense);
                return (
                  <div key={expense.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-muted-foreground">
                        {getCategoryIcon(expense.category || expense.name)}
                      </div>
                      <div>
                        <p className="font-semibold">{expense.name}</p>
                        <p className="text-sm text-muted-foreground">
                          V{expense.amount.toFixed(3).replace(".", "")}
                        </p>
                        {status && (
                          <span className={`inline-block mt-1 px-3 py-1 rounded text-sm font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-base font-mono" style={{ color: generateColorCode(expense.id) }}>
                      #{expense.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 h-16 w-auto px-8 rounded-full shadow-lg"
            >
              <Plus className="mr-2 h-6 w-6" />
              <span className="text-lg">Registrar Despesa</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome da Despesa *</Label>
                <Input
                  id="name"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                  placeholder="Ex: Aluguel, Água, DAS"
                />
              </div>
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newExpense.dueDate}
                  onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  placeholder="Ex: Aluguel, Mercadoria"
                />
              </div>
              <Button onClick={handleAddExpense} className="w-full">
                Registrar Despesa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

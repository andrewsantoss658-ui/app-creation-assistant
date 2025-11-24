// Local storage utilities for GESTUM data

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Sale {
  id: string;
  date: string;
  items: { productId: string; productName: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: "dinheiro" | "pix" | "cartao";
  status: "completed" | "pending";
}

export interface PixCharge {
  id: string;
  amount: number;
  description: string;
  status: "pending" | "paid";
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number; // valor devido
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  category: string;
  createdAt: string;
}

export interface CashFlowEntry {
  id: string;
  type: "entrada" | "saida";
  amount: number;
  description: string;
  date: string;
  category: string;
}

export interface NotaFiscal {
  id: string;
  numero: string;
  cliente: string;
  cpfCnpj: string;
  items: { productName: string; quantity: number; price: number; total: number }[];
  total: number;
  emitidaEm: string;
  status: "emitida" | "cancelada";
}

// Products
export const getProducts = (): Product[] => {
  return JSON.parse(localStorage.getItem("gestum_products") || "[]");
};

export const saveProduct = (product: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  
  localStorage.setItem("gestum_products", JSON.stringify(products));
};

export const deleteProduct = (id: string) => {
  const products = getProducts().filter(p => p.id !== id);
  localStorage.setItem("gestum_products", JSON.stringify(products));
};

export const updateProductQuantity = (id: string, quantity: number) => {
  const products = getProducts();
  const product = products.find(p => p.id === id);
  
  if (product) {
    product.quantity = quantity;
    localStorage.setItem("gestum_products", JSON.stringify(products));
  }
};

// Sales
export const getSales = (): Sale[] => {
  return JSON.parse(localStorage.getItem("gestum_sales") || "[]");
};

export const saveSale = (sale: Sale) => {
  const sales = getSales();
  sales.push(sale);
  localStorage.setItem("gestum_sales", JSON.stringify(sales));
  
  // Update product quantities
  sale.items.forEach(item => {
    const products = getProducts();
    const product = products.find(p => p.id === item.productId);
    if (product) {
      product.quantity -= item.quantity;
      saveProduct(product);
    }
  });
};

// Pix Charges
export const getPixCharges = (): PixCharge[] => {
  return JSON.parse(localStorage.getItem("gestum_pix_charges") || "[]");
};

export const savePixCharge = (charge: PixCharge) => {
  const charges = getPixCharges();
  charges.push(charge);
  localStorage.setItem("gestum_pix_charges", JSON.stringify(charges));
};

export const updatePixChargeStatus = (id: string, status: "pending" | "paid") => {
  const charges = getPixCharges();
  const charge = charges.find(c => c.id === id);
  
  if (charge) {
    charge.status = status;
    localStorage.setItem("gestum_pix_charges", JSON.stringify(charges));
  }
};

// Clients
export const getClients = (): Client[] => {
  return JSON.parse(localStorage.getItem("gestum_clients") || "[]");
};

export const saveClient = (client: Client) => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === client.id);
  
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.push(client);
  }
  
  localStorage.setItem("gestum_clients", JSON.stringify(clients));
};

export const deleteClient = (id: string) => {
  const clients = getClients().filter(c => c.id !== id);
  localStorage.setItem("gestum_clients", JSON.stringify(clients));
};

// Expenses
export const getExpenses = (): Expense[] => {
  return JSON.parse(localStorage.getItem("gestum_expenses") || "[]");
};

export const saveExpense = (expense: Expense) => {
  const expenses = getExpenses();
  expenses.push(expense);
  localStorage.setItem("gestum_expenses", JSON.stringify(expenses));
};

export const updateExpenseStatus = (id: string, status: "pending" | "paid" | "overdue") => {
  const expenses = getExpenses();
  const expense = expenses.find(e => e.id === id);
  
  if (expense) {
    expense.status = status;
    localStorage.setItem("gestum_expenses", JSON.stringify(expenses));
  }
};

// Cash Flow
export const getCashFlowEntries = (): CashFlowEntry[] => {
  return JSON.parse(localStorage.getItem("gestum_cash_flow") || "[]");
};

export const saveCashFlowEntry = (entry: CashFlowEntry) => {
  const entries = getCashFlowEntries();
  entries.push(entry);
  localStorage.setItem("gestum_cash_flow", JSON.stringify(entries));
};

// Notas Fiscais
export const getNotasFiscais = (): NotaFiscal[] => {
  return JSON.parse(localStorage.getItem("gestum_notas_fiscais") || "[]");
};

export const saveNotaFiscal = (nota: NotaFiscal) => {
  const notas = getNotasFiscais();
  notas.push(nota);
  localStorage.setItem("gestum_notas_fiscais", JSON.stringify(notas));
};

export const updateNotaFiscalStatus = (id: string, status: "emitida" | "cancelada") => {
  const notas = getNotasFiscais();
  const nota = notas.find(n => n.id === id);
  
  if (nota) {
    nota.status = status;
    localStorage.setItem("gestum_notas_fiscais", JSON.stringify(notas));
  }
};

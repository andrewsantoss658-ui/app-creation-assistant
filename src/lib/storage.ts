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

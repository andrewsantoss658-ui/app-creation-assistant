import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import NovaVenda from "./pages/NovaVenda";
import Pix from "./pages/Pix";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import MinhaConta from "./pages/MinhaConta";
import Notificacoes from "./pages/Notificacoes";
import Suporte from "./pages/Suporte";
import Caderneta from "./pages/Caderneta";
import ContasPagar from "./pages/ContasPagar";
import FluxoCaixa from "./pages/FluxoCaixa";
import NotFound from "./pages/NotFound";
import EstoqueBaixoAlert from "./components/EstoqueBaixoAlert";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <EstoqueBaixoAlert />
                <Dashboard />
              </Layout>
            }
          />
          <Route path="/produtos" element={<Layout><Produtos /></Layout>} />
          <Route path="/estoque" element={<Layout><Estoque /></Layout>} />
          <Route path="/vendas/nova" element={<Layout><NovaVenda /></Layout>} />
          <Route path="/pix/novo" element={<Layout><Pix /></Layout>} />
          <Route path="/relatorios" element={<Layout><Relatorios /></Layout>} />
          <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
          <Route path="/minha-conta" element={<Layout><MinhaConta /></Layout>} />
          <Route path="/notificacoes" element={<Layout><Notificacoes /></Layout>} />
          <Route path="/suporte" element={<Layout><Suporte /></Layout>} />
          <Route path="/caderneta" element={<Layout><Caderneta /></Layout>} />
          <Route path="/contas-pagar" element={<Layout><ContasPagar /></Layout>} />
          <Route path="/fluxo-caixa" element={<Layout><FluxoCaixa /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

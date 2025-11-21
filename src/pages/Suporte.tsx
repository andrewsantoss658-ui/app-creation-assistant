import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, HelpCircle, MessageCircle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqItems = [
  {
    question: "Como cadastrar um novo produto?",
    answer:
      "Para cadastrar um produto, acesse o menu 'Produtos' na barra lateral e clique no botão 'Adicionar Produto'. Preencha as informações de nome, preço, quantidade e categoria, depois clique em 'Salvar'.",
  },
  {
    question: "Como registrar uma venda?",
    answer:
      "Vá para 'Nova Venda' no menu, selecione os produtos desejados, ajuste as quantidades e escolha a forma de pagamento. Clique em 'Finalizar Venda' para concluir.",
  },
  {
    question: "Como gerar uma cobrança Pix?",
    answer:
      "Acesse 'Pix' no menu lateral, preencha o valor, descrição e dados do cliente. O sistema irá gerar automaticamente um código Pix e QR Code para pagamento.",
  },
  {
    question: "Como controlar o estoque?",
    answer:
      "O estoque é atualizado automaticamente a cada venda. Você pode visualizar e editar manualmente no menu 'Estoque', onde também receberá alertas quando o estoque estiver baixo.",
  },
  {
    question: "Como funciona a Caderneta Digital?",
    answer:
      "A Caderneta permite registrar vendas a prazo e controlar dívidas de clientes. Cadastre clientes, registre compras fiado e acompanhe pagamentos realizados.",
  },
  {
    question: "Como acompanhar minhas contas a pagar?",
    answer:
      "No menu 'Contas a Pagar', você pode registrar todas as despesas do seu negócio, definir datas de vencimento e marcar como pago quando efetuar o pagamento.",
  },
  {
    question: "O que é o Fluxo de Caixa?",
    answer:
      "O Fluxo de Caixa registra todas as entradas e saídas de dinheiro do seu negócio, permitindo acompanhar a saúde financeira em tempo real.",
  },
  {
    question: "Como visualizar relatórios de vendas?",
    answer:
      "Acesse 'Relatórios' no menu para ver gráficos e análises de vendas por período, produtos mais vendidos, formas de pagamento e muito mais.",
  },
];

export default function Suporte() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { text: string; sender: "user" | "support" }[]
  >([
    {
      text: "Olá! Como posso ajudá-lo hoje?",
      sender: "support",
    },
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Adicionar mensagem do usuário
    setChatMessages((prev) => [...prev, { text: message, sender: "user" }]);

    // Simular resposta automática
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          text: "Obrigado pela sua mensagem! Nossa equipe irá responder em breve. Enquanto isso, confira nossas dúvidas frequentes que podem ajudar.",
          sender: "support",
        },
      ]);
    }, 1000);

    setMessage("");
    toast({
      title: "Mensagem enviada",
      description: "Entraremos em contato em breve.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/configuracoes")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Configurações
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Suporte e Ajuda</h1>
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              Dúvidas Frequentes
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Fale Conosco
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Perguntas Frequentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Não encontrou o que procura? Entre em contato conosco pela
                    aba "Fale Conosco" e teremos prazer em ajudá-lo!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Chat de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3 bg-muted/20">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border"
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Digite sua mensagem</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="message"
                        placeholder="Como podemos ajudar você?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 min-h-[60px]"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="self-end"
                        disabled={!message.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pressione Enter para enviar, Shift+Enter para quebrar linha
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Outros canais de contato</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>📧 Email: suporte@gestum.com.br</p>
                      <p>📱 WhatsApp: (11) 98765-4321</p>
                      <p>🕐 Horário de atendimento: Segunda a Sexta, 9h às 18h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

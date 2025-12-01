import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, Package, Zap } from "lucide-react";
import { markOnboardingAsCompleted } from "@/lib/onboarding";

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: WifiOff,
      title: "Registre vendas mesmo offline",
      description: "Não precisa de internet para registrar suas vendas. Sincronizamos automaticamente quando você se conectar.",
    },
    {
      icon: Package,
      title: "Controle de estoque automático",
      description: "Seu estoque é atualizado a cada venda. Receba alertas quando os produtos estiverem acabando.",
    },
    {
      icon: Zap,
      title: "Receba por Pix rapidamente",
      description: "Gere cobranças Pix instantâneas e compartilhe com seus clientes. Acompanhe pagamentos em tempo real.",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      markOnboardingAsCompleted();
      navigate("/dashboard", { replace: true });
    }
  };

  const handleSkip = () => {
    markOnboardingAsCompleted();
    navigate("/dashboard", { replace: true });
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-12 pb-8">
          <div className="text-center space-y-8">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <CurrentIcon className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                {slides[currentSlide].title}
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {slides[currentSlide].description}
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-4">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              {currentSlide < slides.length - 1 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Pular
                </Button>
              )}
              <Button
                size="lg"
                onClick={handleNext}
                className="flex-1"
              >
                {currentSlide < slides.length - 1 ? "Próximo" : "Começar a Gerenciar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;

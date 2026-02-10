import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, Loader2, CheckCircle2, Camera, SwitchCamera, X } from "lucide-react";
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

type Step = "choose" | "upload" | "camera" | "review";

const InvoiceReader = ({ onProductsConfirmed }: InvoiceReaderProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [step, setStep] = useState<Step>("choose");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
      setStep("choose");
    }
  }, [stopCamera]);

  const handleOpenCamera = async () => {
    setCapturedImage(null);
    setStep("camera");
    // small delay so the video element mounts
    setTimeout(() => startCamera(facingMode), 100);
  };

  const handleSwitchCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const processBase64 = async (base64: string, fileType: string) => {
    setLoading(true);
    try {
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
    }
  };

  const handleUseCapturedImage = async () => {
    if (!capturedImage) return;
    const base64 = capturedImage.split(",")[1];
    await processBase64(base64, "jpeg");
  };

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

    const base64 = await fileToBase64(file);
    const fileType = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpeg";
    await processBase64(base64, fileType);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const toggleProduct = (index: number) => {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)));
  };

  const handleConfirm = () => {
    const selected = products.filter((p) => p.selected);
    if (selected.length === 0) {
      toast.error("Selecione ao menos um produto.");
      return;
    }
    onProductsConfirmed(selected.map(({ selected: _, ...p }) => p));
    handleClose(false);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      stopCamera();
      setStep("choose");
      setProducts([]);
      setLoading(false);
      setCapturedImage(null);
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
              {step === "choose" && "Importar Nota Fiscal"}
              {step === "upload" && "Enviar Arquivo"}
              {step === "camera" && "Capturar com Câmera"}
              {step === "review" && "Produtos Encontrados"}
            </DialogTitle>
          </DialogHeader>

          {/* Step: Choose method */}
          {step === "choose" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Escolha como deseja importar sua nota fiscal.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleOpenCamera}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Camera className="w-10 h-10 text-primary" />
                  <span className="text-sm font-medium">Usar Câmera</span>
                  <span className="text-xs text-muted-foreground text-center">Celular ou webcam</span>
                </button>
                <button
                  onClick={() => setStep("upload")}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-primary" />
                  <span className="text-sm font-medium">Enviar Arquivo</span>
                  <span className="text-xs text-muted-foreground text-center">PDF, JPG, PNG</span>
                </button>
              </div>
            </div>
          )}

          {/* Step: Upload file */}
          {step === "upload" && (
            <div className="space-y-4">
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
              <Button variant="ghost" className="w-full" onClick={() => setStep("choose")}>
                Voltar
              </Button>
            </div>
          )}

          {/* Step: Camera */}
          {step === "camera" && (
            <div className="space-y-3">
              {!capturedImage ? (
                <>
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="icon" onClick={handleSwitchCamera} title="Trocar câmera">
                      <SwitchCamera className="w-5 h-5" />
                    </Button>
                    <Button size="lg" onClick={handleCapture} className="px-8">
                      <Camera className="w-5 h-5 mr-2" />
                      Capturar
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => { stopCamera(); setStep("choose"); }} title="Cancelar">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                    <img src={capturedImage} alt="Nota fiscal capturada" className="w-full h-full object-contain" />
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Processando nota fiscal...</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handleRetake}>
                        Tirar outra
                      </Button>
                      <Button className="flex-1" onClick={handleUseCapturedImage}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Usar esta foto
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step: Review products */}
          {step === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Revise os produtos e desmarque os que não deseja cadastrar.
              </p>
              <div className="max-h-[350px] overflow-y-auto space-y-2">
                {products.map((product, index) => (
                  <Card key={index} className={`transition-opacity ${!product.selected ? "opacity-50" : ""}`}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <Checkbox checked={product.selected} onCheckedChange={() => toggleProduct(index)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>Qtd: {product.quantity}</span>
                          <span>R$ {product.price.toFixed(2)}</span>
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{product.category}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep("choose"); setProducts([]); }}>
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

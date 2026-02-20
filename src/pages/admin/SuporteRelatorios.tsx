import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, MessageSquare, ArrowRightLeft, Tag, Download } from "lucide-react";
import { useSupportMetrics } from "@/hooks/useSupportAdvanced";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SuporteRelatorios() {
  const { metrics, loading } = useSupportMetrics();

  const exportPDF = () => {
    if (!metrics) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Suporte - GESTUM", 14, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

    doc.setFontSize(12);
    doc.text("Indicadores Gerais", 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [["Métrica", "Valor"]],
      body: [
        ["Total de Atendimentos", String(metrics.totalConversations)],
        ["Atendimentos Abertos", String(metrics.openConversations)],
        ["Tempo Médio 1ª Resposta (min)", String(metrics.avgFirstResponseMinutes)],
        ["Tempo Médio Resolução (min)", String(metrics.avgResolutionMinutes)],
        ["Taxa de Transferência", `${metrics.transferRate}%`],
      ],
    });

    if (metrics.chatsByTag.length > 0) {
      const lastY = (doc as any).lastAutoTable?.finalY || 100;
      doc.text("Atendimentos por Tag", 14, lastY + 10);
      autoTable(doc, {
        startY: lastY + 15,
        head: [["Tag", "Quantidade"]],
        body: metrics.chatsByTag.map(t => [t.tagName, String(t.count)]),
      });
    }

    doc.save(`relatorio-suporte-${Date.now()}.pdf`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Carregando métricas...</div>;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Suporte</h1>
            <p className="text-muted-foreground">Métricas e indicadores de desempenho</p>
          </div>
        </div>
        <Button onClick={exportPDF}>
          <Download className="h-4 w-4 mr-2" />Exportar PDF
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Total</CardDescription>
            <CardTitle className="text-2xl">{metrics.totalConversations}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Abertos</CardDescription>
            <CardTitle className="text-2xl text-primary">{metrics.openConversations}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" /> 1ª Resposta (min)</CardDescription>
            <CardTitle className="text-2xl">{metrics.avgFirstResponseMinutes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" /> Resolução (min)</CardDescription>
            <CardTitle className="text-2xl">{metrics.avgResolutionMinutes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" /> Transferências</CardDescription>
            <CardTitle className="text-2xl">{metrics.transferRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Team */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atendimentos por Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.chatsByTeam.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {metrics.chatsByTeam.map(t => (
                  <div key={t.teamId} className="flex items-center justify-between">
                    <span className="font-medium">{t.teamName}</span>
                    <Badge variant="secondary">{t.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Tag */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Tag className="h-4 w-4" /> Atendimentos por Tag</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.chatsByTag.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {metrics.chatsByTag.map(t => (
                  <div key={t.tagName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.tagColor }} />
                      <span>{t.tagName}</span>
                    </div>
                    <Badge variant="secondary">{t.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

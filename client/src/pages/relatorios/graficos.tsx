import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useRef, useState } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type GraficosData = {
  crescimento_mensal: Array<{ mes: string; total: number }>;
  distribuicao_tipos: {
    comungantes: number;
    nao_comungantes: number;
  };
  distribuicao_idade: {
    jovens: number;
    adultos: number;
    idosos: number;
  };
  distribuicao_sociedades: Array<{
    sociedade: string;
    total: number;
  }>;
  distribuicao_admissao: {
    batismo: number;
    profissao_fe: number;
    transferencia: number;
    reconciliacao: number;
    jurisdicao: number;
  };
};

export function RelatorioGraficos() {
  const { data: graficos, isLoading } = useQuery<GraficosData>({
    queryKey: ["/api/reports/graficos"],
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!contentRef.current || isExporting) return;

    try {
      setIsExporting(true);

      // Wait for charts to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const content = contentRef.current;
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (doc) => {
          // Ensure tooltips are hidden in PDF
          const tooltips = doc.getElementsByClassName('recharts-tooltip-wrapper');
          Array.from(tooltips).forEach((tooltip: Element) => {
            (tooltip as HTMLElement).style.display = 'none';
          });
        }
      });

      const contentWidth = canvas.width;
      const contentHeight = canvas.height;

      // A4 dimensions in points (pt)
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      // Calculate scaling to fit width
      const scale = pageWidth / contentWidth;
      const scaledHeight = contentHeight * scale;

      const pdf = new jsPDF('p', 'pt', 'a4');
      let position = 0;

      // Add pages as needed
      while (position < scaledHeight) {
        if (position > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          -position,
          pageWidth,
          contentHeight * scale,
          '',
          'FAST'
        );

        position += pageHeight;
      }

      pdf.save('relatorio-grafico.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatarDataGrafico = (crescimentoMensal: Array<{ mes: string; total: number }> = []) => {
    return crescimentoMensal.map(item => ({
      mes: new Date(item.mes).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      total: item.total
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Análise Gráfica</CardTitle>
          <Button 
            onClick={handleExportPDF} 
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </CardHeader>
        <CardContent>
          <div ref={contentRef} className="bg-white p-6 rounded-lg">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : graficos ? (
              <div className="space-y-12">
                {/* Gráfico de Crescimento Mensal */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Crescimento Mensal</h3>
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatarDataGrafico(graficos.crescimento_mensal)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#8884d8" name="Novos Membros" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráficos em Pizza */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Distribuição por Tipo */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Distribuição por Tipo</h3>
                    <div className="w-full aspect-square">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Comungantes', value: graficos.distribuicao_tipos?.comungantes || 0 },
                              { name: 'Não Comungantes', value: graficos.distribuicao_tipos?.nao_comungantes || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0, 1].map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distribuição por Idade */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Distribuição por Idade</h3>
                    <div className="w-full aspect-square">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Jovens (<30)', value: graficos.distribuicao_idade?.jovens || 0 },
                              { name: 'Adultos (30-59)', value: graficos.distribuicao_idade?.adultos || 0 },
                              { name: 'Idosos (60+)', value: graficos.distribuicao_idade?.idosos || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0, 1, 2].map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distribuição por Modo de Admissão */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Distribuição por Modo de Admissão</h3>
                    <div className="w-full aspect-square">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Batismo', value: graficos.distribuicao_admissao?.batismo || 0 },
                              { name: 'Profissão de Fé', value: graficos.distribuicao_admissao?.profissao_fe || 0 },
                              { name: 'Transferência', value: graficos.distribuicao_admissao?.transferencia || 0 },
                              { name: 'Reconciliação', value: graficos.distribuicao_admissao?.reconciliacao || 0 },
                              { name: 'Jurisdição', value: graficos.distribuicao_admissao?.jurisdicao || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0, 1, 2, 3, 4].map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Distribuição por Sociedade Interna */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Distribuição por Sociedade Interna</h3>
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={graficos.distribuicao_sociedades || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sociedade" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#82ca9d" name="Número de Membros" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
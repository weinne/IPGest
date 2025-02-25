import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { FileDown, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useIgrejaContext } from "@/hooks/use-igreja-context";

type Filters = {
  data_inicio?: string;
  data_fim?: string;
};

type Estatisticas = {
  admissoes: {
    batismo: number;
    profissao_fe: number;
    transferencia: number;
  };
  membros: {
    por_tipo: {
      comungantes: number;
      nao_comungantes: number;
    };
    por_sexo: {
      masculino: number;
      feminino: number;
    };
  };
  sociedades: Array<{
    id: number;
    nome: string;
    tipo: string;
    membros_count: number;
  }>;
  lideranca: {
    pastores: number;
    presbiteros: number;
    diaconos: number;
  };
};

export default function EstatisticasReport() {
  const [filters, setFilters] = useState<Filters>({});
  const form = useForm<Filters>();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { igreja, isLoading: isLoadingIgreja } = useIgrejaContext();

  const { data: estatisticas, isLoading: isLoadingData } = useQuery<Estatisticas>({
    queryKey: ["/api/reports/estatisticas", filters],
    enabled: !isLoadingIgreja && !!igreja,
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return fetch(`/api/reports/estatisticas?${params}`).then(res => res.json());
    },
  });

  const handleExportPDF = async () => {
    if (!contentRef.current || isExporting) return;

    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      const content = contentRef.current;
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const contentWidth = canvas.width;
      const contentHeight = canvas.height;

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const scale = pageWidth / contentWidth;
      const scaledHeight = contentHeight * scale;

      const pdf = new jsPDF('p', 'pt', 'a4');
      let position = 0;

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

      pdf.save('relatorio-estatisticas.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => setFilters(data))}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-end space-x-2">
                <Button type="submit">Filtrar</Button>
                <Button type="button" variant="outline" onClick={() => {
                  form.reset();
                  setFilters({});
                }}>
                  Limpar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div ref={contentRef}>
        <Card className="print:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {igreja?.nome}
              </p>
              <CardTitle>Relatório de Estatísticas</CardTitle>
            </div>
            <Button 
              onClick={handleExportPDF}
              disabled={isExporting || isLoadingData || isLoadingIgreja}
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
            {isLoadingData || isLoadingIgreja ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : estatisticas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid-page">
                <Card className="break-inside-avoid">
                  <CardHeader>
                    <CardTitle>Admissões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Por Batismo</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.admissoes?.batismo || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Por Profissão de Fé</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.admissoes?.profissao_fe || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Por Transferência</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.admissoes?.transferencia || 0}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                <Card className="break-inside-avoid">
                  <CardHeader>
                    <CardTitle>Membros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Comungantes</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.membros?.por_tipo?.comungantes || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Não Comungantes</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.membros?.por_tipo?.nao_comungantes || 0}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                <Card className="break-inside-avoid">
                  <CardHeader>
                    <CardTitle>Distribuição por Sexo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Masculino</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.membros?.por_sexo?.masculino || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Feminino</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.membros?.por_sexo?.feminino || 0}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                <Card className="break-inside-avoid">
                  <CardHeader>
                    <CardTitle>Liderança</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Pastores</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.lideranca?.pastores || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Presbíteros</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.lideranca?.presbiteros || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Diáconos</dt>
                        <dd className="text-3xl font-bold">{estatisticas?.lideranca?.diaconos || 0}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                <Card className="break-inside-avoid">
                  <CardHeader>
                    <CardTitle>Sociedades Internas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Nome</th>
                            <th className="text-left py-2">Tipo</th>
                            <th className="text-right py-2">Membros</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estatisticas?.sociedades?.map((sociedade) => (
                            <tr key={sociedade.id} className="border-b">
                              <td className="py-2">{sociedade.nome}</td>
                              <td className="py-2">{sociedade.tipo}</td>
                              <td className="text-right py-2">{sociedade.membros_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
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

type Ocorrencia = {
  tipo: string;
  acao: string;
  data: string;
  descricao: string;
};

export function RelatorioOcorrencias() {
  const [filters, setFilters] = useState<Filters>({});
  const form = useForm<Filters>();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { igreja, isLoading: isLoadingIgreja } = useIgrejaContext();

  const { data: ocorrencias = [], isLoading } = useQuery<Ocorrencia[]>({
    queryKey: ["/api/reports/ocorrencias", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      return fetch(`/api/reports/ocorrencias?${params}`).then(res => res.json());
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

      pdf.save('relatorio-ocorrencias.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = (data: Filters) => {
    const newFilters: Filters = {};
    if (data.data_inicio) newFilters.data_inicio = data.data_inicio;
    if (data.data_fim) newFilters.data_fim = data.data_fim;
    setFilters(newFilters);
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
              onSubmit={form.handleSubmit(handleSubmit)}
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    form.reset();
                    setFilters({});
                  }}
                >
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
              <CardTitle>Relatório de Ocorrências</CardTitle>
            </div>
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
            {isLoading || isLoadingIgreja ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : ocorrencias?.length ? (
              <div className="relative break-inside-avoid-page">
                <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-gray-200" />
                <ul className="space-y-6">
                  {ocorrencias.map((ocorrencia, index) => (
                    <li key={index} className="relative pl-10 break-inside-avoid">
                      <div className="absolute left-0 top-2 w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-primary">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <time className="block text-sm text-gray-500">
                          {new Date(ocorrencia.data).toLocaleDateString()}
                        </time>
                        <p className="mt-2 text-gray-700">{ocorrencia.descricao}</p>
                        <span className="inline-block mt-2 text-sm font-medium text-primary">
                          {ocorrencia.tipo}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhuma ocorrência encontrada no período selecionado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
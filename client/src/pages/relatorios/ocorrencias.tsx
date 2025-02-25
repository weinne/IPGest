import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Printer, Loader2 } from "lucide-react";
import { useState } from "react";

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

  const { data: ocorrencias, isLoading } = useQuery<Ocorrencia[]>({
    queryKey: ["/api/reports/ocorrencias", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return fetch(`/api/reports/ocorrencias?${params}`).then(res => res.json());
    },
  });

  const handlePrint = () => {
    window.print();
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Linha do Tempo</CardTitle>
          <Button onClick={handlePrint} className="print:hidden">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : ocorrencias?.length ? (
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-gray-200" />
              <ul className="space-y-6">
                {ocorrencias.map((ocorrencia, index) => (
                  <li key={index} className="relative pl-10">
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
  );
}
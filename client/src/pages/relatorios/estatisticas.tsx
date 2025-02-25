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

export function RelatorioEstatisticas() {
  const [filters, setFilters] = useState<Filters>({});
  const form = useForm<Filters>();

  const { data: estatisticas, isLoading } = useQuery<Estatisticas>({
    queryKey: ["/api/reports/estatisticas", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return fetch(`/api/reports/estatisticas?${params}`).then(res => res.json());
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

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : estatisticas ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Admissões</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Por Batismo</dt>
                  <dd className="text-3xl font-bold">{estatisticas.admissoes.batismo}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Por Profissão de Fé</dt>
                  <dd className="text-3xl font-bold">{estatisticas.admissoes.profissao_fe}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Por Transferência</dt>
                  <dd className="text-3xl font-bold">{estatisticas.admissoes.transferencia}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membros</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Comungantes</dt>
                  <dd className="text-3xl font-bold">{estatisticas.membros.por_tipo.comungantes}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Não Comungantes</dt>
                  <dd className="text-3xl font-bold">{estatisticas.membros.por_tipo.nao_comungantes}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Sexo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Masculino</dt>
                  <dd className="text-3xl font-bold">{estatisticas.membros.por_sexo.masculino}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Feminino</dt>
                  <dd className="text-3xl font-bold">{estatisticas.membros.por_sexo.feminino}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liderança</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pastores</dt>
                  <dd className="text-3xl font-bold">{estatisticas.lideranca.pastores}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Presbíteros</dt>
                  <dd className="text-3xl font-bold">{estatisticas.lideranca.presbiteros}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Diáconos</dt>
                  <dd className="text-3xl font-bold">{estatisticas.lideranca.diaconos}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
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
                    {estatisticas.sociedades.map((sociedade) => (
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

      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>
    </div>
  );
}
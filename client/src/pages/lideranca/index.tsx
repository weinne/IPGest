import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Lideranca, MandatoLideranca, Pastor, MandatoPastor } from "@shared/schema";
import { Pencil, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { NovaLiderancaDialog } from "./nova-lideranca-dialog";
import { NovoPastorDialog } from "./novo-pastor-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";


const liderancasColumns = [
  {
    accessorKey: "cargo",
    header: "Cargo",
    cell: ({ row }: { row: any }) => {
      const cargo = row.getValue("cargo") as string;
      const cargoMap = {
        presbitero: "Presbítero",
        diacono: "Diácono",
      };
      return cargoMap[cargo as keyof typeof cargoMap] || cargo;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const status = row.getValue("status") as string;
      const statusMap = {
        ativo: "Ativo",
        inativo: "Inativo",
        afastado: "Afastado",
        emerito: "Emérito",
      };
      return statusMap[status as keyof typeof statusMap] || status;
    },
  },
  {
    accessorKey: "mandato.data_inicio",
    header: "Data de Início",
    cell: ({ row }: { row: any }) => {
      const mandato = row.original.mandato as MandatoLideranca;
      if (!mandato?.data_inicio) return "-";
      return format(new Date(mandato.data_inicio), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "mandato.data_fim",
    header: "Data de Término",
    cell: ({ row }: { row: any }) => {
      const mandato = row.original.mandato as MandatoLideranca;
      if (!mandato?.data_fim) return "-";
      return format(new Date(mandato.data_fim), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    id: "historico",
    header: "Histórico",
    cell: ({ row }: { row: any }) => {
      const mandatos = row.original.mandatos as MandatoLideranca[];
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Ver Histórico ({mandatos.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Histórico de Mandatos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {mandatos.map((mandato) => (
                <div key={mandato.id} className="border p-4 rounded-lg">
                  <p>Status: {mandato.status}</p>
                  <p>Eleição: {format(new Date(mandato.data_eleicao), "dd/MM/yyyy")}</p>
                  <p>Início: {format(new Date(mandato.data_inicio), "dd/MM/yyyy")}</p>
                  <p>Término: {mandato.data_fim ? format(new Date(mandato.data_fim), "dd/MM/yyyy") : "-"}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const lideranca = row.original as Lideranca;
      
      return (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedLideranca(lideranca);
              setShowNovaLiderancaDialog(true);
            }}
          >
            Novo Mandato
          </Button>
        </div>
      );e.log(data);
        //Here you should make the API call to add new mandate
      };

      return (
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Novo Mandato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Mandato</DialogTitle>
              </DialogHeader>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <form className="space-y-4">
                  <FormField
                    name="data_eleicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Eleição</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="data_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="data_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                            <SelectItem value="afastado">Afastado</SelectItem>
                            <SelectItem value="emerito">Emérito</SelectItem>
                            <SelectItem value="finalizado">Finalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Salvar</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

const pastoresColumns = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "mandato.tipo_vinculo",
    header: "Tipo de Vínculo",
    cell: ({ row }: { row: any }) => {
      const mandato = row.original.mandato as MandatoPastor;
      if (!mandato?.tipo_vinculo) return "-";
      const tipoMap = {
        eleito: "Eleito",
        designado: "Designado",
      };
      return tipoMap[mandato.tipo_vinculo as keyof typeof tipoMap] || mandato.tipo_vinculo;
    },
  },
  {
    accessorKey: "ano_ordenacao",
    header: "Ano de Ordenação",
  },
  {
    accessorKey: "mandato.data_inicio",
    header: "Data de Início",
    cell: ({ row }: { row: any }) => {
      const mandato = row.original.mandato as MandatoPastor;
      if (!mandato?.data_inicio) return "-";
      return format(new Date(mandato.data_inicio), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "mandato.data_fim",
    header: "Data de Término",
    cell: ({ row }: { row: any }) => {
      const mandato = row.original.mandato as MandatoPastor;
      if (!mandato?.data_fim) return "-";
      return format(new Date(mandato.data_fim), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const pastor = row.original as Pastor;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <Pencil className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function LiderancaPage() {
  const { toast } = useToast();

  const { data: liderancas = [], isLoading: isLoadingLiderancas } = useQuery<Lideranca[]>({
    queryKey: ["/api/liderancas"],
  });

  const { data: mandatosLiderancas = [], isLoading: isLoadingMandatosLiderancas } = useQuery<MandatoLideranca[]>({
    queryKey: ["/api/mandatos/liderancas"],
  });

  const { data: pastores = [], isLoading: isLoadingPastores } = useQuery<Pastor[]>({
    queryKey: ["/api/pastores"],
  });

  const { data: mandatosPastores = [], isLoading: isLoadingMandatosPastores } = useQuery<MandatoPastor[]>({
    queryKey: ["/api/mandatos/pastores"],
  });

  // Combinar lideranças com seus mandatos ativos
  const liderancasComMandatos = liderancas.map(lideranca => ({
    ...lideranca,
    mandato: mandatosLiderancas.find(
      m => m.lideranca_id === lideranca.id && m.status === "ativo"
    ),
    mandatos: mandatosLiderancas.filter(
      m => m.lideranca_id === lideranca.id
    ),
  }));

  // Combinar pastores com seus mandatos ativos
  const pastoresComMandatos = pastores.map(pastor => ({
    ...pastor,
    mandato: mandatosPastores.find(
      m => m.pastor_id === pastor.id && m.status === "ativo"
    ),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Liderança
          </h1>
          <div className="flex gap-4">
            <NovaLiderancaDialog />
            <NovoPastorDialog />
          </div>
        </div>

        <Tabs defaultValue="liderancas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="liderancas">Presbíteros e Diáconos</TabsTrigger>
            <TabsTrigger value="pastores">Pastores</TabsTrigger>
          </TabsList>

          <TabsContent value="liderancas">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Presbíteros e Diáconos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingLiderancas || isLoadingMandatosLiderancas ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <DataTable 
                    columns={liderancasColumns} 
                    data={liderancasComMandatos} 
                    searchColumn="cargo"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pastores">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pastores</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPastores || isLoadingMandatosPastores ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <DataTable 
                    columns={pastoresColumns} 
                    data={pastoresComMandatos} 
                    searchColumn="nome"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
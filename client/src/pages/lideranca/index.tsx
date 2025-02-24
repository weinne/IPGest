import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Lideranca, Pastor } from "@shared/schema";
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
    accessorKey: "data_inicio",
    header: "Data de Início",
    cell: ({ row }: { row: any }) => {
      const date = row.getValue("data_inicio") as string;
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "data_fim",
    header: "Data de Término",
    cell: ({ row }: { row: any }) => {
      const date = row.getValue("data_fim") as string;
      return date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const lideranca = row.original as Lideranca;

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

const pastoresColumns = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "tipo_vinculo",
    header: "Tipo de Vínculo",
    cell: ({ row }: { row: any }) => {
      const tipo = row.getValue("tipo_vinculo") as string;
      const tipoMap = {
        efetivo: "Efetivo",
        designado: "Designado",
      };
      return tipoMap[tipo as keyof typeof tipoMap] || tipo;
    },
  },
  {
    accessorKey: "ano_ordenacao",
    header: "Ano de Ordenação",
  },
  {
    accessorKey: "data_inicio",
    header: "Data de Início",
    cell: ({ row }: { row: any }) => {
      const date = row.getValue("data_inicio") as string;
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "data_fim",
    header: "Data de Término",
    cell: ({ row }: { row: any }) => {
      const date = row.getValue("data_fim") as string;
      return date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : "-";
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

  const { data: pastores = [], isLoading: isLoadingPastores } = useQuery<Pastor[]>({
    queryKey: ["/api/pastores"],
  });

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
                {isLoadingLiderancas ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <DataTable 
                    columns={liderancasColumns} 
                    data={liderancas} 
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
                {isLoadingPastores ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <DataTable 
                    columns={pastoresColumns} 
                    data={pastores} 
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
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Lideranca, MandatoLideranca, Pastor, MandatoPastor } from "@shared/schema";
import { Pencil, Eye, MoreHorizontal, ClipboardList } from "lucide-react";
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
import React from 'react';
import { GerenciarMandatosDialog } from "./gerenciar-mandatos-dialog";
import { GerenciarMandatosPastorDialog } from "./gerenciar-mandatos-pastor-dialog";

// Helper function to check if a mandate is expired
const checkMandatoStatus = (mandato: MandatoLideranca | MandatoPastor | undefined) => {
  if (!mandato) return undefined;

  if (mandato.status !== "ativo") return mandato.status;

  if (mandato.data_fim) {
    const endDate = new Date(mandato.data_fim);
    if (endDate < new Date()) {
      return "inativo";
    }
  }

  return mandato.status;
};

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
      const mandato = row.original.mandato as MandatoLideranca;
      const status = checkMandatoStatus(mandato);
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
        <div className="text-center">
          {mandatos.length} mandato{mandatos.length === 1 ? '' : 's'}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const lideranca = row.original as Lideranca;
      const mandatos = row.original.mandatos as MandatoLideranca[];
      const [mandatosDialogOpen, setMandatosDialogOpen] = React.useState(false);

      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMandatosDialogOpen(true)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Gerir Mandatos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <GerenciarMandatosDialog
            lideranca={lideranca}
            mandatos={mandatos}
            open={mandatosDialogOpen}
            onOpenChange={setMandatosDialogOpen}
          />
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: any }) => {
      const mandato = row.original.mandato as MandatoPastor;
      const status = checkMandatoStatus(mandato);
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
      const mandatos = row.original.mandatos as MandatoPastor[];
      const [mandatosDialogOpen, setMandatosDialogOpen] = React.useState(false);

      return (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMandatosDialogOpen(true)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Gerir Mandatos
              </DropdownMenuItem>
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

          <GerenciarMandatosPastorDialog
            pastor={pastor}
            mandatos={mandatos}
            open={mandatosDialogOpen}
            onOpenChange={setMandatosDialogOpen}
          />
        </div>
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

  const pastoresComMandatos = React.useMemo(() => {
    return pastores.map((pastor: Pastor) => {
      const allMandatos = mandatosPastores.filter(m => m.pastor_id === pastor.id);
      const activeMandate = allMandatos.find(m => m.status === "ativo");

      return {
        ...pastor,
        mandato: activeMandate,
        mandatos: allMandatos,
      };
    });
  }, [pastores, mandatosPastores]);

  const liderancasComMandatos = React.useMemo(() => {
    return liderancas.map((lideranca: Lideranca) => {
      const allMandatos = mandatosLiderancas.filter(m => m.lideranca_id === lideranca.id);
      const activeMandate = allMandatos.find(m => m.status === "ativo");

      return {
        ...lideranca,
        mandato: activeMandate,
        mandatos: allMandatos,
      };
    });
  }, [liderancas, mandatosLiderancas]);

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
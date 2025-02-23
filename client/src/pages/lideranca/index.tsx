import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Lideranca } from "@shared/schema";
import { UserPlus, Pencil, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const columns = [
  {
    accessorKey: "cargo",
    header: "Cargo",
    cell: ({ row }) => {
      const cargo = row.getValue("cargo") as string;
      const cargoMap = {
        pastor: "Pastor",
        presbitero: "Presbítero",
        diacono: "Diácono",
      };
      return cargoMap[cargo as keyof typeof cargoMap] || cargo;
    },
  },
  {
    accessorKey: "data_inicio",
    header: "Data de Início",
    cell: ({ row }) => {
      const date = row.getValue("data_inicio") as string;
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "data_fim",
    header: "Data de Término",
    cell: ({ row }) => {
      const date = row.getValue("data_fim") as string;
      return date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
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

export default function LiderancaPage() {
  const { toast } = useToast();

  const { data: liderancas = [], isLoading } = useQuery<Lideranca[]>({
    queryKey: ["/api/liderancas"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Liderança
          </h1>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Nova Liderança
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Lideranças</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <DataTable 
                columns={columns} 
                data={liderancas} 
                searchColumn="cargo"
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
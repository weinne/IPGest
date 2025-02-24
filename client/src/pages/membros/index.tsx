import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Membro } from "@shared/schema";
import { Pencil, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { NovoMembroDialog } from "./novo-membro-dialog";
import { EditarMembroDialog } from "./editar-membro-dialog";
import { useState } from "react";

const columns = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }: { row: any }) => {
      const tipo = row.getValue("tipo") as string;
      return tipo === "comungante" ? "Comungante" : "Não Comungante";
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
        disciplina: "Em Disciplina",
      };
      return statusMap[status as keyof typeof statusMap] || status;
    },
  },
  {
    accessorKey: "data_admissao",
    header: "Data de Admissão",
    cell: ({ row }: { row: any }) => {
      const date = row.getValue("data_admissao") as string;
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const membro = row.original as Membro;
      const [open, setOpen] = useState(false);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <Pencil className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <EditarMembroDialog 
            membro={membro} 
            open={open} 
            onOpenChange={setOpen}
          />
        </>
      );
    },
  },
];

export default function MembrosPage() {
  const { toast } = useToast();

  const { data: membros = [], isLoading } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Membros
          </h1>
          <NovoMembroDialog />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <DataTable 
                columns={columns} 
                data={membros} 
                searchColumn="nome"
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
import { useState } from "react";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersRound, Pencil, Eye } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Grupo, InsertGrupo } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { FormDialog } from "@/components/ui/form-dialog";
import { GrupoForm } from "@/components/forms/grupo-form";
import { apiRequest, queryClient } from "@/lib/queryClient";

const columns = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as string;
      const tipoMap = {
        UCP: "UCP",
        UPA: "UPA",
        UMP: "UMP",
        SAF: "SAF",
        UPH: "UPH",
        outro: "Outro",
      };
      return tipoMap[tipo as keyof typeof tipoMap] || tipo;
    },
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const grupo = row.original as Grupo;

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

export default function GruposPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: grupos = [], isLoading } = useQuery<Grupo[]>({
    queryKey: ["/api/grupos"],
  });

  const createGrupoMutation = useMutation({
    mutationFn: async (data: InsertGrupo) => {
      const response = await apiRequest("POST", "/api/grupos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Grupo criado",
        description: "O grupo foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Grupos e Sociedades
          </h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UsersRound className="mr-2 h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sociedades Internas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <DataTable 
                columns={columns} 
                data={grupos} 
                searchColumn="nome"
              />
            )}
          </CardContent>
        </Card>

        <FormDialog
          title="Novo Grupo"
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        >
          <GrupoForm
            onSubmit={(data) => createGrupoMutation.mutate(data)}
            isSubmitting={createGrupoMutation.isPending}
          />
        </FormDialog>
      </main>
    </div>
  );
}
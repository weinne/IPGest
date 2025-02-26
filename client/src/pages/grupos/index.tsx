import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersRound, Pencil, Trash2 } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Grupo, type Membro } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { NovoGrupoDialog } from "./novo-grupo-dialog";
import { EditarGrupoDialog } from "./editar-grupo-dialog";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function GruposPage() {
  const { toast } = useToast();
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: grupos = [], isLoading: isLoadingGrupos } = useQuery<Grupo[]>({
    queryKey: ["/api/grupos"],
  });

  // Query for group members
  const { data: selectedGrupoMembros = [], isLoading: isLoadingGrupoMembros } = useQuery({
    queryKey: ["/api/grupos", selectedGrupoId, "membros"],
    enabled: selectedGrupoId !== null, //removed && dialogOpen
    onSuccess: (data) => {
      console.log("=== Group Members Loading ===");
      console.log("Selected Group ID:", selectedGrupoId);
      console.log("Loaded members data:", data);
      console.log("=========================");
    },
    onError: (error) => {
      console.error("Error loading group members:", error);
      toast({
        title: "Erro ao carregar membros",
        description: "Não foi possível carregar os membros do grupo.",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/grupos/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos"] });
      toast({
        title: "Grupo excluído",
        description: "O grupo foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        const tipoMap = {
          UCP: "UCP",
          UPA: "UPA",
          UMP: "UMP",
          SAF: "SAF",
          UPH: "UPH",
          ESTATISTICA: "Departamento de Estatística",
          DIACONIA: "Departamento de Ação Social",
          EVANGELIZACAO: "Departamento de Evangelização",
          ENSINO: "Departamento de Ensino",
          COMUNICACAO: "Departamento de Comunicação",
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.getValue("status") as string;
        return status === "ativo" ? "Ativo" : "Inativo";
      },
    },
    {
      accessorKey: "membros_count",
      header: "Membros",
      cell: ({ row }: { row: any }) => {
        const count = row.getValue("membros_count") as number;
        return (
          <div className="flex items-center">
            <UsersRound className="mr-2 h-4 w-4" />
            {count || 0}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => {
        const grupo = row.original as Grupo;
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
                <DropdownMenuItem 
                  onClick={() => {
                    console.log("Opening edit dialog for group:", grupo.id);
                    setSelectedGrupoId(grupo.id);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este grupo?")) {
                      deleteMutation.mutate(grupo.id);
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedGrupoId === grupo.id && (
              <EditarGrupoDialog 
                grupo={grupo}
                initialMembers={selectedGrupoMembros}
                open={dialogOpen} 
                onOpenChange={(open) => {
                  console.log("Dialog state change:", {
                    open,
                    selectedGrupoId,
                    membersCount: selectedGrupoMembros?.length,
                    membersData: selectedGrupoMembros
                  });
                  if (!open) {
                    setSelectedGrupoId(null);
                  }
                  setDialogOpen(open);
                }} 
                initialMembers={selectedGrupoMembros}
              />
            )}
          </>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Grupos e Sociedades</h1>
          <NovoGrupoDialog />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sociedades Internas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGrupos ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <DataTable columns={columns} data={grupos} searchColumn="nome" />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Membro } from "@shared/schema";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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
import { useState, useRef, useCallback, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const columns = [
  {
    accessorKey: "foto",
    header: "",
    cell: ({ row }: { row: any }) => {
      const foto = row.getValue("foto") as string | null;
      return (
        <Avatar className="h-10 w-10">
          {foto ? (
            <AvatarImage src={`/uploads/${foto}`} alt="Foto do membro" />
          ) : (
            <AvatarFallback>
              <UserCircle className="h-6 w-6" />
            </AvatarFallback>
          )}
        </Avatar>
      );
    },
  },
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
      const queryClient = useQueryClient();
      const { toast } = useToast();
      const { user } = useAuth();

      const deleteMutation = useMutation({
        mutationFn: async () => {
          const res = await apiRequest("DELETE", `/api/membros/${membro.id}`);
          return res.json();
        },
        onSuccess: () => {
          // Include igreja_id in the query key for proper cache invalidation
          queryClient.invalidateQueries({ queryKey: ["/api/membros", user?.igreja_id] });
          toast({
            title: "Membro excluído",
            description: "O membro foi excluído com sucesso.",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Erro ao excluir membro",
            description: error.message,
            variant: "destructive",
          });
        },
      });

      return (
        <>
          <ThemeToggle />
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
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir este membro?")) {
                    deleteMutation.mutate();
                  }
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const observerElem = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/membros", user?.igreja_id],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiRequest("GET", `/api/membros?page=${pageParam}`);
      return res.json();
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length === 0) return undefined;
      return pages.length + 1;
    },
    enabled: !!user?.igreja_id,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (observerElem.current) observer.observe(observerElem.current);
    return () => {
      if (observerElem.current) observer.unobserve(observerElem.current);
    };
  }, [handleObserver]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries(["/api/membros", user?.igreja_id]);
    };
  }, [queryClient, user?.igreja_id]);

  const membros = data?.pages.flat() || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Membros</h1>
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
              <>
                <DataTable columns={columns} data={membros} searchColumn="nome" />
                <div ref={observerElem} className="h-10" />
                {isFetchingNextPage && (
                  <div className="text-center py-4">Carregando mais...</div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

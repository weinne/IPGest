import { useState } from "react";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { User } from "@shared/schema";
import { NovoUsuarioDialog } from "./novo-usuario-dialog";
import { UserPlus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle"; // Added import

const columns = [
  {
    accessorKey: "username",
    header: "Nome de usuário",
  },
  {
    accessorKey: "role",
    header: "Perfil",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return role === "administrador" ? "Administrador" : "Comum";
    },
  },
];

export default function UsuariosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: usuarios = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
      <ThemeToggle />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Usuários</h1>
          <NovoUsuarioDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </NovoUsuarioDialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de UsuáriosUsuários</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={usuarios} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

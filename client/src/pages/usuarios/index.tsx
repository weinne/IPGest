import { useState } from "react";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { User } from "@shared/schema";
import { NovoUsuarioDialog } from "./novo-usuario-dialog";
import { UserPlus } from "lucide-react";

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
    <div className="flex min-h-screen flex-col gap-8 p-8">
      <Navigation />
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Usuários</CardTitle>
            <NovoUsuarioDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </NovoUsuarioDialog>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={usuarios}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

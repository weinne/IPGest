import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersRound } from "lucide-react";

export default function GruposPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Grupos e Sociedades
          </h1>
          <Button>
            <UsersRound className="mr-2 h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sociedades Internas</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Implement groups grid */}
            <p className="text-muted-foreground">
              Implementar grid de grupos e sociedades...
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

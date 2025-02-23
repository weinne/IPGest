import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function LiderancaPage() {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pastores</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement pastors list */}
              <p className="text-muted-foreground">
                Implementar lista de pastores...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presbíteros</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement elders list */}
              <p className="text-muted-foreground">
                Implementar lista de presbíteros...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diáconos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement deacons list */}
              <p className="text-muted-foreground">
                Implementar lista de diáconos...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

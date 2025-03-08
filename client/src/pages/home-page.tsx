import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  UsersRound,
  ChevronRight,
  FileText,
  CreditCard,
} from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "administrador";

  // Buscar assinatura atual
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription");
      return response.json();
    },
  });

  // Verificar se tem plano Pro
  const hasPro = subscription?.status === "active" && subscription?.plan_id === import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_ID;

  const cards = [
    {
      title: "Gestão de Membros",
      description: "Cadastre e gerencie membros comungantes e não-comungantes",
      icon: Users,
      link: "/membros",
      available: true, // Sempre disponível
    },
    {
      title: "Sociedades Internas",
      description: "Administre UCP, UPA, UMP, SAF, UPH e outros grupos",
      icon: UsersRound,
      link: "/grupos",
      available: hasPro,
    },
    {
      title: "Liderança",
      description: "Controle de pastores, presbíteros e diáconos",
      icon: UserPlus,
      link: "/lideranca",
      available: hasPro,
    },
    {
      title: "Relatórios",
      description: "Estatísticas, gráficos e relatórios da igreja",
      icon: FileText,
      link: "/relatorios",
      available: hasPro,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ThemeToggle />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {!hasPro && (
          <Alert className="mb-8">
            <AlertDescription className="flex items-center justify-between">
              <span>
                Você está usando o plano gratuito. Faça upgrade para o plano Pro e tenha acesso a todos os recursos!
              </span>
              <Link href="/assinaturas">
                <Button variant="outline" size="sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Fazer Upgrade
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.link} href={card.available ? card.link : "/assinaturas"}>
                <Card 
                  className={cn(
                    "hover:bg-green-50 dark:hover:bg-green-950/50 cursor-pointer transition-colors",
                    !card.available && "opacity-50"
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                    <div className="flex items-center pt-4 text-green-800">
                      <span className="text-sm font-medium">
                        {card.available ? "Acessar" : "Fazer Upgrade"}
                      </span>
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

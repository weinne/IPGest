import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  UsersRound,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const cards = [
    {
      title: "Gestão de Membros",
      description: "Cadastre e gerencie membros comungantes e não-comungantes",
      icon: Users,
      link: "/membros",
    },
    {
      title: "Sociedades Internas",
      description: "Administre UCP, UPA, UMP, SAF, UPH e outros grupos",
      icon: UsersRound,
      link: "/grupos",
    },
    {
      title: "Liderança",
      description: "Controle de pastores, presbíteros e diáconos",
      icon: UserPlus,
      link: "/lideranca",
    },
    {
      title: "Relatórios",
      description: "Estatísticas, gráficos e relatórios da igreja",
      icon: FileText,
      link: "/relatorios",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ThemeToggle />
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Painel de Gestão
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.link} href={card.link}>
                <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
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
                      <span className="text-sm font-medium">Acessar</span>
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

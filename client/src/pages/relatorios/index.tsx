import Navigation from "@/components/layout/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MembrosReport from "./membros";
import EstatisticasReport from "./estatisticas";
import { RelatorioOcorrencias } from "./ocorrencias";
import { RelatorioGraficos } from "./graficos";
import { ThemeToggle } from "@/components/theme-toggle"; // Added import

export default function RelatoriosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      <ThemeToggle />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Relatórios</h1>

        <Tabs defaultValue="membros" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          </TabsList>

          <TabsContent value="membros">
            <MembrosReport />
          </TabsContent>

          <TabsContent value="estatisticas">
            <EstatisticasReport />
          </TabsContent>

          <TabsContent value="graficos">
            <RelatorioGraficos />
          </TabsContent>

          <TabsContent value="ocorrencias">
            <RelatorioOcorrencias />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

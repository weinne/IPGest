import Navigation from "@/components/layout/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { RelatorioMembros } from "./membros";
import { RelatorioEstatisticas } from "./estatisticas";
import { RelatorioOcorrencias } from "./ocorrencias";
import { RelatorioGraficos } from "./graficos";

export default function RelatoriosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Relatórios
        </h1>

        <Tabs defaultValue="membros" className="space-y-6">
          <TabsList>
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          </TabsList>

          <TabsContent value="membros">
            <RelatorioMembros />
          </TabsContent>

          <TabsContent value="estatisticas">
            <RelatorioEstatisticas />
          </TabsContent>

          <TabsContent value="ocorrencias">
            <RelatorioOcorrencias />
          </TabsContent>

          <TabsContent value="graficos">
            <RelatorioGraficos />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

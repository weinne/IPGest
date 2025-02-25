
import { PageContainer } from "@/components/layout/page-container";
import { ThemeToggle } from "@/components/theme-toggle";
import Navigation from "@/components/layout/navigation";

export default function ConfiguracoesPage() {
  return (
    <PageContainer>
      <ThemeToggle />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Configurações</h1>
        {/* Conteúdo das configurações virá aqui */}
      </main>
    </PageContainer>
  );
}

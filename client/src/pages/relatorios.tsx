
import { PageContainer } from "@/components/layout/page-container";
import { ThemeToggle } from "@/components/theme-toggle";
import Navigation from "@/components/layout/navigation";

export default function RelatoriosPage() {
  return (
    <PageContainer>
      <ThemeToggle />
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Relatórios</h1>
        {/* Conteúdo dos relatórios virá aqui */}
      </main>
    </PageContainer>
  );
}

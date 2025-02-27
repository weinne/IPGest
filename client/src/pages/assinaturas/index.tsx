import { useMutation } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard } from "lucide-react";

export default function AssinaturasPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/subscription-portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível acessar o portal de assinaturas. " + error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center space-y-8">
          <h1 className="text-3xl font-bold">Assinaturas</h1>

          <div className="text-center max-w-2xl">
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Gerencie sua assinatura e planos através do portal seguro do Stripe.
            </p>

            <Button 
              size="lg"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              {portalMutation.isPending ? "Carregando..." : "Acessar Portal de Assinaturas"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
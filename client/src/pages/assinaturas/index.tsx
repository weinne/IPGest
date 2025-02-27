import { useMutation } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Loader2 } from "lucide-react";

// Plano em produção
const PLANO = {
  id: "prod_Rqn8FO2oF9OF4w",
  name: "Plano Pro",
  description: "Plano completo para gestão da igreja",
  features: [
    { name: "Gestão de membros" },
    { name: "Relatórios e estatísticas" },
    { name: "Controle de grupos e sociedades" },
    { name: "Gestão de liderança" },
  ],
  price_id: "price_1Qx5Y4D80OO610Mc4iLE1K5d",
  unit_amount: 40,
  currency: "brl"
};

export default function AssinaturasPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-checkout-session", { priceId });
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
        description: "Não foi possível iniciar o processo de assinatura. " + error.message,
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/subscription-portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
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
          <h1 className="text-3xl font-bold">Planos e Assinaturas</h1>

          <div className="grid gap-8 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-semibold">{PLANO.name}</h3>
              <p className="text-3xl font-bold mt-4">
                R$ {PLANO.unit_amount.toFixed(2)}<span className="text-sm">/mês</span>
              </p>

              <ul className="mt-6 space-y-4">
                {PLANO.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="h-5 w-5 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="ml-3">{feature.name}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-8"
                onClick={() => checkoutMutation.mutate(PLANO.price_id)}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                Assinar Agora
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Já é assinante? Gerencie sua assinatura através do portal seguro.
            </p>

            <Button 
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-5 w-5" />
              )}
              Gerenciar Assinatura
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
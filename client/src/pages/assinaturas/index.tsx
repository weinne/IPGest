import { useMutation, useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Loader2, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Debug das variáveis de ambiente
console.log('[Env Debug] Todas as variáveis:', {
  FREE_PROD_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID,
  FREE_PRICE_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_PRICE_ID,
  PRO_PROD_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_ID,
  PRO_PRICE_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_PRICE_ID,
});

// Planos
const PLANOS = [
  {
    id: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID,
    priceId: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_PRICE_ID,
    name: "Plano Free",
    description: "Plano gratuito para gestão básica",
    price: 0,
    features: [
      { id: 'free-1', name: "Gestão de membros" },
      { id: 'free-2', name: "1 usuário" },
    ],
  },
  {
    id: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_ID,
    priceId: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_PRICE_ID,
    name: "Plano Pro",
    description: "Plano completo para gestão da igreja",
    price:39.90,
    features: [
      { id: 'pro-1', name: "Gestão de membros" },
      { id: 'pro-2', name: "Gestão financeira" },
      { id: 'pro-3', name: "Usuários ilimitados" },
      { id: 'pro-4', name: "Suporte prioritário" },
    ],
  },
];

console.log('[Planos] Free Price ID:', import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_PRICE_ID);
console.log('[Planos] Pro Price ID:', import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_PRICE_ID);

export default function AssinaturasPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Buscar assinatura atual
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription");
      return response.json();
    },
  });

  const handleSubscribe = async (priceId: string) => {
    console.log('[Checkout] Iniciando com priceId:', priceId);
    console.log('[Debug] Variáveis de ambiente:', {
      FREE_PROD_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID,
      FREE_PRICE_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_PRICE_ID,
      PRO_PROD_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_ID,
      PRO_PRICE_ID: import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_PRICE_ID,
    });

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      console.log('[Checkout] Response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('[Checkout] Content-Type:', contentType);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao criar sessão de checkout: ${error.message}`);
      }

      const data = await response.json();
      console.log('[Checkout] Response data:', data);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não encontrada na resposta');
      }
    } catch (error) {
      console.error('[Checkout] Erro:', error);
      if (error instanceof Error) {
        toast({
          title: "Erro",
          description: error.message || 'Não foi possível iniciar o processo de assinatura.',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: 'Não foi possível iniciar o processo de assinatura.',
          variant: "destructive",
        });
      }
    }
  };

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/subscriptions/portal");
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

          {subscription?.status === "active" && subscription?.plan_id === import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID && (
            <Alert>
              <AlertDescription>
                Você está usando o plano gratuito. Faça upgrade para o plano Pro e tenha acesso a todos os recursos!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {PLANOS.map((plano) => (
              <div 
                key={plano.id} 
                className={cn(
                  "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8",
                  plano.id === import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PROD_ID && "ring-2 ring-green-500"
                )}
              >
                <h3 className="text-2xl font-semibold">{plano.name}</h3>
                <p className="text-3xl font-bold mt-4">
                  {plano.price === 0 ? (
                    "Grátis"
                  ) : (
                    <>
                      R$ {plano.price.toFixed(2)}<span className="text-sm">/mês</span>
                    </>
                  )}
                </p>

                <ul className="mt-6 space-y-4">
                  {plano.features.map((feature) => (
                    <li key={feature.id} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="ml-3">{feature.name}</span>
                    </li>
                  ))}
                </ul>

                {subscription?.status === "active" ? (
                  subscription?.plan_id === plano.id ? (
                    <Button
                      className="w-full mt-8"
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                    >
                      {portalMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-5 w-5" />
                      )}
                      Gerenciar Plano Atual
                    </Button>
                  ) : plano.id === import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID ? (
                    <Button
                      className="w-full mt-8"
                      disabled={true}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Plano Gratuito
                    </Button>
                  ) : (
                    <Button
                      className="w-full mt-8"
                      onClick={() => handleSubscribe(plano.priceId)}
                      disabled={portalMutation.isPending}
                    >
                      {portalMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-5 w-5" />
                      )}
                      Mudar para este Plano
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full mt-8"
                    onClick={() => handleSubscribe(plano.priceId)}
                    disabled={portalMutation.isPending || (plano.id === import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID)}
                  >
                    {portalMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-5 w-5" />
                    )}
                    {plano.id === import.meta.env.VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID ? 'Plano Gratuito' : 'Assinar Agora'}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {subscription?.status === "active" && (
            <div className="text-center mt-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Gerencie sua assinatura através do portal seguro.
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
          )}
        </div>
      </main>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type StripePlan = {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  price_id: string;
  unit_amount: number;
  currency: string;
};

export default function AssinaturasPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: plans = [], isLoading } = useQuery<StripePlan[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: !!user?.igreja_id,
  });

  // Consulta a assinatura atual da igreja
  const { data: currentSubscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ["/api/subscriptions/current"],
    enabled: !!user?.igreja_id,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Assinaturas</h1>
        </div>

        {currentSubscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Assinatura Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Status: {currentSubscription.status}</p>
                <p>Válido até: {new Date(currentSubscription.current_period_end).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p>Carregando planos...</p>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                    <ul className="space-y-2">
                      {plan.features?.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span>• {feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4">
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: plan.currency.toUpperCase(),
                        }).format(plan.unit_amount)}
                        <span className="text-sm font-normal">/mês</span>
                      </p>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        window.location.href = `https://billing.stripe.com/p/login/test_${plan.price_id}`;
                      }}
                    >
                      Assinar Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
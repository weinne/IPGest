import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Check } from "lucide-react";

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

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing-portal");
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Assinaturas</h1>
          {user?.igreja_id && (
            <Button 
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {portalMutation.isPending ? "Carregando..." : "Gerenciar Assinatura"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando planos...</p>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>

                    <div className="py-4">
                      <p className="text-3xl font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: plan.currency.toUpperCase(),
                        }).format(plan.unit_amount)}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      {plan.features?.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full"
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
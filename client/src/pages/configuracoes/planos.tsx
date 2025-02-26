import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const planoFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  preco: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Preço deve ser um número positivo",
  }),
  intervalo: z.enum(["mensal", "trimestral", "semestral", "anual"], {
    required_error: "Selecione o intervalo",
  }),
  caracteristicas: z.string().optional(),
});

type PlanoFormValues = z.infer<typeof planoFormSchema>;

export default function PlanosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch existing plans
  const { data: planos, isLoading } = useQuery({
    queryKey: ["/api/stripe"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stripe");
      return res.json();
    },
  });

  const form = useForm<PlanoFormValues>({
    resolver: zodResolver(planoFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      preco: "",
      intervalo: "mensal",
      caracteristicas: "",
    },
  });

  const createPlanoMutation = useMutation({
    mutationFn: async (values: PlanoFormValues) => {
      const planoData = {
        ...values,
        preco: Number(values.preco),
        caracteristicas: values.caracteristicas
          ? values.caracteristicas.split("\n")
          : [],
      };
      const res = await apiRequest("POST", "/api/stripe/plans", planoData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe"] });
      toast({
        title: "Plano criado",
        description: "O plano de assinatura foi criado com sucesso.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PlanoFormValues) => {
    createPlanoMutation.mutate(values);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Planos de Assinatura</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form to create new plan */}
          <Card>
            <CardHeader>
              <CardTitle>Novo Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Plano</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intervalo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o intervalo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caracteristicas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Características (uma por linha)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            as="textarea"
                            className="h-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={createPlanoMutation.isPending}
                  >
                    {createPlanoMutation.isPending
                      ? "Criando..."
                      : "Criar Plano"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* List of existing plans */}
          <Card>
            <CardHeader>
              <CardTitle>Planos Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : planos?.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhum plano cadastrado ainda.
                </p>
              ) : (
                <div className="space-y-4">
                  {planos?.map((plano: any) => (
                    <Card key={plano.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{plano.nome}</h3>
                            <p className="text-sm text-muted-foreground">
                              {plano.descricao}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              R$ {Number(plano.preco).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {plano.intervalo}
                            </p>
                          </div>
                        </div>
                        {plano.caracteristicas?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {plano.caracteristicas.map(
                              (caracteristica: string, index: number) => (
                                <li
                                  key={index}
                                  className="text-sm text-muted-foreground"
                                >
                                  • {caracteristica}
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

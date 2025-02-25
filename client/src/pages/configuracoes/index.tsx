import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useIgrejaContext } from "@/hooks/use-igreja-context";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { fetchAddressByCep } from "@/lib/cep";
import cn from "classnames";

const formatCNPJ = (value: string) => {
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const formatCEP = (value: string) => {
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

const formatPhone = (value: string) => {
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
};

const igrejaFormSchema = z.object({
  nome: z.string().optional(),
  cnpj: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  website: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  logo_url: z.string().optional(),
  data_fundacao: z.string().optional().transform(d => d || null),
  cidade: z.string().optional(),
  estado: z.string().optional()
});

type IgrejaFormValues = z.infer<typeof igrejaFormSchema>;

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { igreja, isLoading, error } = useIgrejaContext();
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (igreja?.logo_url) {
      setPreview(`/uploads/${igreja.logo_url}`);
    }
  }, [igreja?.logo_url]);

  const form = useForm<IgrejaFormValues>({
    resolver: zodResolver(igrejaFormSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      website: "",
      telefone: "",
      email: "",
      logo_url: "",
      data_fundacao: "",
      cidade: "",
      estado: ""
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCepLookup = async (cep: string) => {
    try {
      const address = await fetchAddressByCep(cep);
      form.setValue('endereco', address.endereco);
      form.setValue('cidade', address.cidade);
      form.setValue('estado', address.estado);
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (igreja) {
      form.reset({
        nome: igreja.nome || "",
        cnpj: igreja.cnpj || "",
        cep: igreja.cep || "",
        endereco: igreja.endereco || "",
        numero: igreja.numero || "",
        complemento: igreja.complemento || "",
        bairro: igreja.bairro || "",
        website: igreja.website || "",
        telefone: igreja.telefone || "",
        email: igreja.email || "",
        logo_url: igreja.logo_url || "",
        data_fundacao: igreja.data_fundacao ? new Date(igreja.data_fundacao).toISOString().split('T')[0] : "",
        cidade: igreja.cidade || "",
        estado: igreja.estado || ""
      });
    }
  }, [igreja, form]);

  const updateIgrejaMutation = useMutation({
    mutationFn: async (values: IgrejaFormValues & { logo?: File }) => {
      const formData = new FormData();

      // First add all the form values
      Object.entries(values).forEach(([key, value]) => {
        if (key !== 'logo') {
          formData.append(key, value === null ? '' : String(value));
        }
      });

      // Then add the file if it exists
      if (values.logo) {
        formData.append('logo', values.logo);
      }

      // Use apiRequest instead of fetch directly
      const res = await apiRequest("POST", "/api/user/igreja", formData, {
        // Don't auto-stringify FormData
        headers: {}
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/igreja"] });
      toast({
        title: "Configurações atualizadas",
        description: "As informações da igreja foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: IgrejaFormValues) => {
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    const file = fileInput?.files?.[0];
    updateIgrejaMutation.mutate({ ...values, logo: file });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">
            Erro ao carregar dados da igreja: {error instanceof Error ? error.message : 'Erro desconhecido'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Configurações da Igreja
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <Avatar className="h-24 w-24">
                    {preview ? (
                      <AvatarImage src={preview} alt="Logo preview" />
                    ) : (
                      <AvatarFallback>
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <FormItem>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Igreja</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00.000.000/0000-00"
                            onChange={(e) => {
                              const formatted = formatCNPJ(e.target.value);
                              field.onChange(formatted || e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00000-000"
                            onChange={async (e) => {
                              const formatted = formatCEP(e.target.value);
                              field.onChange(formatted || e.target.value);

                              if (formatted && formatted.length === 9) {
                                await handleCepLookup(formatted);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(00) 00000-0000"
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted || e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_fundacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fundação</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateIgrejaMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {updateIgrejaMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
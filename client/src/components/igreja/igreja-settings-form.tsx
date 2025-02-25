import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

// Input formatters
const formatters = {
  cnpj: (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  },
  cep: (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  },
  phone: (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
};

// Form Schema
const igrejaFormSchema = z.object({
  nome: z.string(),
  cnpj: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  website: z.string().url("Website inválido").optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  data_fundacao: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
});

type IgrejaFormValues = z.infer<typeof igrejaFormSchema>;

export function IgrejaSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { igreja } = useIgrejaContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<IgrejaFormValues>({
    resolver: zodResolver(igrejaFormSchema),
    defaultValues: {
      nome: igreja?.nome || "",
      cnpj: igreja?.cnpj || "",
      cep: igreja?.cep || "",
      endereco: igreja?.endereco || "",
      numero: igreja?.numero || "",
      complemento: igreja?.complemento || "",
      bairro: igreja?.bairro || "",
      website: igreja?.website || "",
      telefone: igreja?.telefone || "",
      email: igreja?.email || "",
      data_fundacao: igreja?.data_fundacao ? 
        new Date(igreja.data_fundacao).toISOString().split('T')[0] : "",
      cidade: igreja?.cidade || "",
      estado: igreja?.estado || "",
    }
  });

  // Load logo preview when igreja data changes
  useEffect(() => {
    if (igreja?.logo_url) {
      setPreview(`/uploads/${igreja.logo_url}`);
    }
  }, [igreja?.logo_url]);

  // Handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle CEP lookup
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

  const updateIgrejaMutation = useMutation({
    mutationFn: async (values: IgrejaFormValues) => {
      const formData = new FormData();

      // Add all form fields to FormData
      Object.entries(values).forEach(([key, value]) => {
        // Only add fields that have values
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      // Add the file if selected
      if (selectedFile) {
        formData.append('logo', selectedFile);
      }

      // Log formData contents for debugging
      console.log("Form data being sent:");
      for (const [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const res = await apiRequest("POST", "/api/user/igreja", formData, {
        headers: {} // Let browser set correct content-type for FormData
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => updateIgrejaMutation.mutate(values))} className="space-y-6">
        {/* Logo Upload */}
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
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="max-w-[200px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome da Igreja */}
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

          {/* CNPJ */}
          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => {
                      const formatted = formatters.cnpj(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CEP */}
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="00000-000"
                    onChange={async (e) => {
                      const formatted = formatters.cep(e.target.value);
                      field.onChange(formatted);
                      if (formatted.length === 9) {
                        await handleCepLookup(formatted);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Endereço */}
          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número */}
          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Complemento */}
          <FormField
            control={form.control}
            name="complemento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bairro */}
          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Telefone */}
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const formatted = formatters.phone(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Fundação */}
          <FormField
            control={form.control}
            name="data_fundacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Fundação</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cidade */}
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estado */}
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
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
  );
}
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertPastorSchema } from "@shared/schema"; // Assuming this is the correct path
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export function NovoPastorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const yearsRange = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const tiposVinculo = {
    eleito: "Pastor Eleito",
    auxiliar: "Pastor Auxiliar",
    evangelista: "Pastor Evangelista",
  } as const;


  const form = useForm({
    resolver: zodResolver(insertPastorSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      bio: "",
      tipo_vinculo: "eleito",
      ano_ordenacao: currentYear,
      data_inicio: new Date().toISOString(),
      data_fim: null,
      data_eleicao: new Date().toISOString(),
    },
  });

  async function onSubmit(values: any) {
    try {
      if (!user?.igreja_id) throw new Error("Igreja não encontrada");

      const formData = new FormData();
      // Formatação do CPF - Kept this logic from original
      const cpf = values.cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      // Add all fields to FormData - adapted to avoid file handling complexity from original
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      formData.append('igreja_id', user.igreja_id.toString());

      const response = await fetch("/api/pastores", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pastores"] });
      toast({ title: "Pastor cadastrado com sucesso!" });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar pastor", description: error.message, variant: "destructive" });
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Novo Pastor</DrawerTitle>
          </DrawerHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input type="email" {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografia</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_vinculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vínculo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de vínculo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(tiposVinculo).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ano_ordenacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano de Ordenação</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_eleicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Eleição</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value?.split("T")[0] || ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          field.onChange(date ? new Date(date).toISOString() : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value?.split("T")[0] || ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          field.onChange(date ? new Date(date).toISOString() : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value?.split("T")[0] || ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          field.onChange(date ? new Date(date).toISOString() : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter>
                <Button type="submit">Cadastrar Pastor</Button>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
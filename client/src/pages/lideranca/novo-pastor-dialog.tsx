import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertPastorSchema, type InsertPastor } from "@shared/schema";
import { Loader2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import cn from 'classnames';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const tiposVinculo = {
  efetivo: "Efetivo",
  designado: "Designado",
} as const;

const currentYear = new Date().getFullYear();
const yearsRange = Array.from(
  { length: currentYear - 1900 + 1 },
  (_, i) => currentYear - i
);

export function NovoPastorDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertPastor>({
    resolver: zodResolver(insertPastorSchema),
    mode: "onChange",
    defaultValues: {
      tipo_vinculo: "efetivo",
      ano_ordenacao: currentYear,
    },
  });

  const { isValid, isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: async (data: InsertPastor) => {
      const res = await apiRequest("POST", "/api/pastores", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pastores"] });
      toast({
        title: "Pastor cadastrado com sucesso",
        description: "O novo pastor foi cadastrado.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar pastor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Pastor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Pastor</DialogTitle>
          <DialogDescription>
            Cadastre um novo pastor efetivo ou designado.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        className={cn(
                          form.formState.errors.nome && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.nome && !form.formState.errors.nome && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
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
                      <Input 
                        {...field}
                        placeholder="000.000.000-00"
                        className={cn(
                          form.formState.errors.cpf && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.cpf && !form.formState.errors.cpf && "border-green-500 focus-visible:ring-green-500"
                        )}
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
                      <Input 
                        {...field}
                        type="email"
                        value={field.value || ""}
                        className={cn(
                          form.formState.errors.email && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.email && !form.formState.errors.email && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
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
                        value={field.value || ""}
                        className={cn(
                          form.formState.errors.telefone && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.telefone && !form.formState.errors.telefone && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foto_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Foto</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type="url"
                        value={field.value || ""}
                        className={cn(
                          form.formState.errors.foto_url && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.foto_url && !form.formState.errors.foto_url && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
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
                      <Textarea 
                        {...field}
                        value={field.value || ""}
                        className={cn(
                          "h-20",
                          form.formState.errors.bio && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.bio && !form.formState.errors.bio && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                    </FormControl>
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
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          form.formState.errors.ano_ordenacao && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.ano_ordenacao && !form.formState.errors.ano_ordenacao && "border-green-500 focus-visible:ring-green-500"
                        )}>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yearsRange.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
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
                name="tipo_vinculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vínculo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          form.formState.errors.tipo_vinculo && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.tipo_vinculo && !form.formState.errors.tipo_vinculo && "border-green-500 focus-visible:ring-green-500"
                        )}>
                          <SelectValue placeholder="Selecione o tipo de vínculo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(tiposVinculo).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={mutation.isPending || !isValid || !isDirty}
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Cadastrar
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

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
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();

  const form = useForm<InsertPastor>({
    resolver: zodResolver(insertPastorSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      bio: "",
      tipo_vinculo: "efetivo",
      ano_ordenacao: new Date().getFullYear(),
      foto: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertPastor) => {
      console.log("Tentando cadastrar pastor:", data);
      if (!user?.igreja_id) throw new Error("Igreja não encontrada");

      const formData = new FormData();

      // Formatação do CPF antes de enviar
      const cpf = data.cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

      // Adiciona todos os campos ao FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'foto') return; // Pula o campo foto
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Adiciona a foto se existir
      const fotoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fotoInput?.files?.length) {
        formData.append('foto', fotoInput.files[0]);
      }

      // Adiciona campos necessários
      formData.append('igreja_id', user.igreja_id.toString());
      formData.append('data_inicio', new Date().toISOString());
      formData.append('cpf', cpf);

      console.log("FormData preparado, enviando requisição...");

      try {
        const res = await fetch('/api/pastores', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.text();
          console.error("Erro ao cadastrar pastor:", error);
          throw new Error(error);
        }

        const responseData = await res.json();
        console.log("Pastor cadastrado com sucesso:", responseData);
        return responseData;
      } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
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
      console.error("Erro na mutation:", error);
      toast({
        title: "Erro ao cadastrar pastor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPastor) => {
    console.log("Formulário submetido com dados:", data);
    mutation.mutate(data);
  };

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <Input
                        {...field}
                        placeholder="000.000.000-00"
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foto"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Foto</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...field}
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
                        className="h-20"
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
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                disabled={mutation.isPending}
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
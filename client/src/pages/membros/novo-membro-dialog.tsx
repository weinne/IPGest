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
import { insertMembroSchema, type InsertMembro } from "@shared/schema";
import { Loader2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import cn from 'classnames';
import { ScrollArea } from "@/components/ui/scroll-area";

export function NovoMembroDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertMembro>({
    resolver: zodResolver(insertMembroSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      endereco: "",
      data_nascimento: "",
      status: "ativo",
      tipo: "comungante",
      tipo_admissao: "profissao_fe",
    },
  });

  // Watch form values for real-time validation
  const { isValid, isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: async (data: InsertMembro) => {
      const res = await apiRequest("POST", "/api/membros", {
        ...data,
        data_nascimento: data.data_nascimento ? new Date(data.data_nascimento).toISOString() : null,
        data_admissao: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membros"] });
      toast({
        title: "Membro cadastrado com sucesso",
        description: "O novo membro foi adicionado à igreja.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar membro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col max-h-[85vh] md:max-h-[90vh] gap-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle>Cadastrar Novo Membro</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo membro da igreja.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <Form {...form}>
            <form id="new-member-form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        {...field} 
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
                        type="tel" 
                        {...field} 
                        value={field.value || ""} 
                        className={cn(
                          form.formState.errors.telefone && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.telefone && !form.formState.errors.telefone && "border-green-500 focus-visible:ring-green-500"
                        )}
                        placeholder="(11) 98765-4321"
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
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        className={cn(
                          form.formState.errors.endereco && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.endereco && !form.formState.errors.endereco && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""} 
                        className={cn(
                          form.formState.errors.data_nascimento && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.data_nascimento && !form.formState.errors.data_nascimento && "border-green-500 focus-visible:ring-green-500"
                        )}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          form.formState.errors.tipo && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.tipo && !form.formState.errors.tipo && "border-green-500 focus-visible:ring-green-500"
                        )}>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="comungante">Comungante</SelectItem>
                        <SelectItem value="nao_comungante">Não Comungante</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_admissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Admissão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          form.formState.errors.tipo_admissao && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.tipo_admissao && !form.formState.errors.tipo_admissao && "border-green-500 focus-visible:ring-green-500"
                        )}>
                          <SelectValue placeholder="Selecione o tipo de admissão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="batismo">Batismo</SelectItem>
                        <SelectItem value="profissao_fe">Profissão de Fé</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <div className="flex justify-end px-6 py-4 border-t">
          <Button 
            form="new-member-form"
            type="submit" 
            className="w-full" 
            disabled={mutation.isPending || !isValid || !isDirty}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Cadastrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
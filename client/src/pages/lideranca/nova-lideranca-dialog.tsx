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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertLiderancaSchema, type InsertLideranca, type Membro } from "@shared/schema";
import { Loader2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import cn from 'classnames';
import { ScrollArea } from "@/components/ui/scroll-area";

const cargos = {
  presbitero: "Presbítero",
  diacono: "Diácono",
} as const;

const status = {
  ativo: "Ativo",
  inativo: "Inativo",
  afastado: "Afastado",
  emerito: "Emérito",
} as const;

export function NovaLiderancaDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membros = [], isLoading: isLoadingMembros } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
  });

  const form = useForm<InsertLideranca>({
    resolver: zodResolver(insertLiderancaSchema),
    mode: "onChange",
    defaultValues: {
      cargo: "presbitero",
      status: "ativo",
    },
  });

  const { isValid, isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: async (data: InsertLideranca) => {
      const res = await apiRequest("POST", "/api/liderancas", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liderancas"] });
      toast({
        title: "Liderança cadastrada com sucesso",
        description: "O novo líder foi cadastrado.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar liderança",
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
          Nova Liderança
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Liderança</DialogTitle>
          <DialogDescription>
            Cadastre um novo presbítero ou diácono.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="membro_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membro</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          form.formState.errors.membro_id && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.membro_id && !form.formState.errors.membro_id && "border-green-500 focus-visible:ring-green-500"
                        )}>
                          <SelectValue placeholder="Selecione o membro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {membros.map((membro) => (
                          <SelectItem key={membro.id} value={membro.id.toString()}>
                            {membro.nome}
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
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          form.formState.errors.cargo && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.cargo && !form.formState.errors.cargo && "border-green-500 focus-visible:ring-green-500"
                        )}>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(cargos).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          form.formState.errors.status && "border-red-500 focus-visible:ring-red-500",
                          form.formState.dirtyFields.status && !form.formState.errors.status && "border-green-500 focus-visible:ring-green-500"
                        )}>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(status).map(([value, label]) => (
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

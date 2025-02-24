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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertLiderancaSchema, type InsertLideranca, type Membro } from "@shared/schema";
import { Loader2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();

  const { data: membros = [], isLoading: isLoadingMembros } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
  });

  const form = useForm<InsertLideranca>({
    resolver: zodResolver(insertLiderancaSchema),
    defaultValues: {
      cargo: "presbitero",
      status: "ativo",
      data_eleicao: undefined,
      data_inicio: undefined,
      data_fim: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertLideranca) => {
      if (!user?.igreja_id) throw new Error("Igreja não encontrada");

      // Primeiro criar a liderança
      const formData = {
        membro_id: data.membro_id,
        cargo: data.cargo,
        igreja_id: user.igreja_id,
        data_eleicao: data.data_eleicao,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        status: data.status,
      };

      console.log("Enviando dados:", formData);
      
      const liderancaRes = await apiRequest("POST", "/api/liderancas", formData);

      if (!liderancaRes.ok) {
        throw new Error("Erro ao criar liderança");
      }

      const lideranca = await liderancaRes.json();

      // Depois criar o mandato
      const mandatoRes = await apiRequest("POST", "/api/mandatos/liderancas", {
        lideranca_id: lideranca.id,
        data_eleicao: data.data_eleicao ? new Date(data.data_eleicao).toISOString() : undefined,
        data_inicio: data.data_inicio ? new Date(data.data_inicio).toISOString() : undefined,
        data_fim: data.data_fim ? new Date(data.data_fim).toISOString() : undefined,
        status: data.status,
        igreja_id: user.igreja_id,
      });

      if (!mandatoRes.ok) {
        throw new Error("Erro ao criar mandato");
      }

      return mandatoRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liderancas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mandatos/liderancas"] });
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
                        <SelectTrigger>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                name="data_eleicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Eleição</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ''} 
                        onChange={(e) => field.onChange(e.target.value)}
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
                        value={field.value || ''} 
                        onChange={(e) => field.onChange(e.target.value)}
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
                    <FormLabel>Data de Fim (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ''} 
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
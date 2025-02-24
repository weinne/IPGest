import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { MandatoLideranca, type Lideranca } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

interface GerenciarMandatosDialogProps {
  lideranca: Lideranca;
  mandatos: MandatoLideranca[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarMandatosDialog({ lideranca, mandatos, open, onOpenChange }: GerenciarMandatosDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm({
    defaultValues: {
      data_eleicao: "",
      data_inicio: "",
      data_fim: "",
      status: "ativo",
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (mandatoId: number) => {
      const res = await apiRequest("PATCH", `/api/mandatos/liderancas/${mandatoId}`, {
        status: "inativo"
      });
      if (!res.ok) throw new Error("Erro ao atualizar status do mandato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatos/liderancas"] });
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar status do mandato:", error);
    },
  });

  // Check for expired mandates when component mounts or mandatos changes
  useEffect(() => {
    mandatos.forEach(mandato => {
      if (mandato.status === "ativo" && mandato.data_fim) {
        const endDate = new Date(mandato.data_fim);
        if (endDate < new Date()) {
          updateStatusMutation.mutate(mandato.id);
        }
      }
    });
  }, [mandatos, updateStatusMutation]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (!user?.igreja_id) throw new Error("Igreja não encontrada");

      const data = {
        lideranca_id: lideranca.id,
        data_eleicao: values.data_eleicao,
        data_inicio: values.data_inicio,
        data_fim: values.data_fim || null,
        status: values.status,
        igreja_id: user.igreja_id,
      };

      const res = await apiRequest("POST", "/api/mandatos/liderancas", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatos/liderancas"] });
      toast({
        title: "Mandato adicionado com sucesso",
        description: "O novo mandato foi registrado.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar mandato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mandatoId: number) => {
      const res = await apiRequest("DELETE", `/api/mandatos/liderancas/${mandatoId}`);
      if (!res.ok) throw new Error("Erro ao remover mandato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mandatos/liderancas"] });
      toast({
        title: "Mandato removido com sucesso",
        description: "O mandato foi removido do registro.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover mandato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Mandatos</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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
                          value={field.value?.split('T')[0] || ''} 
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
                          value={field.value?.split('T')[0] || ''} 
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
                      <FormLabel>Data de Término (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value?.split('T')[0] || ''} 
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="afastado">Afastado</SelectItem>
                          <SelectItem value="emerito">Emérito</SelectItem>
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
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Adicionar Mandato
                </Button>
              </form>
            </Form>

            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold">Histórico de Mandatos</h3>
              {mandatos.map((mandato) => (
                <Card key={mandato.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Eleição: {format(new Date(mandato.data_eleicao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm">
                        Início: {format(new Date(mandato.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm">
                        Término: {mandato.data_fim 
                          ? format(new Date(mandato.data_fim), "dd/MM/yyyy", { locale: ptBR })
                          : "-"
                        }
                      </p>
                      <p className="text-sm">
                        Status: {mandato.status}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (window.confirm("Tem certeza que deseja remover este mandato?")) {
                          deleteMutation.mutate(mandato.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertGrupoSchema, type InsertGrupo, type Grupo, type Membro } from "@shared/schema";
import { Loader2, UserPlus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import cn from 'classnames';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface EditarGrupoDialogProps {
  grupo: Grupo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMembers?: Array<{
    membro: Membro;
    cargo: string;
  }>;
}

const tiposGrupo = {
  UCP: "União de Crianças Presbiterianas",
  UPA: "União Presbiteriana de Adolescentes",
  UMP: "União de Mocidade Presbiteriana",
  SAF: "Sociedade Auxiliadora Feminina",
  UPH: "União Presbiteriana de Homens",
  ESTATISTICA: "Departamento de Estatística",
  DIACONIA: "Departamento de Ação Social",
  EVANGELIZACAO: "Departamento de Evangelização",
  ENSINO: "Departamento de Ensino",
  COMUNICACAO: "Departamento de Comunicação",
  outro: "Outro",
} as const;

const cargosGrupo = {
  presidente: "Presidente",
  vice_presidente: "Vice-Presidente",
  secretario: "Secretário",
  segundo_secretario: "2º Secretário",
  tesoureiro: "Tesoureiro",
  segundo_tesoureiro: "2º Tesoureiro",
  conselheiro: "Conselheiro",
  membro: "Membro",
} as const;

type GrupoFormData = {
  nome: string;
  tipo: keyof typeof tiposGrupo;
  status: "ativo" | "inativo";
  descricao?: string | null;
  membros: Array<{
    membro_id: number;
    cargo: keyof typeof cargosGrupo;
  }>;
};

export function EditarGrupoDialog({ grupo, open, onOpenChange, initialMembers = [] }: EditarGrupoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("EditarGrupoDialog mounted with grupo:", grupo.id, "initialMembers:", initialMembers);

  // Fetch all members for selection
  const { data: membros = [], isLoading: isLoadingMembros } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
    onSuccess: (data) => {
      console.log("All members loaded for selection:", data.length, "members");
    },
  });

  const form = useForm<GrupoFormData>({
    resolver: zodResolver(insertGrupoSchema),
    defaultValues: {
      nome: grupo.nome,
      tipo: grupo.tipo,
      status: grupo.status,
      descricao: grupo.descricao || "",
      membros: [], // This line is changed
    },
  });

  useEffect(() => {
    if (initialMembers?.length > 0) {
      console.log("Setting initial members in form, count:", initialMembers.length);
      const validMembers = initialMembers
        .filter(item => {
          const isValid = item?.membro && item.membro.id;
          if (!isValid) {
            console.warn("Invalid member in initialMembers:", item);
          }
          return isValid;
        })
        .map(({ membro, cargo }) => ({
          membro_id: membro.id,
          cargo: cargo as keyof typeof cargosGrupo,
        }));

      console.log("Setting valid members in form:", validMembers);
      form.setValue("membros", validMembers);
    }
  }, [initialMembers, form]);

  const mutation = useMutation({
    mutationFn: async (data: GrupoFormData) => {
      console.log("Submitting group update with data:", data);
      const res = await apiRequest("PATCH", `/api/grupos/${grupo.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grupos", grupo.id, "membros"] });
      toast({
        title: "Grupo atualizado",
        description: "As informações do grupo foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Error updating group:", error);
      toast({
        title: "Erro ao atualizar grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentMembers = form.watch("membros") || [];
  console.log("Current members in form:", currentMembers);

  if (isLoadingMembros) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-h-[200px] max-h-[85vh] flex flex-col gap-0 p-0">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-h-[200px] max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Editar Grupo</DialogTitle>
          <DialogDescription>
            Atualize as informações do grupo ou sociedade interna.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          <Form {...form}>
            <form
              id="edit-group-form"
              onSubmit={form.handleSubmit((data) => {
                console.log("Form submitted with data:", data);
                mutation.mutate(data);
              })}
              className="space-y-4 py-4"
            >
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
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(tiposGrupo).map(([value, label]) => (
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
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="membros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membros do Grupo</FormLabel>
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col gap-2">
                          {field.value?.map((membro, index) => {
                            const membroData = membros.find(m => m.id === membro.membro_id);
                            if (!membroData) return null;

                            return (
                              <div key={membro.membro_id} className="flex items-center gap-2 p-2 border rounded">
                                <span className="flex-1">{membroData.nome}</span>
                                <Select
                                  defaultValue={membro.cargo}
                                  onValueChange={(cargo) => {
                                    const newValue = [...field.value];
                                    newValue[index] = {
                                      ...newValue[index],
                                      cargo: cargo as keyof typeof cargosGrupo,
                                    };
                                    form.setValue("membros", newValue);
                                  }}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(cargosGrupo).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newValue = field.value.filter((_, i) => i !== index);
                                    form.setValue("membros", newValue);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>

                        <Select
                          onValueChange={(value) => {
                            const membroId = parseInt(value);
                            if (!field.value.some(m => m.membro_id === membroId)) {
                              form.setValue("membros", [
                                ...field.value,
                                { membro_id: membroId, cargo: "membro" }
                              ]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              <span>Adicionar membro</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {membros
                              .filter(membro => !field.value.some(m => m.membro_id === membro.id))
                              .map(membro => (
                                <SelectItem key={membro.id} value={membro.id.toString()}>
                                  {membro.nome}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <div className="flex justify-end gap-2 px-6 py-4 border-t mt-auto">
          <Button form="edit-group-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
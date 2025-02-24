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
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import cn from 'classnames';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface EditarGrupoDialogProps {
  grupo: Grupo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GrupoMembro {
  membro: Membro;
  cargo: keyof typeof cargosGrupo;
}

export function EditarGrupoDialog({ grupo, open, onOpenChange }: EditarGrupoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membros = [], isLoading: isLoadingMembros } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
  });

  const { data: grupoMembros = [] } = useQuery<GrupoMembro[]>({
    queryKey: ["/api/grupos", grupo.id, "membros"],
    enabled: open,
  });

  const form = useForm<InsertGrupo>({
    resolver: zodResolver(insertGrupoSchema),
    defaultValues: {
      nome: grupo.nome,
      tipo: grupo.tipo,
      status: grupo.status,
      descricao: grupo.descricao || "",
      membros: grupoMembros.map(m => ({
        membro_id: m.membro.id,
        cargo: m.cargo,
      })),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertGrupo) => {
      const res = await apiRequest("PATCH", `/api/grupos/${grupo.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos"] });
      toast({
        title: "Grupo atualizado",
        description: "As informações do grupo foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/grupos/${grupo.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos"] });
      toast({
        title: "Grupo excluído",
        description: "O grupo foi excluído com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[85vh] md:max-h-[90vh] gap-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle>Editar Grupo</DialogTitle>
          <DialogDescription>
            Atualize as informações do grupo ou sociedade interna.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <Form {...form}>
            <form id="edit-group-form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
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
                    <FormLabel>Membros</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value?.length && "text-muted-foreground"
                            )}
                          >
                            {field.value?.length
                              ? `${field.value.length} membro${field.value.length === 1 ? "" : "s"} selecionado${field.value.length === 1 ? "" : "s"}`
                              : "Selecione os membros"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" side="top">
                          <Command>
                            <CommandInput placeholder="Procurar membro..." />
                            <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-[200px]">
                                {membros.map((membro) => {
                                  const isSelected = field.value?.some(
                                    (item) => item.membro_id === membro.id
                                  );
                                  return (
                                    <CommandItem
                                      key={membro.id}
                                      onSelect={() => {
                                        if (!isSelected) {
                                          const current = field.value || [];
                                          form.setValue("membros", [...current, { membro_id: membro.id, cargo: "membro" as keyof typeof cargosGrupo }], {
                                            shouldValidate: true,
                                          });
                                        }
                                      }}
                                      className="flex items-center justify-between py-2"
                                    >
                                      <div className="flex items-center">
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            isSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span>{membro.nome}</span>
                                      </div>
                                      {isSelected && (
                                        <div className="flex items-center gap-2">
                                          <Select
                                            defaultValue={field.value.find(
                                              (item) => item.membro_id === membro.id
                                            )?.cargo || "membro"}
                                            onValueChange={(cargo) => {
                                              const current = field.value || [];
                                              const newValue = current.map((item) =>
                                                item.membro_id === membro.id
                                                  ? { ...item, cargo: cargo as keyof typeof cargosGrupo }
                                                  : item
                                              );
                                              form.setValue("membros", newValue, {
                                                shouldValidate: true,
                                              });
                                            }}
                                          >
                                            <SelectTrigger className="h-8 w-[130px]">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Object.entries(cargosGrupo).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                  {label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => {
                                              const current = field.value || [];
                                              form.setValue(
                                                "membros",
                                                current.filter(
                                                  (item) => item.membro_id !== membro.id
                                                ),
                                                { shouldValidate: true }
                                              );
                                            }}
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      )}
                                    </CommandItem>
                                  );
                                })}
                              </ScrollArea>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <div className="flex justify-between gap-2 px-6 py-4 border-t">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir este grupo?")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Excluir
          </Button>

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
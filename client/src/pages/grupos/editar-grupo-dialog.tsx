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
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertGrupoSchema, type InsertGrupo } from "@shared/schema";
import { CheckIcon, Loader2, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditarGrupoDialogProps {
  grupo: {
    id: number;
    nome: string;
    tipo: string;
    status: string;
    descricao: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
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


export function EditarGrupoDialog({ grupo, open, onOpenChange }: EditarGrupoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { members, isLoading, addMember, removeMember, updateMemberCargo } = useGroupMembers(grupo.id);
  const { data: allMembers = [] } = useQuery({
    queryKey: ["/api/membros"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/membros");
      return response.json();
    }
  });

  const form = useForm<InsertGrupo>({
    resolver: zodResolver(insertGrupoSchema),
    defaultValues: {
      nome: grupo.nome,
      tipo: grupo.tipo,
      status: grupo.status,
      descricao: grupo.descricao || "",
      membros: []
    }
  });

  useEffect(() => {
    if (members.length) {
      const validMembers = members.map(m => ({
        membro_id: m.membro.id,
        cargo: m.cargo
      }));
      form.setValue("membros", validMembers);
    }
  }, [members, form]);

  function GroupMemberManager() {
    return (
      <div className="space-y-2">
        {form.watch("membros")?.map((item, index) => {
          const member = members.find(m => m.membro.id === item.membro_id);
          return (
            <div key={item.membro_id} className="flex items-center gap-2 p-2 border rounded">
              <span>{member?.membro.nome || "Membro não encontrado"}</span>
              <Select
                defaultValue={item.cargo}
                onValueChange={(cargo) => {
                  updateMemberCargo.mutate({ membroId: item.membro_id, cargo });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(cargosGrupo).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const currentMembers = form.getValues("membros");
                  form.setValue(
                    "membros",
                    currentMembers.filter((_, i) => i !== index)
                  );
                  removeMember.mutate(item.membro_id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  }

  const onSubmit = async (data: InsertGrupo) => {
    try {
      await apiRequest("PATCH", `/api/grupos/${grupo.id}`, {
        body: JSON.stringify(data)
      });

      queryClient.invalidateQueries({ queryKey: ["/api/grupos"] });
      toast({
        title: "Grupo atualizado",
        description: "As alterações foram salvas com sucesso."
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-h-[200px] max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Editar Grupo</DialogTitle>
          <DialogDescription>
            Atualize os dados do grupo, incluindo os membros.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando membros...</span>
            </div>
          ) : (
            <Form {...form}>
              <form id="edit-group-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Grupo</FormLabel>
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
                        <Input {...field} />
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
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              Adicionar membros
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" side="top">
                            <Command>
                              <CommandInput placeholder="Procurar membro..." />
                              <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                  {allMembers.map((member) => {
                                    const isSelected = field.value?.some(
                                      (item) => item.membro_id === member.membro.id
                                    );
                                    return (
                                      <CommandItem
                                        key={member.membro.id}
                                        onSelect={() => {
                                          if (!isSelected) {
                                            const current = field.value || [];
                                            form.setValue("membros", [...current, { membro_id: member.membro.id, cargo: "membro" }], {
                                              shouldValidate: true,
                                            });
                                            addMember.mutate({ membro_id: member.membro.id, cargo: "membro" });
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
                                          <span>{member.membro.nome}</span>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <GroupMemberManager />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </ScrollArea>

        <div className="flex justify-end px-6 py-4 border-t mt-auto">
          <Button 
            form="edit-group-form"
            type="submit" 
            className="w-full"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
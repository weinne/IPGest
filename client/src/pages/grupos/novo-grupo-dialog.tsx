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
import { insertGrupoSchema, type InsertGrupo, type Membro } from "@shared/schema";
import { Loader2, UsersRound } from "lucide-react";
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

export function NovoGrupoDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membros = [], isLoading: isLoadingMembros } = useQuery<Membro[]>({
    queryKey: ["/api/membros"],
  });

  const form = useForm<InsertGrupo>({
    resolver: zodResolver(insertGrupoSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      tipo: "outro",
      status: "ativo",
      descricao: "",
      membros: [],
    },
  });

  // Watch form values for real-time validation
  const { isValid, isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: async (data: InsertGrupo) => {
      const res = await apiRequest("POST", "/api/grupos", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grupos"] });
      toast({
        title: "Grupo cadastrado com sucesso",
        description: "O novo grupo foi criado.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar grupo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UsersRound className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[90vh] sm:h-auto pb-20">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Grupo</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo grupo ou sociedade interna.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-120px)] sm:max-h-none">
          <div className="p-1">
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
                          <SelectTrigger className={cn(
                            form.formState.errors.status && "border-red-500 focus-visible:ring-red-500",
                            form.formState.dirtyFields.status && !form.formState.errors.status && "border-green-500 focus-visible:ring-green-500"
                          )}>
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
                          className={cn(
                            form.formState.errors.descricao && "border-red-500 focus-visible:ring-red-500",
                            form.formState.dirtyFields.descricao && !form.formState.errors.descricao && "border-green-500 focus-visible:ring-green-500"
                          )}
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
                                            form.setValue("membros", [...current, { membro_id: membro.id, cargo: "membro" }], {
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
                                              defaultValue="membro"
                                              onValueChange={(cargo) => {
                                                const current = field.value || [];
                                                const newValue = current.map((item) =>
                                                  item.membro_id === membro.id
                                                    ? { ...item, cargo }
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
                                                  current.filter((item) => item.membro_id !== membro.id),
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
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
import { Loader2, UserPlus, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import cn from 'classnames';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

export function NovoMembroDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<InsertMembro>({
    resolver: zodResolver(insertMembroSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: null,
      telefone: null,
      endereco: null,
      data_nascimento: null,
      cpf: null,
      rg: null,
      cidade_natal: null,
      estado_civil: null,
      conjuge: null,
      data_casamento: null,
      religiao_anterior: null,
      data_batismo: null,
      data_profissao_fe: null,
      status: "ativo",
      tipo: "comungante",
      tipo_admissao: "profissao_fe",
      numero_rol: undefined,
    },
  });

  const { isValid, isDirty } = form.formState;
  const estadoCivil = form.watch("estado_civil");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: InsertMembro & { foto?: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'foto' && value instanceof File) {
            formData.append('foto', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const res = await fetch("/api/membros", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membros"] });
      toast({
        title: "Membro cadastrado com sucesso",
        description: "O novo membro foi adicionado à igreja.",
      });
      form.reset();
      setPreview(null);
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
      <DialogContent className="min-h-[200px] max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Cadastrar Novo Membro</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo membro da igreja.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          <Form {...form}>
            <form id="new-member-form" onSubmit={form.handleSubmit((data) => {
              const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
              const file = fileInput?.files?.[0];
              mutation.mutate({ ...data, foto: file });
            })} className="space-y-6 py-4">

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Básicas</h3>
                <Separator />

                <div className="flex flex-col items-center gap-4 mb-4">
                  <Avatar className="h-24 w-24">
                    {preview ? (
                      <AvatarImage src={preview} alt="Preview" />
                    ) : (
                      <AvatarFallback>
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <FormItem>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <FormField
                  control={form.control}
                  name="numero_rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número no Rol</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className={cn(
                            form.formState.errors.numero_rol && "border-red-500 focus-visible:ring-red-500",
                            form.formState.dirtyFields.numero_rol && !form.formState.errors.numero_rol && "border-green-500 focus-visible:ring-green-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
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
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            className={cn(
                              form.formState.errors.rg && "border-red-500 focus-visible:ring-red-500",
                              form.formState.dirtyFields.rg && !form.formState.errors.rg && "border-green-500 focus-visible:ring-green-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contato</h3>
                <Separator />

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
                          {...field}
                          value={field.value || ""}
                          placeholder="(00) 00000-0000"
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
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Pessoais</h3>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade_natal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade Natal</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            className={cn(
                              form.formState.errors.cidade_natal && "border-red-500 focus-visible:ring-red-500",
                              form.formState.dirtyFields.cidade_natal && !form.formState.errors.cidade_natal && "border-green-500 focus-visible:ring-green-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estado_civil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            form.formState.errors.estado_civil && "border-red-500 focus-visible:ring-red-500",
                            form.formState.dirtyFields.estado_civil && !form.formState.errors.estado_civil && "border-green-500 focus-visible:ring-green-500"
                          )}>
                            <SelectValue placeholder="Selecione o estado civil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="separado">Separado(a)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {estadoCivil === "casado" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="conjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cônjuge</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              className={cn(
                                form.formState.errors.conjuge && "border-red-500 focus-visible:ring-red-500",
                                form.formState.dirtyFields.conjuge && !form.formState.errors.conjuge && "border-green-500 focus-visible:ring-green-500"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_casamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Casamento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                              className={cn(
                                form.formState.errors.data_casamento && "border-red-500 focus-visible:ring-red-500",
                                form.formState.dirtyFields.data_casamento && !form.formState.errors.data_casamento && "border-green-500 focus-visible:ring-green-500"
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Eclesiásticas</h3>
                <Separator />

                <FormField
                  control={form.control}
                  name="religiao_anterior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religião Anterior</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          className={cn(
                            form.formState.errors.religiao_anterior && "border-red-500 focus-visible:ring-red-500",
                            form.formState.dirtyFields.religiao_anterior && !form.formState.errors.religiao_anterior && "border-green-500 focus-visible:ring-green-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_batismo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Batismo</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                            className={cn(
                              form.formState.errors.data_batismo && "border-red-500 focus-visible:ring-red-500",
                              form.formState.dirtyFields.data_batismo && !form.formState.errors.data_batismo && "border-green-500 focus-visible:ring-green-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_profissao_fe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Profissão de Fé</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                            className={cn(
                              form.formState.errors.data_profissao_fe && "border-red-500 focus-visible:ring-red-500",
                              form.formState.dirtyFields.data_profissao_fe && !form.formState.errors.data_profissao_fe && "border-green-500 focus-visible:ring-green-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
              </div>
            </form>
          </Form>
        </ScrollArea>

        <div className="flex justify-end px-6 py-4 border-t mt-auto">
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
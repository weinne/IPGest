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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

// CPF formatting function
const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export function NovoMembroDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<InsertMembro>({
    resolver: zodResolver(insertMembroSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: null,
      telefone: null,
      sexo: "masculino",
      cep: null,
      endereco: null,
      numero: null,
      cidade_atual: null,
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
      data_admissao: new Date().toISOString().split('T')[0], // Pre-filled with current date
      data_exclusao: null,
      motivo_exclusao: null,
    },
  });

  const { isValid, isDirty } = form.formState;
  const estadoCivil = form.watch("estado_civil");
  const status = form.watch("status");

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

  const fetchAddressByCep = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
        throw new Error('Erro ao buscar endereço.');
      }
      const data = await response.json();
      if (data.erro) {
        throw new Error('CEP inválido.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const fetchAddress = async (cep: string) => {
    if (!cep || cep.length < 8) return;

    try {
      const response = await fetchAddressByCep(cep);
      if (response) {
        form.setValue("endereco", response.logradouro || "");
        form.setValue("cidade_atual", response.localidade || "");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({
        title: 'Erro ao buscar endereço',
        description: (error as Error).message,
        variant: 'destructive'
      });
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

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="personal">Pessoal</TabsTrigger>
                  <TabsTrigger value="contact">Contato</TabsTrigger>
                  <TabsTrigger value="church">Igreja</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_admissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Admissão</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
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
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                            <SelectItem value="disciplina">Em Disciplina</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {status === "inativo" && (
                    <>
                      <FormField
                        control={form.control}
                        name="motivo_exclusao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Motivo da Exclusão</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o motivo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="transferencia">Transferência</SelectItem>
                                <SelectItem value="excomunhao">Excomunhão</SelectItem>
                                <SelectItem value="exclusao">Exclusão</SelectItem>
                                <SelectItem value="falecimento">Falecimento</SelectItem>
                                <SelectItem value="pedido">A Pedido</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_exclusao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data da Exclusão</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="personal" className="space-y-4">
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
                              onChange={(e) => {
                                const formatted = formatCPF(e.target.value);
                                field.onChange(formatted);
                              }}
                              placeholder="000.000.000-00"
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
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o sexo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado_civil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
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
                    <>
                      <FormField
                        control={form.control}
                        name="conjuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Cônjuge</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              fetchAddress(e.target.value);
                            }}
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
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade_atual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade Atual</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="church" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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

                  <FormField
                    control={form.control}
                    name="religiao_anterior"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religião Anterior</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
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
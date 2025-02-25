import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

export type Igreja = {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  presbitero: string;
  cnpj: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  website: string | null;
  telefone: string | null;
  email: string | null;
  logo_url: string | null;
  data_fundacao: string | null;
};

export function useIgrejaContext() {
  const { user } = useAuth();

  const { data: igreja, isLoading, error } = useQuery<Igreja>({
    queryKey: ["/api/igreja", user?.igreja_id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/igreja/${user?.igreja_id}`);
      return res.json();
    },
    enabled: !!user?.igreja_id,
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  if (error) {
    console.error('Error fetching igreja data:', error);
  }

  return {
    igreja,
    isLoading,
    error,
  };
}
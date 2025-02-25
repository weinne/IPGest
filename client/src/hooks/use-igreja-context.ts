import { useQuery } from "@tanstack/react-query";

export type Igreja = {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  presbitero: string;
};

export function useIgrejaContext() {
  const { data: igreja, isLoading, error } = useQuery({
    queryKey: ["/api/igreja"],
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    retry: 3, // Retry failed requests 3 times
  });

  if (error) {
    console.error('Error fetching igreja data:', error);
  }

  return {
    igreja: igreja as Igreja | undefined,
    isLoading,
    error,
  };
}
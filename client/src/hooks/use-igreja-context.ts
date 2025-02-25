import { useQuery } from "@tanstack/react-query";

type User = {
  id: number;
  igreja_id: number;
  username: string;
};

type Igreja = {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  presbitero: string;
};

export function useIgrejaContext() {
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: igreja, isLoading: isLoadingIgreja } = useQuery<Igreja>({
    queryKey: ["/api/igreja", user?.igreja_id],
    enabled: !!user?.igreja_id,
  });

  return {
    igreja,
    isLoading: isLoadingUser || isLoadingIgreja,
  };
}
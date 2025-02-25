import { useQuery } from "@tanstack/react-query";

export function useIgrejaContext() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: igreja } = useQuery({
    queryKey: ["/api/igreja", user?.igreja_id],
    enabled: !!user?.igreja_id,
  });

  return {
    igreja,
    isLoading: !igreja,
  };
}

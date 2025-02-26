
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Membro } from "@shared/schema";

interface GroupMember {
  membro: Membro;
  cargo: string;
}

interface AddMemberParams {
  membro_id: number;
  cargo: string;
}

export function useGroupMembers(groupId: number | null) {
  const queryClient = useQueryClient();
  const queryKey = [`/api/grupos/${groupId}/membros`];

  const { data: members = [], isLoading } = useQuery({
    queryKey,
    enabled: groupId !== null,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/grupos/${groupId}/membros`);
      return response.json() as Promise<GroupMember[]>;
    }
  });

  const addMember = useMutation({
    mutationFn: async (params: AddMemberParams) => {
      const response = await apiRequest("POST", `/api/grupos/${groupId}/membros`, {
        body: JSON.stringify(params)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const removeMember = useMutation({
    mutationFn: async (membroId: number) => {
      await apiRequest("DELETE", `/api/grupos/${groupId}/membros/${membroId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const updateMemberCargo = useMutation({
    mutationFn: async ({ membroId, cargo }: { membroId: number; cargo: string }) => {
      const response = await apiRequest("PATCH", `/api/grupos/${groupId}/membros/${membroId}`, {
        body: JSON.stringify({ cargo })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    members,
    isLoading,
    addMember,
    removeMember,
    updateMemberCargo
  };
}

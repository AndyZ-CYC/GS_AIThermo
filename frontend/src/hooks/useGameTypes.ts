import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/gameTypes";

export function useGameTypes() {
  return useQuery({ queryKey: ["gameTypes"], queryFn: api.fetchGameTypes });
}

export function useCreateGameType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; examples?: string[] }) =>
      api.createGameType(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameTypes"] }),
  });
}

export function useUpdateGameType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name: string;
      description?: string;
      examples?: string[];
    }) => api.updateGameType(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameTypes"] }),
  });
}

export function useDeleteGameType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteGameType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameTypes"] }),
  });
}

export function useSortGameTypes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => api.sortGameTypes(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameTypes"] }),
  });
}

export function useUploadPosters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameTypeId, files }: { gameTypeId: number; files: FileList }) =>
      api.uploadPosters(gameTypeId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameTypes"] }),
  });
}

export function useDeletePoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (posterId: number) => api.deletePoster(posterId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gameTypes"] }),
  });
}

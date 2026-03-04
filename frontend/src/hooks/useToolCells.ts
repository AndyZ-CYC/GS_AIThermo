import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/toolCells";

export function useToolCells() {
  return useQuery({ queryKey: ["toolCells"], queryFn: api.fetchToolCells });
}

export function useCreateToolCell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createToolCell,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["toolCells"] }),
  });
}

export function useUpdateToolCell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Parameters<typeof api.updateToolCell>[1] & { id: number }) =>
      api.updateToolCell(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["toolCells"] }),
  });
}

export function useDeleteToolCell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteToolCell(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["toolCells"] }),
  });
}

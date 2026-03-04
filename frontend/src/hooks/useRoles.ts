import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/roles";

export function useRoleGroups() {
  return useQuery({ queryKey: ["roleGroups"], queryFn: api.fetchRoleGroups });
}

export function useCreateRoleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createRoleGroup(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

export function useUpdateRoleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.updateRoleGroup(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

export function useDeleteRoleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteRoleGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

export function useSortRoleGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => api.sortRoleGroups(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleGroupId, name }: { roleGroupId: number; name: string }) =>
      api.createRole(roleGroupId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.updateRole(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

export function useSortRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleGroupId, ids }: { roleGroupId: number; ids: number[] }) =>
      api.sortRoles(roleGroupId, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roleGroups"] }),
  });
}

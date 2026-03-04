import client from "./client";
import type { RoleGroup, Role } from "../types";

export const fetchRoleGroups = () =>
  client.get<RoleGroup[]>("/role-groups").then((r) => r.data);

export const createRoleGroup = (name: string) =>
  client.post<RoleGroup>("/role-groups", { name }).then((r) => r.data);

export const updateRoleGroup = (id: number, name: string) =>
  client.put<RoleGroup>(`/role-groups/${id}`, { name }).then((r) => r.data);

export const deleteRoleGroup = (id: number) =>
  client.delete(`/role-groups/${id}`);

export const sortRoleGroups = (ids: number[]) =>
  client.put("/role-groups/sort", { ids });

export const createRole = (roleGroupId: number, name: string) =>
  client.post<Role>("/roles", { role_group_id: roleGroupId, name }).then((r) => r.data);

export const updateRole = (id: number, name: string) =>
  client.put<Role>(`/roles/${id}`, { name }).then((r) => r.data);

export const deleteRole = (id: number) =>
  client.delete(`/roles/${id}`);

export const sortRoles = (roleGroupId: number, ids: number[]) =>
  client.put("/roles/sort", { role_group_id: roleGroupId, ids });

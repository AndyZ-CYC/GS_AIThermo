import { Request, Response } from 'express';
import { RoleService } from '../services/roleService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { NotFoundError, DependenciesError, ValidationError } from '../middleware/errorHandler.js';

// RoleGroup 控制器
export const getRoleGroups = asyncHandler(async (_req: Request, res: Response) => {
  const groups = RoleService.getAllGroups();
  const response: ApiResponse<typeof groups> = { data: groups };
  res.json(response);
});

export const getRoleGroupById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const group = RoleService.getGroupById(id);

  if (!group) {
    throw NotFoundError('工种大类不存在');
  }

  const response: ApiResponse<typeof group> = { data: group };
  res.json(response);
});

export const createRoleGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const group = RoleService.createGroup(name);

  const response: ApiResponse<typeof group> = {
    data: group,
    message: '工种大类创建成功',
  };
  res.status(201).json(response);
});

export const updateRoleGroup = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name } = req.body;

  const group = RoleService.updateGroup(id, name);

  if (!group) {
    throw NotFoundError('工种大类不存在');
  }

  const response: ApiResponse<typeof group> = {
    data: group,
    message: '工种大类更新成功',
  };
  res.json(response);
});

export const deleteRoleGroup = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const result = RoleService.deleteGroup(id);

  if (!result.success) {
    throw DependenciesError(
      `该大类下存在 ${result.dependencies!.roles} 个工种子类，请先删除所有子工种后再删除此大类。`,
      result.dependencies!
    );
  }

  res.json({ data: null, message: '工种大类删除成功' });
});

export const reorderRoleGroups = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  RoleService.reorderGroups(ids);
  res.json({ data: null, message: '排序更新成功' });
});

// Role 控制器
export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = RoleService.getAllRoles();
  const response: ApiResponse<typeof roles> = { data: roles };
  res.json(response);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { role_group_id, name } = req.body;
  const role = RoleService.createRole(role_group_id, name);

  const response: ApiResponse<typeof role> = {
    data: role,
    message: '工种子类创建成功',
  };
  res.status(201).json(response);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name } = req.body;

  const role = RoleService.updateRole(id, name);

  if (!role) {
    throw NotFoundError('工种子类不存在');
  }

  const response: ApiResponse<typeof role> = {
    data: role,
    message: '工种子类更新成功',
  };
  res.json(response);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const result = RoleService.deleteRole(id);

  if (!result.success) {
    throw DependenciesError(
      `该工种下存在 ${result.dependencies!.tool_cells} 个工具卡片，请先删除关联工具卡片后再删除此工种。`,
      result.dependencies!
    );
  }

  res.json({ data: null, message: '工种子类删除成功' });
});

export const reorderRoles = asyncHandler(async (req: Request, res: Response) => {
  const { role_group_id, ids } = req.body;

  try {
    RoleService.reorderRoles(role_group_id, ids);
    res.json({ data: null, message: '排序更新成功' });
  } catch (error) {
    throw ValidationError((error as Error).message);
  }
});

import { Router } from 'express';
import {
  getRoleGroups,
  getRoleGroupById,
  createRoleGroup,
  updateRoleGroup,
  deleteRoleGroup,
  reorderRoleGroups,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  reorderRoles,
} from '../controllers/roleController.js';
import { requireBody, requireParams, validateLength, validateNonEmptyArray } from '../middleware/validate.js';

const router = Router();

// ============ RoleGroup 路由 ============

// GET /api/role-groups - 获取工种大类列表
router.get('/groups', getRoleGroups);

// GET /api/role-groups/:id - 获取单个工种大类
router.get('/groups/:id', getRoleGroupById);

// POST /api/role-groups - 创建工种大类
router.post('/groups',
  requireBody('name'),
  validateLength('name', 1, 100),
  createRoleGroup
);

// PUT /api/role-groups/:id - 更新工种大类
router.put('/groups/:id',
  requireParams('id'),
  validateLength('name', 1, 100),
  updateRoleGroup
);

// DELETE /api/role-groups/:id - 删除工种大类
router.delete('/groups/:id', requireParams('id'), deleteRoleGroup);

// PUT /api/role-groups/sort - 批量更新大类排序
router.put('/groups/sort',
  requireBody('ids'),
  validateNonEmptyArray('ids'),
  reorderRoleGroups
);

// ============ Role 路由 ============

// GET /api/roles - 获取工种子类列表
router.get('/', getRoles);

// POST /api/roles - 创建工种子类
router.post('/',
  requireBody('role_group_id', 'name'),
  validateLength('name', 1, 100),
  createRole
);

// PUT /api/roles/:id - 更新工种子类
router.put('/:id',
  requireParams('id'),
  validateLength('name', 1, 100),
  updateRole
);

// DELETE /api/roles/:id - 删除工种子类
router.delete('/:id', requireParams('id'), deleteRole);

// PUT /api/roles/sort - 批量更新子类排序
router.put('/sort',
  requireBody('role_group_id', 'ids'),
  validateNonEmptyArray('ids'),
  reorderRoles
);

export default router;

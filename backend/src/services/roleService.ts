import db from '../config/database.js';
import type { RoleGroup, Role, RoleGroupWithRoles } from '../types/index.js';

export class RoleService {
  // 获取所有工种大类（含子类）
  static getAllGroups(): RoleGroupWithRoles[] {
    const groups = db.prepare(`
      SELECT * FROM role_group
      WHERE is_deleted = 0
      ORDER BY sort_order ASC
    `).all() as RoleGroup[];

    return groups.map(group => {
      const roles = db.prepare(`
        SELECT id, name, sort_order
        FROM role
        WHERE role_group_id = ? AND is_deleted = 0
        ORDER BY sort_order ASC
      `).all(group.id) as Pick<Role, 'id' | 'name' | 'sort_order'>[];

      return {
        ...group,
        roles,
      };
    });
  }

  // 获取单个工种大类
  static getGroupById(id: number): RoleGroupWithRoles | null {
    const groups = this.getAllGroups();
    return groups.find(g => g.id === id) || null;
  }

  // 创建工种大类
  static createGroup(name: string): RoleGroupWithRoles {
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM role_group WHERE is_deleted = 0
    `).get() as { max_order: number };

    const result = db.prepare(`
      INSERT INTO role_group (name, sort_order)
      VALUES (?, ?)
    `).run(name, maxOrder.max_order + 1);

    const id = result.lastInsertRowid as number;
    return this.getGroupById(id)!;
  }

  // 更新工种大类
  static updateGroup(id: number, name: string): RoleGroupWithRoles | null {
    const existing = db.prepare(`
      SELECT * FROM role_group WHERE id = ? AND is_deleted = 0
    `).get(id) as RoleGroup | undefined;

    if (!existing) return null;

    db.prepare(`
      UPDATE role_group SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, id);

    return this.getGroupById(id)!;
  }

  // 删除工种大类
  static deleteGroup(id: number): { success: boolean; dependencies?: Record<string, number> } {
    // 检查是否有子工种
    const roles = db.prepare(`
      SELECT COUNT(*) as count FROM role
      WHERE role_group_id = ? AND is_deleted = 0
    `).get(id) as { count: number };

    if (roles.count > 0) {
      return {
        success: false,
        dependencies: { roles: roles.count },
      };
    }

    db.prepare(`
      UPDATE role_group
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `).run(id);

    return { success: true };
  }

  // 批量更新大类排序
  static reorderGroups(ids: number[]): void {
    const updateStmt = db.prepare(`
      UPDATE role_group SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      ids.forEach((id, index) => {
        updateStmt.run(index + 1, id);
      });
    });

    transaction();
  }

  // 创建工种子类
  static createRole(roleGroupId: number, name: string): Role {
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM role
      WHERE role_group_id = ? AND is_deleted = 0
    `).get(roleGroupId) as { max_order: number };

    const result = db.prepare(`
      INSERT INTO role (role_group_id, name, sort_order)
      VALUES (?, ?, ?)
    `).run(roleGroupId, name, maxOrder.max_order + 1);

    const id = result.lastInsertRowid as number;

    return db.prepare(`
      SELECT * FROM role WHERE id = ?
    `).get(id) as Role;
  }

  // 更新工种子类
  static updateRole(id: number, name: string): Role | null {
    const existing = db.prepare(`
      SELECT * FROM role WHERE id = ? AND is_deleted = 0
    `).get(id) as Role | undefined;

    if (!existing) return null;

    db.prepare(`
      UPDATE role SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, id);

    return db.prepare(`
      SELECT * FROM role WHERE id = ?
    `).get(id) as Role;
  }

  // 删除工种子类
  static deleteRole(id: number): { success: boolean; dependencies?: Record<string, number> } {
    // 检查是否有工具卡片
    const toolCells = db.prepare(`
      SELECT COUNT(*) as count FROM tool_cell
      WHERE role_id = ? AND is_deleted = 0
    `).get(id) as { count: number };

    if (toolCells.count > 0) {
      return {
        success: false,
        dependencies: { tool_cells: toolCells.count },
      };
    }

    db.prepare(`
      UPDATE role
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `).run(id);

    return { success: true };
  }

  // 批量更新子类排序
  static reorderRoles(roleGroupId: number, ids: number[]): void {
    // 验证所有 id 都属于该 role_group_id
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM role
      WHERE id IN (${ids.map(() => '?').join(',')}) AND role_group_id = ? AND is_deleted = 0
    `).get(...ids, roleGroupId) as { count: number };

    if (count.count !== ids.length) {
      throw new Error('部分角色不属于指定的工种大类');
    }

    const updateStmt = db.prepare(`
      UPDATE role SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      ids.forEach((id, index) => {
        updateStmt.run(index + 1, id);
      });
    });

    transaction();
  }

  // 获取所有工种子类（扁平列表）
  static getAllRoles(): Role[] {
    return db.prepare(`
      SELECT * FROM role
      WHERE is_deleted = 0
      ORDER BY role_group_id ASC, sort_order ASC
    `).all() as Role[];
  }
}

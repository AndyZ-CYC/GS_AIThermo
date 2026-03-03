import db from '../config/database.js';
import type { ToolCell } from '../types/index.js';

export class ToolCellService {
  // 获取所有工具卡片
  static getAll(): ToolCell[] {
    return db.prepare(`
      SELECT * FROM tool_cell
      WHERE is_deleted = 0
      ORDER BY game_type_id ASC, role_id ASC
    `).all() as ToolCell[];
  }

  // 根据单元格（game_type_id, role_id）获取工具
  static getByCell(gameTypeId: number, roleId: number): ToolCell | null {
    return db.prepare(`
      SELECT * FROM tool_cell
      WHERE game_type_id = ? AND role_id = ? AND is_deleted = 0
    `).get(gameTypeId, roleId) as ToolCell | null;
  }

  // 根据 ID 获取工具卡片
  static getById(id: number): ToolCell | null {
    return db.prepare(`
      SELECT * FROM tool_cell WHERE id = ? AND is_deleted = 0
    `).get(id) as ToolCell | null;
  }

  // 创建工具卡片
  static create(data: {
    game_type_id: number;
    role_id: number;
    tool_name: string;
    maturity_level: number;
    official_url: string;
    short_desc: string;
    report_url?: string | null;
  }): ToolCell {
    const result = db.prepare(`
      INSERT INTO tool_cell
        (game_type_id, role_id, tool_name, maturity_level, official_url, short_desc, report_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.game_type_id,
      data.role_id,
      data.tool_name,
      data.maturity_level,
      data.official_url,
      data.short_desc,
      data.report_url || null
    );

    const id = result.lastInsertRowid as number;
    return this.getById(id)!;
  }

  // 更新工具卡片
  static update(id: number, data: {
    tool_name?: string;
    maturity_level?: number;
    official_url?: string;
    short_desc?: string;
    report_url?: string | null;
  }): ToolCell | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.tool_name !== undefined) {
      updates.push('tool_name = ?');
      values.push(data.tool_name);
    }
    if (data.maturity_level !== undefined) {
      updates.push('maturity_level = ?');
      values.push(data.maturity_level);
    }
    if (data.official_url !== undefined) {
      updates.push('official_url = ?');
      values.push(data.official_url);
    }
    if (data.short_desc !== undefined) {
      updates.push('short_desc = ?');
      values.push(data.short_desc);
    }
    if (data.report_url !== undefined) {
      updates.push('report_url = ?');
      values.push(data.report_url);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      db.prepare(`
        UPDATE tool_cell SET ${updates.join(', ')} WHERE id = ?
      `).run(...values);
    }

    return this.getById(id)!;
  }

  // 软删除工具卡片
  static delete(id: number): boolean {
    const result = db.prepare(`
      UPDATE tool_cell
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `).run(id);

    return result.changes > 0;
  }
}

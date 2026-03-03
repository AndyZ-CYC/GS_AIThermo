import db from '../config/database.js';
import type { Dimension, DimensionValue, DimensionWithValues } from '../types/index.js';

export class DimensionService {
  // 获取所有维度（含取值）
  static getAll(): DimensionWithValues[] {
    const dimensions = db.prepare(`
      SELECT * FROM dimension
      WHERE is_deleted = 0
      ORDER BY sort_order ASC
    `).all() as Dimension[];

    return dimensions.map(dim => {
      const values = db.prepare(`
        SELECT id, value, sort_order
        FROM dimension_value
        WHERE dimension_id = ? AND is_deleted = 0
        ORDER BY sort_order ASC
      `).all(dim.id) as Pick<DimensionValue, 'id' | 'value' | 'sort_order'>[];

      return {
        ...dim,
        values,
      };
    });
  }

  // 获取单个维度
  static getById(id: number): DimensionWithValues | null {
    const dimensions = this.getAll();
    return dimensions.find(d => d.id === id) || null;
  }

  // 创建维度
  static create(name: string): DimensionWithValues {
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM dimension WHERE is_deleted = 0
    `).get() as { max_order: number };

    const result = db.prepare(`
      INSERT INTO dimension (name, sort_order)
      VALUES (?, ?)
    `).run(name, maxOrder.max_order + 1);

    const id = result.lastInsertRowid as number;
    return this.getById(id)!;
  }

  // 更新维度
  static update(id: number, name: string): DimensionWithValues | null {
    const existing = db.prepare(`
      SELECT * FROM dimension WHERE id = ? AND is_deleted = 0
    `).get(id) as Dimension | undefined;

    if (!existing) return null;

    db.prepare(`
      UPDATE dimension SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, id);

    return this.getById(id)!;
  }

  // 删除维度
  static delete(id: number): { success: boolean; dependencies?: Record<string, number> } {
    // 检查是否有取值
    const values = db.prepare(`
      SELECT COUNT(*) as count FROM dimension_value
      WHERE dimension_id = ? AND is_deleted = 0
    `).get(id) as { count: number };

    if (values.count > 0) {
      return {
        success: false,
        dependencies: { dimension_values: values.count },
      };
    }

    db.prepare(`
      UPDATE dimension
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `).run(id);

    return { success: true };
  }

  // 批量更新排序
  static reorder(ids: number[]): void {
    const updateStmt = db.prepare(`
      UPDATE dimension SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      ids.forEach((id, index) => {
        updateStmt.run(index + 1, id);
      });
    });

    transaction();
  }

  // 创建维度取值
  static createValue(dimensionId: number, value: string): DimensionValue {
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM dimension_value
      WHERE dimension_id = ? AND is_deleted = 0
    `).get(dimensionId) as { max_order: number };

    const result = db.prepare(`
      INSERT INTO dimension_value (dimension_id, value, sort_order)
      VALUES (?, ?, ?)
    `).run(dimensionId, value, maxOrder.max_order + 1);

    const id = result.lastInsertRowid as number;

    return db.prepare(`
      SELECT * FROM dimension_value WHERE id = ?
    `).get(id) as DimensionValue;
  }

  // 更新维度取值
  static updateValue(id: number, value: string): DimensionValue | null {
    const existing = db.prepare(`
      SELECT * FROM dimension_value WHERE id = ? AND is_deleted = 0
    `).get(id) as DimensionValue | undefined;

    if (!existing) return null;

    db.prepare(`
      UPDATE dimension_value SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(value, id);

    return db.prepare(`
      SELECT * FROM dimension_value WHERE id = ?
    `).get(id) as DimensionValue;
  }

  // 删除维度取值
  static deleteValue(id: number): { success: boolean; dependencies?: Record<string, number> } {
    // 检查是否被游戏类型关联
    const gameTypes = db.prepare(`
      SELECT COUNT(*) as count FROM game_type_dimension_value
      WHERE dimension_value_id = ? AND is_deleted = 0
    `).get(id) as { count: number };

    if (gameTypes.count > 0) {
      return {
        success: false,
        dependencies: { game_types: gameTypes.count },
      };
    }

    db.prepare(`
      UPDATE dimension_value
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `).run(id);

    return { success: true };
  }

  // 批量更新取值排序
  static reorderValues(dimensionId: number, ids: number[]): void {
    // 验证所有 id 都属于该 dimension_id
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM dimension_value
      WHERE id IN (${ids.map(() => '?').join(',')}) AND dimension_id = ? AND is_deleted = 0
    `).get(...ids, dimensionId) as { count: number };

    if (count.count !== ids.length) {
      throw new Error('部分取值不属于指定的维度');
    }

    const updateStmt = db.prepare(`
      UPDATE dimension_value SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      ids.forEach((id, index) => {
        updateStmt.run(index + 1, id);
      });
    });

    transaction();
  }

  // 获取所有维度取值（扁平列表）
  static getAllValues(): DimensionValue[] {
    return db.prepare(`
      SELECT * FROM dimension_value
      WHERE is_deleted = 0
      ORDER BY dimension_id ASC, sort_order ASC
    `).all() as DimensionValue[];
  }
}

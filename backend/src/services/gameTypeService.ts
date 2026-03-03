import db from '../config/database.js';
import type { GameType, GameTypeWithRelations, GameTypePoster, GameTypeDimensionValue } from '../types/index.js';

export class GameTypeService {
  // 获取所有游戏类型（含海报和维度取值）
  static getAll(): GameTypeWithRelations[] {
    const gameTypes = db.prepare(`
      SELECT * FROM game_type
      WHERE is_deleted = 0
      ORDER BY sort_order ASC
    `).all() as GameType[];

    return gameTypes.map(gt => {
      // 获取海报
      const posters = db.prepare(`
        SELECT id, file_path, sort_order
        FROM game_type_poster
        WHERE game_type_id = ? AND is_deleted = 0
        ORDER BY sort_order ASC
      `).all(gt.id) as Pick<GameTypePoster, 'id' | 'file_path' | 'sort_order'>[];

      // 获取维度取值
      const dimensionValues = db.prepare(`
        SELECT
          dv.id,
          dv.dimension_id,
          d.name as dimension_name,
          dv.value
        FROM game_type_dimension_value gtdv
        JOIN dimension_value dv ON gtdv.dimension_value_id = dv.id
        JOIN dimension d ON dv.dimension_id = d.id
        WHERE gtdv.game_type_id = ? AND gtdv.is_deleted = 0
          AND dv.is_deleted = 0 AND d.is_deleted = 0
        ORDER BY d.sort_order ASC, dv.sort_order ASC
      `).all(gt.id) as Array<{
        id: number;
        dimension_id: number;
        dimension_name: string;
        value: string;
      }>;

      return {
        ...gt,
        posters,
        dimension_values: dimensionValues,
      };
    });
  }

  // 根据 ID 获取单个游戏类型
  static getById(id: number): GameTypeWithRelations | null {
    const gameTypes = this.getAll();
    return gameTypes.find(gt => gt.id === id) || null;
  }

  // 创建游戏类型
  static create(data: { name: string; dimension_value_ids?: number[] }): GameType {
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM game_type WHERE is_deleted = 0
    `).get() as { max_order: number };

    const result = db.prepare(`
      INSERT INTO game_type (name, sort_order)
      VALUES (?, ?)
    `).run(data.name, maxOrder.max_order + 1);

    const id = result.lastInsertRowid as number;

    // 关联维度取值
    if (data.dimension_value_ids && data.dimension_value_ids.length > 0) {
      this.updateDimensionValues(id, data.dimension_value_ids);
    }

    return this.getById(id)!;
  }

  // 更新游戏类型
  static update(id: number, data: { name?: string; dimension_value_ids?: number[] }): GameType | null {
    const existing = db.prepare(`
      SELECT * FROM game_type WHERE id = ? AND is_deleted = 0
    `).get(id) as GameType | undefined;

    if (!existing) return null;

    if (data.name !== undefined) {
      db.prepare(`
        UPDATE game_type SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(data.name, id);
    }

    if (data.dimension_value_ids !== undefined) {
      this.updateDimensionValues(id, data.dimension_value_ids);
    }

    return this.getById(id)!;
  }

  // 更新维度取值关联（覆盖式）
  private static updateDimensionValues(gameTypeId: number, dimensionValueIds: number[]): void {
    // 软删除旧关联
    db.prepare(`
      UPDATE game_type_dimension_value
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE game_type_id = ? AND is_deleted = 0
    `).run(gameTypeId);

    // 创建新关联
    const insertStmt = db.prepare(`
      INSERT INTO game_type_dimension_value (game_type_id, dimension_value_id)
      VALUES (?, ?)
    `);

    for (const dvId of dimensionValueIds) {
      insertStmt.run(gameTypeId, dvId);
    }
  }

  // 软删除游戏类型
  static delete(id: number): { success: boolean; dependencies?: Record<string, number> } {
    // 检查依赖
    const toolCells = db.prepare(`
      SELECT COUNT(*) as count FROM tool_cell
      WHERE game_type_id = ? AND is_deleted = 0
    `).get(id) as { count: number };

    const posters = db.prepare(`
      SELECT COUNT(*) as count FROM game_type_poster
      WHERE game_type_id = ? AND is_deleted = 0
    `).get(id) as { count: number };

    if (toolCells.count > 0 || posters.count > 0) {
      return {
        success: false,
        dependencies: {
          tool_cells: toolCells.count,
          posters: posters.count,
        },
      };
    }

    db.prepare(`
      UPDATE game_type
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `).run(id);

    return { success: true };
  }

  // 批量更新排序
  static reorder(ids: number[]): void {
    const updateStmt = db.prepare(`
      UPDATE game_type SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const transaction = db.transaction(() => {
      ids.forEach((id, index) => {
        updateStmt.run(index + 1, id);
      });
    });

    transaction();
  }
}

import db from '../config/database.js';
import { GameTypeWithRelations, RoleGroupWithRoles, ToolCell } from '../types/index.js';

/**
 * 获取矩阵数据（一次性加载所有数据）
 */
export function getMatrixData() {
  // 获取所有游戏类型（含海报）
  const gameTypes = db.prepare(`
    SELECT id, name, sort_order, created_at, updated_at
    FROM game_type
    WHERE is_deleted = 0
    ORDER BY sort_order
  `).all() as Array<{
    id: number;
    name: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>;

  // 获取所有海报
  const posters = db.prepare(`
    SELECT id, game_type_id, file_path, sort_order
    FROM game_type_poster
    WHERE is_deleted = 0
    ORDER BY game_type_id, sort_order
  `).all() as Array<{
    id: number;
    game_type_id: number;
    file_path: string;
    sort_order: number;
  }>;

  // 组装游戏类型与海报
  const gameTypesWithPosters: GameTypeWithRelations[] = gameTypes.map(gt => ({
    ...gt,
    created_by: null,
    updated_by: null,
    is_deleted: false,
    deleted_at: null,
    posters: posters
      .filter(p => p.game_type_id === gt.id)
      .map(p => ({
        id: p.id,
        file_path: p.file_path,
        sort_order: p.sort_order,
      })),
    dimension_values: [], // v0 暂不返回维度信息
  }));

  // 获取所有工种大类
  const roleGroups = db.prepare(`
    SELECT id, name, sort_order, created_at, updated_at
    FROM role_group
    WHERE is_deleted = 0
    ORDER BY sort_order
  `).all() as Array<{
    id: number;
    name: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>;

  // 获取所有工种子类
  const roles = db.prepare(`
    SELECT id, role_group_id, name, sort_order, created_at, updated_at
    FROM role
    WHERE is_deleted = 0
    ORDER BY role_group_id, sort_order
  `).all() as Array<{
    id: number;
    role_group_id: number;
    name: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>;

  // 组装工种大类与子类
  const roleGroupsWithRoles: RoleGroupWithRoles[] = roleGroups.map(rg => ({
    ...rg,
    created_by: null,
    updated_by: null,
    is_deleted: false,
    deleted_at: null,
    roles: roles
      .filter(r => r.role_group_id === rg.id)
      .map(r => ({
        id: r.id,
        name: r.name,
        sort_order: r.sort_order,
      })),
  }));

  // 获取所有工具卡片
  const toolCells = db.prepare(`
    SELECT 
      tc.id, tc.game_type_id, tc.role_id, tc.tool_name, 
      tc.maturity_level, tc.official_url, tc.short_desc, tc.report_url,
      tc.created_at, tc.updated_at
    FROM tool_cell tc
    WHERE tc.is_deleted = 0
  `).all() as Array<{
    id: number;
    game_type_id: number;
    role_id: number;
    tool_name: string;
    maturity_level: number;
    official_url: string;
    short_desc: string;
    report_url: string | null;
    created_at: string;
    updated_at: string;
  }>;

  const toolCellResults: ToolCell[] = toolCells.map(tc => ({
    ...tc,
    created_by: null,
    updated_by: null,
    is_deleted: false,
    deleted_at: null,
  }));

  // 获取成熟度配置
  const maturityConfig = db.prepare(`
    SELECT level, label, color_key, sort_order
    FROM maturity_config
    ORDER BY level
  `).all() as Array<{
    level: number;
    label: string;
    color_key: string;
    sort_order: number;
  }>;

  return {
    gameTypes: gameTypesWithPosters,
    roleGroups: roleGroupsWithRoles,
    toolCells: toolCellResults,
    maturityConfig,
  };
}

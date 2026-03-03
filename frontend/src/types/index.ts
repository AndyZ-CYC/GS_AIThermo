// 基础实体接口
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}

// 游戏类型
export interface GameType extends BaseEntity {
  name: string;
  sort_order: number;
}

// 游戏类型海报
export interface GameTypePoster {
  id: number;
  file_path: string;
  sort_order: number;
}

// 游戏类型（含关联）
export interface GameTypeWithRelations extends GameType {
  posters: GameTypePoster[];
  dimension_values: Array<{
    id: number;
    dimension_id: number;
    dimension_name: string;
    value: string;
  }>;
}

// 工种大类
export interface RoleGroup extends BaseEntity {
  name: string;
  sort_order: number;
}

// 工种子类
export interface Role {
  id: number;
  role_group_id: number;
  name: string;
  sort_order: number;
}

// 工种大类（含子类）
export interface RoleGroupWithRoles extends RoleGroup {
  roles: Pick<Role, 'id' | 'name' | 'sort_order'>[];
}

// 工具卡片
export interface ToolCell extends BaseEntity {
  game_type_id: number;
  role_id: number;
  tool_name: string;
  maturity_level: number;
  official_url: string;
  short_desc: string;
  report_url: string | null;
}

// 成熟度配置
export interface MaturityConfig {
  level: number;
  label: string;
  color_key: string;
  sort_order: number;
}

// 矩阵数据
export interface MatrixData {
  gameTypes: GameTypeWithRelations[];
  roleGroups: RoleGroupWithRoles[];
  toolCells: ToolCell[];
  maturityConfig: MaturityConfig[];
}

// API 响应
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// API 错误
export interface ApiError {
  error: string;
  code: string;
  dependencies?: Record<string, number>;
}

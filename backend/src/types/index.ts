// 基础实体接口（包含审计字段）
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
export interface GameTypePoster extends BaseEntity {
  game_type_id: number;
  file_path: string;
  sort_order: number;
}

// 工种大类
export interface RoleGroup extends BaseEntity {
  name: string;
  sort_order: number;
}

// 工种子类
export interface Role extends BaseEntity {
  role_group_id: number;
  name: string;
  sort_order: number;
}

// 工具卡片
export interface ToolCell extends BaseEntity {
  game_type_id: number;
  role_id: number;
  tool_name: string;
  maturity_level: number; // 1-5
  official_url: string;
  short_desc: string;
  report_url: string | null;
}

// 维度
export interface Dimension extends BaseEntity {
  name: string;
  sort_order: number;
}

// 维度取值
export interface DimensionValue extends BaseEntity {
  dimension_id: number;
  value: string;
  sort_order: number;
}

// 游戏类型-维度取值关联
export interface GameTypeDimensionValue extends BaseEntity {
  game_type_id: number;
  dimension_value_id: number;
}

// 成熟度配置
export interface MaturityConfig {
  level: number; // 1-5
  label: string;
  color_key: string;
  sort_order: number;
}

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code: string;
  dependencies?: Record<string, number>;
}

// 扩展类型（带关联）
export interface GameTypeWithRelations extends GameType {
  posters: Pick<GameTypePoster, 'id' | 'file_path' | 'sort_order'>[];
  dimension_values: Array<{
    id: number;
    dimension_id: number;
    dimension_name: string;
    value: string;
  }>;
}

export interface RoleGroupWithRoles extends RoleGroup {
  roles: Pick<Role, 'id' | 'name' | 'sort_order'>[];
}

export interface DimensionWithValues extends Dimension {
  values: Pick<DimensionValue, 'id' | 'value' | 'sort_order'>[];
}

export interface Poster {
  id: number;
  game_type_id: number;
  file_path: string;
  created_at: string;
}

export interface GameType {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  posters: Poster[];
}

export interface Role {
  id: number;
  role_group_id: number;
  name: string;
  sort_order: number;
}

export interface RoleGroup {
  id: number;
  name: string;
  sort_order: number;
  roles: Role[];
}

export interface ToolCell {
  id: number;
  game_type_id: number;
  role_id: number;
  tool_name: string;
  maturity_score: number;
  official_url: string;
  short_desc: string;
  report_url: string | null;
  icon_path: string | null;
  created_at: string;
  updated_at: string;
}

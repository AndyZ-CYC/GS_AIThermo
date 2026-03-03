import db from '../config/database.js';

// 初始化数据库表结构
export function initDatabase(): void {
  // 游戏类型表
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_type (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by  TEXT,
      updated_by  TEXT,
      is_deleted  BOOLEAN NOT NULL DEFAULT 0,
      deleted_at  DATETIME
    )
  `);

  // 游戏类型海报表
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_type_poster (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      game_type_id    INTEGER NOT NULL REFERENCES game_type(id),
      file_path       TEXT    NOT NULL,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by      TEXT,
      updated_by      TEXT,
      is_deleted      BOOLEAN NOT NULL DEFAULT 0,
      deleted_at      DATETIME
    )
  `);

  // 工种大类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_group (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by  TEXT,
      updated_by  TEXT,
      is_deleted  BOOLEAN NOT NULL DEFAULT 0,
      deleted_at  DATETIME
    )
  `);

  // 工种子类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS role (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      role_group_id   INTEGER NOT NULL REFERENCES role_group(id),
      name            TEXT    NOT NULL,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by      TEXT,
      updated_by      TEXT,
      is_deleted      BOOLEAN NOT NULL DEFAULT 0,
      deleted_at      DATETIME
    )
  `);

  // 工具卡片表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tool_cell (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      game_type_id    INTEGER NOT NULL REFERENCES game_type(id),
      role_id         INTEGER NOT NULL REFERENCES role(id),
      tool_name       TEXT    NOT NULL,
      maturity_level  INTEGER NOT NULL CHECK(maturity_level BETWEEN 1 AND 5),
      official_url    TEXT    NOT NULL,
      short_desc      TEXT    NOT NULL,
      report_url      TEXT,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by      TEXT,
      updated_by      TEXT,
      is_deleted      BOOLEAN NOT NULL DEFAULT 0,
      deleted_at      DATETIME
    )
  `);

  // 维度表
  db.exec(`
    CREATE TABLE IF NOT EXISTS dimension (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by  TEXT,
      updated_by  TEXT,
      is_deleted  BOOLEAN NOT NULL DEFAULT 0,
      deleted_at  DATETIME
    )
  `);

  // 维度取值表
  db.exec(`
    CREATE TABLE IF NOT EXISTS dimension_value (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      dimension_id    INTEGER NOT NULL REFERENCES dimension(id),
      value           TEXT    NOT NULL,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by      TEXT,
      updated_by      TEXT,
      is_deleted      BOOLEAN NOT NULL DEFAULT 0,
      deleted_at      DATETIME
    )
  `);

  // 游戏类型-维度取值关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_type_dimension_value (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      game_type_id        INTEGER NOT NULL REFERENCES game_type(id),
      dimension_value_id  INTEGER NOT NULL REFERENCES dimension_value(id),
      created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by          TEXT,
      updated_by          TEXT,
      is_deleted          BOOLEAN NOT NULL DEFAULT 0,
      deleted_at          DATETIME
    )
  `);

  // 创建索引
  // 唯一性约束：保证每个单元格（game_type × role）最多 1 条有效记录
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_tool_cell_active
    ON tool_cell(game_type_id, role_id)
    WHERE is_deleted = 0
  `);

  // 唯一性约束：同一游戏类型不重复关联同一取值
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_gt_dim_value_active
    ON game_type_dimension_value(game_type_id, dimension_value_id)
    WHERE is_deleted = 0
  `);

  // 性能索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tool_cell_game_type
    ON tool_cell(game_type_id) WHERE is_deleted = 0
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tool_cell_role
    ON tool_cell(role_id) WHERE is_deleted = 0
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_role_group
    ON role(role_group_id) WHERE is_deleted = 0
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_poster_game_type
    ON game_type_poster(game_type_id) WHERE is_deleted = 0
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_dim_value_dim
    ON dimension_value(dimension_id) WHERE is_deleted = 0
  `);

  // 成熟度等级配置表（可选，便于后续维护）
  db.exec(`
    CREATE TABLE IF NOT EXISTS maturity_config (
      level       INTEGER PRIMARY KEY CHECK(level BETWEEN 1 AND 5),
      label       TEXT    NOT NULL,
      color_key   TEXT    NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0
    )
  `);

  console.log('Database tables and indexes created successfully');
}

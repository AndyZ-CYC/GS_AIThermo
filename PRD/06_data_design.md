# 06 数据库设计 — AI 行业温度计 WebApp（内网版）

> 前置阅读：`00_overview.md`（项目背景、术语、全局规则）  
> 版本：v0（MVP）

---

## 6.1 数据库选型

| 选项 | 适用场景 | 推荐程度 |
|------|----------|----------|
| **SQLite** | 单文件，极易部署，适合内网小数据量场景，无需额外数据库服务 | **v0 首选** |
| PostgreSQL | 已有内网 DB 基础设施、需要更强并发或企业级运维 | 可替代 |

**v0 默认选择 SQLite**，数据文件建议存放在 `/data/db/app.db`（可配置）。

---

## 6.2 实体关系总览

```
dimension (维度)
    │ 1
    │ n
dimension_value (维度取值)
    │ n
    │ n
game_type_dimension_value (关联表)
    │ n
    │ 1
game_type (游戏类型)
    │ 1
    │ n
game_type_poster (示例海报)

role_group (工种大类)
    │ 1
    │ n
role (工种子类)
    │ n
    │ n
tool_cell (单元格工具卡片)
    │ n
    │ 1
game_type
```

---

## 6.3 表结构详细定义

### 6.3.1 `game_type`（游戏类型）

```sql
CREATE TABLE game_type (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  TEXT,
    updated_by  TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT 0,
    deleted_at  DATETIME
);
```

### 6.3.2 `game_type_poster`（游戏类型示例海报）

```sql
CREATE TABLE game_type_poster (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type_id    INTEGER NOT NULL REFERENCES game_type(id),
    file_path       TEXT    NOT NULL,   -- 服务器本地存储路径或可访问 URL
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      TEXT,
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT 0,
    deleted_at      DATETIME
);
```

> 存储策略：海报文件保存在服务器本地目录（例如 `/data/uploads/posters/`），`file_path` 存相对路径或完整访问 URL。

### 6.3.3 `role_group`（工种大类）

```sql
CREATE TABLE role_group (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  TEXT,
    updated_by  TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT 0,
    deleted_at  DATETIME
);
```

### 6.3.4 `role`（工种子类）

```sql
CREATE TABLE role (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    role_group_id   INTEGER NOT NULL REFERENCES role_group(id),
    name            TEXT    NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,   -- 在所属大类内排序
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      TEXT,
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT 0,
    deleted_at      DATETIME
);
```

### 6.3.5 `tool_cell`（单元格工具卡片）

```sql
CREATE TABLE tool_cell (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type_id    INTEGER NOT NULL REFERENCES game_type(id),
    role_id         INTEGER NOT NULL REFERENCES role(id),
    tool_name       TEXT    NOT NULL,
    maturity_level  INTEGER NOT NULL CHECK(maturity_level BETWEEN 1 AND 5),
    official_url    TEXT    NOT NULL,
    short_desc      TEXT    NOT NULL,
    report_url      TEXT,               -- 可选
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      TEXT,
    updated_by      TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT 0,
    deleted_at      DATETIME
);

-- 唯一性约束：保证每个单元格（game_type × role）最多 1 条有效记录
-- 注意：软删除记录不计入此约束，需由业务层（查询时过滤 is_deleted=0）保障
CREATE UNIQUE INDEX uq_tool_cell_active
    ON tool_cell(game_type_id, role_id)
    WHERE is_deleted = 0;
-- SQLite 支持 partial index；PostgreSQL 同样支持 WHERE 条件唯一索引
```

### 6.3.6 `dimension`（维度）

```sql
CREATE TABLE dimension (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  TEXT,
    updated_by  TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT 0,
    deleted_at  DATETIME
);
```

### 6.3.7 `dimension_value`（维度取值）

```sql
CREATE TABLE dimension_value (
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
);
```

### 6.3.8 `game_type_dimension_value`（游戏类型-维度取值关联）

```sql
CREATE TABLE game_type_dimension_value (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type_id        INTEGER NOT NULL REFERENCES game_type(id),
    dimension_value_id  INTEGER NOT NULL REFERENCES dimension_value(id),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          TEXT,
    updated_by          TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT 0,
    deleted_at          DATETIME
);

CREATE UNIQUE INDEX uq_gt_dim_value_active
    ON game_type_dimension_value(game_type_id, dimension_value_id)
    WHERE is_deleted = 0;
```

### 6.3.9 `maturity_config`（成熟度等级配置，可选）

> v0 可不建此表，直接在前端写死映射。若需要 label/描述/颜色可维护，则建此表。

```sql
CREATE TABLE maturity_config (
    level       INTEGER PRIMARY KEY CHECK(level BETWEEN 1 AND 5),
    label       TEXT    NOT NULL,   -- 例如"低"、"较低"、"中"、"较高"、"高"
    color_key   TEXT    NOT NULL,   -- 前端 key，例如"red"、"orange"，不存 HEX
    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- 初始数据
INSERT INTO maturity_config VALUES (1, '低',   'red',          1);
INSERT INTO maturity_config VALUES (2, '较低', 'orange',       2);
INSERT INTO maturity_config VALUES (3, '中',   'yellow',       3);
INSERT INTO maturity_config VALUES (4, '较高', 'yellow-green', 4);
INSERT INTO maturity_config VALUES (5, '高',   'green',        5);
```

---

## 6.4 唯一性约束汇总

| 表 | 约束 | 说明 |
|----|------|------|
| `tool_cell` | `UNIQUE(game_type_id, role_id) WHERE is_deleted = 0` | 每个单元格最多 1 条有效工具卡片 |
| `game_type_dimension_value` | `UNIQUE(game_type_id, dimension_value_id) WHERE is_deleted = 0` | 同一游戏类型不重复关联同一取值 |

---

## 6.5 软删除规范

- 所有主业务表均含 `is_deleted`（BOOL, 默认 0）和 `deleted_at`（DATETIME, 默认 NULL）字段
- 软删除操作：设置 `is_deleted = 1`，写入 `deleted_at = NOW()`
- **所有查询均需过滤 `is_deleted = 0`**（防止软删数据出现在正常业务流中）
- 物理删除：v0 不做，留给未来运维清理脚本处理

---

## 6.6 级联删除阻止策略（数据层）

业务层（Service 层）在执行删除前，**必须先做依赖检查**：

| 软删目标 | 检查 SQL（示例） | 阻止条件 |
|----------|----------------|----------|
| `game_type` | `SELECT COUNT(*) FROM tool_cell WHERE game_type_id=? AND is_deleted=0` | COUNT > 0 |
| `game_type` | `SELECT COUNT(*) FROM game_type_poster WHERE game_type_id=? AND is_deleted=0` | COUNT > 0 |
| `role_group` | `SELECT COUNT(*) FROM role WHERE role_group_id=? AND is_deleted=0` | COUNT > 0 |
| `role` | `SELECT COUNT(*) FROM tool_cell WHERE role_id=? AND is_deleted=0` | COUNT > 0 |
| `dimension` | `SELECT COUNT(*) FROM dimension_value WHERE dimension_id=? AND is_deleted=0` | COUNT > 0 |
| `dimension_value` | `SELECT COUNT(*) FROM game_type_dimension_value WHERE dimension_value_id=? AND is_deleted=0` | COUNT > 0 |

检查通过（COUNT = 0）后，方可执行软删除。

---

## 6.7 索引建议

```sql
-- 矩阵渲染高频查询
CREATE INDEX idx_tool_cell_game_type ON tool_cell(game_type_id) WHERE is_deleted = 0;
CREATE INDEX idx_tool_cell_role      ON tool_cell(role_id)      WHERE is_deleted = 0;

-- 工种子类按大类查询
CREATE INDEX idx_role_group ON role(role_group_id) WHERE is_deleted = 0;

-- 海报按游戏类型查询
CREATE INDEX idx_poster_game_type ON game_type_poster(game_type_id) WHERE is_deleted = 0;

-- 维度取值按维度查询
CREATE INDEX idx_dim_value_dim ON dimension_value(dimension_id) WHERE is_deleted = 0;
```

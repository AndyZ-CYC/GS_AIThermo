# 07 API 接口设计 — AI 行业温度计 WebApp（内网版）

> 前置阅读：`00_overview.md`（项目背景、术语、全局规则）  
> 版本：v0（MVP）

---

## 7.1 通用约定

| 约定项 | 说明 |
|--------|------|
| 风格 | RESTful HTTP API |
| 数据格式 | JSON（请求体和响应体均为 JSON） |
| 鉴权 | v0 无鉴权，所有接口开放；需预留鉴权中间件位置供未来接入 |
| 软删除 | 所有列表接口**默认只返回未软删除**（`is_deleted = 0`）的数据 |
| 错误响应 | 统一格式：`{ "error": "错误描述", "code": "ERROR_CODE" }` |
| 成功响应 | 统一格式：`{ "data": ... }` 或 `{ "data": ..., "message": "操作成功" }` |
| 级联阻止错误码 | `HAS_DEPENDENCIES`（HTTP 409 Conflict），附带 `dependencyCount` 字段 |

---

## 7.2 GameType（游戏类型）

### `GET /api/game-types`

获取游戏类型列表（含海报和维度取值关联）。

**响应示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "2.5D 俯视角 RPG",
      "sort_order": 1,
      "posters": [
        { "id": 10, "file_path": "/uploads/posters/xxx.jpg", "sort_order": 1 }
      ],
      "dimension_values": [
        { "id": 5, "dimension_id": 1, "dimension_name": "玩法", "value": "RPG" }
      ]
    }
  ]
}
```

---

### `POST /api/game-types`

新增游戏类型。

**请求体**：
```json
{
  "name": "2.5D 俯视角 RPG",
  "dimension_value_ids": [5, 8]   // 可选，为空数组或省略均可
}
```

**响应**：返回新建的游戏类型对象。

---

### `PUT /api/game-types/{id}`

编辑游戏类型。

**请求体**：
```json
{
  "name": "新名称",
  "dimension_value_ids": [5, 9]   // 覆盖式更新，旧关联全部软删，写入新关联
}
```

---

### `DELETE /api/game-types/{id}`

软删除游戏类型。

**级联检查**：若存在关联 `tool_cell` 或 `game_type_poster`，返回 409：
```json
{
  "error": "该游戏类型下存在关联工具卡片或海报，请先清理后再删除。",
  "code": "HAS_DEPENDENCIES",
  "dependencies": {
    "tool_cells": 3,
    "posters": 2
  }
}
```

---

### `PUT /api/game-types/sort`

批量更新游戏类型排序。

**请求体**：
```json
{
  "ids": [3, 1, 2, 5, 4]   // 按新顺序排列的 id 数组，索引即 sort_order
}
```

---

## 7.3 Poster（游戏类型海报）

### `POST /api/game-types/{id}/posters`

上传海报（multipart/form-data）。

**请求**：`Content-Type: multipart/form-data`，字段名 `files`（支持多文件）。

**响应**：返回上传成功的海报对象列表（含 `id`、`file_path`、`sort_order`）。

---

### `DELETE /api/posters/{poster_id}`

软删除指定海报。

**注意**：同时需在服务器本地目录删除或标记对应文件。

---

### `PUT /api/game-types/{id}/posters/sort`

更新指定游戏类型的海报排序。

**请求体**：
```json
{
  "ids": [12, 10, 11]   // 海报 id 按新顺序排列
}
```

---

## 7.4 RoleGroup（工种大类）

### `GET /api/role-groups`

获取工种大类列表（含子类，按 `sort_order` 排序）。

**响应示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "2D 美术",
      "sort_order": 1,
      "roles": [
        { "id": 10, "name": "2D 原画", "sort_order": 1 },
        { "id": 11, "name": "UI 设计", "sort_order": 2 }
      ]
    }
  ]
}
```

---

### `POST /api/role-groups`

新增工种大类。

**请求体**：`{ "name": "2D 美术" }`

---

### `PUT /api/role-groups/{id}`

编辑工种大类。

**请求体**：`{ "name": "新名称" }`

---

### `DELETE /api/role-groups/{id}`

软删除工种大类。

**级联检查**：若存在子工种（`role`），返回 409：
```json
{
  "error": "该大类下存在 N 个工种子类，请先删除所有子工种后再删除此大类。",
  "code": "HAS_DEPENDENCIES",
  "dependencies": { "roles": 3 }
}
```

---

### `PUT /api/role-groups/sort`

批量更新大类排序。

**请求体**：`{ "ids": [2, 1, 3] }`

---

## 7.5 Role（工种子类）

### `POST /api/roles`

新增工种子类。

**请求体**：
```json
{
  "role_group_id": 1,
  "name": "2D 原画"
}
```

---

### `PUT /api/roles/{id}`

编辑工种子类（只允许修改名称，不允许修改 `role_group_id`）。

**请求体**：`{ "name": "新名称" }`

---

### `DELETE /api/roles/{id}`

软删除工种子类。

**级联检查**：若存在关联 `tool_cell`，返回 409：
```json
{
  "error": "该工种下存在 N 个工具卡片，请先删除关联工具卡片后再删除此工种。",
  "code": "HAS_DEPENDENCIES",
  "dependencies": { "tool_cells": 2 }
}
```

---

### `PUT /api/roles/sort`

批量更新某大类内子类排序。

**请求体**：
```json
{
  "role_group_id": 1,
  "ids": [11, 10, 12]   // 必须全部属于同一 role_group_id
}
```

服务端需校验所有 id 均属于指定 `role_group_id`，否则返回 400。

---

## 7.6 ToolCell（单元格工具卡片）

### `GET /api/tool-cells`

获取全部工具卡片（矩阵渲染用，一次性全量返回）。

**响应示例**：
```json
{
  "data": [
    {
      "id": 100,
      "game_type_id": 1,
      "role_id": 10,
      "tool_name": "Midjourney",
      "maturity_level": 5,
      "official_url": "https://midjourney.com",
      "short_desc": "AI 图像生成工具，适用于概念设计阶段。",
      "report_url": "https://example.com/report"
    }
  ]
}
```

---

### `POST /api/tool-cells`

新增工具卡片。

**请求体**：
```json
{
  "game_type_id": 1,
  "role_id": 10,
  "tool_name": "Midjourney",
  "maturity_level": 5,
  "official_url": "https://midjourney.com",
  "short_desc": "AI 图像生成工具。",
  "report_url": "https://example.com/report"   // 可选
}
```

**服务端校验**：
- 必填字段不为空
- `game_type_id` 和 `role_id` 均存在且未软删除
- `UNIQUE(game_type_id, role_id)` 无冲突（即该单元格当前无有效卡片）

---

### `PUT /api/tool-cells/{id}`

编辑工具卡片（不允许修改 `game_type_id` / `role_id`）。

**请求体**：
```json
{
  "tool_name": "Midjourney v6",
  "maturity_level": 5,
  "official_url": "https://midjourney.com",
  "short_desc": "更新后的描述。",
  "report_url": null
}
```

---

### `DELETE /api/tool-cells/{id}`

软删除工具卡片（无下游依赖，直接软删）。

---

## 7.7 Dimension（维度）

### `GET /api/dimensions`

获取维度列表（含取值，按 `sort_order` 排序）。

**响应示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "玩法",
      "sort_order": 1,
      "values": [
        { "id": 1, "value": "动作", "sort_order": 1 },
        { "id": 2, "value": "RPG",  "sort_order": 2 }
      ]
    }
  ]
}
```

---

### `POST /api/dimensions`

新增维度。请求体：`{ "name": "玩法" }`

---

### `PUT /api/dimensions/{id}`

编辑维度。请求体：`{ "name": "新名称" }`

---

### `DELETE /api/dimensions/{id}`

软删除维度。

**级联检查**：若存在取值，返回 409：
```json
{
  "error": "该维度下存在 N 个取值，请先删除所有取值后再删除此维度。",
  "code": "HAS_DEPENDENCIES",
  "dependencies": { "dimension_values": 4 }
}
```

---

### `PUT /api/dimensions/sort`

批量更新维度排序。请求体：`{ "ids": [2, 1, 3] }`

---

## 7.8 DimensionValue（维度取值）

### `POST /api/dimension-values`

新增维度取值。

**请求体**：
```json
{
  "dimension_id": 1,
  "value": "动作"
}
```

---

### `PUT /api/dimension-values/{id}`

编辑取值。请求体：`{ "value": "新取值" }`

---

### `DELETE /api/dimension-values/{id}`

软删除维度取值。

**级联检查**：若被游戏类型关联，返回 409：
```json
{
  "error": "该维度取值已被 N 个游戏类型关联，请先解除关联后再删除。",
  "code": "HAS_DEPENDENCIES",
  "dependencies": { "game_types": 2 }
}
```

---

### `PUT /api/dimension-values/sort`

批量更新某维度内取值排序。

**请求体**：
```json
{
  "dimension_id": 1,
  "ids": [2, 1, 3]
}
```

服务端需校验所有 id 均属于指定 `dimension_id`。

---

## 7.9 GameType 维度取值关联

### `PUT /api/game-types/{id}/dimension-values`

设置某游戏类型选择的维度取值（**覆盖式**：软删旧关联，写入新关联）。

**请求体**：
```json
{
  "dimension_value_ids": [1, 3, 7]   // 新的完整取值 id 列表；空数组表示清空所有关联
}
```

---

## 7.10 错误码一览

| HTTP 状态 | `code` | 含义 |
|-----------|--------|------|
| 400 | `VALIDATION_ERROR` | 必填字段缺失或格式错误 |
| 404 | `NOT_FOUND` | 指定 id 不存在或已软删除 |
| 409 | `HAS_DEPENDENCIES` | 存在级联依赖，阻止删除 |
| 409 | `DUPLICATE_CELL` | 单元格唯一性冲突（已存在卡片） |
| 500 | `INTERNAL_ERROR` | 服务端内部错误 |

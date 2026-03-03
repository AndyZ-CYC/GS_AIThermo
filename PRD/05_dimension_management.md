# 05 维度体系管理 — AI 行业温度计 WebApp（内网版）

> 前置阅读：`00_overview.md`（项目背景、术语、全局规则）  
> 版本：v0（MVP）

---

## 5.1 功能概述

维度体系（Dimension System）是游戏类型分类的结构化配置层，用于支撑未来对游戏类型进行筛选、聚合与管理。

结构为**两级**：
- **维度（Dimension）**：分类的维度名，例如"玩法"、"画风"、"视角"、"建模维度"
- **维度取值（DimensionValue）**：某维度下的具体取值，例如"动作"、"像素"、"2.5D 俯视角"

维度体系本身**独立于游戏类型存在**，可单独维护。游戏类型可选择性地关联若干维度取值（多对多）。

---

## 5.2 数据字段

### 5.2.1 维度（`dimension` 表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | PK | 是 | 主键 |
| `name` | TEXT | **是** | 维度名称，例如"玩法"、"视角" |
| `sort_order` | INT | 是 | 维度列表展示顺序 |
| `created_at` / `updated_at` | DATETIME | 是 | 审计时间 |
| `created_by` / `updated_by` | TEXT | 是 | 审计用户（v0 填 `"system"` 或置空） |
| `is_deleted` | BOOL | 是 | 软删除标记，默认 false |
| `deleted_at` | DATETIME | 否 | 软删除时间 |

### 5.2.2 维度取值（`dimension_value` 表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | PK | 是 | 主键 |
| `dimension_id` | FK | **是** | 所属维度 |
| `value` | TEXT | **是** | 取值内容，例如"动作"、"像素风" |
| `sort_order` | INT | 是 | 在所属维度内的排列顺序 |
| `created_at` / `updated_at` | DATETIME | 是 | 审计时间 |
| `created_by` / `updated_by` | TEXT | 是 | 审计用户（v0 填 `"system"` 或置空） |
| `is_deleted` | BOOL | 是 | 软删除标记，默认 false |
| `deleted_at` | DATETIME | 否 | 软删除时间 |

### 5.2.3 游戏类型-维度取值关联（`game_type_dimension_value` 表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | PK | 是 | 主键 |
| `game_type_id` | FK | **是** | 关联的游戏类型 |
| `dimension_value_id` | FK | **是** | 关联的维度取值 |
| `created_at` / `updated_at` | DATETIME | 是 | 审计时间 |
| `created_by` / `updated_by` | TEXT | 是 | 审计用户（v0 填 `"system"` 或置空） |
| `is_deleted` | BOOL | 是 | 软删除标记，默认 false |
| `deleted_at` | DATETIME | 否 | 软删除时间 |

**唯一性约束**：`UNIQUE(game_type_id, dimension_value_id)`

---

## 5.3 维度（Dimension）CRUD

### 5.3.1 新增维度

**入口**：维度体系管理页的"新增维度"按钮。

**表单字段**：
- 维度名称（必填）

**保存逻辑**：
- 写入 `dimension` 表，`sort_order` 追加到末尾

### 5.3.2 编辑维度

**可编辑字段**：
- 维度名称

### 5.3.3 删除维度

**删除规则（阻止级联删除）**：

1. 检查该维度是否存在**未软删除的维度取值**（`dimension_value.dimension_id = 此维度 id`）
2. **若存在取值**：
   - **阻止删除**
   - 提示信息例如："该维度下存在 N 个取值，请先删除所有取值后再删除此维度。"
3. **若无取值**：
   - 执行软删除：`is_deleted = true`，写入 `deleted_at`

### 5.3.4 维度排序

- 支持拖拽排序
- 拖拽结束后调用 `PUT /dimensions/sort`，批量更新 `sort_order`

---

## 5.4 维度取值（DimensionValue）CRUD

### 5.4.1 新增维度取值

**入口**：维度体系管理页某维度下的"添加取值"按钮。

**表单字段**：
- 取值内容（必填）
- 所属维度（自动关联当前维度，不需用户选择）

**保存逻辑**：
- 写入 `dimension_value` 表，`sort_order` 追加到该维度内末尾

### 5.4.2 编辑维度取值

**可编辑字段**：
- 取值内容

### 5.4.3 删除维度取值

**删除规则（阻止级联删除）**：

1. 检查该取值是否被任何游戏类型关联（`game_type_dimension_value.dimension_value_id = 此取值 id` 且未软删除）
2. **若存在关联**：
   - **阻止删除**
   - 提示信息例如："该维度取值已被 N 个游戏类型关联，请先在对应游戏类型的编辑页解除关联后再删除。"
3. **若无关联**：
   - 执行软删除：`is_deleted = true`，写入 `deleted_at`

### 5.4.4 维度取值排序

- 支持在维度内对取值进行拖拽排序
- 拖拽结束后调用 `PUT /dimension-values/sort`，批量更新该维度内取值的 `sort_order`

---

## 5.5 与游戏类型的关联管理

维度取值与游戏类型的关联操作入口**位于游戏类型编辑页**（见 `02_game_type_management.md`），不在维度体系管理页直接操作。

关联更新方式：**覆盖式**（服务端收到新的取值 id 列表后，软删旧关联，写入新关联记录）。

---

## 5.6 维度体系管理页面结构

```
维度体系管理页
├── 顶部操作栏
│   └── [新增维度] 按钮
├── 维度列表（支持拖拽排序）
│   ├── 维度 A："玩法"（可拖拽）
│   │   ├── 维度名称 + [编辑] [删除] + [添加取值] 操作
│   │   └── 取值列表（支持组内拖拽排序）
│   │       ├── 取值"动作" + [编辑] [删除]
│   │       ├── 取值"RPG" + [编辑] [删除]
│   │       └── ...
│   ├── 维度 B："画风"
│   │   └── ...
│   └── ...
└── 新增/编辑表单（弹窗或嵌入式）
    └── 名称/取值内容（必填）
```

---

## 5.7 接口依赖

详细接口定义见 `07_api_design.md`，本模块相关接口：

- `GET /dimensions` — 获取维度列表（含取值，按 `sort_order`）
- `POST /dimensions` — 新增维度
- `PUT /dimensions/{id}` — 编辑维度
- `DELETE /dimensions/{id}` — 软删除维度（含级联检查）
- `PUT /dimensions/sort` — 维度批量排序
- `POST /dimension-values` — 新增维度取值
- `PUT /dimension-values/{id}` — 编辑维度取值
- `DELETE /dimension-values/{id}` — 软删除维度取值（含级联检查）
- `PUT /dimension-values/sort` — 取值批量排序（组内）

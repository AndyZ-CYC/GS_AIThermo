# 09 权限与审计预留 — AI 行业温度计 WebApp（内网版）

> 前置阅读：`00_overview.md`（项目背景、术语、全局规则）  
> 版本：v0（MVP）

---

## 9.1 v0 权限策略

- v0 **不实施鉴权**
- 内网访问的任何用户均可执行所有操作（增删改查、排序、上传等）
- 无角色区分（管理员 / 只读浏览者等均为同等权限）

---

## 9.2 未来鉴权接入目标（后续版本）

未来计划接入公司现有鉴权/用户体系，届时需要：

- 识别当前操作用户（user_id）
- 可能引入角色权限（例如：只读浏览者 vs 维护者）
- 写操作记录操作者 user_id（审计）

---

## 9.3 v0 必须预留的审计字段

所有核心业务表**必须**在 v0 起包含以下字段，不可省略：

| 字段名 | 类型 | 是否必填 | v0 写入值 | 未来用途 |
|--------|------|----------|-----------|----------|
| `created_at` | DATETIME | 是 | 自动写入当前时间 | 记录创建时间 |
| `updated_at` | DATETIME | 是 | 自动更新为当前时间 | 记录最后更新时间 |
| `created_by` | TEXT | 否 | 写入 `"system"` 或留空（实现选一种，全局统一） | 记录创建者 user_id |
| `updated_by` | TEXT | 否 | 写入 `"system"` 或留空（实现选一种，全局统一） | 记录更新者 user_id |

**涉及的表**（全部核心业务表）：

- `game_type`
- `game_type_poster`
- `role_group`
- `role`
- `tool_cell`
- `dimension`
- `dimension_value`
- `game_type_dimension_value`

---

## 9.4 软删除字段（兼具审计价值）

以下字段同时服务于软删除逻辑与操作审计：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `is_deleted` | BOOL | 软删除标记，默认 0（false） |
| `deleted_at` | DATETIME | 软删除时间，未删除时为 NULL |

> 未来扩展：可增加 `deleted_by` 字段记录执行软删除的用户。

---

## 9.5 鉴权中间件预留位置

后端代码在 v0 起需保留鉴权中间件的**占位结构**，确保未来接入时只需：

1. 实现中间件逻辑（解析 token / session → 提取 user_id）
2. 将 user_id 注入请求上下文
3. 各 Service 层从上下文读取 user_id 并写入 `created_by` / `updated_by`

**不需要**改动路由注册、业务逻辑或数据库 Schema。

示例（伪代码，技术栈无关）：

```
Router
  └── [AuthMiddleware]  ← v0: 直接 next()，不做拦截；未来: 解析 token
       └── [RequestContext: user_id]  ← v0: "system" 或 null；未来: 真实 user_id
            └── BusinessHandler
                 └── service.createXxx(data, ctx.user_id)
```

---

## 9.6 v0 `created_by` / `updated_by` 写入规范

全局统一选择以下一种策略（实现时选定，代码中不混用）：

| 策略 | `created_by` / `updated_by` 值 | 说明 |
|------|-------------------------------|------|
| **方案 A（推荐）** | `"system"` | 语义明确，便于日志检索 |
| 方案 B | `NULL` / 空字符串 | 更简洁，但可读性略差 |

---

## 9.7 未来接入检查清单（备忘）

接入鉴权时需完成的改造点：

- [ ] 实现 AuthMiddleware（解析公司 SSO/token）
- [ ] 请求上下文注入 `user_id`
- [ ] Service 层所有写操作改为从上下文读取 `user_id` 写入 `created_by` / `updated_by`
- [ ] （可选）增加角色权限检查（Role-Based Access Control）
- [ ] （可选）部分只读接口对未登录用户开放，写操作接口要求登录
- [ ] 前端 UI 根据当前用户角色显示/隐藏编辑操作入口

# 08 文件存储与数据一致性 — AI 行业温度计 WebApp（内网版）

> 前置阅读：`00_overview.md`（项目背景、术语、全局规则）  
> 版本：v0（MVP）

---

## 8.1 文件存储方案

### 8.1.1 方案目标

| 目标 | 说明 |
|------|------|
| 易部署 | 无需额外对象存储服务，仅用服务器本地目录 |
| 易备份 | 文件目录 + SQLite 文件一起备份即可 |
| 可删除 | 软删除 DB 记录的同时，物理文件可被清理 |
| 可追踪 | 文件路径记录在 DB，便于排查孤立文件 |

### 8.1.2 存储目录结构（建议）

```
/data/
├── db/
│   └── app.db                    # SQLite 数据文件
└── uploads/
    └── posters/
        ├── {game_type_id}/       # 按游戏类型 id 分目录（可选）
        │   ├── {uuid}.jpg
        │   └── {uuid}.png
        └── ...
```

### 8.1.3 文件命名规则

- 上传时生成 UUID 作为文件名（不使用原始文件名，避免冲突与路径注入）
- 保留原始文件扩展名
- 示例：`a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`

### 8.1.4 `file_path` 字段存储内容

- 存储**相对路径**，例如：`/uploads/posters/1/a1b2c3d4.jpg`
- 前端通过拼接服务器 Base URL 访问：`http://server:port/uploads/posters/1/a1b2c3d4.jpg`
- 服务端需配置静态文件服务，将 `/uploads/` 目录对外提供 HTTP 访问

### 8.1.5 文件删除策略

- 海报被软删除时：
  1. DB 记录执行软删除（`is_deleted = 1`）
  2. 服务端**同步删除**服务器本地对应物理文件
- 若物理删除失败，需记录错误日志，不阻塞 DB 软删除操作（DB 操作优先）

### 8.1.6 前端展示处理

- 所有海报图片在前端统一以**固定比例缩略图**展示（建议 16:9 或 4:3）
- 裁剪方式：前端 CSS `object-fit: cover`（推荐，无需后端参与）
- 在矩阵总览页横轴卡片上：多张海报并排，超出卡片宽度时允许 z-index 堆叠展示

---

## 8.2 数据一致性规则

### 8.2.1 唯一性保障

| 场景 | 约束方式 |
|------|----------|
| 单元格最多 1 个工具卡片 | DB Partial Unique Index：`UNIQUE(game_type_id, role_id) WHERE is_deleted=0` |
| 游戏类型不重复关联同一维度取值 | DB Partial Unique Index：`UNIQUE(game_type_id, dimension_value_id) WHERE is_deleted=0` |

### 8.2.2 软删除一致性

- 所有列表查询**必须**加 `WHERE is_deleted = 0` 过滤条件
- 软删除时同步更新 `deleted_at = NOW()`
- 软删除的记录对业务逻辑透明，不影响 ID 的引用计数（唯一索引通过 partial index 排除）

### 8.2.3 级联删除阻止规则（完整汇总）

> 详细 SQL 示例见 `06_data_design.md` 6.6 节；API 响应格式见 `07_api_design.md` 7.10 节。

| 删除对象 | 检查依赖 | 阻止条件 |
|----------|---------|----------|
| GameType | `tool_cell`（关联此 game_type_id）且未软删除 | 存在 ≥ 1 条 |
| GameType | `game_type_poster`（关联此 game_type_id）且未软删除 | 存在 ≥ 1 条 |
| RoleGroup | `role`（关联此 role_group_id）且未软删除 | 存在 ≥ 1 条 |
| Role | `tool_cell`（关联此 role_id）且未软删除 | 存在 ≥ 1 条 |
| Dimension | `dimension_value`（关联此 dimension_id）且未软删除 | 存在 ≥ 1 条 |
| DimensionValue | `game_type_dimension_value`（关联此 dimension_value_id）且未软删除 | 存在 ≥ 1 条 |

**执行步骤（Service 层）**：
1. 查询所有依赖，统计数量
2. 若任一依赖数量 > 0，返回 409 + `HAS_DEPENDENCIES` 错误及各依赖数量
3. 若依赖均为 0，执行软删除

### 8.2.4 排序操作一致性

- 子工种排序接口（`PUT /api/roles/sort`）：服务端校验请求中所有 `role_id` 均属于指定的 `role_group_id`，否则拒绝（400）
- 维度取值排序接口（`PUT /api/dimension-values/sort`）：服务端校验所有 `dimension_value_id` 均属于指定的 `dimension_id`，否则拒绝（400）
- 排序操作应在事务中执行，保证原子性

### 8.2.5 游戏类型维度取值更新（覆盖式）

执行 `PUT /api/game-types/{id}/dimension-values` 时：
1. 在**事务**中执行：
   a. 软删除该 `game_type_id` 下所有现有 `game_type_dimension_value` 关联记录
   b. 批量写入新的关联记录
2. 若写入过程出错，事务回滚

---

## 8.3 数据备份建议

| 备份对象 | 方式 |
|----------|------|
| SQLite 数据文件 | 定期拷贝 `/data/db/app.db`（SQLite 支持热备份，可使用 `.backup` 命令） |
| 海报文件目录 | 定期同步 `/data/uploads/` 到备份存储 |

建议配置定时脚本（cron），每日备份一次，保留最近 N 天备份。

---

## 8.4 灰色状态语义（已确认）

- **v0 统一语义**：单元格无工具卡片 ↔ 灰色缺失（不区分"不适用 / 未评估 / 暂无工具"）
- 前端判断逻辑：矩阵渲染时，若该 `(game_type_id, role_id)` 对在 `tool_cell` 数据中无匹配记录（或记录已软删除），则渲染灰色占位
- 数据库中无需单独存储灰色状态，灰色由"无记录"隐式表示

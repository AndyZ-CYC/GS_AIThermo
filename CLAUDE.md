# AI 行业温度计 WebApp - 项目说明

> 此文件为 AI Agent 提供项目上下文，帮助 Agent 在新的会话中快速理解项目状态。

## 项目概述

本项目是一个**内网部署的 WebApp**，以二维矩阵方式展示不同"游戏类型"与"游戏行业工种"交叉点下的 SOTA AI 工具及其成熟度。

### 核心功能
- **矩阵总览页**：横轴=游戏类型，纵轴=工种，单元格=AI工具卡片
- **游戏类型管理**：CRUD + 拖拽排序 + 示例海报
- **工种管理**：两级层级（大类+子类）CRUD
- **工具卡片管理**：单元格中的工具信息维护
- **维度体系管理**：可配置的游戏类型分类体系

### 技术栈（待确定）
- 前端：React/Vue + TypeScript
- 后端：Node.js/Python
- 数据库：SQLite（优先）或 PostgreSQL
- 文件存储：服务器本地目录

## 项目结构

```
GS_AIThermo/
├── CLAUDE.md              # 本文件 - Agent 上下文说明
├── PRD/                   # 产品需求文档
│   ├── 00_overview.md     # 项目总览
│   ├── 01_matrix_overview.md
│   ├── 02_game_type_management.md
│   ├── 03_role_management.md
│   ├── 04_tool_cell_management.md
│   ├── 05_dimension_management.md
│   ├── 06_data_design.md
│   ├── 07_api_design.md
│   ├── 08_storage_and_consistency.md
│   └── 09_auth_audit_reserve.md
├── feature_list.json      # 功能清单与状态
├── claude-progress.txt    # 进度日志
├── init.sh               # 初始化脚本
├── src/                  # 源代码（待创建）
└── tests/                # 测试文件（待创建）
```

## Agent 工作指南

### 每次会话开始时
1. 运行 `pwd` 确认工作目录
2. 阅读 `claude-progress.txt` 了解最新进度
3. 阅读 `feature_list.json` 选择下一个未完成的功能
4. 检查 `git log` 了解最近提交
5. 如果项目已初始化，运行 `./init.sh` 启动开发服务器并验证基本功能

### 每次会话结束时
1. 确保代码处于可工作状态（无阻塞性bug）
2. 提交有意义的 git commit
3. 更新 `claude-progress.txt` 记录本次工作内容
4. 如果完成了某个功能，更新 `feature_list.json` 中的 `passes` 状态

### 代码规范
- 使用 TypeScript 编写类型安全的代码
- 遵循现有代码风格
- 添加必要的注释（但不过度注释）
- 编写单元测试覆盖核心逻辑

## 成熟度等级颜色编码

| 等级 | 语义 | 颜色 |
|------|------|------|
| 1 | AI结合程度低 | 红 |
| 2 | 较低 | 橙 |
| 3 | 中 | 黄 |
| 4 | 较高 | 黄绿 |
| 5 | AI结合程度高 | 绿 |
| - | 缺失 | 灰 |

## 关键数据实体

- **GameType**：游戏类型（横轴）
- **RoleGroup/Role**：工种大类/子类（纵轴）
- **ToolCell**：工具卡片（单元格内容）
- **Dimension/DimensionValue**：维度体系

## 里程碑

| 阶段 | 内容 | 状态 |
|------|------|------|
| M1 | 基础数据模型 + 矩阵总览页只读渲染 | pending |
| M2 | GameType / Role CRUD + 拖拽排序 | pending |
| M3 | ToolCell CRUD + 工具详情弹窗 | pending |
| M4 | 海报上传/删除/展示/拖拽排序 | pending |
| M5 | 维度体系管理 + 游戏类型维度取值绑定 | pending |

## 参考链接

- PRD 文档：`./PRD/` 目录
- API 设计：`./PRD/07_api_design.md`
- 数据设计：`./PRD/06_data_design.md`

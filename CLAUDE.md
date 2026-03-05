# AI 行业温度计 WebApp - 项目说明

> 此文件为 AI Agent 提供项目上下文。

## 项目概述

内网部署的 WebApp，以二维矩阵展示不同"游戏类型"与"游戏行业工种"交叉点下的 SOTA AI 工具及其成熟度。

## 技术栈

- **后端**：FastAPI (Python) + SQLite
- **前端**：React 19 + TypeScript + Vite + TailwindCSS
- **数据库**：SQLite 单文件 (`data/app.db`)
- **文件存储**：本地目录 (`data/uploads/posters/`)

## 项目结构

```
GS_AIThermo/
├── CLAUDE.md
├── PRD/                  # 产品需求文档（参考用）
├── backend/
│   ├── requirements.txt
│   ├── main.py           # FastAPI 入口
│   ├── database.py       # SQLite 连接 & 建表
│   ├── models.py         # Pydantic schemas
│   └── routers/          # API 路由
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── api/          # API 客户端
│       ├── pages/        # 页面组件
│       ├── components/   # 通用组件
│       ├── hooks/        # React Query hooks
│       ├── types/        # TypeScript 类型
│       └── utils/        # 工具函数
└── data/                 # 运行时数据（.gitignore）
```

## 核心数据实体

- **GameType**：游戏类型（横轴），含示例海报
- **RoleGroup / Role**：工种大类 / 子类（纵轴）
- **ToolCell**：工具卡片（单元格），含 maturity_score (0-100)

## 成熟度分数映射

| 分数区间 | 等级 | 颜色 | 语义 |
|---------|------|------|------|
| 0-20    | 1    | 红   | AI结合程度低 |
| 21-40   | 2    | 橙   | 较低 |
| 41-60   | 3    | 黄   | 中 |
| 61-80   | 4    | 黄绿 | 较高 |
| 81-100  | 5    | 绿   | AI结合程度高 |
| 无记录   | -    | 灰   | 缺失 |

## 启动开发

```bash
# 后端
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# 前端
cd frontend && npm install && npm run dev
```

## Agent 工作指南

### 每次会话开始时
1. 确认工作目录

### 代码规范
- 后端：Python 类型注解，Pydantic 模型验证
- 前端：TypeScript 严格模式，React Query 管理服务端状态
- 硬删除 + 级联阻止（非软删除）

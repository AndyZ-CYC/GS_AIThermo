#!/bin/bash

# AI 行业温度计 WebApp - 开发服务器启动脚本
# 同时启动前后端开发服务器

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}启动开发服务器...${NC}"

# 获取脚本所在目录的父目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# 检查是否安装了 concurrently
if ! command -v concurrently &> /dev/null; then
    echo -e "${YELLOW}正在安装 concurrently...${NC}"
    npm install -g concurrently
fi

# 同时启动前后端
concurrently -n "backend,frontend" -c "blue,green" \
    "cd backend && npm run dev" \
    "cd frontend && npm run dev"

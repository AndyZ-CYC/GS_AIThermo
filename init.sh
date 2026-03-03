#!/bin/bash

# AI 行业温度计 WebApp - 初始化脚本
# 用于启动开发服务器和验证基本功能

set -e

echo "=========================================="
echo "  AI 行业温度计 WebApp - 初始化脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}当前工作目录: $SCRIPT_DIR${NC}"

# 检查 Node.js
echo -e "\n${YELLOW}[1/6] 检查 Node.js 环境...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 安装后端依赖
echo -e "\n${YELLOW}[2/6] 安装后端依赖...${NC}"
if [ -d "backend" ]; then
    cd backend
    npm install
    echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
    cd "$SCRIPT_DIR"
else
    echo -e "${RED}✗ 未找到 backend 目录${NC}"
    exit 1
fi

# 安装前端依赖
echo -e "\n${YELLOW}[3/6] 安装前端依赖...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    npm install
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
    cd "$SCRIPT_DIR"
else
    echo -e "${RED}✗ 未找到 frontend 目录${NC}"
    exit 1
fi

# 初始化数据库
echo -e "\n${YELLOW}[4/6] 初始化数据库...${NC}"
cd backend
npm run db:migrate
echo -e "${GREEN}✓ 数据库表创建完成${NC}"
cd "$SCRIPT_DIR"

# 创建必要的目录
echo -e "\n${YELLOW}[5/6] 创建必要的目录...${NC}"
mkdir -p ./data/uploads/posters
mkdir -p ./logs
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 询问是否填充测试数据
echo -e "\n${YELLOW}[6/6] 测试数据...${NC}"
read -p "是否填充测试数据？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    npm run db:seed
    echo -e "${GREEN}✓ 测试数据填充完成${NC}"
    cd "$SCRIPT_DIR"
else
    echo -e "${YELLOW}⚠ 跳过测试数据填充${NC}"
fi

# 完成
echo -e "\n${GREEN}=========================================="
echo "  初始化完成！"
echo "==========================================${NC}"
echo ""
echo "启动开发服务器："
echo "  后端: cd backend && npm run dev"
echo "  前端: cd frontend && npm run dev"
echo ""
echo "或者使用："
echo "  ./scripts/dev.sh    # 同时启动前后端（需要安装 concurrently）"
echo ""

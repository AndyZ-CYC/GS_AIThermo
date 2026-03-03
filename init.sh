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
echo -e "\n${YELLOW}[1/5] 检查 Node.js 环境...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查包管理器
echo -e "\n${YELLOW}[2/5] 检查包管理器...${NC}"
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    echo -e "${GREEN}✓ 使用 pnpm${NC}"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "${GREEN}✓ 使用 npm${NC}"
else
    echo -e "${RED}✗ 未找到包管理器${NC}"
    exit 1
fi

# 安装依赖（如果 package.json 存在）
echo -e "\n${YELLOW}[3/5] 安装依赖...${NC}"
if [ -f "package.json" ]; then
    echo "发现 package.json，安装依赖..."
    $PKG_MANAGER install
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
else
    echo -e "${YELLOW}⚠ 未找到 package.json，跳过依赖安装${NC}"
fi

# 检查数据库
echo -e "\n${YELLOW}[4/5] 检查数据库...${NC}"
DB_FILE="./data/aitthermo.db"
if [ -f "$DB_FILE" ]; then
    echo -e "${GREEN}✓ 数据库文件存在: $DB_FILE${NC}"
else
    echo -e "${YELLOW}⚠ 数据库文件不存在，将在首次启动时创建${NC}"
    mkdir -p ./data
fi

# 创建上传目录
echo -e "\n${YELLOW}[5/5] 创建必要的目录...${NC}"
mkdir -p ./uploads/posters
mkdir -p ./logs
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 启动开发服务器
echo -e "\n${YELLOW}=========================================="
echo "  准备启动开发服务器"
echo "==========================================${NC}"

# 检查是否存在启动脚本
if [ -f "./scripts/dev.sh" ]; then
    echo "运行 ./scripts/dev.sh..."
    ./scripts/dev.sh
elif [ -f "package.json" ] && grep -q "\"dev\"" package.json; then
    echo "运行 $PKG_MANAGER run dev..."
    $PKG_MANAGER run dev
else
    echo -e "${YELLOW}⚠ 未找到开发服务器启动脚本"
    echo "请手动配置并启动开发服务器${NC}"
    echo ""
    echo "可选操作："
    echo "  1. 创建 scripts/dev.sh 启动脚本"
    echo "  2. 在 package.json 中添加 dev 脚本"
    echo "  3. 手动启动前后端服务"
fi

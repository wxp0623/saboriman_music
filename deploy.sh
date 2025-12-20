#!/bin/bash

set -e

echo "🔨 构建 Saboriman Music..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ✅ 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

echo -e "${BLUE}📂 项目目录: ${SCRIPT_DIR}${NC}"
echo -e "${BLUE}📂 前端目录: ${FRONTEND_DIR}${NC}"
echo ""

# ✅ 检查前端目录是否存在
if [ ! -d "${FRONTEND_DIR}" ]; then
    echo -e "${RED}❌ 错误: 前端目录不存在${NC}"
    echo -e "${RED}   期望路径: ${FRONTEND_DIR}${NC}"
    exit 1
fi

# 构建前端
echo -e "${BLUE}📦 构建前端...${NC}"
cd "${FRONTEND_DIR}"

# ✅ 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: package.json 不存在${NC}"
    exit 1
fi

# ✅ 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📥 安装依赖...${NC}"
    npm ci
else
    echo -e "${BLUE}✓ 依赖已安装，跳过...${NC}"
fi

# ✅ 构建前端
echo -e "${BLUE}🏗️  开始构建前端...${NC}"
npm run build

# ✅ 验证构建产物
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 错误: 构建失败，dist 目录不存在${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 前端构建完成！${NC}"
echo -e "${BLUE}   构建产物: ${FRONTEND_DIR}/dist${NC}"
echo ""

# ✅ 返回项目根目录
cd "${SCRIPT_DIR}"

# ✅ 检查 Docker Compose 文件
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ 错误: docker-compose.prod.yml 不存在${NC}"
    exit 1
fi

# ✅ 检查 Dockerfile
if [ ! -f "Dockerfile.prod" ]; then
    echo -e "${RED}❌ 错误: Dockerfile.prod 不存在${NC}"
    exit 1
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🚀 开始部署生产环境${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ✅ 停止旧容器
echo -e "${BLUE}🛑 停止旧容器...${NC}"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo -e "${BLUE}🏗️  构建 Docker 镜像...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

echo ""
echo -e "${BLUE}🚀 启动服务...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 服务信息${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🌐 应用地址:  http://localhost:8180"
echo "🗄️  数据库:    localhost:13308"
echo "📊 健康检查:  http://localhost:8180/api/health"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔧 常用命令${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "查看日志:"
echo -e "${BLUE}  docker compose -f docker-compose.prod.yml logs -f app${NC}"
echo ""
echo "查看容器状态:"
echo -e "${BLUE}  docker compose -f docker-compose.prod.yml ps${NC}"
echo ""
echo "重启服务:"
echo -e "${BLUE}  docker compose -f docker-compose.prod.yml restart${NC}"
echo ""
echo "停止服务:"
echo -e "${BLUE}  docker compose -f docker-compose.prod.yml down${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ✅ 显示容器状态
echo ""
echo -e "${BLUE}📊 当前容器状态:${NC}"
docker compose -f docker-compose.prod.yml ps

# ✅ 等待服务启动
echo ""
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 5

# ✅ 检查健康状态
echo -e "${BLUE}🏥 检查服务健康状态...${NC}"
if curl -sf http://localhost:8180/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 服务健康检查通过！${NC}"
else
    echo -e "${YELLOW}⚠️  健康检查未通过，请查看日志${NC}"
    echo -e "${BLUE}   docker compose -f docker-compose.prod.yml logs -f app${NC}"
fi

echo ""
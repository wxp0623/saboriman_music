#!/bin/bash

echo "🧪 测试根据 Entity 创建表功能"
echo "================================"

BASE_URL="http://localhost:8180"

echo "1. 测试服务器是否运行..."
curl -s "$BASE_URL/ping" && echo " ✅ 服务器正常运行"

echo -e "\n2. 查看 API 信息..."
curl -s "$BASE_URL/api" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api"

echo -e "\n3. 查看所有表状态..."
curl -s "$BASE_URL/api/database/tables" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/database/tables"

echo -e "\n4. 自动创建所有表..."
curl -s -X POST "$BASE_URL/api/database/migrate" | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/database/migrate"

echo -e "\n5. 再次查看表状态..."
curl -s "$BASE_URL/api/database/tables" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/database/tables"

echo -e "\n6. 测试创建单个表 (用户表)..."
curl -s -X POST "$BASE_URL/api/database/tables/users" | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/database/tables/users"

echo -e "\n7. 测试创建音乐表..."
curl -s -X POST "$BASE_URL/api/database/tables/music" | jq '.' 2>/dev/null || curl -s -X POST "$BASE_URL/api/database/tables/music"

echo -e "\n✅ 测试完成!"
echo "你可以手动访问以下端点来测试："
echo "- GET  $BASE_URL/api"
echo "- GET  $BASE_URL/api/database/tables" 
echo "- POST $BASE_URL/api/database/migrate"
echo "- POST $BASE_URL/api/database/tables/users"
echo "- POST $BASE_URL/api/database/tables/music"

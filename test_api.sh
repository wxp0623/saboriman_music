#!/bin/bash

echo "🧪 Saboriman Music API 完整CRUD测试"
echo "=================================="

BASE_URL="http://localhost:8180"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}测试: $description${NC}"
    echo "请求: $method $url"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$url" -w "HTTPSTATUS:%{http_code}")
    else
        echo "数据: $data"
        response=$(curl -s -X $method "$BASE_URL$url" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "HTTPSTATUS:%{http_code}")
    fi
    
    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [[ "$http_status" -ge 200 && "$http_status" -lt 300 ]]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_status)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ 失败 (HTTP $http_status)${NC}"
        echo "$body"
    fi
}

echo -e "\n${YELLOW}1. 系统健康检查${NC}"
test_api "GET" "/ping" "" "健康检查"
test_api "GET" "/api" "" "API信息"

echo -e "\n${YELLOW}2. 数据库管理${NC}"
test_api "GET" "/api/database/tables" "" "查看表状态"
test_api "POST" "/api/database/migrate" "" "自动创建表"

echo -e "\n${YELLOW}3. 用户管理 CRUD${NC}"

# 创建用户
USER_DATA='{
  "username": "testuser001",
  "email": "test001@example.com",
  "password": "password123",
  "avatar": "https://example.com/avatar1.jpg"
}'
test_api "POST" "/api/users" "$USER_DATA" "创建用户"

USER_DATA2='{
  "username": "testuser002",
  "email": "test002@example.com",
  "password": "password456",
  "avatar": "https://example.com/avatar2.jpg"
}'
test_api "POST" "/api/users" "$USER_DATA2" "创建第二个用户"

# 获取用户列表
test_api "GET" "/api/users" "" "获取用户列表"
test_api "GET" "/api/users?page=1&page_size=5&search=test" "" "搜索用户"

# 获取单个用户
test_api "GET" "/api/users/1" "" "获取用户ID=1"

# 更新用户
UPDATE_USER_DATA='{
  "username": "updateduser001",
  "avatar": "https://example.com/new-avatar.jpg"
}'
test_api "PUT" "/api/users/1" "$UPDATE_USER_DATA" "更新用户ID=1"

echo -e "\n${YELLOW}4. 音乐管理 CRUD${NC}"

# 创建音乐
MUSIC_DATA='{
  "title": "美丽的歌曲",
  "artist": "著名歌手",
  "album": "热门专辑",
  "duration": 240,
  "genre": "流行",
  "file_url": "https://example.com/song1.mp3",
  "cover_url": "https://example.com/cover1.jpg",
  "user_id": 1
}'
test_api "POST" "/api/musics" "$MUSIC_DATA" "创建音乐"

MUSIC_DATA2='{
  "title": "动听的旋律",
  "artist": "知名艺术家",
  "album": "经典专辑",
  "duration": 180,
  "genre": "摇滚",
  "file_url": "https://example.com/song2.mp3",
  "cover_url": "https://example.com/cover2.jpg",
  "user_id": 2
}'
test_api "POST" "/api/musics" "$MUSIC_DATA2" "创建第二首音乐"

# 获取音乐列表
test_api "GET" "/api/musics" "" "获取音乐列表"
test_api "GET" "/api/musics?search=美丽&genre=流行" "" "搜索音乐"

# 获取单个音乐
test_api "GET" "/api/musics/1" "" "获取音乐ID=1"

# 更新音乐
UPDATE_MUSIC_DATA='{
  "title": "更新后的歌曲标题",
  "duration": 300
}'
test_api "PUT" "/api/musics/1" "$UPDATE_MUSIC_DATA" "更新音乐ID=1"

# 播放和点赞音乐
test_api "POST" "/api/musics/1/play" "" "播放音乐ID=1"
test_api "POST" "/api/musics/1/like" "" "点赞音乐ID=1"

echo -e "\n${YELLOW}5. 播放列表管理 CRUD${NC}"

# 创建播放列表
PLAYLIST_DATA='{
  "name": "我喜欢的音乐",
  "description": "收藏的好听歌曲",
  "cover_url": "https://example.com/playlist-cover.jpg",
  "user_id": 1,
  "is_public": true
}'
test_api "POST" "/api/playlists" "$PLAYLIST_DATA" "创建播放列表"

PLAYLIST_DATA2='{
  "name": "摇滚精选",
  "description": "精选摇滚歌曲",
  "user_id": 2,
  "is_public": false
}'
test_api "POST" "/api/playlists" "$PLAYLIST_DATA2" "创建第二个播放列表"

# 获取播放列表列表
test_api "GET" "/api/playlists" "" "获取播放列表列表"
test_api "GET" "/api/playlists?user_id=1" "" "获取用户1的播放列表"

# 获取单个播放列表
test_api "GET" "/api/playlists/1" "" "获取播放列表ID=1"

# 添加音乐到播放列表
ADD_MUSIC_DATA='{
  "music_id": 1,
  "order": 1
}'
test_api "POST" "/api/playlists/1/musics" "$ADD_MUSIC_DATA" "添加音乐1到播放列表1"

ADD_MUSIC_DATA2='{
  "music_id": 2,
  "order": 2
}'
test_api "POST" "/api/playlists/1/musics" "$ADD_MUSIC_DATA2" "添加音乐2到播放列表1"

# 获取包含音乐的播放列表
test_api "GET" "/api/playlists/1?include_musics=true" "" "获取播放列表详情（含音乐）"

# 更新播放列表
UPDATE_PLAYLIST_DATA='{
  "name": "我最爱的音乐",
  "description": "更新后的描述"
}'
test_api "PUT" "/api/playlists/1" "$UPDATE_PLAYLIST_DATA" "更新播放列表ID=1"

# 播放播放列表
test_api "POST" "/api/playlists/1/play" "" "播放播放列表ID=1"

# 从播放列表删除音乐
REMOVE_MUSIC_DATA='{
  "music_id": 2
}'
test_api "DELETE" "/api/playlists/1/musics" "$REMOVE_MUSIC_DATA" "从播放列表1删除音乐2"

echo -e "\n${YELLOW}6. 删除测试${NC}"

# 删除数据（谨慎操作）
read -p "是否执行删除测试? (y/N): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    test_api "DELETE" "/api/users/2" "" "删除用户ID=2"
    test_api "DELETE" "/api/musics/2" "" "删除音乐ID=2"
    test_api "DELETE" "/api/playlists/2" "" "删除播放列表ID=2"
else
    echo "跳过删除测试"
fi

echo -e "\n${GREEN}🎉 API测试完成!${NC}"
echo "详细API文档请查看: API_DOCS.md"

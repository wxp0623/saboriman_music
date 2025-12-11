# Saboriman Music API - 完整CRUD接口文档

## 基础信息

- **服务器地址**: `http://localhost:8180`
- **API版本**: `v1.0.0`
- **数据库**: SQLite (saboriman.db)

## 1. 系统管理接口

### 1.1 健康检查
```bash
GET /ping
# 响应: "pong"
```

### 1.2 API信息
```bash
GET /api
# 响应: API基本信息和端点列表
```

### 1.3 数据库管理
```bash
# 查看所有表状态
GET /api/database/tables

# 自动创建所有表
POST /api/database/migrate

# 创建单个表
POST /api/database/tables/users
POST /api/database/tables/music
POST /api/database/tables/playlists
POST /api/database/tables/playlist-musics

# 删除表
DELETE /api/database/tables/{table_name}
```

## 2. 用户管理接口 (CRUD)

### 2.1 创建用户
```bash
POST /api/users
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 2.2 获取用户列表
```bash
GET /api/users?page=1&page_size=10&search=test&status=1
```

### 2.3 获取单个用户
```bash
GET /api/users/{id}
```

### 2.4 更新用户
```bash
PUT /api/users/{id}
Content-Type: application/json

{
  "username": "newusername",
  "email": "new@example.com",
  "avatar": "https://example.com/new-avatar.jpg",
  "status": 1
}
```

### 2.5 删除用户
```bash
DELETE /api/users/{id}
```

## 3. 音乐管理接口 (CRUD)

### 3.1 创建音乐
```bash
POST /api/musics
Content-Type: application/json

{
  "title": "歌曲标题",
  "artist": "艺术家",
  "album": "专辑名称",
  "duration": 240,
  "genre": "流行",
  "file_url": "https://example.com/music.mp3",
  "cover_url": "https://example.com/cover.jpg",
  "user_id": 1
}
```

### 3.2 获取音乐列表
```bash
GET /api/musics?page=1&page_size=10&search=歌曲&status=1&user_id=1&genre=流行
```

### 3.3 获取单个音乐
```bash
GET /api/musics/{id}
```

### 3.4 更新音乐
```bash
PUT /api/musics/{id}
Content-Type: application/json

{
  "title": "新歌曲标题",
  "artist": "新艺术家",
  "duration": 300,
  "status": 1
}
```

### 3.5 删除音乐
```bash
DELETE /api/musics/{id}
```

### 3.6 播放音乐（增加播放次数）
```bash
POST /api/musics/{id}/play
```

### 3.7 点赞音乐（增加点赞次数）
```bash
POST /api/musics/{id}/like
```

## 4. 播放列表管理接口 (CRUD)

### 4.1 创建播放列表
```bash
POST /api/playlists
Content-Type: application/json

{
  "name": "我的播放列表",
  "description": "这是一个很棒的播放列表",
  "cover_url": "https://example.com/playlist-cover.jpg",
  "user_id": 1,
  "is_public": true
}
```

### 4.2 获取播放列表列表
```bash
GET /api/playlists?page=1&page_size=10&search=我的&user_id=1
```

### 4.3 获取单个播放列表
```bash
# 不包含音乐列表
GET /api/playlists/{id}

# 包含音乐列表
GET /api/playlists/{id}?include_musics=true
```

### 4.4 更新播放列表
```bash
PUT /api/playlists/{id}
Content-Type: application/json

{
  "name": "新的播放列表名称",
  "description": "新的描述",
  "is_public": false
}
```

### 4.5 删除播放列表
```bash
DELETE /api/playlists/{id}
```

### 4.6 添加音乐到播放列表
```bash
POST /api/playlists/{id}/musics
Content-Type: application/json

{
  "music_id": 1,
  "order": 1
}
```

### 4.7 从播放列表删除音乐
```bash
DELETE /api/playlists/{id}/musics
Content-Type: application/json

{
  "music_id": 1
}
```

### 4.8 播放播放列表（增加播放次数）
```bash
POST /api/playlists/{id}/play
```

## 5. 响应格式

### 5.1 成功响应
```json
{
  "error": false,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 5.2 错误响应
```json
{
  "error": true,
  "message": "错误信息"
}
```

### 5.3 分页响应
```json
{
  "error": false,
  "message": "获取数据成功",
  "data": {
    "data": [...],
    "total": 100,
    "page": 1,
    "page_size": 10,
    "total_pages": 10
  }
}
```

## 6. 查询参数说明

### 6.1 分页参数
- `page`: 页码，默认1
- `page_size`: 每页数量，默认10，最大100

### 6.2 搜索参数
- `search`: 搜索关键词（支持用户名、邮箱、歌曲标题、艺术家等）
- `status`: 状态筛选（0=禁用，1=正常）
- `user_id`: 用户ID筛选
- `genre`: 音乐类型筛选

## 7. HTTP状态码

- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 8. 使用示例

### 8.1 创建用户并上传音乐
```bash
# 1. 创建用户
curl -X POST http://localhost:8180/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "musiclover",
    "email": "music@example.com",
    "password": "password123"
  }'

# 2. 上传音乐
curl -X POST http://localhost:8180/api/musics \
  -H "Content-Type: application/json" \
  -d '{
    "title": "美丽的歌",
    "artist": "著名歌手",
    "album": "热门专辑",
    "duration": 240,
    "genre": "流行",
    "file_url": "https://example.com/song.mp3",
    "cover_url": "https://example.com/cover.jpg",
    "user_id": 1
  }'

# 3. 创建播放列表
curl -X POST http://localhost:8180/api/playlists \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我喜欢的音乐",
    "description": "收藏的好听歌曲",
    "user_id": 1,
    "is_public": true
  }'

# 4. 添加音乐到播放列表
curl -X POST http://localhost:8180/api/playlists/1/musics \
  -H "Content-Type: application/json" \
  -d '{
    "music_id": 1,
    "order": 1
  }'
```

### 8.2 查询数据
```bash
# 获取所有用户
curl http://localhost:8180/api/users

# 搜索音乐
curl "http://localhost:8180/api/musics?search=美丽&page=1&page_size=5"

# 获取用户的播放列表
curl "http://localhost:8180/api/playlists?user_id=1"

# 获取播放列表详情（包含音乐）
curl "http://localhost:8180/api/playlists/1?include_musics=true"
```

现在你有了完整的增删改查API接口！🎉

============================= 歌词易 歌词 =====================================
搜索歌词
https://geciyi.com/zh-Hans/api/search_lists？
keyword
不散的夏之灯
timestamp
1765370693672
signature
f141efa836fe62f466d5dc10ca16a181077e97d8061c3531401189899115382f
page
1
pageSize
12

# 歌词搜索
https://geciyi.com/zh-Hans?ref=openi.cn
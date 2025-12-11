# Saboriman Music - 根据 Entity 创建表功能

这个项目演示了如何在 Go + Fiber + GORM 中实现根据实体(Entity)自动创建数据库表的功能。

## 项目结构

```
saboriman-music/
├── cmd/server/main.go           # 主程序入口
├── internal/
│   ├── entity/                  # 数据实体定义
│   │   ├── user.go             # 用户实体
│   │   ├── music.go            # 音乐实体
│   │   └── playlist.go         # 播放列表实体
│   ├── database/               # 数据库管理
│   │   └── database.go         # 数据库连接和迁移工具
│   └── handler/                # HTTP 处理器
│       └── database.go         # 数据库管理 API
├── go.mod
└── go.sum
```

## 功能特性

### 1. 实体定义
- **User**: 用户实体，包含基本用户信息
- **Music**: 音乐实体，包含歌曲详细信息
- **Playlist**: 播放列表实体
- **PlaylistMusic**: 播放列表和音乐的关联表

### 2. 数据库操作
- ✅ 自动迁移所有表
- ✅ 创建单个表
- ✅ 删除表
- ✅ 检查表是否存在
- ✅ 列出所有表信息

### 3. API 端点

#### 基础信息
- `GET /api` - API 基本信息
- `GET /ping` - 健康检查

#### 数据库管理
- `GET /api/database/tables` - 获取所有表信息
- `POST /api/database/migrate` - 自动迁移所有表
- `POST /api/database/tables/users` - 创建用户表
- `POST /api/database/tables/music` - 创建音乐表
- `POST /api/database/tables/playlists` - 创建播放列表表
- `POST /api/database/tables/playlist-musics` - 创建播放列表音乐关联表
- `DELETE /api/database/tables/:table` - 删除指定表

## 使用方法

### 1. 启动服务器

```bash
go run cmd/server/main.go
```

服务器将在 `http://localhost:8180` 启动。

### 2. 查看所有表状态

```bash
curl http://localhost:8180/api/database/tables
```

响应示例：
```json
{
  "error": false,
  "data": [
    {
      "entity_name": "User",
      "table_name": "users",
      "exists": false
    },
    {
      "entity_name": "Music", 
      "table_name": "music",
      "exists": false
    }
  ],
  "count": 4
}
```

### 3. 自动创建所有表

```bash
curl -X POST http://localhost:8180/api/database/migrate
```

### 4. 创建单个表

```bash
# 创建用户表
curl -X POST http://localhost:8180/api/database/tables/users

# 创建音乐表
curl -X POST http://localhost:8180/api/database/tables/music

# 创建播放列表表
curl -X POST http://localhost:8180/api/database/tables/playlists

# 创建播放列表音乐关联表
curl -X POST http://localhost:8180/api/database/tables/playlist-musics
```

### 5. 删除表

```bash
# 删除用户表
curl -X DELETE http://localhost:8180/api/database/tables/users

# 删除音乐表
curl -X DELETE http://localhost:8180/api/database/tables/music
```

## 实体字段说明

### User (用户)
- `id`: 主键，自增
- `username`: 用户名，唯一索引
- `email`: 邮箱，唯一索引
- `password`: 密码（加密存储）
- `avatar`: 头像URL
- `status`: 状态（1:正常, 0:禁用）
- `created_at/updated_at`: 创建/更新时间
- `deleted_at`: 软删除时间

### Music (音乐)
- `id`: 主键，自增
- `title`: 歌曲标题
- `artist`: 艺术家
- `album`: 专辑名称
- `duration`: 时长（秒）
- `genre`: 音乐类型
- `file_url`: 音频文件URL
- `cover_url`: 封面图片URL
- `play_count`: 播放次数
- `like_count`: 点赞数
- `user_id`: 上传用户ID（外键）
- `status`: 状态（1:正常, 0:下架）

### Playlist (播放列表)
- `id`: 主键，自增
- `name`: 播放列表名称
- `description`: 描述
- `cover_url`: 封面图片URL
- `user_id`: 创建用户ID（外键）
- `is_public`: 是否公开
- `play_count`: 播放次数

### PlaylistMusic (播放列表音乐关联)
- `id`: 主键，自增
- `playlist_id`: 播放列表ID（外键）
- `music_id`: 音乐ID（外键）
- `order`: 排序

## 数据库配置

默认使用 SQLite 数据库，数据库文件保存在 `./saboriman.db`。

如需使用 MySQL，可修改 `main.go` 中的数据库配置：

```go
dbConfig := database.Config{
    Driver:   "mysql",
    Host:     "localhost",
    Port:     3306,
    Username: "root",
    Password: "password",
    Database: "saboriman_music",
    Charset:  "utf8mb4",
}
```

## 扩展功能

### 添加新实体

1. 在 `internal/entity/` 目录下创建新的实体文件
2. 在 `database.go` 的 `GetAllEntities()` 函数中添加新实体
3. 在 `database.go` 中添加对应的处理器方法
4. 在 `main.go` 中添加新的路由

### 自定义表结构

使用 GORM 标签来定义表结构：

```go
type CustomEntity struct {
    ID   uint   `gorm:"primaryKey;autoIncrement"`
    Name string `gorm:"type:varchar(100);not null;uniqueIndex;comment:名称"`
    // ...
}
```

常用标签：
- `primaryKey`: 主键
- `autoIncrement`: 自增
- `type:varchar(100)`: 指定字段类型和长度
- `not null`: 不能为空
- `uniqueIndex`: 唯一索引
- `index`: 普通索引
- `comment`: 字段注释
- `default:value`: 默认值

这样你就可以轻松地根据实体定义自动创建和管理数据库表了！
go run ./internal/test/test_bcrypt.go
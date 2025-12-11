package dto

import "time"

// CreateUserRequest 创建用户请求
type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email,max=100"`
	Password string `json:"password" validate:"required,min=6,max=100"`
	Avatar   string `json:"avatar,omitempty" validate:"omitempty,url,max=500"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Username string `json:"username,omitempty" validate:"omitempty,min=3,max=50"`
	Email    string `json:"email,omitempty" validate:"omitempty,email,max=100"`
	Password string `json:"password,omitempty" validate:"omitempty,min=6,max=100"`
	Avatar   string `json:"avatar,omitempty" validate:"omitempty,url,max=500"`
	Status   *int   `json:"status,omitempty" validate:"omitempty,oneof=0 1"`
}

// UserResponse 用户响应
type UserResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Avatar    string    `json:"avatar"`
	Status    int       `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateMusicRequest 创建音乐请求
type CreateMusicRequest struct {
	Title    string `json:"title" validate:"required,max=200"`
	Artist   string `json:"artist" validate:"required,max=100"`
	Album    string `json:"album,omitempty" validate:"omitempty,max=100"`
	Duration int    `json:"duration,omitempty" validate:"omitempty,min=0"`
	Genre    string `json:"genre,omitempty" validate:"omitempty,max=50"`
	FileURL  string `json:"file_url" validate:"required,url,max=500"`
	CoverURL string `json:"cover_url,omitempty" validate:"omitempty,url,max=500"`
	UserID   uint   `json:"user_id" validate:"required"`
}

// UpdateMusicRequest 更新音乐请求
type UpdateMusicRequest struct {
	Title    string `json:"title,omitempty" validate:"omitempty,max=200"`
	Artist   string `json:"artist,omitempty" validate:"omitempty,max=100"`
	Album    string `json:"album,omitempty" validate:"omitempty,max=100"`
	Duration *int   `json:"duration,omitempty" validate:"omitempty,min=0"`
	Genre    string `json:"genre,omitempty" validate:"omitempty,max=50"`
	FileURL  string `json:"file_url,omitempty" validate:"omitempty,url,max=500"`
	CoverURL string `json:"cover_url,omitempty" validate:"omitempty,url,max=500"`
	Status   *int   `json:"status,omitempty" validate:"omitempty,oneof=0 1"`
}

// MusicResponse 音乐响应
type MusicResponse struct {
	ID        uint          `json:"id"`
	Title     string        `json:"title"`
	Artist    string        `json:"artist"`
	Album     string        `json:"album"`
	Duration  int           `json:"duration"`
	Genre     string        `json:"genre"`
	FileURL   string        `json:"file_url"`
	CoverURL  string        `json:"cover_url"`
	PlayCount int64         `json:"play_count"`
	LikeCount int64         `json:"like_count"`
	UserID    uint          `json:"user_id"`
	Status    int           `json:"status"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
	User      *UserResponse `json:"user,omitempty"`
}

// PlaylistResponse 播放列表响应
type PlaylistResponse struct {
	ID          uint            `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	CoverURL    string          `json:"cover_url"`
	UserID      uint            `json:"user_id"`
	IsPublic    bool            `json:"is_public"`
	PlayCount   int64           `json:"play_count"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	User        *UserResponse   `json:"user,omitempty"`
	Musics      []MusicResponse `json:"musics,omitempty"`
	MusicCount  int             `json:"music_count"`
}

// QueryParams 查询参数
type QueryParams struct {
	Page     int    `query:"page" validate:"omitempty,min=1"`
	PageSize int    `query:"page_size" validate:"omitempty,min=1,max=100"`
	Search   string `query:"search" validate:"omitempty,max=100"`
	Status   *int   `query:"status" validate:"omitempty,oneof=0 1"`
	UserID   uint   `query:"user_id" validate:"omitempty"`
	Genre    string `query:"genre" validate:"omitempty,max=50"`
}

// PaginationResponse 分页响应
type PaginationResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

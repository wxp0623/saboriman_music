package dto

import "time"

// CreateAlbumRequest 创建专辑请求
type CreateAlbumRequest struct {
	Name        string     `json:"name" validate:"required"`
	ArtistName  string     `json:"artistName"`
	CoverURL    string     `json:"coverUrl"`
	ReleaseDate *time.Time `json:"releaseDate"`
}

// UpdateAlbumRequest 更新专辑请求
type UpdateAlbumRequest struct {
	Name        string     `json:"name"`
	ArtistName  string     `json:"artistName"`
	CoverURL    string     `json:"coverUrl"`
	ReleaseDate *time.Time `json:"releaseDate"`
}

// AlbumResponse 专辑响应（包含动态计算的 Genre）
type AlbumResponse struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	ArtistName  string     `json:"artistName"`
	CoverURL    string     `json:"coverUrl"`
	ReleaseDate *time.Time `json:"releaseDate,omitempty"`
	Genre       string     `json:"genre"`      // 动态计算的流派
	MusicCount  int64      `json:"musicCount"` // 专辑中音乐数量
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

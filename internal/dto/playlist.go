package dto

// AddMusicToPlaylistRequest 添加音乐到播放列表请求
type AddMusicToPlaylistRequest struct {
	MusicID             string `json:"musicId" validate:"required"`
	PlaylistName        string `json:"playlistName,omitempty"`        // 可选：播放列表名称（不存在时创建用）
	PlaylistDescription string `json:"playlistDescription,omitempty"` // 可选：播放列表描述
}

// RemoveMusicFromPlaylistRequest 从播放列表删除音乐请求
type RemoveMusicFromPlaylistRequest struct {
	MusicID string `json:"musicId" validate:"required"`
}

// CreatePlaylistRequest 创建播放列表请求
type CreatePlaylistRequest struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description,omitempty"`
	CoverURL    string `json:"coverUrl,omitempty"`
}

// UpdatePlaylistRequest 更新播放列表请求
type UpdatePlaylistRequest struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	CoverURL    string `json:"coverUrl,omitempty"`
}

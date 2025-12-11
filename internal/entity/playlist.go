package entity

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Playlist 播放列表实体
type Playlist struct {
	ID          string         `gorm:"type:varchar(8);primaryKey" json:"id"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Description string         `gorm:"type:varchar(500)" json:"description"`
	CoverUrl    string         `gorm:"type:varchar(500)" json:"cover_url"`
	UserID      string         `gorm:"type:varchar(8);not null" json:"user_id"` // Must be string
	User        User           `gorm:"foreignKey:UserID" json:"user"`
	IsPublic    bool           `gorm:"default:true" json:"is_public"`
	PlayCount   int            `gorm:"type:int;default:0" json:"play_count"`
	Musics      []*Music       `gorm:"many2many:playlist_musics;" json:"musics"`
	CreatedAt   time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate GORM 钩子，在创建记录前自动生成 8 位 UUID
func (playlist *Playlist) BeforeCreate(tx *gorm.DB) (err error) {
	playlist.ID = strings.ToUpper(uuid.New().String()[:8])
	return
}

// TableName 指定表名
func (Playlist) TableName() string {
	return "playlists"
}

// PlaylistMusic 播放列表和音乐的中间表
type PlaylistMusic struct {
	PlaylistID string `gorm:"type:varchar(8);primaryKey" json:"playlist_id"`
	MusicID    string `gorm:"type:varchar(8);primaryKey" json:"music_id"`
	Order      int    `gorm:"type:int;default:0;comment:排序" json:"order"`
}

// TableName 指定表名
func (PlaylistMusic) TableName() string {
	return "playlist_musics"
}

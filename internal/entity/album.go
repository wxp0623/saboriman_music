package entity

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Album 专辑实体
type Album struct {
	ID          string         `gorm:"type:varchar(8);primaryKey" json:"id"`
	Name        string         `gorm:"type:varchar(255);not null;index" json:"name"`
	ArtistName  string         `gorm:"type:varchar(255);index" json:"artistName"`
	CoverURL    string         `gorm:"type:varchar(512)" json:"coverUrl"`
	ReleaseDate *time.Time     `gorm:"type:date" json:"release_date"` // 1. 修改这里：使用指针类型允许 NULL
	Genre       string         `json:"genre" gorm:"type:varchar(100);index"`
	CreatedAt   time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// 关系: 一个专辑有多首音乐
	Musics []Music `gorm:"foreignKey:AlbumID" json:"musics,omitempty"`
}

// BeforeCreate GORM 钩子，在创建记录前自动生成 8 位 UUID
func (album *Album) BeforeCreate(tx *gorm.DB) (err error) {
	if album.ID == "" {
		album.ID = strings.ToUpper(uuid.New().String()[:8])
	}
	return
}

// TableName 指定表名
func (Album) TableName() string {
	return "album"
}

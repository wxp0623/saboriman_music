package entity

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Music struct {
	ID          string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	Title       string    `gorm:"type:varchar(255);index" json:"title"`
	Artist      string    `gorm:"type:varchar(255);index" json:"artist"`
	AlbumArtist string    `gorm:"type:varchar(255);index" json:"albumArtist"`
	AlbumID     string    `gorm:"type:varchar(36);index" json:"albumId"`     // 专辑ID（外键）
	Album       *Album    `gorm:"foreignKey:AlbumID" json:"album,omitempty"` // 关联的专辑对象
	Genre       string    `gorm:"type:varchar(100)" json:"genre"`
	Composer    string    `gorm:"type:varchar(255)" json:"composer"`
	Performer   string    `gorm:"type:varchar(255)" json:"performer"`
	Year        int       `json:"year"`
	ReleaseDate string    `gorm:"type:varchar(50)" json:"date"`
	TrackNumber int       `json:"trackNumber"`
	DiscNumber  int       `json:"discNumber"`
	Duration    int       `json:"duration"`                                  // 秒
	FileUrl     string    `gorm:"type:varchar(768);uniqueIndex" json:"path"` // 修改为 varchar(768)，符合 MySQL utf8mb4 索引限制
	CoverUrl    string    `gorm:"type:varchar(768)" json:"coverUrl"`         // 新增：封面路径
	Size        int64     `json:"size"`                                      // 文件大小（字节）
	Suffix      string    `gorm:"type:varchar(10)" json:"suffix"`            // 文件扩展名
	BitRate     int       `json:"bitRate"`                                   // kbps
	SampleRate  int       `json:"sampleRate"`                                // Hz
	BitDepth    int       `json:"bitDepth"`                                  // bits
	Channels    int       `json:"channels"`                                  // 声道数
	HasCoverArt bool      `json:"hasCoverArt"`                               // 是否有封面
	Label       string    `gorm:"type:varchar(255)" json:"label"`            // 唱片公司
	Copyright   string    `gorm:"type:text" json:"copyright"`                // 版权信息
	ISRC        string    `gorm:"type:varchar(50)" json:"isrc"`              // 国际标准录音代码
	UPC         string    `gorm:"type:varchar(50)" json:"upc"`               // 通用产品代码
	PlayCount   int       `gorm:"default:0" json:"playCount"`
	LikeCount   int       `gorm:"default:0" json:"likeCount"`
	UserID      string    `gorm:"type:varchar(36);index" json:"userId"`
	User        *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// BeforeCreate GORM 钩子，在创建记录前自动生成 8 位 UUID
func (music *Music) BeforeCreate(tx *gorm.DB) (err error) {
	music.ID = strings.ToUpper(uuid.New().String()[:8])
	return
}

func (Music) TableName() string {
	return "music"
}

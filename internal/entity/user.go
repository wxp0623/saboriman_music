package entity

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 用户实体
type User struct {
	ID        string         `gorm:"type:varchar(36);primaryKey" json:"id"`
	Username  string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email     string         `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"type:varchar(60);not null" json:"-"`
	Avatar    string         `gorm:"type:varchar(255)" json:"avatar"`
	Role      Role           `gorm:"type:varchar(20);default:'user'" json:"role"` // 使用 Role 枚举
	Status    int            `gorm:"type:tinyint;default:1;comment:状态 1:正常 0:禁用" json:"status"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate 是一个 GORM 钩子，在创建记录之前被调用
func (user *User) BeforeCreate(tx *gorm.DB) (err error) {
	if user.ID != "SYSTEM" {
		user.ID = strings.ToUpper(uuid.New().String()[:8])
	}

	// 设置默认角色
	if user.Role == "" {
		user.Role = RoleUser
	}

	// 加密密码
	if user.Password != "" {
		user.HashPassword(user.Password)
	}

	return
}

// HashPassword 加密密码
func (u *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

// CheckPassword 验证密码
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// IsAdmin 检查是否为管理员
func (u *User) IsAdmin() bool {
	return u.Role.IsAdmin()
}

// IsActive 检查用户是否激活
func (u *User) IsActive() bool {
	return u.Status == 1
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

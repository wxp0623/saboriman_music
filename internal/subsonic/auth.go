package subsonic

import (
	"encoding/hex"
	"errors"
	"net/url"
	"strings"

	"saboriman-music/internal/entity"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Auth struct {
	Username string
	Password string // raw password (支持 enc:xxx 解码)
	Client   string
	Version  string
}

// 解析通用查询参数，并解码 enc: 前缀的密码
func ParseAuth(q url.Values) (*Auth, error) {
	username := strings.TrimSpace(q.Get("u"))
	client := strings.TrimSpace(q.Get("c"))
	version := strings.TrimSpace(q.Get("v"))
	password := q.Get("p")

	if username == "" || password == "" {
		return nil, errors.New("missing required auth params (u,p)")
	}
	// 支持 Subsonic 的 enc:HEX 编码密码
	if strings.HasPrefix(password, "enc:") {
		hexStr := strings.TrimPrefix(password, "enc:")
		if b, err := hex.DecodeString(hexStr); err == nil {
			password = string(b)
		}
	}

	return &Auth{
		Username: username,
		Password: password,
		Client:   client,
		Version:  version,
	}, nil
}

// 从 Fiber 构造 url.Values 并解析
func ParseAuthFromFiber(c *fiber.Ctx) (*Auth, error) {
	q := url.Values{}
	for k, v := range c.Queries() {
		q.Set(k, v)
	}
	return ParseAuth(q)
}

// 校验用户名 + 密码，返回用户或错误
func ValidateAuth(db *gorm.DB, a *Auth) (*entity.User, error) {
	if a == nil {
		return nil, errors.New("auth missing")
	}

	var user entity.User
	// 支持用户名或邮箱
	if err := db.Where("username = ? OR email = ?", a.Username, a.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	if !user.IsActive() {
		return nil, errors.New("user disabled")
	}
	// 校验明文密码（支持 enc:）
	if !user.CheckPassword(a.Password) {
		return nil, errors.New("invalid credentials")
	}
	return &user, nil
}

// 便捷方法：直接从 Fiber 校验并返回用户
func ValidateAuthFromFiber(db *gorm.DB, c *fiber.Ctx) (*entity.User, error) {
	a, err := ParseAuthFromFiber(c)
	if err != nil {
		return nil, err
	}
	return ValidateAuth(db, a)
}

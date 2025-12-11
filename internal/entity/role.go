package entity

// Role 用户角色枚举
type Role string

const (
	RoleAdmin Role = "admin" // 管理员
	RoleUser  Role = "user"  // 普通用户
	RoleGuest Role = "guest" // 访客
)

// String 实现 Stringer 接口
func (r Role) String() string {
	return string(r)
}

// IsValid 检查角色是否有效
func (r Role) IsValid() bool {
	switch r {
	case RoleAdmin, RoleUser, RoleGuest:
		return true
	default:
		return false
	}
}

// IsAdmin 检查是否为管理员
func (r Role) IsAdmin() bool {
	return r == RoleAdmin
}

// IsUser 检查是否为普通用户
func (r Role) IsUser() bool {
	return r == RoleUser
}

// IsGuest 检查是否为访客
func (r Role) IsGuest() bool {
	return r == RoleGuest
}

// GetAllRoles 获取所有有效角色
func GetAllRoles() []Role {
	return []Role{RoleAdmin, RoleUser, RoleGuest}
}

// RoleFromString 从字符串转换为角色
func RoleFromString(s string) Role {
	r := Role(s)
	if r.IsValid() {
		return r
	}
	return RoleUser // 默认返回普通用户
}

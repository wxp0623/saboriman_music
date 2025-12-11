package db

import (
	"fmt"
	"log"
	"reflect"
	"saboriman-music/internal/entity"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// Database 数据库连接管理器
type Database struct {
	DB *gorm.DB
}

// Config 数据库配置
type Config struct {
	Driver   string // mysql, sqlite
	Host     string
	Port     int
	Username string
	Password string
	Database string
	Charset  string
	FilePath string // for sqlite
}

// NewDatabase 创建数据库连接
func NewDatabase(config Config) (*Database, error) {
	var db *gorm.DB
	var err error

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: false, // 使用复数表名
		},
	}

	switch config.Driver {
	case "mysql":
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
			config.Username, config.Password, config.Host, config.Port, config.Database, config.Charset)
		db, err = gorm.Open(mysql.Open(dsn), gormConfig)
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(config.FilePath), gormConfig)
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", config.Driver)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %v", err)
	}

	return &Database{DB: db}, nil
}

// GetAllEntities 获取所有实体类型
func GetAllEntities() []interface{} {
	return []interface{}{
		&entity.User{},
		&entity.Music{},
		&entity.Playlist{},
		&entity.PlaylistMusic{},
		&entity.Album{},
	}
}

// AutoMigrate 自动迁移所有表
func (d *Database) AutoMigrate() error {
	log.Println("开始自动迁移数据库表...")

	entities := GetAllEntities()
	for _, entity := range entities {
		entityType := reflect.TypeOf(entity).Elem()
		log.Printf("正在迁移表: %s", entityType.Name())

		if err := d.DB.AutoMigrate(entity); err != nil {
			return fmt.Errorf("failed to migrate %s: %v", entityType.Name(), err)
		}
		log.Printf("表 %s 迁移完成", entityType.Name())
	}

	log.Println("所有表迁移完成！")

	// 迁移完成后，确保系统用户存在
	var count int64
	if err := d.DB.Model(&entity.User{}).Where("id = ?", "SYSTEM").Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check SYSTEM user: %v", err)
	}
	if count == 0 {
		systemUser := entity.User{
			ID:       "SYSTEM",
			Username: "admin",
			Email:    "system@localhost",
			Password: "123456",         // 虚拟密码
			Role:     entity.RoleAdmin, // 系统角色
			Status:   1,                // 系统角色
		}
		if err := d.DB.Create(&systemUser).Error; err != nil {
			return fmt.Errorf("failed to create SYSTEM user: %v", err)
		}
		log.Println("系统用户 SYSTEM 已创建。")
	} else {
		log.Println("系统用户 SYSTEM 已存在。")
	}
	return nil
}

// CreateTable 根据实体创建单个表
func (d *Database) CreateTable(entity interface{}) error {
	entityType := reflect.TypeOf(entity)
	if entityType.Kind() == reflect.Ptr {
		entityType = entityType.Elem()
	}

	log.Printf("正在创建表: %s", entityType.Name())

	if err := d.DB.AutoMigrate(entity); err != nil {
		return fmt.Errorf("failed to create table for %s: %v", entityType.Name(), err)
	}

	log.Printf("表 %s 创建完成", entityType.Name())
	return nil
}

// DropTable 删除表
func (d *Database) DropTable(entity interface{}) error {
	entityType := reflect.TypeOf(entity)
	if entityType.Kind() == reflect.Ptr {
		entityType = entityType.Elem()
	}

	log.Printf("正在删除表: %s", entityType.Name())

	if err := d.DB.Migrator().DropTable(entity); err != nil {
		return fmt.Errorf("failed to drop table for %s: %v", entityType.Name(), err)
	}

	log.Printf("表 %s 删除完成", entityType.Name())
	return nil
}

// HasTable 检查表是否存在
func (d *Database) HasTable(entity interface{}) bool {
	return d.DB.Migrator().HasTable(entity)
}

// GetTableName 获取表名
func (d *Database) GetTableName(entity interface{}) string {
	stmt := &gorm.Statement{DB: d.DB}
	stmt.Parse(entity)
	return stmt.Schema.Table
}

// ListTables 列出所有表信息
func (d *Database) ListTables() ([]TableInfo, error) {
	var tables []TableInfo
	entities := GetAllEntities()

	for _, entity := range entities {
		entityType := reflect.TypeOf(entity).Elem()
		tableName := d.GetTableName(entity)
		exists := d.HasTable(entity)

		tables = append(tables, TableInfo{
			EntityName: entityType.Name(),
			TableName:  tableName,
			Exists:     exists,
		})
	}

	return tables, nil
}

// TableInfo 表信息
type TableInfo struct {
	EntityName string `json:"entity_name"`
	TableName  string `json:"table_name"`
	Exists     bool   `json:"exists"`
}

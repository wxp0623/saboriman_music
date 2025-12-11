package config

import (
	"fmt"
	"os" // 1. 导入 os 包
	"strings"

	"github.com/spf13/viper"
)

// Config 结构体用于映射 TOML 文件中的所有配置项
type Config struct {
	MusicFolder string
	Port        int
	LogLevel    string
	Database    struct {
		Type     string `mapstructure:"type"` // 新增: 数据库类型 (sqlite, mysql, postgres)
		Path     string `mapstructure:"path"` // 用于 sqlite
		Host     string `mapstructure:"host"`
		Port     int    `mapstructure:"port"`
		User     string `mapstructure:"user"`
		Password string `mapstructure:"password"`
		Name     string `mapstructure:"name"`
	}
}

// AppConfig 是一个全局变量，用于在应用各处访问配置
var AppConfig *Config

// LoadConfig 从文件或环境变量中加载配置
func LoadConfig() (*Config, error) {
	v := viper.New()

	// 1. 设置默认值
	v.SetDefault("Port", 8180)
	v.SetDefault("LogLevel", "info")
	v.SetDefault("Database.Type", "sqlite") // 默认使用 sqlite
	v.SetDefault("Database.Path", "saboriman.db")
	v.SetDefault("Database.Host", "localhost")
	v.SetDefault("Database.Port", 3306)
	v.SetDefault("Database.User", "root")
	v.SetDefault("Database.Password", "")
	v.SetDefault("Database.Name", "saboriman")

	// 2. 打印当前工作目录，用于最终诊断
	wd, err := os.Getwd()
	if err != nil {
		fmt.Printf("⚠️ 无法获取当前工作目录: %v\n", err)
	} else {
		fmt.Printf("ℹ️  当前工作目录是: %s\n", wd)
	}

	// 设置配置文件
	v.SetConfigName("config")    // 配置文件名 (不带扩展名)
	v.SetConfigType("toml")      // 配置文件类型
	v.AddConfigPath("./config/") // 路径1: 项目根目录下的 config/ 文件夹
	v.AddConfigPath("/config")   // 路径2: 容器根目录下的 /config 文件夹
	v.AddConfigPath(".")         // 路径3: 项目根目录

	// 读取配置文件
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// 2. 如果文件没找到，打印一条明确的警告信息
			fmt.Println("⚠️  未找到配置文件 'config.toml'。将使用默认值和环境变量。")
		} else {
			// 如果是其他类型的错误，则返回
			return nil, err
		}
	} else {
		// 3. 如果成功找到文件，也打印一条日志
		fmt.Printf("✅  成功在 '%s' 中找到并读取了配置文件。\n", v.ConfigFileUsed())
	}

	// 4. 启用环境变量覆盖
	// 例如，环境变量 SABORIMAN_MUSICFOLDER 会覆盖 TOML 中的 MusicFolder
	v.SetEnvPrefix("SABORIMAN") // 设置环境变量前缀
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// 5. 将所有配置 Unmarshal 到结构体中
	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	// 3. 打印最终加载的配置，用于调试
	fmt.Println("--- 最终生效配置 ---")
	fmt.Printf("   - 端口 (Port): %d\n", cfg.Port)
	fmt.Printf("   - 音乐库 (MusicFolder): %s\n", cfg.MusicFolder)
	fmt.Printf("   - 数据库类型 (DB Type): %s\n", cfg.Database.Type)
	fmt.Printf("   - 数据库路径 (DB Path): %s\n", cfg.Database.Path)

	AppConfig = &cfg
	return AppConfig, nil
}

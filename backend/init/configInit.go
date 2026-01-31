package inits

import (
	"backend/internal/pkg/globals"
	"fmt"

	"github.com/spf13/viper"
)

func ConfigInit() {
	viper.SetConfigName(globals.Env) // 配置文件名称
	viper.SetConfigType("yaml")      // 如果配置问文件没有扩展名，则需要配置此项

	viper.AddConfigPath("./backend/configs") // 查找配置文件所在路径
	viper.AddConfigPath("./configs")

	viper.AddConfigPath(".") // 还可以在工作目录中查找配置

	viper.AddConfigPath("./configs")          // 查找配置文件所在路径（相对当前目录）
	viper.AddConfigPath(".")                  // 还可以在工作目录中查找配置
	viper.AddConfigPath("../configs")         // 从父目录查找配置文件
	viper.AddConfigPath("../backend/configs") // 从父目录的backend子目录查找配置文件

	err := viper.ReadInConfig() // 查找并读取配置文件
	if err != nil {
		fmt.Println("读取配置文件错误", err)
		// 配置文件不存在时，使用默认配置
		fmt.Println("使用默认配置运行")
	}
	// 将配置解析到 AppConfig 结构体
	if err := viper.Unmarshal(&globals.AppConfig); err != nil {
		fmt.Println("配置解析错误", err)
	}

	// 设置默认配置值，确保即使配置文件不存在也能正常运行
	// App配置默认值
	if globals.AppConfig.App.Host == "" {
		globals.AppConfig.App.Host = "0.0.0.0"
	}
	if globals.AppConfig.App.Port == 0 {
		globals.AppConfig.App.Port = 8080
	}

	// Database配置默认值
	if globals.AppConfig.Database.Host == "" {
		globals.AppConfig.Database.Host = "localhost"
	}
	if globals.AppConfig.Database.Port == 0 {
		globals.AppConfig.Database.Port = 3306
	}
	if globals.AppConfig.Database.User == "" {
		globals.AppConfig.Database.User = "root"
	}
	if globals.AppConfig.Database.Name == "" {
		globals.AppConfig.Database.Name = "blue_lock"
	}

	// Redis配置默认值
	if globals.AppConfig.Redis.Host == "" {
		globals.AppConfig.Redis.Host = "localhost"
	}
	if globals.AppConfig.Redis.Port == 0 {
		globals.AppConfig.Redis.Port = 6379
	}

	// Log配置默认值
	if globals.AppConfig.Log.LogPath == "" {
		globals.AppConfig.Log.LogPath = "./logs"
	}
	if globals.AppConfig.Log.AppName == "" {
		globals.AppConfig.Log.AppName = "backend"
	}

	// JWT配置默认值
	if globals.AppConfig.JWT.SecretKey == "" {
		globals.AppConfig.JWT.SecretKey = "default_secret_key_change_this_in_production"
	}
	if globals.AppConfig.JWT.AccessTokenExpiry == 0 {
		globals.AppConfig.JWT.AccessTokenExpiry = 24 * 3600 // 24小时
	}
	if globals.AppConfig.JWT.RefreshTokenExpiry == 0 {
		globals.AppConfig.JWT.RefreshTokenExpiry = 7 * 24 * 3600 // 7天
	}
}

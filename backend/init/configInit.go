package inits

import (
	"blueLock/backend/internal/pkg/globals"
	"fmt"
	"github.com/spf13/viper"
)

func ConfigInit() {
	viper.SetConfigName(globals.Env)         // 配置文件名称
	viper.SetConfigType("yaml")              // 如果配置问文件没有扩展名，则需要配置此项
	viper.AddConfigPath("./backend/configs") // 查找配置文件所在路径

	viper.AddConfigPath(".")    // 还可以在工作目录中查找配置
	err := viper.ReadInConfig() // 查找并读取配置文件
	if err != nil {
		fmt.Println("读取配置文件错误", err)
	}
	// 将配置解析到 AppConfig 结构体
	if err := viper.Unmarshal(&globals.AppConfig); err != nil {
		fmt.Println("配置解析错误", err)
	}
}

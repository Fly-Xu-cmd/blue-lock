// Package inits 进行一些相关的初始化操作
package inits

import (
	"blueLock/backend/internal/pkg/globals"
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"

	"github.com/spf13/viper"
)

// RedisInit 初始化Redis
func RedisInit() {
	if err := viper.UnmarshalKey("redis", &globals.AppConfig.Redis); err != nil {
		globals.Log.Panicf("无法解码为结构: %s", err)
	}

	// 验证配置值
	if globals.AppConfig.Redis.Host == "" {
		globals.Log.Panicf("Redis配置错误: Host 不能为空")
	}
	if globals.AppConfig.Redis.Port == 0 {
		globals.Log.Panicf("Redis配置错误: Port 不能为0")
	}

	globals.RDB = redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf(
			"%s:%d",
			globals.AppConfig.Redis.Host,
			globals.AppConfig.Redis.Port,
		),
		Password:     globals.AppConfig.Redis.Password,
		DB:           globals.AppConfig.Redis.DB,
		PoolSize:     globals.AppConfig.Redis.PoolSize,
		MinIdleConns: globals.AppConfig.Redis.MinIdleConns,
		IdleTimeout:  globals.AppConfig.Redis.IdleTimeout,
		DialTimeout:  globals.AppConfig.Redis.DialTimeout,
		ReadTimeout:  globals.AppConfig.Redis.ReadTimeout,
		WriteTimeout: globals.AppConfig.Redis.WriteTimeout,
		MaxRetries:   globals.AppConfig.Redis.MaxRetries,
	})
	ctx := context.Background()
	_, err := globals.RDB.Ping(ctx).Result()
	if err != nil {
		globals.Log.Panicf("Redis连接失败: %v", err)
	} else {
		globals.Log.Infof("Redis连接成功")
	}
}

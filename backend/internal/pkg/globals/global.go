package globals

import (
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	// AppConfig 项目总配置
	AppConfig Config

	// Env 环境配置文件
	Env string

	// RDB redis链接
	RDB *redis.Client

	// DB mysql连接
	DB *gorm.DB

	// Log 日志记录
	Log *zap.SugaredLogger

	// Router 总路由
	Router *gin.Engine
)

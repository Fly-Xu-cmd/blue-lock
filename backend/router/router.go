package router

import (
	"blueLock/backend/internal/middleware"
	"blueLock/backend/internal/pkg/globals"
	"blueLock/backend/internal/routers"
	"github.com/gin-gonic/gin"
)

func SetUpRouter() {
	// 创建 Gin 引擎
	globals.Router = gin.Default()
	
	// 跨域
	globals.Router.Use(middleware.CorsMiddleware())
	// 登录路由
	routers.EmailLoginRouter(globals.Router)
}

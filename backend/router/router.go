package router

import (
	"backend/internal/middleware"
	"backend/internal/pkg/globals"
	"backend/internal/routers"

	"github.com/gin-gonic/gin"
)

func SetUpRouter() {
	// 创建 Gin 引擎
	globals.Router = gin.Default()
	// 跨域
	globals.Router.Use(middleware.CorsMiddleware())
	// 创建/api前缀的路由组
	apiGroup := globals.Router.Group("/api")
	// 登录路由
	routers.EmailLoginRouter(apiGroup)
	// 用户操作相关路由
	routers.UserRouter(apiGroup)
}

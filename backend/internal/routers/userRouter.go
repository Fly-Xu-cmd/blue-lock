package routers

import (
	"backend/internal/controller"
	"backend/internal/middleware"
	"backend/internal/pkg/globals"
	"backend/internal/pkg/token"

	"github.com/gin-gonic/gin"
)

// UserRouter 用户相关的路由
func UserRouter(r interface{}) {
	// 统一处理Engine和RouterGroup
	var routerGroup *gin.RouterGroup
	if engine, ok := r.(*gin.Engine); ok {
		routerGroup = engine.Group("")
	} else if group, ok := r.(*gin.RouterGroup); ok {
		routerGroup = group
	}

	user := routerGroup.Group("/user")

	// 需要认证的路由组
	tokenService := token.NewService(token.Config{
		SecretKey:          globals.AppConfig.JWT.SecretKey,
		AccessTokenExpiry:  globals.AppConfig.JWT.AccessTokenExpiry,
		RefreshTokenExpiry: globals.AppConfig.JWT.RefreshTokenExpiry,
	})
	authGroup := user.Group("")
	authGroup.Use(middleware.AuthMiddleware(tokenService))
	{
		authGroup.POST("/operationRecord", controller.UserOperationCtrl())
		authGroup.GET("/getOperateRecord", controller.GetOperationRecord())
	}
}

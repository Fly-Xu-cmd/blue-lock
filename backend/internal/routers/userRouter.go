package routers

import (
	"backend/internal/controller"
	"backend/internal/middleware"
	"backend/internal/pkg/globals"
	"backend/internal/pkg/token"
	"github.com/gin-gonic/gin"
)

// UserRouter 用户相关的路由
func UserRouter(r *gin.Engine) {
	user := r.Group("/user")

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

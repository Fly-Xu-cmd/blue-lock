package routers

import (
	"backend/internal/controller"
	"backend/internal/middleware"
	"backend/internal/pkg/globals"
	"backend/internal/pkg/token"

	"github.com/gin-gonic/gin"
)

// EmailLoginRouter 邮箱登录注册路由
func EmailLoginRouter(r interface{}) {
	// 统一处理Engine和RouterGroup
	var routerGroup *gin.RouterGroup
	if engine, ok := r.(*gin.Engine); ok {
		routerGroup = engine.Group("")
	} else if group, ok := r.(*gin.RouterGroup); ok {
		routerGroup = group
	}

	login := routerGroup.Group("/login")
	// 发送验证码接口
	login.POST("/sendVerificationCode", controller.SendVerificationCode())
	// 注册接口
	login.POST("/register/emailRegister", controller.RegisterHandler())
	// 登录接口
	login.POST("/emailLogin", controller.LoginHandler())
	// 刷新token接口
	login.POST("/refreshToken", controller.RefreshToken())

	// 需要认证的路由组
	tokenService := token.NewService(token.Config{
		SecretKey:          globals.AppConfig.JWT.SecretKey,
		AccessTokenExpiry:  globals.AppConfig.JWT.AccessTokenExpiry,
		RefreshTokenExpiry: globals.AppConfig.JWT.RefreshTokenExpiry,
	})
	authGroup := login.Group("")
	authGroup.Use(middleware.AuthMiddleware(tokenService))
	{
		// 登出接口
		authGroup.POST("/logout", controller.LogoutHandler())
	}
}

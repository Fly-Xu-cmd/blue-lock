package routers

import (
	"blueLock/backend/internal/controller"
	"blueLock/backend/internal/middleware"
	"blueLock/backend/internal/pkg/globals"
	"blueLock/backend/internal/pkg/token"
	"github.com/gin-gonic/gin"
)

// EmailLoginRouter 邮箱登录注册路由
func EmailLoginRouter(r *gin.Engine) {
	login := r.Group("/login")
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

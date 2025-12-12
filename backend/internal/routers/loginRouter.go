package routers

import (
	"blueLock/backend/internal/controller"
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
	// 登出接口
	login.POST("/logout")
}

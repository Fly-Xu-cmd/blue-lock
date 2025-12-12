package controller

import (
	"blueLock/backend/internal/logic"
	"blueLock/backend/internal/pkg/globals"
	"blueLock/backend/internal/pkg/token"
	"blueLock/backend/internal/repository"
	"blueLock/backend/internal/request"
	"blueLock/backend/internal/response"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

func buildLoginLogic() *logic.LoginLogic {
	repo := repository.NewLoginRepository(globals.DB)
	tokenRepo := repository.NewTokenRepository(globals.DB, globals.RDB)
	tokenService := token.NewService(token.Config{
		SecretKey:          globals.AppConfig.JWT.SecretKey,
		AccessTokenExpiry:  globals.AppConfig.JWT.AccessTokenExpiry,
		RefreshTokenExpiry: globals.AppConfig.JWT.RefreshTokenExpiry,
	})
	return logic.NewLoginLogic(repo, tokenService, tokenRepo)
}

// SendVerificationCode 发送验证码处理器
func SendVerificationCode() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		loginLogic := buildLoginLogic()
		var req request.SendVerificationCodeRequest
		if err := ctx.ShouldBind(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, response.ErrorResponse{
				Code:  globals.StatusBadRequest,
				Error: fmt.Sprintf("参数绑定错误 err: %s", err),
			})
		}
		// 调用logic层代码
		err := loginLogic.SendVerificationCode(ctx, req.Email)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, response.ErrorResponse{
				Code:  globals.StatusInternalServerError,
				Error: fmt.Sprintf("验证码发送失败：%s", err),
			})
			return
		}
		// 返回信息
		ctx.JSON(http.StatusOK, response.Success{
			Code: globals.StatusOK,
			Data: "验证码发送成功",
		})
	}
}

// RegisterHandler 注册
func RegisterHandler() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		regisLogic := buildLoginLogic()
		var req request.RegisterByVerificationCodeRequest
		if err := ctx.ShouldBind(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, response.ErrorResponse{
				Code:  globals.StatusBadRequest,
				Error: fmt.Sprintf("参数绑定错误 err: %s", err),
			})
			return
		}
		user, err := regisLogic.RegisterEmail(ctx, &req)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, response.ErrorResponse{
				Code:  globals.StatusInternalServerError,
				Error: fmt.Sprintf("注册账号出现错误 err: %s", err),
			})
			return
		}
		ctx.JSON(http.StatusOK, response.Success{
			Code: globals.StatusOK,
			Data: user,
		})
	}
}

// LoginHandler 登录
func LoginHandler() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		loginLogic := buildLoginLogic()
		var req request.LoginByPassORCode
		if err := ctx.ShouldBind(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, response.ErrorResponse{
				Code:  globals.StatusBadRequest,
				Error: fmt.Sprintf("参数绑定错误 err: %s", err),
			})
			return
		}
		respData, err := loginLogic.LoginByPass(ctx, &req)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, response.ErrorResponse{
				Code:  globals.StatusInternalServerError,
				Error: fmt.Sprintf("登录账号出现错误 err: %s", err),
			})
			return
		}
		ctx.JSON(http.StatusOK, response.Success{
			Code: globals.StatusOK,
			Data: respData,
		})
	}
}

// RefreshToken 刷新令牌
func RefreshToken() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		loginLogic := buildLoginLogic()
		var req request.RefreshTokenRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, response.ErrorResponse{
				Code:  globals.StatusBadRequest,
				Error: fmt.Sprintf("参数绑定错误 err: %s", err),
			})
			return
		}

		respData, err := loginLogic.RefreshToken(ctx, req.RefreshToken)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, response.ErrorResponse{
				Code:  globals.StatusUnauthorized,
				Error: err.Error(),
			})
			return
		}

		ctx.JSON(http.StatusOK, response.Success{
			Code: globals.StatusOK,
			Data: respData,
		})
	}
}

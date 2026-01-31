package controller

import (
	"backend/internal/logic"
	"backend/internal/pkg/globals"
	"backend/internal/repository"
	"backend/internal/request"
	"backend/internal/response"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// UserOperationCtrl 用户操作蓝牙密码箱记录
func UserOperationCtrl() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		// 从JWT中获取用户id
		userID, exists := ctx.Get("user_id")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, response.ErrorResponse{
				Code:    globals.StatusUnauthorized,
				Message: "未登录",
			})
			return
		}
		repo := repository.NewUserRepository(globals.DB)
		userLogic := logic.NewUserLogic(repo)
		var req request.UserOperationReq
		if err := ctx.ShouldBind(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, response.ErrorResponse{
				Code:    globals.StatusBadRequest,
				Message: "参数绑定错误",
				Error:   fmt.Sprintf("参数绑定错误 err: %s", err),
			})
			return
		}
		req.UserID = uint(userID.(uint64))
		res, err := userLogic.CreateUserOperation(ctx, &req)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, response.ErrorResponse{
				Code:    globals.StatusInternalServerError,
				Message: "添加用户操作记录出现错误",
				Error:   fmt.Sprintf("添加用户操作记录出现错误 err: %s", err),
			})
			return
		}
		ctx.JSON(http.StatusOK, response.Success{
			Code: globals.StatusOK,
			Data: res,
		})
	}
}

// GetOperationRecord 获取用户操作记录
func GetOperationRecord() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		// 从JWT中获取用户id
		userID, exists := ctx.Get("user_id")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, response.ErrorResponse{
				Code:    globals.StatusUnauthorized,
				Message: "未登录",
			})
			return
		}
		repo := repository.NewUserRepository(globals.DB)
		userLogic := logic.NewUserLogic(repo)
		var req request.GetOperationRecordReq
		req.UserID = uint(userID.(uint64))
		if err := ctx.ShouldBind(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, response.ErrorResponse{
				Code:    globals.StatusUnauthorized,
				Message: "参数绑定错误",
				Error:   fmt.Sprintf("参数绑定错误 err: %s", err),
			})
		}
		res, err := userLogic.GetOperateRecord(ctx, &req)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, response.ErrorResponse{
				Code:    globals.StatusUnauthorized,
				Message: "获取操作记录失败",
				Error:   fmt.Sprintf("获取用户操作记录出现错误 err:%s", err),
			})
		}
		ctx.JSON(http.StatusOK, response.Success{
			Code: globals.StatusOK,
			Data: res,
		})
	}
}

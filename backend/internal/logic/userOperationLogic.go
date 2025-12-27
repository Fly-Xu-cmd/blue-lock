package logic

import (
	"blueLock/backend/internal/models"
	"blueLock/backend/internal/repository"
	"blueLock/backend/internal/request"
	"blueLock/backend/internal/response"
	"context"
)

// 已移除: 使用 response.GetOperationRecord 作为返回结构体

// UserLogic 提供了用户相关的业务逻辑操作
type UserLogic struct {
	repo *repository.UserRepository
}

// NewUserLogic 擦混关键并返回一个新的 UserLogic 实例
func NewUserLogic(repo *repository.UserRepository) *UserLogic {
	return &UserLogic{repo: repo}
}

// CreateUserOperation 添加用户操作记录
func (l *UserLogic) CreateUserOperation(
	ctx context.Context,
	req *request.UserOperationReq,
) (*response.UserResponse, error) {
	// 通过id找到对应的姓名，操作内容
	name, err := l.repo.GetUserNameByID(ctx, uint64(req.UserID))
	if err != nil {
		return nil, err
	}
	userOperation := &models.UserOperation{
		UserID:           req.UserID,
		UserName:         name,
		OperationType:    uint(req.Type),
		OperationContent: req.OperationContent,
	}
	if err := l.repo.CreateUserOperationRecord(ctx, userOperation); err != nil {
		return nil, err
	}
	user, err := l.repo.GetUserOperationRecord(ctx, userOperation.ID)
	if err != nil {
		return nil, err
	}
	res := &response.UserResponse{
		ID:               user.ID,
		UserName:         user.UserName,
		OperationContent: user.OperationContent,
		OperateTime:      user.CreatedAt.Format("2006-01-02 15:04:05"),
	}
	return res, nil
}

// GetOperateRecord 获取用户操作记录
func (l *UserLogic) GetOperateRecord(
	ctx context.Context,
	req *request.GetOperationRecordReq,
) (response.GetOperationRecord, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 {
		req.PageSize = 6
	} else if req.PageSize > 6 {
		req.PageSize = 6
	}

	recordList, total, err := l.repo.ListOperateRecord(ctx, req)
	if err != nil {
		return response.GetOperationRecord{}, err
	}

	// 获取解锁/关锁次数
	lock, unlock := l.repo.GetlockCount(ctx)

	// 映射为响应结构体
	recordsResp := make([]response.UserResponse, 0, len(recordList))
	for _, u := range recordList {
		recordsResp = append(recordsResp, response.UserResponse{
			ID:               u.ID,
			UserName:         u.UserName,
			OperationContent: u.OperationContent,
			OperateTime:      u.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	res := response.GetOperationRecord{
		Total:       uint(total),
		LockCount:   lock,
		UnlockCount: unlock,
		RecordList:  recordsResp,
	}
	return res, nil
}

package repository

import (
	"backend/internal/models"
	"backend/internal/request"
	"context"
	"errors"
	"gorm.io/gorm"
)

// UserRepository 封装了对用户（User）数据的数据库操作
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建并返回一个新的 UserRepository 实例
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

// CreateUserOperationRecord 创建用户操作记录
func (r *UserRepository) CreateUserOperationRecord(c context.Context, user *models.UserOperation) error {
	return r.db.WithContext(c).Create(user).Error
}

// GetUserOperationRecord 通过id查询用户操作记录
func (r *UserRepository) GetUserOperationRecord(c context.Context, id uint) (*models.UserOperation, error) {
	var user models.UserOperation
	err := r.db.WithContext(c).First(&user, id).Error
	return &user, err
}

// GetUserNameByID 通过id找到对应的用户操作信息
func (r *UserRepository) GetUserNameByID(c context.Context, userID uint64) (string, error) {
	var user models.User
	result := r.db.WithContext(c).First(&user, userID)
	if result.Error != nil {
		return "", result.Error
	}
	return user.Name, nil
}

// ListOperateRecord 获取所有用户操作记录
func (r *UserRepository) ListOperateRecord(
	c context.Context,
	req *request.GetOperationRecordReq,
) ([]models.UserOperation, int64, error) {

	if req.UserID == 0 {
		return nil, 0, errors.New("userID is required")
	}

	var total int64
	var records []models.UserOperation

	db := r.db.WithContext(c).
		Debug(). // 打印 SQL
		Model(&models.UserOperation{}).
		Where("user_id = ?", req.UserID)

	if req.OperationType != 0 {
		db = db.Where("operation_type = ?", req.OperationType)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := db.Order("created_at DESC").
		Offset((req.Page - 1) * req.PageSize).
		Limit(req.PageSize).
		Find(&records).Error
	return records, total, err
}

// GetlockCount 获取解锁和锁定次数
func (r *UserRepository) GetlockCount(c context.Context) (uint, uint) {
	var lockCount, unlockCount int64
	err := r.db.WithContext(c).
		Model(&models.UserOperation{}).
		Where("operation_type = 1").
		Count(&unlockCount).Error
	if err != nil {
		return 0, 0
	}
	err = r.db.WithContext(c).
		Model(&models.UserOperation{}).
		Where("operation_type = 2").
		Count(&lockCount).Error
	return uint(lockCount), uint(unlockCount)
}

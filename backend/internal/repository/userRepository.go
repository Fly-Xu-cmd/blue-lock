package repository

import (
	"backend/internal/models"
	"backend/internal/request"
	"context"
	"errors"
	"gorm.io/gorm"
	"time"
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

func (r *UserRepository) ListOperateRecord(
	c context.Context,
	req *request.GetOperationRecordReq,
) ([]models.UserOperation, int64, error) {

	if req.UserID == 0 {
		return nil, 0, errors.New("userID is required")
	}

	var total int64
	var records []models.UserOperation

	// 1. 使用 .Session(&gorm.Session{}) 彻底克隆一个干净的查询对象
	// 这样可以确保 Count 和 Find 共享完全一致的上下文，且不被外部污染
	tx := r.db.WithContext(c).Model(&models.UserOperation{}).Session(&gorm.Session{})

	// 2. 基础过滤条件
	tx = tx.Where("user_id = ?", req.UserID)
	if req.OperationType != 0 {
		tx = tx.Where("operation_type = ?", req.OperationType)
	}

	// 3. 时间过滤（核心修复点：强制指定时区）
	if req.TimePeriod != 0 {
		var startTime time.Time
		// 建议：统一使用数据库所在时区，通常是 time.Local 或 time.UTC
		loc := time.Local
		now := time.Now().In(loc)

		switch req.TimePeriod {
		case 1: // 今天 00:00:00
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		case 2: // 本周一 00:00:00
			weekday := int(now.Weekday())
			if weekday == 0 {
				weekday = 7
			} // 周日转为 7
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, 1-weekday)
		case 3: // 本月 1 号 00:00:00
			startTime = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		}

		if !startTime.IsZero() {
			// 使用 Debug 打印出的 SQL 务必检查此处的参数
			tx = tx.Where("created_at >= ?", startTime)
		}
	}

	// 4. 执行计数（使用克隆的 tx）
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 5. 分页查询记录
	// 注意：tx 依然保留着之前的 Where 条件
	err := tx.Order("created_at DESC").
		Offset((req.Page - 1) * req.PageSize).
		Limit(req.PageSize).
		Find(&records).Error

	return records, total, err
}

// GetlockCount 获取解锁和锁定次数
func (r *UserRepository) GetlockCount(c context.Context, req *request.GetOperationRecordReq) (uint, uint) {
	var lockCount, unlockCount int64

	// 构建与 ListOperateRecord 相同的查询条件
	txLock := r.db.WithContext(c).Model(&models.UserOperation{}).Session(&gorm.Session{})
	txUnlock := r.db.WithContext(c).Model(&models.UserOperation{}).Session(&gorm.Session{})

	// 基础过滤条件
	txLock = txLock.Where("user_id = ?", req.UserID)
	txUnlock = txUnlock.Where("user_id = ?", req.UserID)

	// 操作类型过滤
	txLock = txLock.Where("operation_type = 1") // 关锁
	txUnlock = txUnlock.Where("operation_type = 2") // 开锁

	// 时间过滤
	if req.TimePeriod != 0 {
		var startTime time.Time
		loc := time.Local
		now := time.Now().In(loc)

		switch req.TimePeriod {
		case 1: // 今天 00:00:00
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		case 2: // 本周一 00:00:00
			weekday := int(now.Weekday())
			if weekday == 0 {
				weekday = 7
			}
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, 1-weekday)
		case 3: // 本月 1 号 00:00:00
			startTime = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		}

		if !startTime.IsZero() {
			txLock = txLock.Where("created_at >= ?", startTime)
			txUnlock = txUnlock.Where("created_at >= ?", startTime)
		}
	}

	// 执行计数
	err := txLock.Count(&lockCount).Error
	if err != nil {
		return 0, 0
	}
	err = txUnlock.Count(&unlockCount).Error
	if err != nil {
		return 0, 0
	}

	return uint(lockCount), uint(unlockCount)
}

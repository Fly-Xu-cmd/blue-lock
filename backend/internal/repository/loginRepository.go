package repository

import (
	"blueLock/backend/internal/models"
	"context"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// LoginRepository 封装了对学校（school）数据的数据库操作
type LoginRepository struct {
	db *gorm.DB
}

// NewLoginRepository 创建并返回一个新的 LoginRepository 实例
func NewLoginRepository(db *gorm.DB) *LoginRepository {
	return &LoginRepository{db: db}
}

// CreateUser 注册时将邮箱密码存入数据库
func (r *LoginRepository) CreateUser(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

// ExistsByEmail 判断用户是否存在
func (r *LoginRepository) ExistsByEmail(c context.Context, email string) (bool, error) {
	var count int64
	err := r.db.WithContext(c).
		Model(&models.User{}).
		Where("email = ?", email).
		Where("deleted_at IS NULL").
		Count(&count).
		Error
	return count > 0, err
}

// GetUserByID 根据id查询用户
func (r *LoginRepository) GetUserByID(c context.Context, id uint) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(c).First(&user, id).Error
	return &user, err
}

// GetPasswordByEmail 邮箱是否存在数据库并且其对应的密码是否正确
func (r *LoginRepository) GetPasswordByEmail(c context.Context, email string, password string) error {
	var user models.User
	// 1. 验证邮箱是否存在
	res := r.db.WithContext(c).
		Model(&models.User{}).
		Where("email = ?", email).
		Where("deleted_at IS NULL").
		First(&user)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			return errors.New("邮箱或密码错误")
		}
		return res.Error
	}
	// 2. 邮箱对应密码是否正确
	if err := bcrypt.CompareHashAndPassword([]byte(user.PassWord), []byte(password)); err != nil {
		return errors.New("邮箱或密码错误")
	}
	return nil
}

// GetUserByEmail 根据邮箱获取用户信息
func (r *LoginRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).
		Where("email = ?", email).
		Where("deleted_at IS NULL").
		First(&user).
		Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

package repository

import (
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
	"time"
)

// TokenRepository Token相关数据访问层
type TokenRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

// NewTokenRepository 创建Token数据访问实现
func NewTokenRepository(db *gorm.DB, redis *redis.Client) *TokenRepository {
	return &TokenRepository{
		db:    db,
		redis: redis,
	}
}

// SaveRefreshToken 保存刷新令牌
func (r *TokenRepository) SaveRefreshToken(
	ctx context.Context,
	userID uint, token string,
	expiry time.Duration,
) error {
	key := fmt.Sprintf("user:refresh_token:%d", userID)
	return r.redis.Set(ctx, key, token, expiry).Err()
}

// GetRefreshToken 获取刷新令牌
func (r *TokenRepository) GetRefreshToken(ctx context.Context, userID uint) (string, error) {
	key := fmt.Sprintf("user:refresh_token:%d", userID)
	return r.redis.Get(ctx, key).Result()
}

// DeleteRefreshToken 删除刷新令牌
func (r *TokenRepository) DeleteRefreshToken(ctx context.Context, userID uint) error {
	key := fmt.Sprintf("user:refresh_token:%d", userID)
	return r.redis.Del(ctx, key).Err()
}

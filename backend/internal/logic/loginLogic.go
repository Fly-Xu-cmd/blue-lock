package logic

import (
	v1 "blueLock/backend/api/v1"
	"blueLock/backend/internal/models"
	"blueLock/backend/internal/pkg/globals"
	"blueLock/backend/internal/pkg/token"
	"blueLock/backend/internal/repository"
	"blueLock/backend/internal/request"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"github.com/go-redis/redis/v8"
	"golang.org/x/crypto/bcrypt"
	"math/rand"
	"net/smtp"
	"strings"
	"time"

	"github.com/patrickmn/go-cache"
)

// LoginLogic 提供了登录相关的业务逻辑操作
type LoginLogic struct {
	repo         *repository.LoginRepository
	tokenService *token.Service
	tokenRepo    *repository.TokenRepository
}

// NewLoginLogic 创建并返回一个新的 LoginLogic 实例
func NewLoginLogic(
	repo *repository.LoginRepository,
	tokenService *token.Service,
	tokenRepo *repository.TokenRepository,
) *LoginLogic {
	return &LoginLogic{
		repo:         repo,
		tokenService: tokenService,
		tokenRepo:    tokenRepo,
	}
}

var (
	verificationCodeCache = cache.New(5*time.Minute, 10*time.Minute)
)

type EmailConfig struct {
	SMTPHost  string // SMTP服务器地址
	SMTPPort  int    // SMTP端口
	FromEmail string // 发件人邮箱
	Password  string // 授权码
	FromName  string // 发件人名称
}

// SendVerificationCode 发送验证码
func (l *LoginLogic) SendVerificationCode(c context.Context, toUser string) error {
	code := l.GenerateVerificationCode()

	// 先存储验证码到Redis，确保即使邮件发送失败也能存储
	// 标准化email（转小写、去除空格）确保存储和读取时key一致
	normalizedEmail := strings.ToLower(strings.TrimSpace(toUser))
	key := fmt.Sprintf("verify_code:%s", normalizedEmail)
	err := globals.RDB.SetEX(c, key, code, 5*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("验证码存储失败: %w", err)
	}

	// 记录日志以便调试
	globals.Log.Infof("验证码已存储到Redis，key: %s, code: %s, email: %s", key, code, normalizedEmail)

	// 再发送邮件
	err = l.SendCode(toUser, code)
	if err != nil {
		// 即使邮件发送失败，验证码也已经存储，用户可以重试
		globals.Log.Warnf("邮件发送失败，但验证码已存储: %v", err)
		return fmt.Errorf("邮件发送失败: %w", err)
	}

	return nil
}

// GenerateVerificationCode 随机生成要发送的验证码
func (l *LoginLogic) GenerateVerificationCode() string {
	rand.Seed(time.Now().UnixNano())
	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	return code
}

// SendCode 发送验证码过程 - 使用SMTP方式（修复short response问题）
func (l *LoginLogic) SendCode(to string, code string) error {
	config := &EmailConfig{
		SMTPHost:  "smtp.qq.com",
		SMTPPort:  587,
		FromEmail: "3095660240@qq.com",
		Password:  "dlionbtrfwogdcha",
		FromName:  "验证码系统",
	}

	// 构建邮件内容
	subject := "Subject: Verification Code\r\n"
	from := fmt.Sprintf("From: %s <%s>\r\n", config.FromName, config.FromEmail)
	toHeader := fmt.Sprintf("To: %s\r\n", to)
	mime := "MIME-Version: 1.0\r\n"
	contentType := "Content-Type: text/html; charset=UTF-8\r\n"
	body := fmt.Sprintf("\r\n<h1>验证码</h1><p>您的验证码是: <strong>%s</strong></p><p>5分钟内有效，请勿泄露</p>", code)

	msg := []byte(from + toHeader + subject + mime + contentType + "\r\n" + body)

	// 配置TLS
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         config.SMTPHost,
	}

	// 连接到SMTP服务器
	addr := fmt.Sprintf("%s:%d", config.SMTPHost, config.SMTPPort)
	client, err := smtp.Dial(addr)
	if err != nil {
		return fmt.Errorf("连接SMTP服务器失败: %w", err)
	}

	// 使用defer确保连接关闭，但不使用Quit()避免short response错误
	defer func() {
		if client != nil {
			client.Close()
		}
	}()

	// 启动TLS
	if err = client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("启动TLS失败: %w", err)
	}

	// 认证
	auth := smtp.PlainAuth("", config.FromEmail, config.Password, config.SMTPHost)
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP认证失败: %w", err)
	}

	// 设置发件人和收件人
	if err = client.Mail(config.FromEmail); err != nil {
		return fmt.Errorf("设置发件人失败: %w", err)
	}
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("设置收件人失败: %w", err)
	}

	// 发送邮件内容
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("准备发送数据失败: %w", err)
	}
	if _, err = writer.Write(msg); err != nil {
		return fmt.Errorf("写入邮件内容失败: %w", err)
	}
	if err = writer.Close(); err != nil {
		return fmt.Errorf("关闭数据流失败: %w", err)
	}

	// 邮件已成功发送，直接返回，让defer处理连接关闭
	// 不调用Quit()避免short response错误
	return nil
}

// RegisterEmail 注册邮箱
func (l *LoginLogic) RegisterEmail(ctx context.Context, req *request.RegisterByVerificationCodeRequest) (*models.User, error) {
	// 1.判断验证码是否正确
	isTrue := l.VerifyVerificationCode(ctx, req.Email, req.Code)
	if !isTrue {
		return nil, fmt.Errorf("验证码存在错误")
	}

	// 2. 验证用户信息
	err := l.VerifyMes(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("验证用户信息错误 err: %s", err)
	}
	// 3. 密码加密生成 hash
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	// 4. 邮箱密码存入数据库
	user := &models.User{
		Email:    req.Email,
		PassWord: string(hashed),
	}
	err = l.repo.CreateUser(ctx, user)
	if err != nil {
		return nil, err
	}
	user, err = l.repo.GetUserByID(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("查询用户时存在错误 err: %w", err)
	}
	return user, nil
}

// VerifyMes 验证信息
func (l *LoginLogic) VerifyMes(ctx context.Context, req *request.RegisterByVerificationCodeRequest) error {
	// 1. 判断密码是否符合格式
	if len(req.Password) < 6 {
		return fmt.Errorf("用户输入密码至少六位")
	}
	// 2. 判断邮箱是否存在
	isExists, err := l.repo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("该用户已存在 err: %w", err)
	}
	if isExists {
		return fmt.Errorf("已经存在邮箱为 %v 的用户", req.Email)
	}
	return nil
}

// VerifyVerificationCode 验证邮箱验证码是否正确
func (l *LoginLogic) VerifyVerificationCode(ctx context.Context, email string, code string) bool {
	// 标准化email（转小写、去除空格）确保存储和读取时key一致
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	key := fmt.Sprintf("verify_code:%s", normalizedEmail)

	globals.Log.Infof("尝试从Redis读取验证码，key: %s, email: %s, 输入的code: %s", key, normalizedEmail, code)

	storedCode, err := globals.RDB.Get(ctx, key).Result()
	if err == redis.Nil {
		// redis 返回 nil，已过期或者根本没发送
		globals.Log.Warnf("验证码已过期或不存在，key: %s, email: %s", key, normalizedEmail)
		return false
	}
	if err != nil {
		globals.Log.Errorf("redis查询失败，key: %s, error: %v", key, err)
		return false
	}

	globals.Log.Infof("从Redis读取到验证码，key: %s, storedCode: %s, inputCode: %s", key, storedCode, code)

	// 验证成功后立即删除（防止重复使用）
	if storedCode == code {
		globals.RDB.Del(ctx, key)
		globals.Log.Infof("验证码验证成功，已删除key: %s", key)
		return true
	}

	globals.Log.Warnf("验证码不匹配，key: %s, storedCode: %s, inputCode: %s", key, storedCode, code)
	return false
}

// LoginByPass 登录验证逻辑
func (l *LoginLogic) LoginByPass(ctx context.Context, req *request.LoginByPassORCode) (*v1.LoginResponseData, error) {
	if req.Email == "" {
		return nil, fmt.Errorf("邮箱不能为空")
	}
	// 1. 如果传的是密码，验证邮箱和密码
	if req.Password != "" {
		if err := l.repo.GetPasswordByEmail(ctx, req.Email, req.Password); err != nil {
			return nil, fmt.Errorf("邮箱或者密码错误err: %v", err)
		}
	} else {
		// 2. 如果传的是验证码，就验证验证码和邮箱是否正确
		if req.Code == "" {
			return nil, fmt.Errorf("密码或验证码必须提供其一")
		}
		isRight := l.VerifyVerificationCode(ctx, req.Email, req.Code)
		if !isRight {
			return nil, fmt.Errorf("邮箱或验证码不正确")
		}
	}

	user, err := l.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("查询用户失败: %w", err)
	}

	accessToken, err := l.tokenService.GenerateAccessToken(uint64(user.ID))
	if err != nil {
		return nil, fmt.Errorf("生成访问令牌失败: %w", err)
	}
	refreshToken, err := l.tokenService.GenerateRefreshToken(uint64(user.ID))
	if err != nil {
		return nil, fmt.Errorf("生成刷新令牌失败: %w", err)
	}

	if err := l.tokenRepo.SaveRefreshToken(ctx, user.ID, refreshToken, globals.AppConfig.JWT.RefreshTokenExpiry); err != nil {
		// 不中断登录流程，但记录日志，方便排查
		globals.Log.Warnf("保存刷新令牌失败 userID=%d err=%v", user.ID, err)
	}

	return &v1.LoginResponseData{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       user.ID,
	}, nil
}

// RefreshToken 刷新访问令牌
func (l *LoginLogic) RefreshToken(ctx context.Context, refreshToken string) (*v1.LoginResponseData, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return nil, errors.New("刷新令牌不能为空")
	}

	claims, err := l.tokenService.ParseToken(refreshToken)
	if err != nil {
		return nil, errors.New("刷新令牌无效或已过期")
	}

	if !token.IsRefreshToken(claims) {
		return nil, errors.New("无效的刷新令牌类型")
	}

	storedToken, err := l.tokenRepo.GetRefreshToken(ctx, uint(claims.UserID))
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, errors.New("刷新令牌无效或已过期")
		}
		return nil, fmt.Errorf("查询刷新令牌失败: %w", err)
	}

	if storedToken != refreshToken {
		return nil, errors.New("刷新令牌无效或已过期")
	}

	newAccessToken, err := l.tokenService.GenerateAccessToken(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("生成访问令牌失败: %w", err)
	}

	return &v1.LoginResponseData{
		AccessToken:  newAccessToken,
		RefreshToken: refreshToken,
		UserID:       uint(claims.UserID),
	}, nil
}

// Logout 登出删除token逻辑
func (l *LoginLogic) Logout(ctx context.Context, userID uint) error {
	return l.tokenRepo.DeleteRefreshToken(ctx, userID)
}

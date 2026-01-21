package logger

import (
	"fmt"
	"log"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// GetEncoder 获取编码器
func GetEncoder() zapcore.Encoder {
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder   // 将时间以 ISO8601 格式进行编码
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder // 将日志级别以大写形式输出
	return zapcore.NewJSONEncoder(encoderConfig)
}

// GetLogWriter 获取日志写入器
func GetLogWriter(logPath, appName string) zapcore.WriteSyncer {
	// 如果logPath为空，使用默认路径
	if logPath == "" {
		logPath = "./logs"
	}
	
	// 确保日志目录存在
	if err := os.MkdirAll(logPath, os.ModePerm); err != nil {
		log.Printf("failed to create log directory: %v\n", err)
		// 如果目录创建失败，返回控制台输出，确保程序不会崩溃
		return zapcore.AddSync(os.Stderr)
	}
	
	currentDate := time.Now().Format("2006-01-02")
	fileName := fmt.Sprintf("./%s/%s-%s.log", logPath, appName, currentDate)
	file, err := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("failed to open log file: %v\n", err)
		// 如果文件打开失败，返回控制台输出，确保程序不会崩溃
		return zapcore.AddSync(os.Stderr)
	}
	return zapcore.AddSync(file)
}

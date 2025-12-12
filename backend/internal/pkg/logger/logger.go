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
	// 确保日志目录存在
	if err := os.MkdirAll(logPath, os.ModePerm); err != nil {
		log.Printf("failed to create log directory: %v\n", err)
		return nil
	}
	currentDate := time.Now().Format("2006-01-02")
	fileName := fmt.Sprintf("./%s/%s-%s.log", logPath, appName, currentDate)
	file, _ := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	return zapcore.AddSync(file)
}

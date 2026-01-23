package inits

import (
	"backend/internal/pkg/globals"
	"backend/internal/pkg/logger"
	"fmt"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"os"
)

// LogInit 日志初始化
func LogInit() {
	if err := viper.UnmarshalKey("log", &globals.AppConfig.Log); err != nil {
		fmt.Printf("无法解码结构: %v\n", err.Error())
	}

	logPath := globals.AppConfig.Log.LogPath
	appName := globals.AppConfig.Log.AppName
	// 如果appName为空，使用默认名称
	if appName == "" {
		appName = "backend"
	}
	
	// 获取日志输出目标（文件）
	writeSyncer := logger.GetLogWriter(logPath, appName)
	// 创建日志编码器（通常是 JSON 格式）
	encoder := logger.GetEncoder()

	// 将日志输出到控制台
	consoleWriteSyncer := zapcore.AddSync(
		os.Stdout,
	) // 输出到控制台（os.Stdout）
	consoleCore := zapcore.NewCore(
		encoder,
		consoleWriteSyncer,
		zapcore.InfoLevel,
	) // 控制台输出设置为InfoLevel

	// 合并控制台输出和文件输出
	var core zapcore.Core
	if writeSyncer != nil {
		// 将日志输出到文件
		fileCore := zapcore.NewCore(encoder, writeSyncer, zapcore.DebugLevel)
		// 合并控制台输出和文件输出
		core = zapcore.NewTee(fileCore, consoleCore)
	} else {
		// 如果文件输出失败，只使用控制台输出
		core = consoleCore
	}
	
	log := zap.New(core, zap.AddCaller())
	globals.Log = log.Sugar()
}

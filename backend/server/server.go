package server

import (
	"blueLock/backend/init"
	"blueLock/backend/internal/pkg/globals"
	"blueLock/backend/router"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func Run() {
	inits.Init()
	// 运行结束时，刷新日志的缓冲区（缓存区的信息写入到文件中）
	defer func() {
		if err := globals.Log.Sync(); err != nil {
			fmt.Println("日志同步失败:", err)
		}
	}()

	// 启动处理函数
	router.SetUpRouter()

	// 启动http服务+ 平滑关闭
	Start()
}

func Start() {
	// 构造服务地址
	addr := fmt.Sprintf("%s:%d", globals.AppConfig.App.Host, globals.AppConfig.App.Port)

	// 创建 HTTP 服务器
	srv := &http.Server{
		Addr:    addr,
		Handler: globals.Router, // 路由处理器
	}

	// 启动服务
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务启动失败: %v", err)
		}
	}()
	log.Printf("服务启动成功，监听地址: %v", addr)

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Printf("收到退出信号，正在关闭服务...")

	// 设置超时时间，优雅关闭
	ctxTimeout, cancelTimeout := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelTimeout()
	if err := srv.Shutdown(ctxTimeout); err != nil {
		log.Fatalf("优雅关闭失败: %v", err)
	}
	log.Printf("服务器已正常关闭")
}

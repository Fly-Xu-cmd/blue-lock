# --- 运行阶段 ---
# 直接使用轻量级 Alpine 镜像，不再包含 Go 环境
FROM alpine:latest

# 安装必要的基础库
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# 【关键】直接拷贝外面编译好的二进制文件 'main'
# 注意：这一步假设 main 文件已经存在于当前目录下
COPY main .
COPY configs ./configs

# 创建日志目录
RUN mkdir -p /app/logs && chmod 777 /app/logs

EXPOSE 8090
ENTRYPOINT ["./main"]
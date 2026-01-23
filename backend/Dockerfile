# --- 编译阶段 (保持不变) ---
FROM m.daocloud.io/docker.io/library/golang:1.24-alpine AS builder
WORKDIR /build
ENV GOPROXY=https://goproxy.io,direct
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# --- 运行阶段 ---
FROM m.daocloud.io/docker.io/library/alpine:latest
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

# 1. 拷贝二进制文件
COPY --from=builder /build/main .

# 2. 【关键】拷贝你的配置文件夹 (假设你的配置在 backend/configs)
# 请确保宿主机当前目录下有 configs 目录
COPY configs ./configs

# 3. 【关键】创建日志目录并赋权 (假设你的日志目录叫 logs)
RUN mkdir -p /app/logs && chmod 777 /app/logs

EXPOSE 8090
ENTRYPOINT ["./main"]
# 使用官方镜像名，去除 m.daocloud.io 前缀
# 注意：改为 1.23 或 1.22，确保有对应镜像
FROM golang:1.23-alpine AS builder

WORKDIR /build
ENV GOPROXY=https://goproxy.io,direct
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 运行阶段也改回官方镜像
FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

COPY --from=builder /build/main .
COPY configs ./configs
RUN mkdir -p /app/logs && chmod 777 /app/logs

EXPOSE 8090
ENTRYPOINT ["./main"]
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for "Blue Lock" - a Bluetooth lock control system with three main components:

- **backend/** - Go backend API using Gin framework
- **mobile/** - React Native mobile app for Bluetooth device control
- **web/** - React web dashboard using Vite

## Backend (Go)

### Architecture

The backend follows a layered architecture pattern:
```
controller -> logic -> repository -> models
```

- **controller/** - HTTP request handlers, validate requests, call logic layer
- **logic/** - Business logic layer, orchestrates data flow
- **repository/** - Database access layer (GORM + MySQL)
- **models/** - Data models
- **middleware/** - CORS, authentication
- **request/** - Request DTOs
- **response/** - Response DTOs
- **api/v1/** - API versioned response types
- **routers/** - Route definitions grouped by domain

### Initialization

The `init/` folder handles sequential initialization:
1. Environment variables (envInit.go)
2. Configuration (configInit.go) - loads `configs/dev.yaml`
3. Logger (logInit.go)
4. MySQL (dbInit.go)
5. Redis (redisInit.go)
6. JWT (jwtInit.go)

Global state is managed in `internal/pkg/globals/`.

### Routing

Routes are grouped under `/api` prefix with domain-specific routers:
- `EmailLoginRouter()` - Authentication endpoints
- `UserRouter()` - User operations

### Build & Run

```bash
# Local development
cd backend
go run main.go

# Build Linux binary for Docker
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o main .

# Run with Docker Compose
docker compose up -d --build
docker compose down
```

### Configuration

Configuration is loaded from `configs/dev.yaml` via Viper:
- MySQL connection details (host: mysql_db for Docker)
- Redis connection (host: redis_db for Docker)
- App port (default: 8090)
- JWT secret and expiry times
- Log path

### Docker Deployment

The Dockerfile uses a multi-stage pattern (compile locally, copy binary to Alpine):
- Copies `main` binary and `configs/` folder
- Exposes port 8090
- Creates logs directory with write permissions

## Mobile (React Native)

### Stack

- React Navigation (Stack navigator)
- React Native Elements for UI components
- react-native-ble-plx for Bluetooth LE
- AsyncStorage for persistence
- react-native-config for environment variables

### Development Commands

```bash
cd mobile

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (requires pod install first)
bundle exec pod install  # First time only
npm run ios

# Lint
npm run lint

# Test
npm test
```

### iOS Setup

First time setup requires:
```bash
bundle install
bundle exec pod install
```

### Structure

- `App.tsx` - Main entry with NavigationContainer
- `screens/` - Screen components (LoginScreen, HomeScreen, AnalysisScreen)
- `apis/` - API clients and type definitions
- `utils/` - Utility functions

## Web (React + Vite)

### Stack

- React 19 with TypeScript
- Vite for build tooling (replaces CRA)
- Ant Design (antd) for UI components
- React Router v7 for routing
- Axios for HTTP requests

### Development Commands

```bash
cd web

# Development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Configuration

- `vite.config.ts` - Vite configuration with proxy to backend
- `.env` - Development environment variables
- `.env.production` - Production environment variables
- `tsconfig.json` - TypeScript config with path aliases (`@/*` -> `src/*`)

### Proxy Setup

Dev server proxies `/api` requests to backend:
```
/api -> http://localhost:8090
```

### Build Output

Production builds output to `build/` directory (deployed to `/home/www/bluebox` on server).

## CI/CD

### Backend Deployment ([`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml))

On push to main branch (backend changes):
1. Compiles Go binary for Linux
2. Packages binary + configs + Dockerfile into tarball
3. Uploads via SSH to server
4. Restarts Docker Compose with `--build --force-recreate`

### Web Deployment ([`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml))

On push to main branch (web changes):
1. Installs dependencies with `--legacy-peer-deps`
2. Builds with Vite to `build/` directory
3. Uploads to `/home/www/bluebox` via SCP

### Required Secrets

- `SSH_PRIVATE_KEY` - SSH key for server access
- `SERVER_HOST` - Server hostname/IP
- `SERVER_USER` - SSH username

## Common Patterns

### API Calls

Frontend (web/mobile) uses Axios with a configured base URL. API endpoints are defined in `apis/` directories with corresponding TypeScript types.

### Authentication

- JWT-based authentication with access tokens (30min) and refresh tokens (7 days)
- Tokens stored in Redis
- Middleware validates tokens on protected routes

### Error Handling

Backend uses structured responses with status codes. Frontend uses Ant Design message notifications for user feedback.

## Node Version Requirements

- Backend Go: 1.24
- Frontend Node.js: 20+
- Mobile React Native: Node 20+

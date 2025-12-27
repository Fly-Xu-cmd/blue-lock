# HTTP 请求封装使用说明

## 概述

`http.ts` 是一个专为 React Native 环境设计的 HTTP 请求封装，基于 axios 和 AsyncStorage。

## 主要特性

- ✅ 自动 token 管理（使用 AsyncStorage）
- ✅ 统一的错误处理
- ✅ 请求/响应拦截器
- ✅ 支持文件上传/下载
- ✅ TypeScript 类型支持
- ✅ 自动处理 401 未授权错误

## 基本使用

### 导入

```typescript
import { http } from '../utils/http';
```

### GET 请求

```typescript
try {
  const response = await http.get('/api/users');
  console.log(response.data); // 响应数据
} catch (error: any) {
  console.error('请求失败:', error.message);
  console.error('错误码:', error.code);
}
```

### POST 请求

```typescript
try {
  const response = await http.post('/api/login', {
    email: 'user@example.com',
    password: 'password123',
  });
  console.log(response.data);
} catch (error: any) {
  console.error('登录失败:', error.message);
}
```

### PUT 请求

```typescript
try {
  const response = await http.put('/api/users/1', {
    name: '新名称',
  });
  console.log(response.data);
} catch (error: any) {
  console.error('更新失败:', error.message);
}
```

### DELETE 请求

```typescript
try {
  const response = await http.delete('/api/users/1');
  console.log(response.data);
} catch (error: any) {
  console.error('删除失败:', error.message);
}
```

## Token 管理

### 保存 Token

```typescript
import { http } from '../utils/http';

// 登录成功后保存 token
const loginResponse = await http.post('/api/login', { email, password });
if (loginResponse.code === 2000) {
  await http.setToken(
    loginResponse.data.access_token,
    loginResponse.data.refresh_token,
  );
}
```

### 获取 Token

```typescript
const token = await http.getToken();
const refreshToken = await http.getRefreshToken();
```

### 清除 Token

```typescript
// 退出登录时清除 token
await http.clearTokens();
```

## 文件上传

```typescript
import { http } from '../utils/http';

const formData = new FormData();
formData.append('file', {
  uri: 'file://path/to/file.jpg',
  type: 'image/jpeg',
  name: 'photo.jpg',
});

try {
  const response = await http.upload('/api/upload', formData, progress => {
    console.log(`上传进度: ${progress}%`);
  });
  console.log('上传成功:', response.data);
} catch (error: any) {
  console.error('上传失败:', error.message);
}
```

## 错误处理

HTTP 封装会自动处理以下错误：

- **401 未授权**: 自动清除 token
- **403 禁止访问**: 返回相应错误信息
- **404 未找到**: 返回相应错误信息
- **500+ 服务器错误**: 返回友好的错误提示
- **网络错误**: 返回网络连接失败提示

### 错误对象结构

```typescript
try {
  await http.get('/api/data');
} catch (error: any) {
  console.error(error.message); // 错误消息
  console.error(error.code); // 错误码（HTTP 状态码或 'NETWORK_ERROR'）
  console.error(error.data); // 错误数据（如果有）
}
```

## 配置

### 设置 API 基础 URL

在 `.env` 文件中设置：

```env
API_BASE_URL=http://your-api-server.com
```

### 修改超时时间

在 `http.ts` 中修改 `timeout` 配置（默认 30 秒）。

## 在登录页面中使用示例

```typescript
import { http } from '../utils/http';

// 登录
const handleLogin = async () => {
  try {
    const res = await http.post('/login/emailLogin', {
      email,
      password,
    });

    if (res.code === 2000) {
      // 保存 token
      await http.setToken(res.data.access_token, res.data.refresh_token);
      // 登录成功，导航到主页
    }
  } catch (error: any) {
    Alert.alert('错误', error.message);
  }
};
```

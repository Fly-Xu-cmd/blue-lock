# Blue Lock 项目前端面试点总结

> 作为Go后端开发者，以下是该项目前端部分值得写进简历的技术亮点

## 一、Web 前端（React + Vite）

### 1. 现代化构建工具链 - Vite
- **面试点**: 从 CRA (Create React App) 迁移到 Vite 的经验
- **技术细节**:
  - Vite 开发服务器启动快（ESM 原生支持，无需打包）
  - 配置了 `vite-tsconfig-paths` 插件支持路径别名 `@/*`
  - 开发环境代理配置解决 CORS 跨域问题
  - 生产环境构建输出到 `build/` 目录

### 2. Axios HTTP 请求封装（核心亮点）
- **面试点**: 自定义 HTTP 请求类的设计思路
- **代码位置**: `web/src/utils/http.ts`
- **技术细节**:
  - 单例模式封装 `HttpRequest` 类
  - **请求拦截器**: 自动携带 JWT Token（Bearer Auth）
  - **响应拦截器**:
    - 统一处理业务状态码（code !== 2000 视为错误）
    - 统一处理 HTTP 状态码（401/403/404/500）
    - 网络错误友好提示
  - Token 管理：localStorage 存储 access_token 和 refresh_token
  - 支持文件上传/下载，带进度回调

### 3. TypeScript 类型定义
- **面试点**: 前后端接口类型对齐
- **代码位置**: `web/src/apis/types/register.ts`
- **技术细节**:
  - 定义请求/响应 DTO 类型
  - 与后端 Go 结构体对应（如 `LoginParams`, `LoginResponse`）
  - 使用 `[property: string]: any` 支持扩展字段

### 4. React Router v7 路由管理
- **面试点**: SPA 路由设计
- **代码位置**: `web/src/App.tsx`
- **技术细节**:
  - 使用 `BrowserRouter` + `Routes` + `Route`
  - 未匹配路由重定向处理 `<Navigate to="/login" replace />`

### 5. Web Bluetooth API（IoT 特色）
- **面试点**: Web 端蓝牙设备控制
- **代码位置**: `web/src/screens/HomeScreen.tsx`
- **技术细节**:
  - 使用 `navigator.bluetooth.requestDevice()` 扫描设备
  - GATT 协议连接：获取 PrimaryService 和 Characteristic
  - 通过 `writeValue()` 发送控制命令（锁定/解锁）
  - 设备状态读取验证

### 6. Ant Design 组件库应用
- **面试点**: 企业级 UI 组件库使用
- **技术细节**:
  - Form 表单验证（邮箱格式、密码长度）
  - Card、Badge、Steps、Alert 等组件组合使用
  - message 全局提示反馈

---

## 二、Mobile 前端（React Native）

### 1. React Navigation 导航方案
- **面试点**: 移动端导航架构
- **代码位置**: `mobile/App.tsx`
- **技术细节**:
  - `createStackNavigator` 配置路由
  - `createStaticNavigation` 静态导航配置
  - `SafeAreaProvider` 处理安全区域（刘海屏适配）
  - `useFocusEffect` 处理页面焦点生命周期
  - 禁用物理返回键（`BackHandler.addEventListener`）

### 2. 蓝牙 BLE 通信（核心亮点）
- **面试点**: 移动端蓝牙低功耗设备开发
- **代码位置**: `mobile/screens/HomeScreen.tsx`
- **技术细节**:
  - 使用 `react-native-ble-plx` 库
  - `BleManager` 管理蓝牙生命周期
  - **权限处理**:
    - Android 11 及以下：`ACCESS_FINE_LOCATION`
    - Android 12+：`BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT`
  - 设备扫描 `startDeviceScan` + RSSI 信号强度排序
  - GATT 服务发现 `discoverAllServicesAndCharacteristics`
  - 特征值写入 `writeCharacteristicWithoutResponseForService`
  - Base64 编码发送命令

### 3. AsyncStorage 持久化存储
- **面试点**: 移动端本地存储
- **代码位置**: `mobile/utils/http.ts`
- **技术细节**:
  - 替代 localStorage（RN 不支持 localStorage）
  - Token 存储：`@blue_lock:access_token`
  - `multiRemove` 批量清除

### 4. 环境配置管理
- **面试点**: 多环境配置方案
- **技术细节**:
  - `react-native-config` 环境变量
  - `__DEV__` 开发/生产环境判断
  - 动态 API Base URL 配置

### 5. 平台差异化处理
- **面试点**: iOS/Android 兼容性处理
- **技术细节**:
  - `Platform.OS` 判断平台
  - `PermissionsAndroid` Android 权限请求
  - `ToastAndroid` Android 原生 Toast

---

## 三、前后端协作亮点

### 1. JWT 双 Token 机制
- **面试点**: Token 刷新机制设计
- **技术细节**:
  - access_token（短时效，30分钟）
  - refresh_token（长时效，7天）
  - 前端存储方案对比：localStorage vs AsyncStorage

### 2. API 响应统一格式
- **面试点**: 前后端接口规范
- **技术细节**:
  ```typescript
  interface ApiResponse<T> {
    code: number;    // 业务状态码（2000 = 成功）
    message: string; // 提示信息
    data: T;         // 业务数据
  }
  ```
  - 与 Go 后端 `response.Response` 结构对应

### 3. 跨平台代码复用
- **面试点**: Web/Mobile 共享设计
- **技术细节**:
  - 相同的 API 类型定义结构
  - 相同的 HTTP 请求类设计模式
  - 相同的屏幕/页面命名规范

---

## 四、简历建议写法

### 项目描述模板
```
蓝牙智能门锁控制系统
- 技术栈：React 19 + Vite + TypeScript + Ant Design（Web端）
          React Native + react-navigation + react-native-ble-plx（移动端）
          Go + Gin + GORM + MySQL + Redis（后端）

核心职责：
1. 设计并实现前后端分离架构，JWT双Token认证机制
2. Web端使用Web Bluetooth API实现蓝牙设备控制
3. 移动端集成react-native-ble-plx实现BLE通信，处理Android蓝牙权限适配
4. 封装统一HTTP请求层，实现请求/响应拦截、错误统一处理
5. 配置Vite开发代理解决跨域，React Navigation处理移动端导航
```

### 可深入讲解的技术点
- **问：为什么选择 Vite 而不是 CRA？**
  答：Vite 基于 ESM 原生支持，开发服务器启动无需打包，HMR 更快

- **问：HTTP 封装的设计思路？**
  答：单例模式 + 拦截器链，统一处理认证、错误、Token管理

- **问：BLE 蓝牙开发难点？**
  答：Android 权限适配（版本差异）、GATT 协议理解、设备扫描与连接生命周期管理

- **问：Web Bluetooth 和 RN BLE 的区别？**
  答：Web Bluetooth API 浏览器原生支持，兼容性有限；RN 需要第三方库但可控性更强
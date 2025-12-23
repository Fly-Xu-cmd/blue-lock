import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API响应类型接口
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * Token 存储键名
 */
const TOKEN_KEY = '@blue_lock:access_token';
const REFRESH_TOKEN_KEY = '@blue_lock:refresh_token';

/**
 * HTTP 请求类 - 专为 React Native 环境设计
 */
class HttpRequest {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    // 获取 API 基础 URL
    this.baseURL = this.getBaseUrl();

    // 创建 axios 实例
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 设置请求拦截器
    this.setupRequestInterceptor();

    // 设置响应拦截器
    this.setupResponseInterceptor();
  }

  /**
   * 获取 API 基础 URL
   */
  private getBaseUrl(): string {
    // 优先尝试使用 react-native-config
    try {
      // 使用动态 require 避免在模块加载时失败
      const RNConfig = require('react-native-config');
      // react-native-config 可能返回 default 或直接返回对象
      const Config = RNConfig?.default || RNConfig;

      // 检查 Config 是否为有效对象且包含 API_BASE_URL
      if (
        Config &&
        typeof Config === 'object' &&
        'API_BASE_URL' in Config &&
        Config.API_BASE_URL
      ) {
        return Config.API_BASE_URL;
      }
    } catch (err) {
      // react-native-config 未配置或不可用，继续尝试其他方法
      console.debug('react-native-config 不可用:', err);
    }

    // 默认值 - 可以根据实际情况修改
    // 开发环境可以使用 localhost，生产环境需要设置实际的 API 地址
    const defaultUrl = __DEV__
      ? 'http://10.221.197.54:8090'
      : 'https://api.example.com';

    console.warn(`API_BASE_URL 未配置，使用默认值: ${defaultUrl}`);
    return defaultUrl;
  }

  /**
   * 设置请求拦截器
   */
  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(
      async config => {
        // 从 AsyncStorage 获取 token
        try {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('获取 token 失败:', error);
        }

        // 可以在这里添加其他请求头或处理逻辑
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      },
    );
  }

  /**
   * 设置响应拦截器
   */
  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response;

        // 如果响应码不是 2000，视为错误
        if (data.code !== 2000) {
          const error = new Error(data.message || '请求失败');
          (error as any).code = data.code;
          (error as any).data = data.data;
          return Promise.reject(error);
        }

        return response;
      },
      async (error: AxiosError<ApiResponse>) => {
        // 处理 HTTP 错误
        if (error.response) {
          console.log('error.response', error.response);
          const { status, data } = error.response;

          // 401 未授权，清除 token 并可能需要重新登录
          if (status === 401) {
            await this.clearTokens();
            const errorMsg = new Error(data?.message || '未授权，请重新登录');
            (errorMsg as any).code = 401;
            return Promise.reject(errorMsg);
          }

          // 403 禁止访问
          if (status === 403) {
            const errorMsg = new Error(data?.message || '禁止访问');
            (errorMsg as any).code = 403;
            return Promise.reject(errorMsg);
          }

          // 404 未找到
          if (status === 404) {
            const errorMsg = new Error(data?.message || '请求的资源不存在');
            (errorMsg as any).code = 404;
            return Promise.reject(errorMsg);
          }

          // 500 服务器错误
          if (status >= 500) {
            const errorMsg = new Error(
              data?.message || '服务器错误，请稍后重试',
            );
            (errorMsg as any).code = status;
            return Promise.reject(errorMsg);
          }

          // 其他错误
          const errorMsg = new Error(data?.message || `请求失败 (${status})`);
          (errorMsg as any).code = status;
          (errorMsg as any).data = data?.data;
          return Promise.reject(errorMsg);
        }

        // 网络错误
        if (error.request) {
          const errorMsg = new Error('网络连接失败，请检查网络设置');
          (errorMsg as any).code = 'NETWORK_ERROR';
          return Promise.reject(errorMsg);
        }

        // 其他错误
        return Promise.reject(error);
      },
    );
  }

  /**
   * 保存 token
   */
  async setToken(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('保存 token 失败:', error);
      throw error;
    }
  }

  /**
   * 获取 access token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('获取 token 失败:', error);
      return null;
    }
  }

  /**
   * 获取 refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('获取 refresh token 失败:', error);
      return null;
    }
  }

  /**
   * 清除所有 token
   */
  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    } catch (error) {
      console.error('清除 token 失败:', error);
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(
      url,
      data,
      config,
    );
    return response.data;
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(
      url,
      data,
      config,
    );
    return response.data;
  }

  /**
   * 上传文件
   */
  async upload<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onUploadProgress(progress);
        }
      },
    };

    const response = await this.instance.post<ApiResponse<T>>(
      url,
      formData,
      config,
    );
    return response.data;
  }

  /**
   * 下载文件
   */
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  }
}

// 导出单例实例
export const http = new HttpRequest();

// 导出类型
export type { AxiosRequestConfig, AxiosResponse, AxiosError };

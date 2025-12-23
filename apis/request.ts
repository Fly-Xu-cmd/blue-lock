import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * API响应类型接口
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * API请求类
 */
export class ApiRequest {
  private instance: AxiosInstance;

  /**
   * 获取API基础URL，适配不同环境
   * @returns string API基础URL
   */
  private getBaseUrl(): string {
    // 检测是否为浏览器环境
    const isBrowser = typeof window !== "undefined";
    // 检测是否为React Native环境
    const isReactNative =
      typeof navigator !== "undefined" && navigator.product === "ReactNative";

    if (isBrowser) {
      // Web环境：使用process.env.REACT_APP_API_BASE_URL
      return (
        (process.env as any).REACT_APP_API_BASE_URL || "http://localhost:3000"
      );
    } else if (isReactNative) {
      // React Native环境：使用react-native-dotenv获取环境变量
      // 注意：需要在React Native项目中配置react-native-dotenv
      try {
        // 动态导入react-native-dotenv，避免在web环境中报错
        const { API_BASE_URL } = require("react-native-dotenv");
        return API_BASE_URL || "http://localhost:3000";
      } catch (error) {
        return "http://localhost:3000";
      }
    } else {
      // 其他环境：使用默认值
      return "http://localhost:3000";
    }
  }

  /**
   * 构造函数，初始化axios实例
   */
  constructor() {
    // 创建axios实例
    this.instance = axios.create({
      baseURL: this.getBaseUrl(),
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证信息，如token
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 统一处理响应
        const { data } = response;
        if (data.code !== 200) {
          // 处理错误情况
          return Promise.reject(new Error(data.message || "请求失败"));
        }
        return response;
      },
      (error) => {
        // 处理网络错误等
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET请求
   * @param url 请求地址
   * @param config 请求配置
   * @returns Promise<ApiResponse<T>>
   */
  get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.instance.get(url, config).then((response) => response.data);
  }

  /**
   * POST请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise<ApiResponse<T>>
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.instance
      .post(url, data, config)
      .then((response) => response.data);
  }

  /**
   * PUT请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise<ApiResponse<T>>
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.instance
      .put(url, data, config)
      .then((response) => response.data);
  }

  /**
   * DELETE请求
   * @param url 请求地址
   * @param config 请求配置
   * @returns Promise<ApiResponse<T>>
   */
  delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config).then((response) => response.data);
  }
}

// 导出单例实例
export const apiRequest = new ApiRequest();

import { http } from "../utils/http";

import {
  RegisterData,
  RegisterParams,
  LoginData,
  LoginParams,
  RefreshTokenParams,
  RefreshTokenData,
  LogoutResponse,
  VerifyCodeResponse,
  VerifyCodeRequest,
} from "./types/register";

const urls = {
  getVerificationCode: "/api/login/sendVerificationCode",
  register: "/api/login/register/emailRegister",
  login: "/api/login/emailLogin",
  loginOut: "/api/login/logout",
  refreshToken: "/api/login/refreshToken",
};

/**
 * 获取验证码
 * @param email 邮箱号
 * @returns Promise<VerifyCodeResponse>
 */
export const getVerificationCodeApi = (params: VerifyCodeRequest) => {
  return http.post<VerifyCodeResponse>(urls.getVerificationCode, params);
};

/**
 * 注册API
 * @param params 注册参数
 * @returns Promise<RegisterData>
 */
export const registerApi = (params: RegisterParams) => {
  return http.post<RegisterData>(urls.register, params);
};

/**
 * 登录API
 * @param data 登录参数
 * @returns Promise<LoginData>
 */
export const loginApi = (data: LoginParams) => {
  return http.post<LoginData>(urls.login, data);
};

/**
 * 刷新tokenAPI
 * @param data 刷新token参数
 * @returns Promise<RefreshTokenData>
 */
export const refreshTokenApi = (data: RefreshTokenParams) => {
  return http.post<RefreshTokenData>(urls.refreshToken, data);
};

/**
 * 退出登录API
 * @returns Promise<LogoutResponse>
 */
export const logoutApi = () => {
  return http.post<LogoutResponse>(urls.loginOut);
};

import { apiRequest } from "./request";

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
} from "./models/register";

const urls = {
  getVerificationCode: "/login/sendVerificationCode",
  register: "/login/register/emailRegister",
  login: "/login/emailLogin",
  loginOut: "/login/logout",
  refreshToken: "/login/refreshToken",
};

/**
 * 获取验证码
 * @param email 邮箱号
 * @returns Promise<VerifyCodeResponse>
 */
export const getVerificationCodeApi = (params: VerifyCodeRequest) => {
  return apiRequest.post<VerifyCodeResponse>(urls.getVerificationCode, params);
};

/**
 * 注册API
 * @param params 注册参数
 * @returns Promise<RegisterData>
 */
export const registerApi = (params: RegisterParams) => {
  return apiRequest.post<RegisterData>(urls.register, params);
};

/**
 * 登录API
 * @param params 登录参数
 * @returns Promise<LoginData>
 */
export const loginApi = (params: LoginParams) => {
  return apiRequest.post<LoginData>(urls.login, params);
};

/**
 * 刷新tokenAPI
 * @param params 刷新token参数
 * @returns Promise<RefreshTokenData>
 */
export const refreshTokenApi = (params: RefreshTokenParams) => {
  return apiRequest.post<RefreshTokenData>(urls.refreshToken, params);
};

/**
 * 退出登录API
 * @param params 退出登录参数
 * @returns Promise<LogoutResponse>
 */

export const logoutApi = () => {
  return apiRequest.post<LogoutResponse>(urls.loginOut);
};

import { http } from '../utils/http';

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
} from './types/register';

const urls = {
  getVerificationCode: '/login/sendVerificationCode',
  register: '/login/register/emailRegister',
  login: '/login/emailLogin',
  loginOut: '/login/logout',
  refreshToken: '/login/refreshToken',
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
 * @param params 登录参数
 * @returns Promise<LoginData>
 */
export const loginApi = (params: LoginParams) => {
  return http.post<LoginData>(urls.login, params);
};

/**
 * 刷新tokenAPI
 * @param params 刷新token参数
 * @returns Promise<RefreshTokenData>
 */
export const refreshTokenApi = (params: RefreshTokenParams) => {
  return http.post<RefreshTokenData>(urls.refreshToken, params);
};

/**
 * 退出登录API
 * @returns Promise<LogoutResponse>
 */
export const logoutApi = () => {
  return http.post<LogoutResponse>(urls.loginOut);
};

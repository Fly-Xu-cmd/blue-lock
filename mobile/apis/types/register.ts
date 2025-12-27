export interface VerifyCodeRequest {
  /**
   * 登录注册邮箱
   */
  email: string;
  [property: string]: any;
}

export interface VerifyCodeResponse {
  /**
   * 验证码
   */
  code: number;
  /**
   * 是否成功信息
   */
  data: string;
  [property: string]: any;
}

/**
 * 注册请求参数接口
 */
export interface RegisterParams {
  /**
   * 验证码
   */
  code: string;
  /**
   * 邮箱
   */
  email: string;
  /**
   * 密码
   */
  password: string;
  [property: string]: any;
}

export interface RegisterResponse {
  code: number;
  data: RegisterData;
  [property: string]: any;
}

export interface RegisterData {
  /**
   * 注册时间
   */
  CreatedAt: string;
  DeletedAt: null;
  /**
   * 注册邮箱
   */
  email: string;
  ID: number;
  /**
   * 密码
   */
  password: string;
  UpdatedAt: string;
  [property: string]: any;
}

/**
 * 登录请求参数接口
 */
export interface LoginParams {
  /**
   * 邮箱
   */
  email: string;
  /**
   * 密码
   */
  password?: string;
  /**
   * 验证码
   */
  code?: string;
  [property: string]: any;
}

/**
 * 登录响应数据接口
 */
export interface LoginResponse {
  code: number;
  data: LoginData;
  [property: string]: any;
}

/**
 * 登录响应数据接口
 */
export interface LoginData {
  user_id: string;
  username: string;
  email: string;
  access_token: string;
  refresh_token: string;
  [property: string]: any;
}

export interface RefreshTokenParams {
  /**
   * 刷新token
   */
  refresh_token: string;
  [property: string]: any;
}

export interface RefreshTokenResponse {
  code: number;
  data: RefreshTokenData;
  [property: string]: any;
}

export interface RefreshTokenData {
  /**
   * 短token
   */
  access_token: string;
  /**
   * 长token
   */
  refresh_token: string;
  /**
   * 用户id
   */
  user_id: number;
  [property: string]: any;
}

export interface LogoutResponse {
  code: number;
  data: string;
  [property: string]: any;
}

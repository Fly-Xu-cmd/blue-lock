import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import {
  getVerificationCodeApi,
  loginApi,
  registerApi,
} from "../apis/register";
import "./LoginScreen.css";

/**
 * 登录屏幕组件
 * 提供账号密码登录和注册功能
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const navigate = useNavigate();

  // 验证邮箱格式
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // 获取验证码
  const getVerificationCode = async () => {
    if (!email) {
      message.warning("请输入邮箱");
      return;
    }
    if (!validateEmail(email)) {
      message.warning("请输入有效的邮箱地址");
      return;
    }

    setCodeLoading(true);
    try {
      await getVerificationCodeApi({ email });
      message.success("验证码已发送，请查收邮箱");
      setCodeLoading(false);
    } catch (error: any) {
      message.error(error.message || "获取验证码失败，请稍后重试");
      setCodeLoading(false);
    }
  };

  // 处理登录按钮点击
  const handleLogin = async () => {
    if (!email) {
      message.warning("请输入邮箱");
      return;
    }
    if (!validateEmail(email)) {
      message.warning("请输入有效的邮箱地址");
      return;
    }
    if (!password) {
      message.warning("请输入密码");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      // 保存token到localStorage
      localStorage.setItem("blue_lock:access_token", res.data.access_token);
      localStorage.setItem("blue_lock:refresh_token", res.data.refresh_token);
      message.success("登录成功");
      navigate("/home");
      setLoading(false);
    } catch (error: any) {
      message.error(error.message || "登录失败，请稍后重试");
      setLoading(false);
    }
  };

  // 处理注册按钮点击
  const handleRegister = async () => {
    if (!isRegister) {
      // 切换到注册模式
      setIsRegister(true);
      return;
    }

    // 执行注册逻辑
    if (!email) {
      message.warning("请输入邮箱");
      return;
    }
    if (!validateEmail(email)) {
      message.warning("请输入有效的邮箱地址");
      return;
    }
    if (!password) {
      message.warning("请输入密码");
      return;
    }
    if (password.length < 6) {
      message.warning("密码长度至少为6位");
      return;
    }
    if (!verifyCode) {
      message.warning("请输入验证码");
      return;
    }

    setLoading(true);
    try {
      await registerApi({ email, password, code: verifyCode });
      message.success("注册成功，请登录");
      setIsRegister(false);
      setVerifyCode("");
      setLoading(false);
    } catch (error: any) {
      message.error(error.message || "注册失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">蓝牙密码箱</h1>

        <div className="form-group">
          <label className="form-label">邮箱</label>
          <input
            type="email"
            className="form-input"
            placeholder="请输入邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">密码</label>
          <input
            type="password"
            className="form-input"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {isRegister && (
          <div className="form-group">
            <div className="verify-code-container">
              <div className="verify-code-input-wrapper">
                <label className="form-label">验证码</label>
                <input
                  type="text"
                  className="form-input verify-code-input"
                  placeholder="请输入验证码"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  disabled={loading || codeLoading}
                />
              </div>
              <button
                className="verify-code-btn"
                onClick={getVerificationCode}
                disabled={
                  loading || codeLoading || !email || !validateEmail(email)
                }
              >
                {codeLoading ? "发送中..." : "获取验证码"}
              </button>
            </div>
          </div>
        )}

        <button
          className="login-btn"
          onClick={isRegister ? handleRegister : handleLogin}
          disabled={loading}
        >
          {loading ? "处理中..." : isRegister ? "注册" : "登录"}
        </button>

        <div className="register-toggle">
          {isRegister ? (
            <span>
              已有账号？{" "}
              <button
                className="toggle-btn"
                onClick={() => setIsRegister(false)}
              >
                立即登录
              </button>
            </span>
          ) : (
            <span>
              没有账号？{" "}
              <button
                className="toggle-btn"
                onClick={() => setIsRegister(true)}
              >
                立即注册
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

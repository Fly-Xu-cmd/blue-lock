import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, message, Row, Col } from "antd";
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
  const [isRegister, setIsRegister] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 获取验证码
  const getVerificationCode = async () => {
    try {
      // 验证邮箱格式
      await form.validateFields(["email"]);
      const email = form.getFieldValue("email");

      setCodeLoading(true);
      await getVerificationCodeApi({ email });
      message.success("验证码已发送，请查收邮箱");
      setCodeLoading(false);
    } catch (error: any) {
      message.error(error.message || "请先输入有效的邮箱地址");
      setCodeLoading(false);
    }
  };

  // 处理登录
  const handleLogin = async (values: any) => {
    try {
      const res = await loginApi(values);
      // 保存token到localStorage
      localStorage.setItem("blue_lock:access_token", res.data.access_token);
      localStorage.setItem("blue_lock:refresh_token", res.data.refresh_token);
      message.success("登录成功");
      navigate("/home");
    } catch (error: any) {
      message.error(error.message || "登录失败，请稍后重试");
    }
  };

  // 处理注册
  const handleRegister = async (values: any) => {
    try {
      await registerApi(values);
      message.success("注册成功，请登录");
      setIsRegister(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.message || "注册失败，请稍后重试");
    }
  };

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsRegister(!isRegister);
    form.resetFields();
  };

  return (
    <div className="login-container">
      <Card
        title="蓝牙密码箱"
        className="login-card"
        
        style={{ width: 400, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={isRegister ? handleRegister : handleLogin}
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input placeholder="请输入邮箱" type="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码长度至少为6位" },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          {isRegister && (
            <Form.Item
              name="code"
              label="验证码"
              rules={[{ required: true, message: "请输入验证码" }]}
            >
              <Row gutter={8}>
                <Col span={16}>
                  <Input placeholder="请输入验证码" />
                </Col>
                <Col span={8}>
                  <Button
                    type="primary"
                    onClick={getVerificationCode}
                    loading={codeLoading}
                    disabled={codeLoading}
                    block
                  >
                    {codeLoading ? "发送中..." : "获取验证码"}
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              {isRegister ? "注册" : "登录"}
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              type="link"
              onClick={toggleMode}
              block
              style={{ marginBottom: 0 }}
            >
              {isRegister ? "已有账号？立即登录" : "没有账号？立即注册"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

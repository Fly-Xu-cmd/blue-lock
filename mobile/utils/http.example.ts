/**
 * HTTP 请求封装使用示例
 *
 * 这个文件展示了如何在项目中使用 http 封装
 */

import { http } from './http';
import { Alert } from 'react-native';

// ========== 示例 1: 登录并保存 token ==========
export const loginExample = async (email: string, password: string) => {
  try {
    const response = await http.post('/login/emailLogin', {
      email,
      password,
    });

    if (response.code === 2000) {
      // 保存 token
      await http.setToken(
        response.data.access_token,
        response.data.refresh_token,
      );

      Alert.alert('成功', '登录成功');
      return response.data;
    } else {
      Alert.alert('失败', response.message || '登录失败');
    }
  } catch (error: any) {
    Alert.alert('错误', error.message || '登录失败，请稍后重试');
    throw error;
  }
};

// ========== 示例 2: 获取用户信息（自动携带 token） ==========
export const getUserInfoExample = async () => {
  try {
    const response = await http.get('/user/info');
    return response.data;
  } catch (error: any) {
    if (error.code === 401) {
      // token 已过期，需要重新登录
      Alert.alert('提示', '登录已过期，请重新登录');
      await http.clearTokens();
    }
    throw error;
  }
};

// ========== 示例 3: 上传文件 ==========
export const uploadFileExample = async (fileUri: string) => {
  try {
    const FormData = require('form-data');
    const formData = new FormData();

    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    const response = await http.upload('/upload', formData, progress => {
      console.log(`上传进度: ${progress}%`);
    });

    Alert.alert('成功', '文件上传成功');
    return response.data;
  } catch (error: any) {
    Alert.alert('错误', error.message || '上传失败');
    throw error;
  }
};

// ========== 示例 4: 退出登录 ==========
export const logoutExample = async () => {
  try {
    // 调用退出登录 API
    await http.post('/login/logout');

    // 清除本地 token
    await http.clearTokens();

    Alert.alert('成功', '已退出登录');
  } catch (error: any) {
    console.error('请求失败:', error);
    // 即使 API 调用失败，也清除本地 token
    await http.clearTokens();
    Alert.alert('提示', '已退出登录');
  }
};

// ========== 示例 5: 带自定义配置的请求 ==========
export const customRequestExample = async () => {
  try {
    const response = await http.get('/api/data', {
      params: {
        page: 1,
        limit: 10,
      },
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('请求失败:', error);
    throw error;
  }
};

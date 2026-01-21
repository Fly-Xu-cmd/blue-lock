import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { useState } from 'react';
import {
  loginApi,
  registerApi,
  getVerificationCodeApi,
} from '../apis/register';
import { http } from '../utils/http';
import { useNavigation } from '@react-navigation/native';

/**
 * 登录屏幕组件
 * 提供账号密码登录和注册功能
 */
export default function LoginScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const navigation = useNavigation();

  // 验证邮箱格式
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // 获取验证码
  const getVerificationCode = async () => {
    if (!email) {
      ToastAndroid.show('请输入邮箱', ToastAndroid.SHORT);
      return;
    }
    if (!validateEmail(email)) {
      ToastAndroid.show('请输入有效的邮箱地址', ToastAndroid.SHORT);
      return;
    }

    setCodeLoading(true);
    try {
      const res = await getVerificationCodeApi({ email: email });
      if (res.code === 2000) {
        ToastAndroid.show('验证码已发送，请查收邮箱', ToastAndroid.SHORT);
      } else {
        const errorMessage =
          res.data && typeof res.data === 'string'
            ? res.data
            : '获取验证码失败，请稍后重试';
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      }
    } catch (error: any) {
      ToastAndroid.show(
        error.message || '获取验证码失败，请稍后重试',
        ToastAndroid.SHORT,
      );
    } finally {
      setCodeLoading(false);
    }
  };

  // 处理登录按钮点击
  const handleLogin = async () => {
    if (!email) {
      ToastAndroid.show('请输入邮箱', ToastAndroid.SHORT);
      return;
    }
    if (!validateEmail(email)) {
      ToastAndroid.show('请输入有效的邮箱地址', ToastAndroid.SHORT);
      return;
    }
    if (!password) {
      ToastAndroid.show('请输入密码', ToastAndroid.SHORT);
      return;
    }

    setLoading(true);
    // Alert.alert('成功', '登录成功', [
    //   {
    //     text: '确定',
    //     onPress: () => {
    //       // TODO: 导航到主页面
    //       navigation.navigate('Home');
    //     },
    //   },
    // ]);
    try {
      const res = await loginApi({ email, password });
      if (res.code === 2000) {
        // 保存 token（这里可以后续集成 AsyncStorage）
        console.log('登录成功', res.data);
        await http.setToken(res.data.access_token, res.data.refresh_token);
        ToastAndroid.show('登录成功', ToastAndroid.SHORT);
        setTimeout(() => {
          navigation.navigate('Home' as never);
        }, 1000);
      } else {
        ToastAndroid.show(
          res.message || '登录失败，请检查邮箱和密码',
          ToastAndroid.SHORT,
        );
      }
    } catch (error: any) {
      ToastAndroid.show(
        error.message || '登录失败，请稍后重试',
        ToastAndroid.SHORT,
      );
    } finally {
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
      ToastAndroid.show('请输入邮箱', ToastAndroid.SHORT);
      return;
    }
    if (!validateEmail(email)) {
      ToastAndroid.show('请输入有效的邮箱地址', ToastAndroid.SHORT);
      return;
    }
    if (!password) {
      ToastAndroid.show('请输入密码', ToastAndroid.SHORT);
      return;
    }
    if (password.length < 6) {
      ToastAndroid.show('密码长度至少为6位', ToastAndroid.SHORT);
      return;
    }
    if (!verifyCode) {
      ToastAndroid.show('请输入验证码', ToastAndroid.SHORT);
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi({
        email,
        password,
        code: verifyCode,
      });
      if (res.code === 2000) {
        ToastAndroid.show('注册成功，请登录', ToastAndroid.SHORT);
        setTimeout(() => {
          setIsRegister(false);
          setVerifyCode('');
        }, 1000);
      } else {
        ToastAndroid.show(
          res.message || '注册失败，请检查信息后重试',
          ToastAndroid.SHORT,
        );
      }
    } catch (error: any) {
      ToastAndroid.show(
        error.message || '注册失败，请稍后重试',
        ToastAndroid.SHORT,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <Text style={styles.title}>蓝牙密码箱</Text>
      <View style={styles.form}>
        <Text style={styles.formLabel}>邮箱</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入邮箱"
          placeholderTextColor="#999"
          onChangeText={setEmail}
          value={email}
        />
        <Text style={styles.formLabel}>密码</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入密码"
          placeholderTextColor="#999"
          secureTextEntry={true}
          onChangeText={setPassword}
          value={password}
        />
        {isRegister && (
          <>
            <Text style={styles.formLabel}>验证码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入验证码"
              placeholderTextColor="#999"
              onChangeText={setVerifyCode}
              value={verifyCode}
            />
            <TouchableOpacity
              style={[styles.button, codeLoading && styles.buttonDisabled]}
              onPress={getVerificationCode}
              disabled={codeLoading}
            >
              {codeLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>获取验证码</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        {!isRegister && (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>登录</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            styles.registerButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.registerButtonText]}>
            {isRegister ? '注册' : '切换到注册'}
          </Text>
        </TouchableOpacity>

        {isRegister && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => {
              setIsRegister(false);
              setVerifyCode('');
            }}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.backButtonText]}>
              返回登录
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 40,
    alignSelf: 'center',
  },
  form: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    width: '100%',
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  registerButtonText: {
    color: '#007AFF',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

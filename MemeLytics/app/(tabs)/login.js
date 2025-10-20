// app/login.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import LiquidEtherBackground from '../../components/LiquidEtherBackground';
import CustomAlert from '../../components/CustomAlert';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login } = useAuth();
 const [showPassword, setShowPassword] = useState(false);
const [alertVisible, setAlertVisible] = useState(false);
const [alertData, setAlertData] = useState({
  title: '',
  message: '',
  buttons: []
});

const EyeIcon = ({ show, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.eyeButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.eyeIcon}>
        {show ? '🙈' : '🙉'}
      </Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Функции валидации
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setEmailError('Введите корректный email');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text && !validatePassword(text)) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
    } else {
      setPasswordError('');
    }
  };

const handleLogin = async () => {
  // Проверяем валидность перед логином
  let isValid = true;

  if (!email) {
    setEmailError('Введите email');
    isValid = false;
  } else if (!validateEmail(email)) {
    setEmailError('Введите корректный email');
    isValid = false;
  }

  if (!password) {
    setPasswordError('Введите пароль');
    isValid = false;
  } else if (!validatePassword(password)) {
    setPasswordError('Пароль должен содержать минимум 6 символов');
    isValid = false;
  }

  if (!isValid) return;

  try {
    await login({ email, password });
    router.replace('/');
  } catch (error) {
  console.error('Login error:', error);

  let errorMessage = error.message || 'Неизвестная ошибка';

  // Ошибка: пользователь не найден
  if (
    errorMessage.includes('Пользователь не найден') ||
    errorMessage.includes('User not found')
  ) {
    setAlertData({
      title: 'Пользователь не найден',
      message: 'Аккаунт с таким email не существует.\nПроверьте email или зарегистрируйтесь.',
      buttons: [
        { text: 'Зарегистрироваться', onPress: () => setTimeout(() => router.push('/Stepper'), 200) },
        { text: 'OK' }
      ]
    });
    setAlertVisible(true);
    return;
  }

  // Ошибка: неверный пароль
  if (
    errorMessage.includes('Неверный email или пароль') ||
    errorMessage.includes('Invalid credentials')
  ) {
    setAlertData({
      title: 'Неверный пароль',
      message: 'Проверьте правильность введённого пароля.',
      buttons: [{ text: 'OK' }]
    });
    setAlertVisible(true);
    return;
  }

  // Прочие ошибки
  setAlertData({
    title: 'Ошибка входа',
    message: `Не удалось войти: ${errorMessage}`,
    buttons: [{ text: 'OK' }]
  });
  setAlertVisible(true);
}
};

  const handleBack = () => {
    router.back();
  };

  // Проверяем, можно ли активировать кнопку входа
  const isLoginEnabled = email && password && !emailError && !passwordError;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* ФОН - точно как в Stepper */}
        <View style={styles.backgroundContainer}>
          <LiquidEtherBackground 
            colors={['#5227FF', '#FF9FFC', '#B19EEF']}
            autoSpeed={0.3}
            autoIntensity={1.5}
          />
        </View>
        
        {/* КОНТЕНТ - точно как в Stepper */}
        {isReady && (
          <SafeAreaView style={styles.safeArea}>
            {/* Хедер - ТОЧНО как в Stepper */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Вход в аккаунт</Text>
              <View style={{ width: 32 }} /> {/* Заглушка для выравнивания */}
            </View>

            <View style={styles.content}>
              <KeyboardAvoidingView 
                style={styles.keyboardAvoiding}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <ScrollView 
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.stepSubtitle}>Введите email и пароль для входа</Text>
                  
                  <View style={styles.inputContainer}>
                    {/* Поле Email */}
                    <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#7C8599"
                        value={email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                    
    <View style={[styles.inputWrapper, passwordError && styles.inputWrapperError]}>
      <TextInput
        style={[styles.input, { paddingRight: 50 }]}
        placeholder="Пароль"
        placeholderTextColor="#7C8599"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry={!showPassword}
      />
      <EyeIcon 
        show={showPassword} 
        onPress={() => setShowPassword(!showPassword)} 
      />
    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                    {/* Кнопка входа */}
                    <TouchableOpacity 
                      style={[styles.loginButton, !isLoginEnabled && styles.loginButtonDisabled]}
                      onPress={handleLogin}
                      disabled={!isLoginEnabled}
                    >
                      <LinearGradient 
                        colors={isLoginEnabled ? ['#16DBBE', '#9B8CFF'] : ['#2A2B42', '#2A2B42']} 
                        style={styles.loginButtonGradient}
                      >
                        <Text style={[styles.loginButtonText, !isLoginEnabled && styles.loginButtonTextDisabled]}>
                          Войти
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Ссылка на регистрацию */}
                    <View style={styles.registerContainer}>
                      <Text style={styles.registerText}>Нет аккаунта?</Text>
                      <TouchableOpacity onPress={handleBack}>
                        <Text style={styles.registerLink}>Зарегистрироваться</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </SafeAreaView>
        )}
        <CustomAlert
  visible={alertVisible}
  title={alertData.title}
  message={alertData.message}
  buttons={alertData.buttons}
  onClose={() => setAlertVisible(false)}
/>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F111E',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
  },
  eyeIcon: {
    fontSize: 20,
    color: '#7C8599',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#A3B7D2',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    gap: 16,
  },
  inputWrapper: {
    backgroundColor: '#1A1B30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2B42',
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: '#FF6B6B',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: -12,
    marginLeft: 4,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#0F111E',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButtonTextDisabled: {
    color: '#7C8599',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  registerText: {
    color: '#A3B7D2',
    fontSize: 14,
  },
  registerLink: {
    color: '#16DBBE',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
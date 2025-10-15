import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router'; 
import Svg, { Path } from 'react-native-svg';
import LiquidEtherBackground from '../../components/LiquidEtherBackground';
import * as ImagePicker from 'expo-image-picker';
import { EmojiText } from '../../components/Twemoji';

const { width, height } = Dimensions.get('window');

// Check Icon Component
const CheckIcon = ({ color = "#FFFFFF", size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13l4 4L19 7"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ===== Кастомный TextInput с Twemoji (как в edit-profile) =====
const EmojiTextInput = ({ value, onChangeText, placeholder, style, theme, onFocus, onBlur }) => {
  const localStyles = StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 50,
      justifyContent: "center",
      backgroundColor: theme.inputBackground || '#1A1B30',
    },
    text: { fontSize: 16, lineHeight: 20 },
    placeholder: { fontSize: 16, lineHeight: 20, color: theme.inputPlaceholder || "#7C8599" },
    hiddenInput: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0,
      fontSize: 16,
    },
  });

  return (
    <View style={[localStyles.container, style]}>
      {value ? (
        <EmojiText text={value} style={[localStyles.text, { color: theme.inputText || theme.text || '#FFFFFF' }]} />
      ) : (
        <Text style={localStyles.placeholder}>{placeholder}</Text>
      )}
      <TextInput
        style={localStyles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        placeholder=""
        multiline={false}
        placeholderTextColor="transparent"
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

// Step Indicator Component
const StepIndicator = React.memo(({ step, currentStep, onPress, disableStepIndicators = false }) => {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const scaleToValue =
      status === 'active' ? 1.1 :
      status === 'complete' ? 1 :
      1;

    Animated.spring(scaleAnim, {
      toValue: scaleToValue,
      useNativeDriver: true,
    }).start();
  }, [status]);

  const getBackgroundColor = () => {
    switch (status) {
      case 'active': return '#16DBBE';
      case 'complete': return '#16DBBE';
      default: return '#2A2B42';
    }
  };

  const handlePress = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onPress(step);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.stepIndicator}
    >
      <Animated.View 
        style={[
          styles.stepIndicatorInner,
          {
            backgroundColor: getBackgroundColor(),
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {status === 'complete' ? (
          <CheckIcon color="#0F111E" />
        ) : status === 'active' ? (
          <View style={styles.activeDot} />
        ) : (
          <Text style={styles.stepNumber}>
            {step}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

const StepConnector = React.memo(({ isComplete }) => {
  const progressAnim = useRef(new Animated.Value(isComplete ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: isComplete ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isComplete]);

  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.stepConnector}>
      <Animated.View style={[styles.stepConnectorInner, { width: widthInterpolate, backgroundColor: '#16DBBE' }]} />
    </View>
  );
});


const Stepper = ({ 
  children, 
  initialStep = 1, 
  onStepChange = () => {}, 
  onFinalStepCompleted = () => {}, 
  backButtonText = 'Назад', 
  nextButtonText = 'Продолжить',
  stepValidations = [] 
}) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const stepsArray = React.Children.toArray(children);
  const totalSteps = stepsArray.length;

  const slideAnim = useRef(new Animated.Value(initialStep)).current;

  const updateStep = React.useCallback((newStep, dir) => {
    if (newStep === currentStep) return;

    // Проверка валидности текущего шага перед переходом
    if (newStep > currentStep) {
      const validationFn = stepValidations[currentStep - 1];
      if (validationFn && !validationFn()) {
        return; // Не переходим если шаг не валиден
      }
    }

    setCurrentStep(newStep);

    Animated.timing(slideAnim, {
      toValue: newStep,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      if (newStep > totalSteps) onFinalStepCompleted();
    });
  }, [currentStep, slideAnim, totalSteps, onFinalStepCompleted, stepValidations]);

  const isLastStep = currentStep === totalSteps;
  const isCompleted = currentStep > totalSteps;

  // Проверяем валидность текущего шага для активации кнопки
  const isCurrentStepValid = () => {
    const validationFn = stepValidations[currentStep - 1];
    return !validationFn || validationFn();
  };

  return (
    <View style={styles.stepperContainer}>
      {/* Step Indicators */}
      <View style={styles.stepIndicatorsContainer}>
        {stepsArray.map((_, index) => {
          const stepNumber = index + 1;
          const isComplete = currentStep > stepNumber;
          const isLast = index === stepsArray.length - 1;
          return (
            <View key={stepNumber} style={styles.stepIndicatorWrapper}>
              <StepIndicator
                step={stepNumber}
                currentStep={currentStep}
                onPress={(step) => {
                  const dir = step > currentStep ? 1 : -1;
                  updateStep(step, dir);
                }}
              />
              {!isLast && <StepConnector isComplete={isComplete} />}
            </View>
          );
        })}
      </View>

      {/* Step Content */}
      <View style={styles.stepContentContainer}>
        {stepsArray.map((step, index) => {
          const stepNumber = index + 1;
          const inputRange = Array.from({ length: totalSteps + 1 }, (_, i) => i + 1);
          
          const translateX = slideAnim.interpolate({
            inputRange,
            outputRange: inputRange.map(i => (i - stepNumber) * width),
          });

          const opacity = slideAnim.interpolate({
            inputRange: [stepNumber - 0.5, stepNumber, stepNumber + 0.5],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          const pointerEvents = currentStep === stepNumber ? 'auto' : 'none';

          return (
            <Animated.View
              key={stepNumber}
              style={[
                styles.stepContent,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity,
                  transform: [{ translateX }],
                  pointerEvents,
                },
              ]}
            >
              {step}
            </Animated.View>
          );
        })}
      </View>

      {/* Navigation Buttons */}
      {!isCompleted && (
        <View style={[styles.navigationButtons, { paddingBottom: insets.bottom + 20 }]}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => updateStep(currentStep - 1, -1)}
            >
              <Text style={styles.backButtonText}>{backButtonText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, !isCurrentStepValid() && styles.nextButtonDisabled]}
            onPress={() => {
              if (isLastStep) {
                updateStep(totalSteps + 1, 1);
              } else {
                updateStep(currentStep + 1, 1);
              }
            }}
            disabled={!isCurrentStepValid()}
          >
            <LinearGradient 
              colors={isCurrentStepValid() ? ['#16DBBE', '#9B8CFF'] : ['#2A2B42', '#2A2B42']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.nextButtonGradient}
            >
              <Text style={[styles.nextButtonText, !isCurrentStepValid() && styles.nextButtonTextDisabled]}>
                {isLastStep ? 'Завершить' : nextButtonText}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Шаг 1: Email/пароль
const Step1EmailPassword = React.memo(({ onDataChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
    onDataChange({ email: text, password });
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text && !validatePassword(text)) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
    } else {
      setPasswordError('');
    }
    onDataChange({ email, password: text });
  };

  const theme = {
    background: '#0F111E',
    text: '#FFFFFF',
    inputBackground: '#1A1B30',
    inputText: '#FFFFFF',
    inputPlaceholder: '#7C8599',
  };

const handleLoginPress = () => {
  router.push('login');
};

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Создайте аккаунт</Text>
      <Text style={styles.stepSubtitle}>Введите email и пароль для регистрации</Text>
      
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Email"
            placeholderTextColor={theme.inputPlaceholder}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        
        <View style={[styles.inputWrapper, passwordError && styles.inputWrapperError]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Пароль"
            placeholderTextColor={theme.inputPlaceholder}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
          />
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* === КНОПКА "ВОЙТИ" === */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Уже есть аккаунт?</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLoginPress}
          >
            <Text style={styles.loginButtonText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// Шаг 2: Профиль
const Step2Profile = React.memo(({ onDataChange }) => {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      onDataChange({ username, avatar: result.assets[0].uri });
    }
  };

  const handleUsernameChange = (text) => {
    setUsername(text);
    onDataChange({ username: text, avatar });
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const theme = {
    background: '#0F111E',
    text: '#FFFFFF',
    inputBackground: '#1A1B30',
    inputText: '#FFFFFF',
    inputPlaceholder: '#7C8599',
  };

  return (
    <KeyboardAvoidingView 
      style={styles.stepContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.stepScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>Настройте профиль</Text>
        <Text style={styles.stepSubtitle}>Добавьте имя и аватар</Text>
        
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarPlaceholder} onPress={pickImage}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>+</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Добавить фото</Text>
        </View>
        
        <View style={[styles.inputContainer, isInputFocused && styles.inputContainerFocused]}>
          <View style={[styles.emojiInputWrapper, { backgroundColor: theme.inputBackground }]}>
            <EmojiTextInput 
              value={username} 
              onChangeText={handleUsernameChange} 
              placeholder="Имя пользователя" 
              theme={theme}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </View>
        </View>

        {/* Spacer для поднятия контента над клавиатурой */}
        {isInputFocused && <View style={styles.keyboardSpacer} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

// Шаг 3: Интересы
const Step3Interests = React.memo(({ onDataChange }) => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const interests = [
    '😂 Юмор', '🎮 Игры', '🐱 Животные', '🍕 Еда', 
    '🏆 Спорт', '🎬 Фильмы', '🎵 Музыка', '🚀 Наука',
    '💻 Технологии', '🎨 Искусство', '✈️ Путешествия', '💪 Фитнес'
  ];

  const toggleInterest = (interest) => {
    const newSelected = selectedInterests.includes(interest) 
      ? selectedInterests.filter(item => item !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(newSelected);
    onDataChange(newSelected);
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Выберите интересы</Text>
      <Text style={styles.stepSubtitle}>Выберите минимум 3 интереса{'\n'}Это поможет нам показывать вам релевантные мемы</Text>
      
      <ScrollView 
        style={styles.interestsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.interestsContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.interestsGrid}>
          {interests.map((interest, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.interestButton,
                selectedInterests.includes(interest) && styles.interestButtonSelected
              ]}
              onPress={() => toggleInterest(interest)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.interestText,
                selectedInterests.includes(interest) && styles.interestTextSelected
              ]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {selectedInterests.length > 0 && (
          <Text style={styles.selectedCountText}>
            Выбрано: {selectedInterests.length}/3
          </Text>
        )}
      </ScrollView>
    </View>
  );
});

// Шаг 4: Подтверждение
const Step4Confirmation = React.memo(() => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>🎉</Text>
        </View>
        <Text style={styles.successTitle}>Регистрация завершена!</Text>
        <Text style={styles.successSubtitle}>
          Добро пожаловать в сообщество мемов!{'\n'}
          Начните исследовать и создавать мемы.
        </Text>
      </View>
    </View>
  );
});

// Главный компонент экрана регистрации
const RegistrationScreen = () => {
  const { register } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  // Состояния для данных формы
  const [formData, setFormData] = useState({
    step1: { email: '', password: '' },
    step2: { username: '', avatar: null },
    step3: []
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Функции валидации для каждого шага
  const validateStep1 = () => {
    const { email, password } = formData.step1;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && password.length >= 6;
  };

  const validateStep2 = () => {
    const { username } = formData.step2;
    return username.trim().length > 0;
  };

  const validateStep3 = () => {
    return formData.step3.length >= 3;
  };

  const stepValidations = [validateStep1, validateStep2, validateStep3];

  const handleStepDataChange = (step, data) => {
    setFormData(prev => ({
      ...prev,
      [step]: data
    }));
  };

  const handleFinalStepCompleted = () => {
    const userData = {
      id: '1',
      name: formData.step2.username || 'User Name 😎',
      email: formData.step1.email,
      avatar: formData.step2.avatar ? { uri: formData.step2.avatar } : require('../../src/assets/cool_avatar.jpg'),
      interests: formData.step3,
      isRegistered: true,
      stats: {
        followers: 0,
        following: 0,
        likes: 0
      }
    };
    
    register(userData);
  setTimeout(() => {
    router.replace('/');
  }, 1000);
};

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* ФОН - всегда рендерим */}
        <View style={styles.backgroundContainer}>
          <LiquidEtherBackground 
            colors={['#5227FF', '#FF9FFC', '#B19EEF']}
            autoSpeed={0.3}
            autoIntensity={1.5}
          />
        </View>
        
        {/* КОНТЕНТ - рендерим с небольшой задержкой */}
        {isReady && (
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Регистрация</Text>
              <View style={{ width: 32 }} /> {/* Заглушка для выравнивания */}
            </View>

            <Stepper
              onFinalStepCompleted={handleFinalStepCompleted}
              nextButtonText="Далее"
              backButtonText="Назад"
              stepValidations={stepValidations}
            >
              <Step1EmailPassword onDataChange={(data) => handleStepDataChange('step1', data)} />
              <Step2Profile onDataChange={(data) => handleStepDataChange('step2', data)} />
              <Step3Interests onDataChange={(data) => handleStepDataChange('step3', data)} />
              <Step4Confirmation />
            </Stepper>
          </SafeAreaView>
        )}
      </View>
    </SafeAreaProvider>
  );
};

// Обновленный StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F111E',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepperContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  stepIndicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  stepIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    padding: 4,
  },
  stepIndicatorInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepIndicatorComplete: {
    backgroundColor: '#16DBBE',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F111E',
  },
  stepConnector: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
    backgroundColor: '#2A2B42',
    overflow: 'hidden',
  },
  stepConnectorInner: {
    height: '100%',
    width: '100%',
  },
  stepContentContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  loginContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 24,
  gap: 8,
},
loginText: {
  color: '#A3B7D2',
  fontSize: 14,
},
loginButton: {
  paddingVertical: 4,
  paddingHorizontal: 12,
},
loginButtonText: {
  color: '#16DBBE',
  fontSize: 14,
  fontWeight: '600',
},
  stepContent: {
    width: '100%',
    height: '100%',
  },
  stepContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  stepScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
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
  inputContainerFocused: {
    marginBottom: 100, // Дополнительное место при фокусе
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
  emojiInputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: -12,
    marginLeft: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16DBBE',
    borderStyle: 'dashed',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 24,
    color: '#16DBBE',
  },
  avatarLabel: {
    color: '#A3B7D2',
    fontSize: 14,
  },
  interestsContainer: {
    flex: 1,
  },
  interestsContent: {
    paddingBottom: 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  interestButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#1A1B30',
    borderWidth: 1,
    borderColor: '#2A2B42',
  },
  interestButtonSelected: {
    backgroundColor: '#16DBBE',
    borderColor: '#16DBBE',
  },
  interestText: {
    color: '#A3B7D2',
    fontSize: 14,
    fontWeight: '500',
  },
  interestTextSelected: {
    color: '#0F111E',
    fontWeight: '600',
  },
  selectedCountText: {
    color: '#16DBBE',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#16DBBE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#A3B7D2',
    textAlign: 'center',
    lineHeight: 22,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2A2B42',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#A3B7D2',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#0F111E',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#7C8599',
  },
  keyboardSpacer: {
    height: 200, // Дополнительное пространство при открытой клавиатуре
  },
});

export default RegistrationScreen;
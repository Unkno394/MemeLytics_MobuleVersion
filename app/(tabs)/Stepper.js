// app/(tabs)/Stepper.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Кастомизированный Stepper компонент
const Stepper = ({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = 'Назад',
  nextButtonText = 'Продолжить',
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = React.Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  // Анимационные значения
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const updateStep = (newStep) => {
    // Анимация перехода
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction >= 0 ? -50 : 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(newStep);
      if (newStep > totalSteps) {
        onFinalStepCompleted();
      } else {
        onStepChange(newStep);
      }
      
      // Сброс анимации
      slideAnim.setValue(direction >= 0 ? 50 : -50);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <View style={styles.stepperContainer}>
      {/* Step Indicators */}
      <View style={styles.stepIndicatorsContainer}>
        {stepsArray.map((_, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isComplete = currentStep > stepNumber;
          const isLast = index === stepsArray.length - 1;

          return (
            <View key={stepNumber} style={styles.stepIndicatorWrapper}>
              <TouchableOpacity 
                style={[
                  styles.stepIndicator,
                  isActive && styles.stepIndicatorActive,
                  isComplete && styles.stepIndicatorComplete
                ]}
              >
                {isComplete ? (
                  <Text style={styles.stepIndicatorText}>✓</Text>
                ) : (
                  <Text style={[
                    styles.stepIndicatorText,
                    isActive && styles.stepIndicatorTextActive
                  ]}>
                    {stepNumber}
                  </Text>
                )}
              </TouchableOpacity>
              {!isLast && (
                <View style={styles.stepConnector}>
                  <View style={[
                    styles.stepConnectorLine,
                    isComplete && styles.stepConnectorLineComplete
                  ]} />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Step Content */}
      <View style={styles.stepContentContainer}>
        <Animated.View
          style={[
            styles.stepContent,
            {
              transform: [{ translateX: slideAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          {stepsArray[currentStep - 1]}
        </Animated.View>
      </View>

      {/* Navigation Buttons */}
      {!isCompleted && (
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>{backButtonText}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={isLastStep ? handleComplete : handleNext}
          >
            <LinearGradient
              colors={['#16DBBE', '#9B8CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
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
const Step1EmailPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Создайте аккаунт</Text>
      <Text style={styles.stepSubtitle}>Введите email и пароль для регистрации</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#7C8599"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor="#7C8599"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
    </View>
  );
};

// Шаг 2: Профиль
const Step2Profile = () => {
  const [username, setUsername] = useState('');

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Настройте профиль</Text>
      <Text style={styles.stepSubtitle}>Добавьте имя и аватар</Text>
      
      <View style={styles.avatarContainer}>
        <TouchableOpacity style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.avatarLabel}>Добавить фото</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Имя пользователя"
          placeholderTextColor="#7C8599"
          value={username}
          onChangeText={setUsername}
        />
      </View>
    </View>
  );
};

// Шаг 3: Интересы
const Step3Interests = () => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const interests = [
    '😂 Юмор', '🎮 Игры', '🐱 Животные', '🍕 Еда', 
    '🏆 Спорт', '🎬 Фильмы', '🎵 Музыка', '🚀 Наука',
    '💻 Технологии', '🎨 Искусство', '✈️ Путешествия', '💪 Фитнес'
  ];

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(item => item !== interest)
        : [...prev, interest]
    );
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Выберите интересы</Text>
      <Text style={styles.stepSubtitle}>Это поможет нам показывать вам релевантные мемы</Text>
      
      <ScrollView 
        style={styles.interestsContainer}
        showsVerticalScrollIndicator={false}
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
      </ScrollView>
    </View>
  );
};

// Шаг 4: Подтверждение
const Step4Confirmation = () => {
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
};

// Главный компонент экрана регистрации
const RegistrationScreen = () => {
  const { register } = useAuth();

  const handleFinalStepCompleted = () => {
    const userData = {
      id: '1',
      name: 'User Name 😎',
      email: 'user@example.com',
      avatar: require('../../src/assets/cool_avatar.jpg'),
      interests: ['😂 Юмор', '🎮 Игры'],
      isRegistered: true,
      stats: {
        followers: 0,
        following: 0,
        likes: 0
      }
    };
    
    register(userData);
  };

  return (
    <LinearGradient
      colors={['#0F111E', '#1A1B30']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Регистрация</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <Stepper
        onFinalStepCompleted={handleFinalStepCompleted}
        nextButtonText="Далее"
        backButtonText="Назад"
      >
        <Step1EmailPassword />
        <Step2Profile />
        <Step3Interests />
        <Step4Confirmation />
      </Stepper>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  stepperContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2B42',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2B42',
  },
  stepIndicatorActive: {
    borderColor: '#16DBBE',
  },
  stepIndicatorComplete: {
    backgroundColor: '#16DBBE',
    borderColor: '#16DBBE',
  },
  stepIndicatorText: {
    color: '#7C8599',
    fontSize: 14,
    fontWeight: '600',
  },
  stepIndicatorTextActive: {
    color: '#16DBBE',
  },
  stepConnector: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  stepConnectorLine: {
    flex: 1,
    backgroundColor: '#2A2B42',
  },
  stepConnectorLineComplete: {
    backgroundColor: '#16DBBE',
  },
  stepContentContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
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
  input: {
    backgroundColor: '#1A1B30',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2B42',
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  nextButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#0F111E',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegistrationScreen;
import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  findNodeHandle,
  UIManager,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from "../../src/context/ThemeContext";
import { router } from "expo-router";
import { EmojiText } from "../../components/Twemoji";
import ActionModal from "../../components/ActionModal";
import CustomAlert from "../../components/CustomAlert";
import { apiClient } from "../../api/client";
import { useAuth } from "../../src/context/AuthContext";

const API_BASE_URL = 'http://192.168.1.18:8000';

const BackIcon = ({ color = "#16DBBE" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ===== Кастомный TextInput с Twemoji =====
const EmojiTextInput = ({ value, onChangeText, placeholder, style, theme }) => {
  const localStyles = StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 50,
      justifyContent: "center",
      backgroundColor: theme.input?.backgroundColor || theme.inputBackground,
    },
    text: { fontSize: 16, lineHeight: 20 },
    placeholder: { fontSize: 16, lineHeight: 20, color: theme.inputPlaceholder || "#999" },
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
        <EmojiText text={value} style={[localStyles.text, { color: theme.inputText || theme.text }]} />
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
      />
    </View>
  );
};

// ===== Полноэкранная модалка для изменения email/пароля =====
const CredentialsModal = ({ visible, type, onClose, theme, onSave, showAlert, isLoading }) => {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetForm = () => {
    setCurrentEmail("");
    setNewEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

const handleSave = () => {
  if (type === 'email') {
    if (!currentEmail || !newEmail) {
      showAlert("Ошибка", "Заполните все поля");
      return;
    }
    if (!isValidEmail(currentEmail) || !isValidEmail(newEmail)) {
      showAlert("Ошибка", "Введите корректный email адрес");
      return;
    }
    if (currentEmail.toLowerCase() === newEmail.toLowerCase()) {
      showAlert("Ошибка", "Новый email не должен совпадать с текущим");
      return;
    }
    onSave({ type: 'email', currentEmail, newEmail });
  } else {
      if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert("Ошибка", "Заполните все поля");
        return;
      }
      if (newPassword !== confirmPassword) {
        showAlert("Ошибка", "Пароли не совпадают");
        return;
      }
      if (newPassword.length < 6) {
        showAlert("Ошибка", "Пароль должен содержать минимум 6 символов");
        return;
      }
      onSave({ type: 'password', currentPassword, newPassword });
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            onPress={handleClose} 
            style={styles.modalHeaderButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isLoading}
          >
            <Text style={[styles.modalHeaderButtonText, { 
              color: isLoading ? theme.secondaryText : theme.secondaryText,
              opacity: isLoading ? 0.5 : 1 
            }]}>
              Отмена
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {type === 'email' ? 'Изменение Email' : 'Изменение Пароля'}
          </Text>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.modalHeaderButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Text style={[styles.modalHeaderButtonText, { 
                color: theme.accent,
                opacity: isLoading ? 0.5 : 1 
              }]}>
                Готово
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalContentContainer}
        >
          {/* Иконка и описание */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.accent}20` }]}>
              <Text style={[styles.iconText, { color: theme.accent }]}>
                {type === 'email' ? '✉️' : '🔒'}
              </Text>
            </View>
          </View>

          <Text style={[styles.modalDescription, { color: theme.secondaryText }]}>
            {type === 'email' 
              ? 'Для изменения email требуется подтверждение текущего адреса' 
              : 'Для безопасности подтвердите текущий пароль'
            }
          </Text>

          {type === 'email' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Текущий email
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border
                    }
                  ]}
                  placeholder="your@current.email"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={currentEmail}
                  onChangeText={setCurrentEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Новый email
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border
                    }
                  ]}
                  placeholder="your@new.email"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Текущий пароль
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border
                    }
                  ]}
                  placeholder="Введите текущий пароль"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Новый пароль
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border
                    }
                  ]}
                  placeholder="Придумайте новый пароль"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!isLoading}
                />
                <Text style={[styles.inputHint, { color: theme.secondaryText }]}>
                  Минимум 6 символов
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Подтвердите пароль
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border
                    }
                  ]}
                  placeholder="Повторите новый пароль"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!isLoading}
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { isDark, toggleTheme } = useContext(ThemeContext);
const { logout, user, updateUser, updateUserData } = useAuth();
  
  // Состояния пользователя
  const [avatar, setAvatar] = useState(user?.avatar_url ? { uri: user.avatar_url } : require("../../src/assets/cool_avatar.jpg"));
  const [username, setUsername] = useState(user?.username || "User123");
  const [isLoading, setIsLoading] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  // Состояния для уведомлений и приватности
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifMemes, setNotifMemes] = useState(false);
  const [privacyMessages, setPrivacyMessages] = useState("all");
  const [privacyMemes, setPrivacyMemes] = useState("all");

  // Состояния для модалок
  const [credentialsModalVisible, setCredentialsModalVisible] = useState(false);
  const [credentialsModalType, setCredentialsModalType] = useState('email');
  const [memesModalVisible, setMemesModalVisible] = useState(false);
  
  // Состояние для кастомного алерта
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const emailBtnRef = useRef(null);
  const memesBtnRef = useRef(null);
  const [memesModalPos, setMemesModalPos] = useState({ x: 0, y: 0 });

  // Загрузка настроек при монтировании
  useEffect(() => {
    if (user?.settings) {
      const settings = user.settings;
      if (settings.notifications) {
        setNotifLikes(settings.notifications.likes ?? true);
        setNotifMessages(settings.notifications.messages ?? true);
        setNotifMemes(settings.notifications.memes ?? false);
      }
      if (settings.privacy) {
        setPrivacyMessages(settings.privacy.messages ?? "all");
        setPrivacyMemes(settings.privacy.memes ?? "all");
      }
    }
  }, [user]);

  // Функция для показа алерта
  const showAlert = (title, message, customButtons = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

const uploadAvatar = async (imageUri) => {
  setIsLoading(true);
  try {
    const response = await apiClient.uploadAvatar(imageUri);

    // Обновляем аватар в состоянии
    setAvatar({ uri: response.avatar_url });
    
    // Обновляем пользователя в контексте
    if (updateUser) {
      updateUser({ avatar_url: response.avatar_url });
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    showAlert("Ошибка", error.message || "Не удалось загрузить аватар");
  } finally {
    setIsLoading(false);
  }
};

  const pickImage = async () => {
    // Запрашиваем разрешения
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert("Ошибка", "Нужно разрешение для доступа к галерее");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      // Сразу показываем новое изображение
      setAvatar({ uri: result.assets[0].uri });
      // Загружаем на сервер
      await uploadAvatar(result.assets[0].uri);
    }
  };

const updateUsername = async () => {
  if (!username.trim()) {
    showAlert("Ошибка", "Введите имя пользователя");
    return false;
  }

  if (username === user?.username) {
    return true; // Имя не изменилось
  }

  try {
    const response = await apiClient.updateUsername(username.trim());

    // Обновляем пользователя в контексте - используем updateUser
    if (updateUser) {
      updateUser({ username: username.trim() });
    }

    // ИЛИ альтернативно - полное обновление с сервера
    // await updateUserData();

    return true;
  } catch (error) {
    console.error('Error updating username:', error);
    showAlert("Ошибка", error.message || "Не удалось обновить имя пользователя");
    return false;
  }
};

  // Функция обновления email
const updateEmail = async (currentEmail, newEmail) => {
  setCredentialsLoading(true);
  try {
    const response = await apiClient.updateEmail(currentEmail, newEmail);
    showAlert("Успех", "Email успешно обновлен. Проверьте почту для подтверждения");
    
    // Обновляем данные пользователя в контексте
    if (updateUser) {
      updateUser({ email: newEmail });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating email:', error);
    showAlert("Ошибка", error.message || "Не удалось обновить email");
    return false;
  } finally {
    setCredentialsLoading(false);
  }
};

  // Функция обновления пароля
const updatePassword = async (currentPassword, newPassword) => {
  setCredentialsLoading(true);
  try {
    const response = await apiClient.updatePassword(currentPassword, newPassword);
    showAlert("Успех", "Пароль успешно обновлен");
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    showAlert("Ошибка", error.message || "Не удалось обновить пароль");
    return false;
  } finally {
    setCredentialsLoading(false);
  }
};

const handleCredentialsSave = async (data) => {
  console.log("Сохранение данных:", data);
  
  let success = false;
  
  if (data.type === 'email') {
    success = await updateEmail(data.currentEmail, data.newEmail);
  } else {
    success = await updatePassword(data.currentPassword, data.newPassword);
  }
  
  if (success) {
    // Закрываем модалку только при успешном обновлении
    setCredentialsModalVisible(false);
    
    // Обновляем данные пользователя
    if (updateUserData) {
      await updateUserData();
    }
  }
};

  const openCredentialsModal = (type) => {
    setCredentialsModalType(type);
    setCredentialsModalVisible(true);
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Сохраняем настройки уведомлений и приватности
      await apiClient.updateSettings({
        notifications: {
          likes: notifLikes,
          messages: notifMessages,
          memes: notifMemes
        },
        privacy: {
          messages: privacyMessages,
          memes: privacyMemes
        },
        theme: isDark ? 'dark' : 'light'
      });

      // Обновляем username если он изменился
      const usernameUpdated = await updateUsername();

      if (usernameUpdated) {
        showAlert("Изменения сохранены", "Ваши настройки профиля успешно обновлены");
        
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert("Ошибка", error.message || "Не удалось сохранить настройки");
    } finally {
      setIsLoading(false);
    }
  };

  const theme = isDark
    ? {
        background: "#0F111E",
        text: "#FFFFFF",
        secondaryText: "#A3B7D2",
        accent: "#16DBBE",
        inputBackground: "#1A1B30",
        inputText: "#FFFFFF",
        inputPlaceholder: "#666",
        option: "#1A1B30",
        button: "#16DBBE",
        border: "#2D2F45",
      }
    : {
        background: "#EAF0FF",
        text: "#1B1F33",
        secondaryText: "#64748B",
        accent: "#16A085",
        inputBackground: "#FFFFFF",
        inputText: "#1B1F33",
        inputPlaceholder: "#999",
        option: "#D6E2F5",
        button: "#1FD3B9",
        border: "#E5E5E5",
      };

  // Получение позиции кнопки для модалки
  const measurePosition = (ref, setPos) => {
    const handle = findNodeHandle(ref.current);
    if (handle) {
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        setPos({ x: pageX, y: pageY + height });
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon color={isDark ? "#16DBBE" : "#16A085"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Изменить профиль</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Основное */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>Основное</Text>

          <View style={styles.avatarWrapper}>
            <Image source={avatar} style={styles.avatar} />
            <TouchableOpacity
              style={[styles.changeAvatarBtn, { backgroundColor: theme.option }]}
              onPress={pickImage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Text style={[styles.changeAvatarText, { color: theme.accent }]}>
                  Сменить аватарку
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
            <EmojiTextInput 
              value={username} 
              onChangeText={setUsername} 
              placeholder="Никнейм" 
              theme={theme} 
            />
          </View>

          {/* Email/Пароль */}
          <View style={styles.credentialsButtons}>
            <TouchableOpacity
              style={[styles.credentialButton, { backgroundColor: theme.option }]}
              onPress={() => openCredentialsModal('email')}
              disabled={isLoading}
            >
              <Text style={[styles.credentialButtonText, { color: theme.text }]}>Изменить Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.credentialButton, { backgroundColor: theme.option }]}
              onPress={() => openCredentialsModal('password')}
              disabled={isLoading}
            >
              <Text style={[styles.credentialButtonText, { color: theme.text }]}>Изменить пароль</Text>
            </TouchableOpacity>
          </View>

          {/* Настройки приложения */}
          <Text style={[styles.sectionTitle, { color: theme.accent, marginTop: 20 }]}>Настройки приложения</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Тёмная тема</Text>
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme} 
              thumbColor={isDark ? "#16DBBE" : "#ccc"} 
              disabled={isLoading}
            />
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Уведомления о лайках</Text>
            <Switch 
              value={notifLikes} 
              onValueChange={setNotifLikes} 
              thumbColor={notifLikes ? "#16DBBE" : "#ccc"} 
              disabled={isLoading}
            />
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Уведомления о сообщениях</Text>
            <Switch 
              value={notifMessages} 
              onValueChange={setNotifMessages} 
              thumbColor={notifMessages ? "#16DBBE" : "#ccc"} 
              disabled={isLoading}
            />
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Уведомления о мемах друзей</Text>
            <Switch 
              value={notifMemes} 
              onValueChange={setNotifMemes} 
              thumbColor={notifMemes ? "#16DBBE" : "#ccc"} 
              disabled={isLoading}
            />
          </View>

          {/* Мои мемы */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>Мои мемы</Text>
          <TouchableOpacity
            ref={memesBtnRef}
            style={[styles.optionRow, { backgroundColor: theme.option }]}
            onPress={() => {
              measurePosition(memesBtnRef, setMemesModalPos);
              setMemesModalVisible(true);
            }}
            disabled={isLoading}
          >
            <Text style={[styles.optionRowText, { color: theme.text }]}>Управлять мемами</Text>
            <Text style={[styles.optionRowArrow, { color: theme.secondaryText }]}>›</Text>
          </TouchableOpacity>

          <ActionModal
            visible={memesModalVisible}
            onClose={() => setMemesModalVisible(false)}
            position={memesModalPos}
            items={[
              { label: "Добавить мем", icon: "plus", onPress: () => {
                setMemesModalVisible(false);
                showAlert("Добавление мема", "Функция добавления мема будет реализована в ближайшее время");
              }},
              { label: "Удалить мем", icon: "trash", danger: true, onPress: () => {
                setMemesModalVisible(false);
                showAlert("Удаление мема", "Функция удаления мема будет реализована в ближайшее время");
              }},
            ]}
            theme={theme}
          />

          {/* Приватность */}
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>Приватность</Text>
          <Text style={[styles.labelSmall, { color: theme.secondaryText }]}>Кто может писать мне сообщения</Text>
          <View style={styles.rowOptions}>
            {["all", "friends", "none"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.option, 
                  { backgroundColor: theme.option }, 
                  privacyMessages === opt && styles.optionActive
                ]}
                onPress={() => setPrivacyMessages(opt)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.optionText, 
                  { color: theme.secondaryText }, 
                  privacyMessages === opt && styles.optionTextActive
                ]}>
                  {opt === "all" ? "Все" : opt === "friends" ? "Друзья" : "Никто"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.labelSmall, { color: theme.secondaryText }]}>Кто видит мои мемы</Text>
          <View style={styles.rowOptions}>
            {["all", "friends", "me"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.option, 
                  { backgroundColor: theme.option }, 
                  privacyMemes === opt && styles.optionActive
                ]}
                onPress={() => setPrivacyMemes(opt)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.optionText, 
                  { color: theme.secondaryText }, 
                  privacyMemes === opt && styles.optionTextActive
                ]}>
                  {opt === "all" ? "Все" : opt === "friends" ? "Друзья" : "Только я"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Кнопка выхода */}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#FF6B6B' }]} 
            onPress={() => {
              showAlert("Выход из системы", "Вы уверены, что хотите выйти?", [
                {
                  text: "Отмена",
                  onPress: () => console.log("Отмена выхода")
                },
                {
                  text: "Выйти", 
                  onPress: async () => {
                    try {
                      if (logout) {
                        await logout();
                        console.log("Успешный выход из системы");
                        router.replace('/registration');
                      }
                    } catch (error) {
                      console.error("Ошибка при выходе:", error);
                    }
                  }
                }
              ]);
            }}
            disabled={isLoading}
          >
            <Text style={styles.logoutButtonText}>Выйти из системы</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Save Button закреплён снизу */}
        <View style={[styles.saveButtonContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { 
                backgroundColor: isLoading ? theme.secondaryText : theme.button,
                opacity: isLoading ? 0.7 : 1
              }
            ]} 
            onPress={handleSaveChanges}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isDark ? "#0F111E" : "#FFFFFF"} />
            ) : (
              <Text style={[styles.saveButtonText, { color: isDark ? "#0F111E" : "#FFFFFF" }]}>
                Сохранить изменения
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Модалка для email/пароля */}
      <CredentialsModal
        visible={credentialsModalVisible}
        type={credentialsModalType}
        onClose={() => setCredentialsModalVisible(false)}
        theme={theme}
        onSave={handleCredentialsSave}
        showAlert={showAlert}
        isLoading={credentialsLoading}
      />

      {/* Кастомный алерт */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={
          alertTitle === "Выход из системы" && alertMessage === "Вы уверены, что хотите выйти?" 
            ? [
                {
                  text: "Отмена",
                  onPress: () => setAlertVisible(false)
                },
                {
                  text: "Выйти", 
                  onPress: async () => {
                    try {
                      if (logout) {
                        await logout();
                        console.log("Успешный выход из системы");
                        router.replace('/registration');
                      }
                    } catch (error) {
                      console.error("Ошибка при выходе:", error);
                      setAlertVisible(false);
                    }
                  }
                }
              ]
            : [
                {
                  text: "OK",
                  onPress: () => setAlertVisible(false)
                }
              ]
        }
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 16, 
    justifyContent: "space-between" 
  },
  logoutButton: { 
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    width: '100%',
  },
  logoutButtonText: { 
    fontWeight: "700", 
    fontSize: 16,
    color: "#FFFFFF"
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "700" 
  },
  scroll: { 
    padding: 16, 
    paddingBottom: 80 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginVertical: 10, 
    textAlign: "center" 
  },
  avatarWrapper: { 
    alignItems: "center", 
    marginBottom: 12 
  },
  avatar: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    borderWidth: 3, 
    borderColor: "#16DBBE", 
    marginBottom: 8 
  },
  changeAvatarBtn: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 12,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarText: { 
    fontSize: 12 
  },
  inputContainer: { 
    borderRadius: 12, 
    marginBottom: 10, 
    overflow: "hidden", 
    padding: 2 
  },
  
  // Кнопки для email/пароля
  credentialsButtons: { 
    marginBottom: 10 
  },
  credentialButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  credentialButtonText: { 
    fontSize: 16, 
    fontWeight: "500" 
  },
  
  row: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginVertical: 6, 
    paddingHorizontal: 8 
  },
  optionRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  optionRowText: { 
    fontSize: 16, 
    fontWeight: "500" 
  },
  optionRowArrow: { 
    fontSize: 18, 
    fontWeight: "500" 
  },
  label: { 
    fontSize: 14 
  },
  labelSmall: { 
    fontSize: 13, 
    marginBottom: 6 
  },
  rowOptions: { 
    flexDirection: "row", 
    marginBottom: 10, 
    flexWrap: "wrap" 
  },
  option: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: "transparent" 
  },
  optionActive: { 
    backgroundColor: "#16DBBE", 
    borderColor: "#16DBBE" 
  },
  optionText: { 
    fontSize: 12 
  },
  optionTextActive: { 
    color: "#0F111E", 
    fontWeight: "600", 
    fontSize: 12 
  },
  saveButtonContainer: { 
    padding: 12, 
    borderTopWidth: 1, 
    borderColor: "#ccc" 
  },
  saveButton: { 
    padding: 14, 
    borderRadius: 14, 
    alignItems: "center",
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButtonText: { 
    fontWeight: "700", 
    fontSize: 16 
  },
  
  // Стили для модалки
  modalContainer: { 
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  modalHeaderButtonText: { 
    fontSize: 16, 
    fontWeight: "500",
    textAlign: 'center',
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700",
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  modalDescription: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputGroup: { 
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

export default EditProfileScreen;
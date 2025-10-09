// components/ActionModal2.js
import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  StyleSheet, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";

const ActionModal2 = ({ 
  visible, 
  onClose, 
  position = { x: 0, y: 0 }, 
  items = [], 
  theme = {},
  currentAction,
  onActionComplete 
}) => {
  const modalAnim = useRef(new Animated.Value(0)).current;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [activeForm, setActiveForm] = useState(null); // 'email' или 'password'

  useEffect(() => {
    if (visible) {
      Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    } else {
      Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      // Сброс форм при закрытии
      setActiveForm(null);
      setEmail("");
      setPassword("");
      setCurrentPassword("");
    }
  }, [visible]);

  const modalTranslateY = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  const modalOpacity = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const handleEmailChange = () => {
    console.log("Изменение email на:", email);
    // Здесь API вызов для изменения email
    onActionComplete?.();
    onClose();
  };

  const handlePasswordChange = () => {
    console.log("Изменение пароля");
    // Здесь API вызов для изменения пароля
    onActionComplete?.();
    onClose();
  };

  const defaultTheme = { 
    background: "#FFFFFF", 
    text: "#1B1F33", 
    border: "#E5E5E5",
    inputBackground: "#F5F5F5",
    accent: "#16DBBE"
  };
  const mergedTheme = { ...defaultTheme, ...theme };

  // Если открыта форма, показываем её вместо меню
  const renderForm = () => {
    if (activeForm === 'email') {
      return (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formContainer}
        >
          <Text style={[styles.formTitle, { color: mergedTheme.text }]}>
            Изменить Email
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: mergedTheme.inputBackground,
                color: mergedTheme.text,
                borderColor: mergedTheme.border
              }
            ]}
            placeholder="Новый email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.formButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => setActiveForm(null)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton, { backgroundColor: mergedTheme.accent }]} 
              onPress={handleEmailChange}
              disabled={!email}
            >
              <Text style={styles.confirmButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }

    if (activeForm === 'password') {
      return (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formContainer}
        >
          <Text style={[styles.formTitle, { color: mergedTheme.text }]}>
            Изменить Пароль
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: mergedTheme.inputBackground,
                color: mergedTheme.text,
                borderColor: mergedTheme.border
              }
            ]}
            placeholder="Текущий пароль"
            placeholderTextColor="#999"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: mergedTheme.inputBackground,
                color: mergedTheme.text,
                borderColor: mergedTheme.border
              }
            ]}
            placeholder="Новый пароль"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={styles.formButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => setActiveForm(null)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton, { backgroundColor: mergedTheme.accent }]} 
              onPress={handlePasswordChange}
              disabled={!currentPassword || !password}
            >
              <Text style={styles.confirmButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }

    // Стандартное меню
    return items.map((item, index) => (
      <TouchableOpacity
        key={index}
        style={styles.item}
        onPress={() => {
          if (item.label === "Изменить Email") {
            setActiveForm('email');
          } else if (item.label === "Изменить пароль") {
            setActiveForm('password');
          } else {
            item.onPress?.();
            onClose();
          }
        }}
      >
        <Text style={[styles.itemText, { color: mergedTheme.text }]}>{item.label}</Text>
      </TouchableOpacity>
    ));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              top: position.y,
              left: Math.max(10, position.x - 100), // Центрируем лучше
              opacity: modalOpacity,
              transform: [{ translateY: modalTranslateY }],
              backgroundColor: mergedTheme.background,
              borderColor: mergedTheme.border,
              width: activeForm ? 300 : 200, // Шире для форм
            },
          ]}
        >
          {renderForm()}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: "transparent" 
  },
  container: {
    position: "absolute",
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: '90%',
  },
  item: { 
    paddingVertical: 12, 
    paddingHorizontal: 16 
  },
  itemText: { 
    fontSize: 16 
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#16DBBE',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
});

export default ActionModal2;
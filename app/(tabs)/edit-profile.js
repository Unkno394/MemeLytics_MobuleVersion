import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from "../../src/context/ThemeContext";
import { router } from 'expo-router';
import { EmojiText } from "../../components/Twemoji";

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

// ===== Кастомный TextInput с Twemoji КАК В [id].js =====
const EmojiTextInput = ({ value, onChangeText, placeholder, style, theme }) => {
  const localStyles = StyleSheet.create({
    textInputContainer: {
      flex: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 50,
      justifyContent: 'center',
      backgroundColor: theme.input?.backgroundColor || theme.inputBackground,
    },
    textInputContent: {
      fontSize: 16,
      lineHeight: 20,
    },
    hiddenInput: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0,
      fontSize: 16,
    },
  });

  return (
    <View style={[localStyles.textInputContainer, style]}>
      {/* Всегда отображаем Twemoji */}
      {value ? (
        <EmojiText 
          text={value} 
          style={[
            localStyles.textInputContent,
            { 
              color: theme.inputText || theme.text,
            }
          ]} 
        />
      ) : (
        // Показываем placeholder когда пусто
        <Text style={[localStyles.textInputContent, { color: theme.inputPlaceholder || "#999" }]}>
          {placeholder}
        </Text>
      )}
      
      {/* Прозрачный TextInput для ввода */}
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

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [avatar, setAvatar] = useState(require("../../src/assets/cool_avatar.jpg"));
  const [username, setUsername] = useState("User123");
  const [email, setEmail] = useState("user@mail.com");
  const [password, setPassword] = useState("");
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifMemes, setNotifMemes] = useState(false);
  const [privacyMessages, setPrivacyMessages] = useState("all");
  const [privacyMemes, setPrivacyMemes] = useState("all");

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar({ uri: result.assets[0].uri });
    }
  };

  // --- Темы ---
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
      };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon color={isDark ? "#16DBBE" : "#16A085"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Изменить профиль
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* --- Основное --- */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.accent },
          ]}
        >
          Основное
        </Text>

        <View style={styles.avatarWrapper}>
          <Image source={avatar} style={styles.avatar} />
          <TouchableOpacity
            style={[styles.changeAvatarBtn, { backgroundColor: theme.option }]}
            onPress={pickImage}
          >
            <Text
              style={[
                styles.changeAvatarText,
                { color: theme.accent },
              ]}
            >
              Сменить аватарку
            </Text>
          </TouchableOpacity>
        </View>

        {/* Кастомный инпут для никнейма с эмодзи */}
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
          <EmojiTextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Никнейм"
            theme={theme}
          />
        </View>

        {/* Обычный инпут для email */}
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.inputBackground,
            color: theme.inputText 
          }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.inputPlaceholder}
        />

        {/* Обычный инпут для пароля */}
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.inputBackground,
            color: theme.inputText 
          }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Новый пароль"
          placeholderTextColor={theme.inputPlaceholder}
          secureTextEntry
        />

        {/* --- Настройки приложения --- */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.accent },
          ]}
        >
          Настройки приложения
        </Text>

        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>Тёмная тема</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? "#16DBBE" : "#ccc"}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>
            Уведомления о лайках
          </Text>
          <Switch
            value={notifLikes}
            onValueChange={setNotifLikes}
            thumbColor={notifLikes ? "#16DBBE" : "#ccc"}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>
            Уведомления о сообщениях
          </Text>
          <Switch
            value={notifMessages}
            onValueChange={setNotifMessages}
            thumbColor={notifMessages ? "#16DBBE" : "#ccc"}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>
            Уведомления о мемах друзей
          </Text>
          <Switch
            value={notifMemes}
            onValueChange={setNotifMemes}
            thumbColor={notifMemes ? "#16DBBE" : "#ccc"}
          />
        </View>

        {/* --- Мои мемы --- */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Мои мемы</Text>
        <TouchableOpacity style={[styles.buttonSecondary, { backgroundColor: theme.option }]}>
          <Text style={[styles.buttonSecondaryText, { color: theme.text }]}>
            Управлять мемами
          </Text>
        </TouchableOpacity>

        {/* --- Приватность --- */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Приватность</Text>
        <Text style={[styles.labelSmall, { color: theme.secondaryText }]}>
          Кто может писать мне сообщения
        </Text>
        <View style={styles.rowOptions}>
          {["all", "friends", "none"].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.option,
                { backgroundColor: theme.option },
                privacyMessages === opt && styles.optionActive,
              ]}
              onPress={() => setPrivacyMessages(opt)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.secondaryText },
                  privacyMessages === opt && styles.optionTextActive,
                ]}
              >
                {opt === "all" ? "Все" : opt === "friends" ? "Друзья" : "Никто"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.labelSmall, { color: theme.secondaryText }]}>
          Кто видит мои мемы
        </Text>
        <View style={styles.rowOptions}>
          {["all", "friends", "me"].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.option,
                { backgroundColor: theme.option },
                privacyMemes === opt && styles.optionActive,
              ]}
              onPress={() => setPrivacyMemes(opt)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.secondaryText },
                  privacyMemes === opt && styles.optionTextActive,
                ]}
              >
                {opt === "all"
                  ? "Все"
                  : opt === "friends"
                  ? "Друзья"
                  : "Только я"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.button }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.saveButtonText, { color: isDark ? "#0F111E" : "#FFFFFF" }]}>
            Сохранить изменения
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: { padding: 16, paddingBottom: 50 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  avatarWrapper: { alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#16DBBE",
    marginBottom: 8,
  },
  changeAvatarBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  changeAvatarText: { fontSize: 12 },
  inputContainer: {
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  label: { fontSize: 14 },
  labelSmall: { fontSize: 13, marginBottom: 6 },
  rowOptions: { flexDirection: "row", marginBottom: 10 },
  option: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  optionActive: { backgroundColor: "#16DBBE" },
  optionText: {
    fontSize: 12,
  },
  optionTextActive: {
    color: "#0F111E",
    fontWeight: "600",
    fontSize: 12,
  },
  buttonSecondary: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  buttonSecondaryText: { fontWeight: "600" },
  saveButton: {
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  saveButtonText: { fontWeight: "700", fontSize: 16 },
});

export default EditProfileScreen;
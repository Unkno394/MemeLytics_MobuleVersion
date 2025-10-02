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
  const themeStyles = {
    container: {
      backgroundColor: isDark ? "#0F111E" : "#EAF0FF",
    },
    text: {
      color: isDark ? "#fff" : "#1B1F33",
    },
    secondaryText: {
      color: isDark ? "#A3B7D2" : "#64748B",
    },
    input: {
      backgroundColor: isDark ? "#1A1B30" : "#FFFFFF",
      color: isDark ? "#fff" : "#1B1F33",
    },
    button: {
      backgroundColor: isDark ? "#16DBBE" : "#1FD3B9",
    },
    option: {
      backgroundColor: isDark ? "#1A1B30" : "#D6E2F5",
    },
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon color={isDark ? "#16DBBE" : "#16A085"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, themeStyles.text]}>
          Изменить профиль
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* --- Основное --- */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#16DBBE" : "#16A085" },
          ]}
        >
          Основное
        </Text>

        <View style={styles.avatarWrapper}>
          <Image source={avatar} style={styles.avatar} />
          <TouchableOpacity
            style={[styles.changeAvatarBtn, themeStyles.option]}
            onPress={pickImage}
          >
            <Text
              style={[
                styles.changeAvatarText,
                { color: isDark ? "#16DBBE" : "#16A085" },
              ]}
            >
              Сменить аватарку
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, themeStyles.input]}
          value={username}
          onChangeText={setUsername}
          placeholder="Никнейм"
          placeholderTextColor={isDark ? "#555" : "#888"}
        />

        {/* --- Аккаунт --- */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#16DBBE" : "#16A085" },
          ]}
        >
          Аккаунт / безопасность
        </Text>

        <TextInput
          style={[styles.input, themeStyles.input]}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={isDark ? "#555" : "#888"}
        />

        <TextInput
          style={[styles.input, themeStyles.input]}
          value={password}
          onChangeText={setPassword}
          placeholder="Новый пароль"
          placeholderTextColor={isDark ? "#555" : "#888"}
          secureTextEntry
        />

        {/* --- Настройки приложения --- */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#16DBBE" : "#16A085" },
          ]}
        >
          Настройки приложения
        </Text>

        <View style={styles.row}>
          <Text style={[styles.label, themeStyles.text]}>Тёмная тема</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? "#16DBBE" : "#ccc"}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, themeStyles.text]}>
            Уведомления о лайках
          </Text>
          <Switch
            value={notifLikes}
            onValueChange={setNotifLikes}
            thumbColor={notifLikes ? "#16DBBE" : "#ccc"}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, themeStyles.text]}>
            Уведомления о сообщениях
          </Text>
          <Switch
            value={notifMessages}
            onValueChange={setNotifMessages}
            thumbColor={notifMessages ? "#16DBBE" : "#ccc"}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, themeStyles.text]}>
            Уведомления о мемах друзей
          </Text>
          <Switch
            value={notifMemes}
            onValueChange={setNotifMemes}
            thumbColor={notifMemes ? "#16DBBE" : "#ccc"}
          />
        </View>

        {/* --- Мои мемы --- */}
        <Text style={[styles.sectionTitle, themeStyles.text]}>Мои мемы</Text>
        <TouchableOpacity style={[styles.buttonSecondary, themeStyles.option]}>
          <Text style={[styles.buttonSecondaryText, themeStyles.text]}>
            Управлять мемами
          </Text>
        </TouchableOpacity>

        {/* --- Приватность --- */}
        <Text style={[styles.sectionTitle, themeStyles.text]}>Приватность</Text>
        <Text style={[styles.labelSmall, themeStyles.secondaryText]}>
          Кто может писать мне сообщения
        </Text>
        <View style={styles.rowOptions}>
          {["all", "friends", "none"].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.option,
                themeStyles.option,
                privacyMessages === opt && styles.optionActive,
              ]}
              onPress={() => setPrivacyMessages(opt)}
            >
              <Text
                style={[
                  styles.optionText,
                  privacyMessages === opt && styles.optionTextActive,
                ]}
              >
                {opt === "all" ? "Все" : opt === "friends" ? "Друзья" : "Никто"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.labelSmall, themeStyles.secondaryText]}>
          Кто видит мои мемы
        </Text>
        <View style={styles.rowOptions}>
          {["all", "friends", "me"].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.option,
                themeStyles.option,
                privacyMemes === opt && styles.optionActive,
              ]}
              onPress={() => setPrivacyMemes(opt)}
            >
              <Text
                style={[
                  styles.optionText,
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
  style={[styles.saveButton, themeStyles.button]}
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
    color: "#A3B7D2",
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
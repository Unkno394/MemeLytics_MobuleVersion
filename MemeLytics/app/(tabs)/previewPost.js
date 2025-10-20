import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemeContext } from "../../src/context/ThemeContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useCreatePost } from "../../hooks/useCreatePost";

const { width, height } = Dimensions.get("window");

/* -------------------- CustomTextInput -------------------- */
const CustomTextInput = ({ text, setText, theme }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (newText) => {
    setText(newText);
  };

  const addHashtag = (tag) => {
    const newText = text + (text ? ` ${tag}` : tag);
    setText(newText);
  };

  return (
    <View style={{ width: width * 0.9, marginTop: 25 }}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>
        Описание и хэштеги
      </Text>
      <View
        style={[
          styles.textInputContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: isFocused ? theme.accent : theme.inputPlaceholder,
          },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: theme.inputText }]}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Расскажи о своем меме... ✨"
          placeholderTextColor={theme.inputPlaceholder}
          multiline
          maxLength={500}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.inputFooter}>
        <TouchableOpacity style={styles.hashtagHint} onPress={() => addHashtag("#мем")}>
          <Icon name="tag" size={14} color={theme.accent} />
          <Text style={[styles.hashtagText, { color: theme.secondaryText }]}>
            Добавить хэштег
          </Text>
        </TouchableOpacity>
        <Text style={[styles.charCount, { color: theme.inputPlaceholder }]}>
          {text.length}/500
        </Text>
      </View>
    </View>
  );
};

/* -------------------- PreviewPost -------------------- */
const PreviewPost = () => {
  const router = useRouter();
  const { isDark } = useContext(ThemeContext);
const {
  memeUri,
  imageWidth = width * 0.85,
  imageHeight = 300,
  initialDescription = "",
  description = "", // ДОБАВЬТЕ ЭТУ СТРОКУ
} = useLocalSearchParams();

  const { creating, publishPost } = useCreatePost();

const [text, setText] = useState(description || initialDescription);
  const [calculatedHeight, setCalculatedHeight] = useState(300);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Success alert → переход на главную
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
        router.replace({ pathname: "/", params: { showSuccessAlert: "true" } });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert, router]);

  // Вычисление размеров изображения
  useEffect(() => {
    if (memeUri) {
      Image.getSize(
        memeUri,
        (imgW, imgH) => {
          const actualWidth = parseFloat(imageWidth) || width * 0.85;
          const actualHeight = parseFloat(imageHeight) || 300;
          setCalculatedHeight(Math.min(actualHeight, height * 0.6));
        },
        () => {
          const defaultHeight = parseFloat(imageHeight) || width * 0.8;
          setCalculatedHeight(Math.min(defaultHeight, height * 0.6));
        }
      );
    }
  }, [memeUri, imageWidth, imageHeight]);

const handlePublish = async () => {
  Keyboard.dismiss();
  if (!memeUri) {
    Alert.alert("Ошибка", "Изображение не найдено");
    return;
  }

  try {
    await publishPost({
      imageUri: memeUri,
      description: text, // Убедитесь, что передается текущий текст
      imageWidth: parseFloat(imageWidth) || width * 0.85,
      imageHeight: parseFloat(imageHeight) || calculatedHeight,
    });
    setShowSuccessAlert(true);
  } catch (err) {
    console.error("Ошибка публикации:", err);
  }
};

  const theme = {
    background: isDark ? "#0F111E" : "#EAF0FF",
    text: isDark ? "#FFF" : "#1B1F33",
    inputBg: isDark ? "#1A1B30" : "#FFF",
    inputText: isDark ? "#FFF" : "#000",
    inputPlaceholder: isDark ? "#666" : "#999",
    secondaryText: isDark ? "#AAA" : "#666",
    accent: "#16DBBE",
  };

  const SuccessAlert = () => (
    <View style={styles.successOverlay}>
      <View style={styles.successAlert}>
        <View style={styles.successIcon}>
          <Icon name="check-circle" size={50} color="#16DBBE" />
        </View>
        <Text style={styles.successTitle}>Успех! 🎉</Text>
        <Text style={styles.successMessage}>
          Твой мем успешно выложен и скоро появится в ленте
        </Text>
        <ActivityIndicator size="small" color="#16DBBE" style={styles.loadingIndicator} />
        <Text style={styles.redirectText}>Переходим на главную...</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {showSuccessAlert && <SuccessAlert />}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow-back" size={26} color={theme.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Предпросмотр</Text>
        <View style={styles.headerButton} />
      </View>

      {/* BODY */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height * 0.92 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Изображение */}
        <View style={[styles.imageWrapper, { height: calculatedHeight }]}>
          <Image
            source={{ uri: memeUri }}
            style={[styles.image, { height: calculatedHeight }]}
            resizeMode="contain"
          />
          <View style={styles.imageOverlay} />
        </View>

        {/* Инпут */}
        <CustomTextInput text={text} setText={setText} theme={theme} />

        {/* Популярные хэштеги */}
        <View style={styles.hashtagSuggestions}>
          <Text style={[styles.suggestionsTitle, { color: theme.secondaryText }]}>
            Популярные хэштеги:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hashtagScroll}>
{["#мем", "#юмор", "#прикол", "#смех", "#день", "#отношения", "#жизнь"].map((tag) => (
  <TouchableOpacity
    key={tag}
    style={[styles.hashtagChip, { backgroundColor: theme.inputBg }]}
    onPress={() => setText(prev => prev + (prev ? ` ${tag}` : tag))}
  >
    <Text style={[styles.hashtagChipText, { color: theme.accent }]}>{tag}</Text>
  </TouchableOpacity>
))}
          </ScrollView>
        </View>

        {/* Кнопка публикации */}
        <TouchableOpacity
          style={[
            styles.publishButton,
            creating && styles.publishButtonDisabled,
            !memeUri && styles.publishButtonDisabled,
          ]}
          onPress={handlePublish}
          disabled={creating || !memeUri}
        >
          {creating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.publishText}>Публикация...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Icon name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.publishText}>Выложить в ленту</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Информация */}
        <View style={styles.publishInfo}>
          <Icon name="info-outline" size={16} color={theme.secondaryText} />
          <Text style={[styles.publishInfoText, { color: theme.secondaryText }]}>
            Мем будет виден всем пользователям приложения
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerButton: { width: 26, height: 26, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  scrollContent: { alignItems: "center", justifyContent: "flex-start", paddingBottom: 40, paddingTop: 10 },
  imageWrapper: {
    width: width * 0.9,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B2030",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: { width: "100%", borderRadius: 16 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.02)" },
  inputLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8, textAlign: "left", width: "100%" },
  textInputContainer: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, minHeight: 120 },
  textInput: { fontSize: 16, lineHeight: 20, minHeight: 100, textAlignVertical: "top" },
  inputFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, width: "100%" },
  hashtagHint: { flexDirection: "row", alignItems: "center" },
  hashtagText: { fontSize: 12, marginLeft: 6 },
  charCount: { fontSize: 12 },
  hashtagSuggestions: { width: width * 0.9, marginTop: 20 },
  suggestionsTitle: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  hashtagScroll: { flexGrow: 0 },
  hashtagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  hashtagChipText: { fontSize: 12, fontWeight: "500" },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16DBBE",
    paddingVertical: 16,
    borderRadius: 16,
    width: width * 0.9,
    marginTop: 30,
    marginBottom: 16,
    shadowColor: "#16DBBE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  publishButtonDisabled: { backgroundColor: "#666", opacity: 0.6, shadowOpacity: 0 },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  publishText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  publishInfo: { flexDirection: "row", alignItems: "center", width: width * 0.9, marginTop: 12 },
  publishInfoText: { fontSize: 12, marginLeft: 6, flex: 1 },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 17, 30, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successAlert: {
    backgroundColor: "#1A1B30",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: width * 0.8,
    shadowColor: "#16DBBE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: { marginBottom: 16 },
  successTitle: { color: "#16DBBE", fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  successMessage: { color: "#FFFFFF", fontSize: 16, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  loadingIndicator: { marginBottom: 12 },
  redirectText: { color: "#A3B7D2", fontSize: 12 },
});

export default PreviewPost;

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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemeContext } from "../../src/context/ThemeContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { EmojiText } from "../../components/Twemoji"; // ✅ импортируем из Twemoji.js

const { width, height } = Dimensions.get("window");

const PreviewPost = () => {
  const router = useRouter();
  const { isDark } = useContext(ThemeContext);
  const { memeUri } = useLocalSearchParams();

  const [text, setText] = useState("");
  const [imageHeight, setImageHeight] = useState(300);

  // ===== вычисляем пропорции картинки =====
  useEffect(() => {
    if (memeUri) {
      Image.getSize(
        memeUri,
        (imgW, imgH) => {
          const scale = width * 0.85 / imgW;
          const newHeight = imgH * scale;
          setImageHeight(Math.min(newHeight, height * 0.5));
        },
        () => setImageHeight(width * 0.8)
      );
    }
  }, [memeUri]);

  const handlePublish = () => {
    console.log("✅ Пост выложен:", { memeUri, text });
    router.replace("/(tabs)");
  };

  const theme = {
    background: isDark ? "#0F111E" : "#EAF0FF",
    text: isDark ? "#FFF" : "#1B1F33",
    inputBg: isDark ? "#1A1B30" : "#FFF",
    inputText: isDark ? "#FFF" : "#000",
    inputPlaceholder: isDark ? "#666" : "#999",
  };

  // ===== наш EmojiTextInput (из чата) =====
  const EmojiTextInput = ({ value, onChangeText, placeholder }) => (
    <View
      style={[
        styles.textInputContainer,
        { backgroundColor: theme.inputBg, borderColor: theme.inputPlaceholder },
      ]}
    >
      {value ? (
        <EmojiText
          text={value}
          style={[styles.textInputContent, { color: theme.inputText }]}
        />
      ) : (
        <Text
          style={[styles.textInputContent, { color: theme.inputPlaceholder }]}
        >
          {placeholder}
        </Text>
      )}

      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        placeholder=""
        multiline
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={26} color="#16DBBE" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Предпросмотр
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* BODY */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height * 0.92 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Изображение */}
        <View style={[styles.imageWrapper, { height: imageHeight }]}>
          <Image
            source={{ uri: memeUri }}
            style={[styles.image, { height: imageHeight }]}
          />
        </View>

        {/* Инпут */}
        <View style={{ width: width * 0.9, marginTop: 25 }}>
          <EmojiTextInput
            value={text}
            onChangeText={setText}
            placeholder="Добавь описание и хэштеги..."
          />
        </View>

        {/* Кнопка */}
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
          <Icon name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.publishText}>Выложить</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    alignItems: "center",
    justifyContent: "center", // 💡 добавили для выравнивания ближе к центру
    paddingBottom: 60,
  },
  imageWrapper: {
    width: width * 0.9,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B2030",
  },
  image: {
    width: "100%",
    resizeMode: "cover",
    borderRadius: 14,
  },
  textInputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 80,
    justifyContent: "center",
  },
  textInputContent: {
    fontSize: 16,
    lineHeight: 20,
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16DBBE",
    paddingVertical: 12,
    borderRadius: 12,
    width: width * 0.9,
    marginTop: 30,
    marginBottom: 40,
  },
  publishText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 6,
  },
});

export default PreviewPost;

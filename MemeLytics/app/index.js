// SplashScreen.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Icon from "../assets/images/IconComponent";
import { useAuth } from "../src/context/AuthContext"; // ДОБАВИТЬ ИМПОРТ

// Создаём анимированную версию SVG
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const SplashScreen = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth(); // ДОБАВИТЬ ИСПОЛЬЗОВАНИЕ АВТОРИЗАЦИИ
  const fullText = "MemeLytics";
  const [displayedText, setDisplayedText] = useState("");
  const typingInterval = 200;

  // Ref для анимации opacity
  const iconOpacity = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  // Анимация появления иконки
  Animated.timing(iconOpacity, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();

  // Тайпинг-анимация текста
  const delayTimer = setTimeout(() => {
    let index = 0;
    const typingTimer = setInterval(() => {
      index++;
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
      } else {
        clearInterval(typingTimer);
        
        // После завершения анимации текста проверяем авторизацию
        const checkAuthAndNavigate = () => {
          if (!isLoading) {
            if (user) {
              // Если пользователь авторизован - на главный экран
              console.log("User exists, redirecting to tabs");
              router.replace("/(tabs)");
            } else {
              // Если не авторизован - на регистрацию
              console.log("No user, redirecting to registration");
              router.replace("/registration");
            }
          } else {
            // Если еще загружается, проверяем снова через 100мс
            setTimeout(checkAuthAndNavigate, 100);
          }
        };
        
        checkAuthAndNavigate();
      }
    }, typingInterval);
  }, 1500);

  return () => clearTimeout(delayTimer);
}, [user, isLoading]);

  return (
    <LinearGradient
      colors={["#00DEE8", "#77EE5F"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.4, y: 1.5 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <AnimatedIcon
          width={238}
          height={238}
          style={[styles.icon, { opacity: iconOpacity }]}
        />
        <Text style={styles.text}>{displayedText}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginBottom: 30, // Отступ между иконкой и текстом
  },
  text: {
    fontSize: 48,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Jersey15-Regular",
  },
});

export default SplashScreen;
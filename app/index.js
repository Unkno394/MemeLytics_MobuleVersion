// SplashScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Icon from "../assets/images/icon.svg";

const SplashScreen = () => {
  const router = useRouter();
  const fullText = "MemeLytics";
  const [displayedText, setDisplayedText] = useState("");
  const typingInterval = 200;

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      let index = 0;
      const typingTimer = setInterval(() => {
        index++;
        if (index <= fullText.length) {
          setDisplayedText(fullText.slice(0, index));
        } else {
          clearInterval(typingTimer);
          // Завершаем сплеш через 500ms после окончания печати
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 500);
        }
      }, typingInterval);
    }, 1500);
    
    return () => {
      clearTimeout(delayTimer);
    };
  }, []);

  return (
    <LinearGradient
      colors={["#00DEE8", "#77EE5F"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.4, y: 1.5 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Icon width={238} height={238} style={styles.icon} />
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
    marginBottom: 30, // отступ между иконкой и текстом
  },
  text: {
    fontSize: 48,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Jersey15-Regular",
  },
});

export default SplashScreen;
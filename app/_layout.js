// app/_layout.js
import 'react-native-reanimated';
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { ThemeProvider } from "../src/context/ThemeContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomAlert from '../components/CustomAlert';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync({
          "Jersey15-Regular": require("../src/assets/fonts/Jersey15-Regular.ttf"),
        });
      } catch (e) {
        console.warn("Ошибка загрузки шрифтов:", e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    loadResources();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

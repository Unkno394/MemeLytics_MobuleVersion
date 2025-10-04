import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("theme").then((value) => {
      if (value !== null) setIsDark(value === "dark");
    });
  }, []);

  const toggleTheme = (value) => {
    const newValue = value !== undefined ? value : !isDark;
    setIsDark(newValue);
    AsyncStorage.setItem("theme", newValue ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Дополнительный хук для удобства
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

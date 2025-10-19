// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Загрузка токена и пользователя при старте приложения
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.warn('Ошибка загрузки данных аутентификации:', error);
        await AsyncStorage.removeItem('userToken');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadAuthData();
  }, []);

  // -----------------------
  // Методы аутентификации
  // -----------------------
  const register = async ({ email, password, username, interests }) => {
    try {
      const data = await apiClient.register({ email, password, username, interests });
      await AsyncStorage.setItem('userToken', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  };

  const login = async ({ email, password }) => {
    try {
      const data = await apiClient.login({ email, password });
      await AsyncStorage.setItem('userToken', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Ошибка выхода:', error);
      throw error;
    }
  };

  // -----------------------
  // Методы обновления пользователя
  // -----------------------
  
  // Полное обновление данных пользователя с сервера
  const updateUserData = async () => {
    try {
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Ошибка обновления данных пользователя:', error);
      throw error;
    }
  };

  // Локальное обновление отдельных полей пользователя
  const updateUser = (updatedFields) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        ...updatedFields
      };
    });
  };

  // Обновление пользователя после операций
  const refreshUser = async () => {
    try {
      await updateUserData();
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
    }
  };

  // Проверка статуса аутентификации
  const isAuthenticated = () => {
    return !!(token && user);
  };

  return (
    <AuthContext.Provider
      value={{
        // Состояние
        user,
        token,
        loading,
        
        // Методы аутентификации
        register,
        login,
        logout,
        
        // Методы обновления пользователя
        updateUserData,
        updateUser, // ✅ ДОБАВЛЕНО
        refreshUser,
        setUser,
        
        // Вспомогательные методы
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
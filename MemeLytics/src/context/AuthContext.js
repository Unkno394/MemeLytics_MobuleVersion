// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Загрузка токена и пользователя при старте приложения
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        console.log('🔄 Загружаем данные аутентификации...');
        const storedToken = await AsyncStorage.getItem('userToken');
        
        if (storedToken) {
          console.log('✅ Токен найден в хранилище');
          setToken(storedToken);
          
          try {
            const currentUser = await apiClient.getCurrentUser();
            console.log('✅ Данные пользователя загружены:', currentUser);
            setUser(currentUser);
          } catch (userError) {
            console.error('❌ Ошибка загрузки пользователя:', userError);
            // Если не удалось загрузить пользователя, очищаем токен
            await AsyncStorage.removeItem('userToken');
            setToken(null);
            setUser(null);
          }
        } else {
          console.log('ℹ️ Токен не найден в хранилище');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки данных аутентификации:', error);
        await AsyncStorage.removeItem('userToken');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
        setIsAuthChecked(true);
        console.log('✅ Проверка аутентификации завершена');
      }
    };
    
    loadAuthData();
  }, []);

  // -----------------------
  // Методы аутентификации
  // -----------------------
  const register = async ({ email, password, username, interests }) => {
    try {
      console.log('🔄 Начинаем регистрацию...');
      const data = await apiClient.register({ email, password, username, interests });
      
      console.log('✅ Регистрация успешна, устанавливаем состояние...');
      setToken(data.access_token);
      setUser(data.user);
      
      console.log('✅ Пользователь установлен в контекст:', data.user);
      return data;
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error);
      throw error;
    }
  };

  const login = async ({ email, password }) => {
    try {
      const data = await apiClient.login({ email, password });
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
      await apiClient.logout();
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
  
  const updateUserData = async () => {
    try {
      console.log('🔄 Обновляем данные пользователя с сервера...');
      const currentUser = await apiClient.getCurrentUser();
      console.log('✅ Данные пользователя обновлены:', currentUser);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('❌ Ошибка обновления данных пользователя:', error);
      throw error;
    }
  };

  const updateUser = (updatedFields) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        ...updatedFields
      };
    });
  };

  const refreshUser = async () => {
    try {
      await updateUserData();
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
    }
  };

  // Улучшенная проверка аутентификации
  const isAuthenticated = () => {
    const authenticated = !!(token && user);
    console.log('🔐 Проверка аутентификации:', { 
      token: !!token, 
      user: !!user, 
      authenticated 
    });
    return authenticated;
  };

  return (
    <AuthContext.Provider
      value={{
        // Состояние
        user,
        token,
        loading,
        isAuthChecked,
        
        // Методы аутентификации
        register,
        login,
        logout,
        
        // Методы обновления пользователя
        updateUserData,
        updateUser,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
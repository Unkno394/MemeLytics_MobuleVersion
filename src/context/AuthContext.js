import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();


export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Здесь проверяем есть ли сохраненный пользователь
      // Например из AsyncStorage
      const savedUser = await getSavedUser();
      if (savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = (userData) => {
    setUser(userData);
    saveUser(userData);
  };

  const login = (userData) => {
    setUser(userData);
    saveUser(userData);
  };

  const logout = () => {
    setUser(null);
    clearUser();
  };

  const value = {
    user,
    isLoading,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Заглушки для хранения
const getSavedUser = async () => {
  // Пока возвращаем null - пользователь не авторизован
  return null;
};

const saveUser = async (userData) => {
  // Логика сохранения
  console.log('User saved:', userData);
};

const clearUser = async () => {
  // Логика очистки
  console.log('User cleared');
};
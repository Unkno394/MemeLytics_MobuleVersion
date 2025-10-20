import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { profileApi } from '../api/profileApi';
import { usePosts } from '../src/context/PostContext';

export const useProfile = (userId) => {
  const { user, updateUser } = useAuth();
  const { userPosts, loadUserPosts, loading: postsLoading, error: postsError } = usePosts();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const targetUserId = userId || user?.id;

  // Загрузка данных профиля (посты + информация пользователя)
  const loadProfileData = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadUserPosts(targetUserId, 'created'),
        loadUserPosts(targetUserId, 'saved')
      ]);
      
    } catch (err) {
      console.error('Ошибка загрузки данных профиля:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, loadUserPosts]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, [loadProfileData]);

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    if (targetUserId) {
      loadProfileData();
    }
  }, [targetUserId, loadProfileData]);

  // Обновление аватара
  const updateAvatar = useCallback(async (imageUri) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await profileApi.uploadAvatar(imageUri);
      
      // Обновляем в контексте
      if (updateUser) {
        updateUser({ avatar_url: response.avatar_url });
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  // Обновление username
  const updateUsername = useCallback(async (username) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await profileApi.updateUsername(username);
      
      // Обновляем в контексте
      if (updateUser) {
        updateUser({ username });
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  // Обновление email
  const updateEmail = useCallback(async (currentEmail, newEmail) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await profileApi.updateEmail(currentEmail, newEmail);
      
      // Обновляем в контексте
      if (updateUser) {
        updateUser({ email: newEmail });
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  // Обновление пароля
  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      return await profileApi.updatePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление настроек
  const updateSettings = useCallback(async (settings) => {
    try {
      setLoading(true);
      setError(null);
      return await profileApi.updateSettings(settings);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Данные постов
    memesCreated: userPosts.created || [],
    memesSaved: userPosts.saved || [],
    
    // Состояние загрузки
    isLoading: loading || postsLoading,
    refreshing,
    
    // Ошибки
    error: error || postsError,
    
    // Методы загрузки данных
    loadProfileData,
    onRefresh,
    
    // Методы обновления профиля
    updateAvatar,
    updateUsername,
    updateEmail,
    updatePassword,
    updateSettings,
    clearError
  };
};
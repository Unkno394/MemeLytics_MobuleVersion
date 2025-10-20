import { useState, useCallback } from 'react';
import { usePosts } from '../src/context/PostContext';
import { useAuth } from '../src/context/AuthContext';
import { router } from 'expo-router';
import { apiClient } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = "MEME_DRAFT_v3";

export const useCreatePost = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const { createPost } = usePosts();
  const { user } = useAuth();

  // Очистка черновика
  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.warn("Ошибка очистки черновика:", e);
    }
  }, []);

  // Создание поста
 const publishPost = async (postData) => {
  setCreating(true);
  setError(null);
  
  try {
    const formData = new FormData();
    
    // Добавляем изображение
    formData.append('image', {
      uri: postData.imageUri,
      type: 'image/jpeg',
      name: 'meme.jpg',
    });
    
    // ДОБАВЬТЕ ЭТО - передача описания
    if (postData.description && postData.description.trim() !== '') {
      formData.append('description', postData.description.trim());
    } else {
      formData.append('description', ''); // Явно передаем пустую строку
    }
    
    // Добавляем реальные размеры изображения
    if (postData.imageWidth) {
      formData.append('width', postData.imageWidth.toString());
    }
    if (postData.imageHeight) {
      formData.append('height', postData.imageHeight.toString());
    }
    
    // Добавляем заголовок (title) - если нужно
    if (postData.title) {
      formData.append('title', postData.title);
    }
    
    // Добавляем теги
    formData.append('tags', JSON.stringify([]));
    
    console.log('📤 Отправка данных:', {
      description: postData.description,
      width: postData.imageWidth,
      height: postData.imageHeight
    });
    
    const response = await apiClient.createPost(formData);
    
    // Очищаем черновик после успешной публикации
    await clearDraft();
    
    return {
      ...response,
      width: postData.imageWidth,
      height: postData.imageHeight
    };
  } catch (error) {
    setError(error.message || 'Ошибка при публикации');
    throw error;
  } finally {
    setCreating(false);
  }
};

  // Очистка ошибки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    creating,
    error,
    publishPost,
    clearError,
    clearDraft,
  };
};
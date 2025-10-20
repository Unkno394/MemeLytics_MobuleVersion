import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export const useImagePicker = () => {
  const [picking, setPicking] = useState(false);
  const [image, setImage] = useState(null); // Добавляем состояние для хранения изображения

  const pickImage = async (options = {}) => {
    try {
      setPicking(true);

      // Запрашиваем разрешения
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Нужно разрешение для доступа к галерее');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        ...options
      });

      if (!result.canceled && result.assets[0].uri) {
        const selectedImage = result.assets[0].uri;
        setImage(selectedImage); // Сохраняем изображение в состоянии
        return selectedImage;
      }
      
      return null;
    } catch (error) {
      throw error;
    } finally {
      setPicking(false);
    }
  };

  // Функция для очистки выбранного изображения
  const clearImage = () => {
    setImage(null);
  };

  return {
    picking,
    image, // Возвращаем выбранное изображение
    pickImage,
    clearImage
  };
};
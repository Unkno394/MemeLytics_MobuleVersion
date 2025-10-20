import { apiClient } from './client';

export const profileApi = {
  // Получение данных профиля
  getProfile: (userId) => apiClient.getUserProfile(userId),
  
  // Получение мемов пользователя
  getUserMemes: (userId, type = 'created') => 
    apiClient.getUserMemes(userId, type),
  
  // Обновление username
  updateUsername: (username) => 
    apiClient.updateUsername(username),
  
  // Обновление email
  updateEmail: (currentEmail, newEmail) => 
    apiClient.updateEmail(currentEmail, newEmail),
  
  // Обновление пароля
  updatePassword: (currentPassword, newPassword) => 
    apiClient.updatePassword(currentPassword, newPassword),
  
  // Загрузка аватара
  uploadAvatar: (imageUri) => 
    apiClient.uploadAvatar(imageUri),
  
  // Обновление настроек
  updateSettings: (settings) => 
    apiClient.updateSettings(settings),
  
  // Получение текущего пользователя
  getCurrentUser: () => 
    apiClient.getCurrentUser()
};

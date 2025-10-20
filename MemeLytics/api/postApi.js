import { apiClient } from './client';

export const postApi = {
  // Создание поста
  createPost: async (formData) => {
    return apiClient.request('/memes', {
      method: 'POST',
      body: formData,
    });
  },
getFeaturedMemes: () => apiClient.request('/feed/featured'),
  // Получение поста по ID
  getPost: (postId) => apiClient.request(`/memes/${postId}`),

  // Получение мемов пользователя
  getUserMemes: (userId, type = 'created') => 
    apiClient.request(`/users/${userId}/memes?type=${type}`),

  // Лайк поста (заглушка для будущей реализации)
  likePost: (postId) => 
    apiClient.request(`/memes/${postId}/like`, { method: 'POST' }),

  // Сохранение поста (заглушка для будущей реализации)
  savePost: (postId) => 
    apiClient.request(`/memes/${postId}/save`, { method: 'POST' }),
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.18:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.tokenKey = 'userToken';
  }

  // -----------------------
  // Токен
  // -----------------------
  async getToken() {
    try {
      return await AsyncStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
async getFeaturedMemes() {
  return this.request('/feed/featured');
}
  async setToken(token) {
    try {
      await AsyncStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async removeToken() {
    try {
      await AsyncStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

 translateError = (errorMessage) => {
  const errorTranslations = {
    // Auth errors
    "Invalid credentials": "Неверный email или пароль",
    "Email already registered": "Этот email уже зарегистрирован",
    "Invalid token": "Недействительный токен",
    "User not found": "Пользователь не найден",
    
    // Profile update errors
    "Username already taken": "Такой ник уже занят",
    "Current email is incorrect": "Текущий email указан неверно",
    "New email cannot be the same as current email": "Новый email не должен совпадать с текущим",
    "Email already registered": "Этот email уже используется другим пользователем",
    "Current password is incorrect": "Старый пароль указан неверно",
    "New password cannot be the same as current password": "Придумайте НОВЫЙ ПАРОЛЬ!",
    "New password must be at least 6 characters long": "Новый пароль должен содержать минимум 6 символов",
    "All fields are required": "Заполните все поля",
    
    // File errors
    "File must be an image": "Файл должен быть изображением",
    
    // Registration errors
    "Error during registration": "Ошибка при регистрации",
    "email already registered": "Этот email уже зарегистрирован", 
    "username already taken": "Этот никнейм уже занят",
    
    // Generic errors
    "Error during login": "Ошибка при входе",
    "Error updating username": "Ошибка при обновлении имени",
    "Error updating email": "Ошибка при обновлении email",
    "Error updating password": "Ошибка при обновлении пароля",
    "Error uploading avatar": "Ошибка при загрузке аватара",
    "Error updating settings": "Ошибка при обновлении настроек",
    "Internal Server Error": "Внутренняя ошибка сервера",
    "Not Found": "Ресурс не найден",
    "Unauthorized": "Не авторизован"
  };

  // Убираем лишние символы для более точного сравнения
  const cleanErrorMessage = errorMessage.replace(/[:]/g, '').trim();
  
  // Сначала ищем ТОЧНОЕ совпадение (самые конкретные ошибки)
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }

  // Затем ищем совпадение с очищенной строкой
  if (errorTranslations[cleanErrorMessage]) {
    return errorTranslations[cleanErrorMessage];
  }

  // Затем ищем частичное совпадение
  const errorMsgLower = errorMessage.toLowerCase();
  const cleanErrorMsgLower = cleanErrorMessage.toLowerCase();
  
  for (const [key, value] of Object.entries(errorTranslations)) {
    const keyLower = key.toLowerCase();
    
    // Проверяем частичное совпадение в оригинальной и очищенной строке
    if (errorMsgLower.includes(keyLower) || cleanErrorMsgLower.includes(keyLower)) {
      return value;
    }
  }

  // Если перевод не найден, возвращаем общую ошибку с оригинальным сообщением
  return `Произошла ошибка: ${errorMessage}`;
}
  // -----------------------
  // Основной запрос
  // -----------------------
async request(endpoint, options = {}) {
  const url = `${this.baseURL}${endpoint}`;
  const token = await this.getToken();

  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  if (options.body && !(options.body instanceof FormData)) {
    console.log('📦 Request body:', options.body);
  }

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log(`📥 API Response: ${response.status}`, data);

    if (!response.ok) {
      // Если 401, очищаем токен
      if (response.status === 401) {
        await this.removeToken();
      }

      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // Улучшенная обработка различных форматов ошибок
      if (data && data.detail) {
        errorMessage = data.detail;
      } else if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.error) {
        errorMessage = data.error;
      } else if (typeof data === 'string' && data) {
        errorMessage = data;
      } else if (data && typeof data === 'object') {
        // Попробуем найти любую строку с ошибкой в объекте
        const errorString = JSON.stringify(data);
        if (errorString.includes('error') || errorString.includes('Error')) {
          errorMessage = errorString;
        }
      }

      console.error(`❌ API Error [${response.status}]:`, errorMessage);
      
      // Переводим ошибку на русский
      const translatedError = this.translateError(errorMessage);
      throw new Error(translatedError);
    }

    return data;
  } catch (error) {
    console.error('❌ API Request failed:', error);
    
    // Если ошибка уже переведена, просто пробрасываем её
    if (error.message && this.translateError(error.message) !== error.message) {
      throw error;
    }
    
    // Переводим оригинальную ошибку
    const translatedError = this.translateError(error.message);
    throw new Error(translatedError);
  }
}

  // -----------------------
  // Auth & User
  // -----------------------
  async login({ email, password }) {
    const data = await this.request('/login', { method: 'POST', body: { email, password } });
    if (data.access_token) {
      await this.setToken(data.access_token);
    }
    return data;
  }

  async register({ email, password, username, interests = [] }) {
    const data = await this.request('/register', { method: 'POST', body: { email, password, username, interests } });
    if (data.access_token) {
      await this.setToken(data.access_token);
    }
    return data;
  }

  async logout() {
    await this.removeToken();
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  async getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  async getUserMemes(userId, type = 'created') {
    return this.request(`/users/${userId}/memes?type=${type}`);
  }

  // -----------------------
  // Profile updates
  // -----------------------
  async updateUsername(username) {
    return this.request('/users/update-username', { method: 'PUT', body: { username } });
  }

  async updateEmail(currentEmail, newEmail) {
    return this.request('/users/update-email', { method: 'PUT', body: { currentEmail, newEmail } });
  }

  async updatePassword(currentPassword, newPassword) {
    return this.request('/users/update-password', { method: 'PUT', body: { currentPassword, newPassword } });
  }

  async uploadAvatar(imageUri) {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const fileExtension = filename.split('.').pop() || 'jpg';

    formData.append('avatar', {
      uri: imageUri,
      type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
      name: `avatar.${fileExtension}`,
    });

    const data = await this.request('/users/upload-avatar', { method: 'POST', body: formData });

    if (data.avatar_url && !data.avatar_url.startsWith('http')) {
      data.avatar_url = `${this.baseURL}${data.avatar_url}`;
    }

    return data;
  }

  async updateSettings(settings) {
    return this.request('/users/settings', { method: 'PUT', body: settings });
  }

  // -----------------------
  // Post methods
  // -----------------------
async createPost(formData) {
  return this.request('/memes', { 
    method: 'POST', 
    body: formData 
  });
}

  async getPost(postId) {
    return this.request(`/memes/${postId}`);
  }
}

export const apiClient = new ApiClient();
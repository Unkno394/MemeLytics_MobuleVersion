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

  // -----------------------
  // Основной запрос
  // -----------------------
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();

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

      if (!response.ok) {
        // Если 401, очищаем токен
        if (response.status === 401) {
          await this.removeToken();
        }

        let errorMessage = `HTTP error! status: ${response.status}`;
        if (data && data.detail) errorMessage = data.detail;
        else if (data && typeof data === 'object') errorMessage = data.message || JSON.stringify(data);
        else if (typeof data === 'string') errorMessage = data;

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
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
}

export const apiClient = new ApiClient();

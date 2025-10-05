# MemePinterest - Социальная сеть для мемов 🎭

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.72-blue?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-49-black?style=for-the-badge&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
</div>

## 🎯 О проекте

MemePinterest - это современное мобильное приложение для создания, редактирования и распространения мемов. Платформа сочетает в себе удобство Pinterest с мощным редактором мемов, предлагая уникальный опыт для креативных пользователей.

## ✨ Особенности

### 🎨 **Редактор мемов**
- 📝 **Текст с поддержкой emoji** - Twemoji рендеринг
- 🎨 **Рисование** - Кисти, маркеры, стрелки
- 🎛️ **Фильтры** - Градации серого, сепия, инвертирование и другие
- 🖌️ **Пипетка** - Выбор цвета из изображения
- 📐 **Трансформации** - Масштаб, поворот, перемещение

### 🏠 **Основные экраны**
- **Лента** - Masonry grid с мемами
- **Поиск** - Поиск и discovery контента
- **Создание** - Мощный редактор мемов
- **Профиль** - Личный кабинет с созданными и сохраненными мемами
- **Мессенджер** - Чат с друзьями

### 🎭 **Уникальные возможности**
- 🔄 **Темная/светлая тема** - Полная поддержка смены темы
- ✨ **Анимированная навигация** - Кастомный bottom navigation
- 🏷️ **Система комментариев** - С поддержкой emoji и ответами
- 📤 **Шеринг** - Отправка мемов друзьям
- 🔔 **Уведомления** - Лайки, комментарии, подписки

## 🛠 Технологический стек

| Категория | Технологии |
|-----------|------------|
| **Фреймворк** | React Native 0.72, Expo 49 |
| **Навигация** | Expo Router (File-based routing) |
| **Стилизация** | StyleSheet, Linear Gradients |
| **Анимации** | React Native Animated, Reanimated |
| **Работа с медиа** | Expo Image Picker, Expo Media Library |
| **Иконки** | React Native SVG, @expo/vector-icons |
| **Шрифты** | Custom font loading |
| **Хранение данных** | AsyncStorage |

## 📦 Установка и запуск

### Предварительные требования
- Node.js 16+
- npm или yarn
- Expo CLI
- iOS Simulator или Android Emulator

### Шаги установки

```bash
# Клонирование репозитория
git clone https://github.com/your-username/memepinterest.git
cd memepinterest

# Установка зависимостей
npm install

# Запуск в development режиме
npx expo start

# Для конкретной платформы
npx expo start --ios
npx expo start --android
npx expo start --web
```
### Сборка для продакшена

```bash
# Сборка для Android
npx expo prebuild --platform android
npx eas build --platform android

# Сборка для iOS
npx expo prebuild --platform ios
npx eas build --platform ios
```

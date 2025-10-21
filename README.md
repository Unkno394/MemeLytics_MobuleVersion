# MemePinterest - Социальная сеть для мемов 🎭

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.72-blue?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-49-black?style=for-the-badge&logo=expo)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?style=for-the-badge&logo=fastapi)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-orange?style=for-the-badge&logo=socket.io)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red?style=for-the-badge&logo=python)

</div>

## 🎯 О проекте

MemePinterest - это современное мобильное приложение для создания, редактирования и распространения мемов. Платформа сочетает в себе удобство Pinterest с мощным редактором мемов, предлагая уникальный опыт для креативных пользователей.

## 🏗️ Архитектура проекта

Проект состоит из двух основных частей:

### 📱 **Frontend (React Native/Expo)**
- Мобильное приложение для iOS и Android
- Современный стек: React Native 0.72, Expo 49, TypeScript
- File-based routing с Expo Router
- Контекст для управления состоянием

### 🔧 **Backend (FastAPI)**
- Python FastAPI для REST API
- SQLAlchemy для работы с базой данных
- JWT аутентификация
- WebSocket сервер на Node.js для реального времени
- Загрузка и хранение медиафайлов

## ✨ Ключевые особенности

### 🔐 **Система аутентификации**
- Регистрация и вход по email/password
- JWT токены для безопасной аутентификации
- Восстановление пароля
- Верификация email

### 📸 **Создание и управление контентом**
- Загрузка мемов с поддержкой различных форматов
- Система тегов и описаний
- Автоматическое определение размеров изображений
- Алгоритм рекомендаций (каждый 5-й пост становится featured)

### 🔍 **Поиск и discovery**
- Поиск мемов по описанию и тегам
- Поиск пользователей по никнейму
- Лента рекомендованных постов
- Персональные рекомендации

### 👥 **Социальные функции**
- Лайки и взаимодействия
- Система подписчиков
- Личные сообщения в реальном времени
- Уведомления о действиях

### 🎨 **Пользовательский профиль**
- Кастомные аватары
- Настройки приватности
- Темная/светлая тема
- Управление уведомлениями

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

### 🚀 **Оптимизации**
- Виртуализация списков (FlatList, SectionList)
- Ленивая загрузка изображений
- Мемоизация тяжелых компонентов
- Дебаунсинг поиска и операций

## 🚀 Быстрый старт

### Предварительные требования
- Python 3.8+
- Node.js 16+
- SQLite (встроенная) или PostgreSQL
- Expo CLI для мобильной разработки

### Установка фронтенда

```bash
# Клонирование репозитория
git clone [https://github.com/your-username/memepinterest.git](https://github.com/Unkno394/MemeLytics_MobuleVersion.git)
cd MemeLytics_MobuleVersion

# Установка зависимостей
npm install

# Запуск в development режиме
npx expo start

# Для конкретной платформы
npx expo start --ios
npx expo start --android
npx expo start --web

# Сборка для iOS
npx expo prebuild --platform ios
npx eas build --platform ios
```
### Установка бэкенда

```bash
# Переход в директорию бэкенда
cd MemeLytics_MobuleVersion/backend

# Установка Python зависимостей
pip install -r requirements.txt

# Запуск FastAPI сервера
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# В отдельном терминале - запуск WebSocket сервера
cd socket-server
npm install
npm start
```

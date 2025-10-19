import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

// Создаем HTTP сервер
const httpServer = createServer();

// Настраиваем Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // ← временно разрешаем все
    methods: ['GET', 'POST']
  }
});

// Хранилище активных пользователей (временное, потом заменим на БД)
const activeUsers = new Map();
const userRooms = new Map();

io.on('connection', (socket) => {
  console.log('🔗 Новое подключение:', socket.id);

  // 📱 Пользователь заходит в приложение
  socket.on('user_online', (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`👤 Пользователь ${userId} онлайн`);
    
    // Уведомляем всех о новом онлайн пользователе
    socket.broadcast.emit('user_status_change', {
      userId,
      status: 'online'
    });
  });

  // 💬 Отправка сообщения
  socket.on('send_message', (data) => {
    const { chatId, message, senderId, senderName } = data;
    
    console.log(`💬 Новое сообщение в чате ${chatId}: ${message}`);
    
    // Сохраняем в "БД" (пока временно)
    const messageData = {
      id: Date.now().toString(),
      chatId,
      text: message,
      senderId,
      senderName,
      timestamp: new Date().toISOString()
    };
    
    // Отправляем всем в комнате чата
    socket.to(chatId).emit('new_message', messageData);
    // И отправителю тоже (для синхронизации)
    socket.emit('new_message', messageData);
  });

  // 🔄 Присоединение к комнате чата
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    userRooms.set(socket.id, chatId);
    console.log(`🚪 Пользователь ${socket.id} вошел в чат ${chatId}`);
  });

  // 📤 Покидание комнаты чата
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
    userRooms.delete(socket.id);
    console.log(`🚪 Пользователь ${socket.id} вышел из чата ${chatId}`);
  });

  // ❤️ Уведомление о лайке
  socket.on('send_like', (data) => {
    const { postId, userId, userName } = data;
    
    console.log(`❤️ Пользователь ${userName} лайкнул пост ${postId}`);
    
    // Здесь будем отправлять уведомление автору поста
    socket.broadcast.emit('new_like', {
      postId,
      userId,
      userName,
      timestamp: new Date().toISOString()
    });
  });

  // 🔔 Подписка на уведомления
  socket.on('subscribe_to_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`🔔 ${socket.id} подписался на уведомления пользователя ${userId}`);
  });

  // 📵 Отключение пользователя
  socket.on('disconnect', () => {
    console.log('🔌 Отключение:', socket.id);
    
    // Удаляем из активных пользователей
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        
        // Уведомляем о выходе
        socket.broadcast.emit('user_status_change', {
          userId,
          status: 'offline'
        });
        break;
      }
    }
    
    // Удаляем из комнат
    userRooms.delete(socket.id);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {  // ← слушаем на всех интерфейсах
  console.log(`🎯 WebSocket сервер запущен на порту ${PORT}`);
  console.log(`🌐 Подключение: http://192.168.1.18:${PORT}`);
});
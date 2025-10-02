import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { ThemeContext } from '../src/context/ThemeContext';

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  onClose 
}) => {
  const { isDark } = React.useContext(ThemeContext);
  
  // Состояние анимации для подъема
  const [fadeAnim] = useState(new Animated.Value(0)); // Начальное значение 0 (невидим)
  const [translateY] = useState(new Animated.Value(-200)); // Начальная позиция -200 (снаружи экрана)

  useEffect(() => {
    if (visible) {
      // Анимация появления
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0, // Позиция на экране (вверх, около челки)
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Анимация скрытия
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -200, // Возвращаем за экран
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (onClose) onClose();  // Закрытие с помощью переданной функции
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <Animated.View
            style={[ 
              styles.alertContainer,
              { 
                backgroundColor: isDark ? '#1B2030' : '#fff', 
                opacity: fadeAnim, 
                transform: [{ translateY }] 
              }
            ]}
          >
            <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
              {title}
            </Text>
            <Text style={[styles.message, { color: isDark ? '#ccc' : '#666' }]}>
              {message}
            </Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Полупрозрачный фон
    justifyContent: 'flex-start', // Это важно для того, чтобы алерт располагался сверху
    alignItems: 'center',
    paddingTop: 50, // Отступ сверху (в районе челки)
    paddingLeft: 20,
    paddingRight: 20,
  },
  alertContainer: {
    width: '90%', // Ширина алерта
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center', // Центрируем содержимое
    marginTop: 10, // Это позволит выстраивать алерты друг за другом
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});

export default CustomAlert;

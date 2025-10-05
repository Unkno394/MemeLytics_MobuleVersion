import React, { useEffect, useState } from 'react'; 
import { View, Text, Modal, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../src/context/ThemeContext';

const CustomAlert = ({ 
  visible, 
  title, 
  message, 
  buttons = [], // Массив кнопок: [{ text: 'OK', onPress: () => {} }]
  onClose 
}) => {
  const { isDark } = React.useContext(ThemeContext);
  
  // Состояние анимации для подъема
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-200));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  // Если кнопок нет - закрываем по тапу
  const handleOverlayPress = () => {
    if (buttons.length === 0) {
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
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
            
            {/* Кнопки только если они есть */}
            {buttons.length > 0 && (
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      index === 0 && styles.primaryButton,
                      { 
                        backgroundColor: index === 0 ? '#16DBBE' : 'transparent',
                        borderColor: isDark ? '#444' : '#ddd'
                      }
                    ]}
                    onPress={() => {
                      button.onPress?.();
                      handleClose();
                    }}
                  >
                    <Text style={[
                      styles.buttonText,
                      { 
                        color: index === 0 ? '#fff' : (isDark ? '#16DBBE' : '#16A085')
                      }
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    paddingLeft: 20,
    paddingRight: 20,
  },
  alertContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    marginTop: 10,
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;
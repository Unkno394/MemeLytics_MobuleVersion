// components/ActionModal.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const ActionModal = ({
  visible,
  onClose,
  position = { x: 0, y: 0 },
  items = [],
  theme = {},
}) => {
  const modalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const modalTranslateY = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const modalOpacity = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const defaultTheme = {
    background: '#FFFFFF',
    text: '#1B1F33',
    border: '#E5E5E5',
    danger: '#FF3B30',
  };

  const mergedTheme = { ...defaultTheme, ...theme };

  const styles = StyleSheet.create({
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    modalContainer: {
      position: 'absolute',
      width: 200,
      backgroundColor: mergedTheme.background,
      borderRadius: 12,
      paddingVertical: 4, // Уменьшил отступы
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 1,
      borderColor: mergedTheme.border,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10, // Уменьшил вертикальные отступы
    },
    modalItemText: {
      fontSize: 16,
      color: mergedTheme.text,
      marginLeft: 12,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              top: position.y,
              left: position.x,
              opacity: modalOpacity,
              transform: [{ translateY: modalTranslateY }],
            }
          ]}
        >
          {items.map((item, index) => (
            <TouchableOpacity 
              key={item.id || index}
              style={styles.modalItem} 
              onPress={() => {
                item.onPress?.();
                onClose();
              }}
              disabled={item.disabled}
            >
              <Feather 
                name={item.icon} 
                size={20} 
                color={item.danger ? mergedTheme.danger : mergedTheme.text} 
              />
              <Text style={[
                styles.modalItemText,
                item.danger && { color: mergedTheme.danger },
                item.disabled && { opacity: 0.5 }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ActionModal;
// src/components/GlobalText.js
import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';

// Кастомный Text компонент
export const Text = ({ style, children, ...props }) => {
  return (
    <RNText style={[styles.defaultText, style]} {...props}>
      {children}
    </RNText>
  );
};

// Кастомный TextInput компонент
export const TextInput = ({ style, ...props }) => {
  return (
    <RNTextInput style={[styles.defaultText, style]} {...props} />
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'RussoOne-Regular',
  },
});
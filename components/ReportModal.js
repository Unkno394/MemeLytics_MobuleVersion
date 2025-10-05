// components/ReportModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const ReportModal = ({ visible, onClose, onSubmit, theme = {} }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [comment, setComment] = useState('');

  const reportReasons = [
    { id: 'spam', label: 'Спам', icon: 'alert-octagon' },
    { id: 'nudity', label: 'Непристойное содержание', icon: 'eye-off' },
    { id: 'violence', label: 'Насилие', icon: 'alert-triangle' },
    { id: 'harassment', label: 'Травля', icon: 'user-x' },
    { id: 'false_info', label: 'Ложная информация', icon: 'alert-circle' },
    { id: 'copyright', label: 'Нарушение авторских прав', icon: 'copy' },
    { id: 'other', label: 'Другое', icon: 'more-horizontal' },
  ];

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason, comment);
    setSelectedReason('');
    setComment('');
  };

  const defaultTheme = {
    background: '#FFFFFF',
    text: '#1B1F33',
    border: '#E5E5E5',
    danger: '#FF3B30',
    primary: '#16DBBE',
  };

  const mergedTheme = { ...defaultTheme, ...theme };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: mergedTheme.background,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
modalHeader: {
  alignItems: 'center',
  marginBottom: 20,
  paddingTop: 8,
  borderBottomWidth: 1,
  borderBottomColor: mergedTheme.border,
},
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: mergedTheme.text,
    },
    reasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: mergedTheme.border,
    },
    reasonItemSelected: {
      backgroundColor: `${mergedTheme.primary}20`,
      borderColor: mergedTheme.primary,
    },
    reasonIcon: {
      marginRight: 12,
    },
    reasonText: {
      fontSize: 16,
      color: mergedTheme.text,
      flex: 1,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: mergedTheme.border,
      borderRadius: 8,
      padding: 12,
      marginTop: 15,
      marginBottom: 20,
      minHeight: 80,
      textAlignVertical: 'top',
      color: mergedTheme.text,
      backgroundColor: mergedTheme.background,
    },
    submitButton: {
      backgroundColor: mergedTheme.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: `${mergedTheme.primary}80`,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
closeButtonWrapper: {
  position: 'absolute',
  right: -25,
  top: -25, // крестик над заголовком примерно на 20px
  padding: 8,
},

  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
<View style={styles.modalHeader}>
  <TouchableOpacity onPress={onClose} style={styles.closeButtonWrapper}>
    <Feather name="x" size={24} color='#16DBBE' />
  </TouchableOpacity>
  <Text style={styles.modalTitle}>Пожаловаться на публикацию</Text>
</View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ color: mergedTheme.text, marginBottom: 15 }}>
              Выберите причину жалобы:
            </Text>

            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.id && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <Feather
                  name={reason.icon}
                  size={20}
                  color={selectedReason === reason.id ? mergedTheme.primary : mergedTheme.text}
                  style={styles.reasonIcon}
                />
                <Text style={styles.reasonText}>{reason.label}</Text>
                <Feather
                  name={selectedReason === reason.id ? "check-circle" : "circle"}
                  size={20}
                  color={selectedReason === reason.id ? mergedTheme.primary : mergedTheme.border}
                />
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.commentInput}
              placeholder="Дополнительный комментарий (необязательно)"
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                !selectedReason && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason}
            >
              <Text style={styles.submitButtonText}>Отправить жалобу</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReportModal;
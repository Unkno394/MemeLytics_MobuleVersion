// components/StickerModal.js
import React, { useState, useMemo, useContext } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Dimensions,
} from "react-native";
import { ThemeContext } from "../src/context/ThemeContext";
import { Twemoji } from "./Twemoji";
import emojis from "unicode-emoji-json";

const { width, height } = Dimensions.get("window");

const UNSUPPORTED_EMOJIS = new Set([
  '🫨', '🫷', '🫸', '🩷', '🩵', '🩶', '🫩'
]);

const StickerModal = ({ visible, onClose, onSelectEmoji, onSelectSticker }) => {
  const { isDark } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("emojis");

// Подготовка данных эмодзи
const emojiCategories = useMemo(() => {
  // Фильтруем только точно неподдерживаемые эмодзи
  const filteredEmojis = Object.entries(emojis).filter(([emoji]) => 
    !UNSUPPORTED_EMOJIS.has(emoji)
  );

  // Группируем по категориям
  const grouped = filteredEmojis.reduce((acc, [emoji, info]) => {
    const { group } = info;
    if (!acc[group]) acc[group] = [];
    acc[group].push(emoji);
    return acc;
  }, {});

  // Разбиваем на строки по 7 эмодзи для SectionList
  return Object.entries(grouped).map(([title, data]) => ({ 
    title, 
    data: Array.from({ length: Math.ceil(data.length / 7) }, (_, i) =>
      data.slice(i * 7, i * 7 + 7)
    )
  }));
}, []);

  // Полупрозрачные темы
  const theme = {
    // Для темной темы
    modalBackground: isDark ? 'rgba(30, 30, 40, 0.8)' : 'rgba(250, 250, 255, 0.8)',
    headerBackground: isDark ? 'rgba(30, 30, 40, 0.8)' : 'rgba(250, 250, 255, 0.8)',
    contentBackground: isDark ? 'rgba(30, 30, 40, 0.7)' : 'rgba(250, 250, 255, 0.7)',
    tabBackground: isDark ? 'rgba(30, 30, 40, 0.7)' : 'rgba(250, 250, 255, 0.7)',
    text: isDark ? "#FFF" : "#000",
    tabActive: "#16DBBE",
    tabInactive: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
    border: isDark ? "rgba(22, 219, 190, 0.3)" : "rgba(22, 219, 190, 0.2)",
  };

  const renderEmojiItem = ({ item }) => (
    <View style={styles.emojiRow}>
      {item.map((emoji, i) => (
        <TouchableOpacity
          key={i}
          style={styles.emojiItem}
          onPress={() => {
            onSelectEmoji(emoji);
            onClose();
          }}
        >
          <Twemoji emoji={emoji} size={24} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={[styles.sectionHeader, { color: theme.text }]}>
      {title}
    </Text>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
          
          {/* Заголовок */}
          <View style={[styles.header, { 
            borderBottomColor: theme.border,
            backgroundColor: theme.headerBackground 
          }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Стикеры и эмодзи
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.tabActive }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Табы */}
          <View style={[styles.tabContainer, { 
            borderBottomColor: theme.border,
            backgroundColor: theme.tabBackground 
          }]}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === "emojis" && [styles.activeTab, { backgroundColor: theme.tabActive + '20' }]
              ]}
              onPress={() => setActiveTab("emojis")}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === "emojis" ? theme.tabActive : theme.tabInactive }
              ]}>
                Эмодзи
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === "stickers" && [styles.activeTab, { backgroundColor: theme.tabActive + '20' }]
              ]}
              onPress={() => setActiveTab("stickers")}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === "stickers" ? theme.tabActive : theme.tabInactive }
              ]}>
                Стикеры
              </Text>
            </TouchableOpacity>
          </View>

          {/* Контент */}
          <View style={[styles.content, { backgroundColor: theme.contentBackground }]}>
            {activeTab === "emojis" ? (
              <SectionList
                sections={emojiCategories}
                keyExtractor={(item, idx) => `emoji-section-${idx}`}
                renderSectionHeader={renderSectionHeader}
                renderItem={renderEmojiItem}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews
                contentContainerStyle={styles.emojiList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.stickersContainer}>
                <Text style={[styles.emptyText, { color: theme.tabInactive }]}>
                  Стикеры появятся скоро
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.tabInactive }]}>
                  Я не работаю над добавлением стикеров
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    height: '60%',
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    fontWeight: "bold",
  },
tabContainer: {
  flexDirection: "row",
  borderBottomWidth: 1,
  paddingHorizontal: 8,
  paddingTop: 8,
},
tab: {
  flex: 1,
  alignItems: "center",
  paddingVertical: 12,
  borderRadius: 10,
  marginHorizontal: 4,
  marginBottom: 8,
},
activeTab: {
  borderBottomWidth: 0,
},
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  emojiList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontWeight: "600",
    fontSize: 14,
    marginVertical: 6,
    marginLeft: 8,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  emojiItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    margin: 2,
  },
  stickersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default StickerModal;
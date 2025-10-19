// app/post-detail.js
import React, { useState, useContext, useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Text, 
  ScrollView,
  Animated,
  Modal,
  TextInput,
  FlatList,
  StatusBar,
  SafeAreaView
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ThemeContext } from "../../src/context/ThemeContext";
import Svg, { Path } from "react-native-svg";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Twemoji } from "../../components/Twemoji";
import ActionModal from "../../components/ActionModal";
import ReportModal from "../../components/ReportModal.js";
import { modalConfigs } from "../../constants/modalConfigs";
import CustomAlert from '../../components/CustomAlert';
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import CoolAvatar from "../../src/assets/cool_avatar.jpg";



const { width, height } = Dimensions.get("window");
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

// === Исправленный EmojiText (чтобы эмодзи были на одной линии с текстом) ===
const UNSUPPORTED_EMOJIS = new Set(["™️", "©️", "®️"]);

function makeCodePoints(emoji) {
  return Array.from(emoji)
    .map(char => char.codePointAt(0).toString(16))
    .join("-");
}

const EmojiText = React.memo(({ text, style }) => {
  if (!text) return null;

  const parts = Array.from(text);
  const fontSize = style?.fontSize || 16;
  const emojiSize = fontSize * 1.1; // чуть больше, как системные emoji

  return (
    <Text style={[style, { flexWrap: "nowrap" }]}>
      {parts.map((char, i) => {
        const isEmoji = /\p{Extended_Pictographic}/u.test(char);
        if (isEmoji && !UNSUPPORTED_EMOJIS.has(char)) {
          const codePoints = makeCodePoints(char);
          const uri = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/15.1.0/72x72/${codePoints}.png`;
          return (
            <Image
              key={i}
              source={{ uri }}
              style={{
                width: emojiSize,
                height: emojiSize,
                marginHorizontal: 1,
                alignSelf: "center",
                transform: [{ translateY: fontSize * 0.08 }],
              }}
            />
          );
        } else {
          return <Text key={i} style={style}>{char}</Text>;
        }
      })}
    </Text>
  );
});


const BackIcon = ({ color = "#16DBBE" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ===== Кастомный TextInput с Twemoji КАК В [id].js =====
const EmojiTextInput = ({ value, onChangeText, placeholder, style, theme }) => {
  const localStyles = StyleSheet.create({
    textInputContainer: {
      flex: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 100,
      justifyContent: 'center',
    },
    textInputContent: {
      fontSize: 16,
      lineHeight: 20,
    },
    hiddenInput: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0,
      fontSize: 16,
    },
  });

  return (
    <View style={[localStyles.textInputContainer, style]}>
      {/* Всегда отображаем Twemoji */}
      {value ? (
        <EmojiText 
          text={value} 
          style={[
            localStyles.textInputContent,
            { 
              color: theme.inputText,
            }
          ]} 
        />
      ) : (
        // Показываем placeholder когда пусто
        <Text style={[localStyles.textInputContent, { color: theme.inputPlaceholder }]}>
          {placeholder}
        </Text>
      )}
      
      {/* Прозрачный TextInput для ввода */}
      <TextInput
        style={localStyles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        placeholder=""
        multiline
      />
    </View>
  );
};

const PostDetail = () => {
  const { isDark } = useContext(ThemeContext);
  const params = useLocalSearchParams();

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [likesCount, setLikesCount] = useState(42);
  const [imageHeight, setImageHeight] = useState(200);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalConfig, setModalConfig] = useState({ items: [] });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: []
  });

  // Состояния для модалки отправки
  const [shareComment, setShareComment] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Получаем тип поста из параметров навигации
  const { postType = 'otherPost', postId, imageUri } = params;

  // Анимация сердечка
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Время последнего нажатия для двойного тапа
  const lastTap = useRef(null);
  const moreButtonRef = useRef(null);

  // Моковые пользователи для отправки
  const mockUsers = [
    { id: '1', name: 'Аня', avatar: 'https://i.pravatar.cc/150?img=1', online: true },
    { id: '2', name: 'Максим', avatar: 'https://i.pravatar.cc/150?img=2', online: true },
    { id: '3', name: 'Ира', avatar: 'https://i.pravatar.cc/150?img=3', online: false },
    { id: '4', name: 'Влад', avatar: 'https://i.pravatar.cc/150?img=4', online: true },
    { id: '5', name: 'Света', avatar: 'https://i.pravatar.cc/150?img=5', online: false },
    { id: '6', name: 'Дима', avatar: 'https://i.pravatar.cc/150?img=6', online: true },
  ];

  const theme = {
    background: isDark ? "#0F111E" : "#EAF0FF",
    text: isDark ? "#FFF" : "#1B1F33",
    border: isDark ? "#FFF" : "#C7C7CC",
    modalBg: isDark ? "#1A1B30" : "#FFFFFF",
    modalText: isDark ? "#FFFFFF" : "#1B1F33",
    modalBorder: isDark ? "#2A2B42" : "#E5E5E5",
    danger: '#FF3B30',
    primary: '#16DBBE',
    secondaryText: isDark ? "#A0A3BD" : "#6B7280",
    inputText: isDark ? "#FFF" : "#000",
    inputPlaceholder: isDark ? "#666" : "#999",
  };

  const showAlert = (title, message, buttons) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const showSuccess = (message) => {
    showAlert('Успех', message, [
      { text: 'OK', onPress: () => setAlertVisible(false) }
    ]);
  };

  const showError = (message) => {
    showAlert('Ошибка', message, [
      { text: 'OK', onPress: () => setAlertVisible(false) }
    ]);
  };

  const showConfirm = (title, message, onConfirm, onCancel) => {
    showAlert(title, message, [
      { 
        text: 'Отмена', 
        onPress: () => {
          setAlertVisible(false);
          onCancel?.();
        }
      },
      { 
        text: 'OK', 
        onPress: () => {
          setAlertVisible(false);
          onConfirm?.();
        }
      }
    ]);
  };

  const handleMorePress = () => {
    requestAnimationFrame(() => {
      if (moreButtonRef.current) {
        moreButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
          const adjustedPosition = {
            x: Math.max(10, pageX - 150),
            y: pageY + height + STATUS_BAR_HEIGHT,
          };
          
          setModalPosition(adjustedPosition);
          
          const config = modalConfigs[postType](theme, {
            onDownload: handleDownload,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onHide: handleHide,
            onReport: handleReport,
            onUnsave: handleUnsave,
          });
          
          setModalConfig(config);
          setIsModalVisible(true);
        });
      } else {
        setModalPosition({ 
          x: width - 210, 
          y: 100 + STATUS_BAR_HEIGHT
        });
        const config = modalConfigs[postType](theme, {
          onDownload: handleDownload,
          onEdit: handleEdit,
          onDelete: handleDelete,
          onHide: handleHide,
          onReport: handleReport,
          onUnsave: handleUnsave,
        });
        setModalConfig(config);
        setIsModalVisible(true);
      }
    });
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const closeReportModal = () => {
    setIsReportModalVisible(false);
  };

  const handleLike = () => {
    if (!isLiked) animateHeart();
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      showSuccess('Пост добавлен в сохраненные');
    } else {
      showSuccess('Пост удален из сохраненных');
    }
  };

  const animateHeart = () => {
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && (now - lastTap.current) < 300) {
      if (!isLiked) handleLike();
    }
    lastTap.current = now;
  };

  // Обработчики действий модального меню
  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showError('Нет разрешения на доступ к галерее');
        return;
      }

      showAlert('Сохранение', 'Скачать изображение в галерею?', [
        { 
          text: 'Отмена', 
          onPress: () => setAlertVisible(false)
        },
        { 
          text: 'Скачать', 
          onPress: async () => {
            try {
              showSuccess('Изображение скачано в галерею');
            } catch (error) {
              showError('Не удалось скачать изображение');
            }
          }
        }
      ]);
      
    } catch (error) {
      showError('Не удалось скачать изображение');
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/create',
      params: { 
        editMode: 'true',
        imageUri: imageUri || Image.resolveAssetSource(CoolAvatar).uri
      }
    });
  };

  const handleDelete = () => {
    showConfirm(
      'Удаление поста',
      'Вы точно хотите удалить этот мем?',
      () => {
        showSuccess('Пост удален');
        setTimeout(() => router.back(), 1000);
      }
    );
  };

  const handleHide = () => {
    setIsHidden(true);
    showSuccess('Пост скрыт из вашей ленты');
    setTimeout(() => router.back(), 1000);
  };

  const handleReport = () => {
    setIsReportModalVisible(true);
  };

  const handleReportSubmit = (reason, comment) => {
    console.log('Жалоба отправлена:', { reason, comment });
    showSuccess('Жалоба отправлена на рассмотрение');
    setIsReportModalVisible(false);
  };

  const handleUnsave = () => {
    setIsSaved(false);
    showSuccess('Пост удален из сохраненных');
  };

  const handleComments = () => {
    router.push({
      pathname: '/comments',
      params: { 
        postId: postId || '123',
        postImage: imageUri || Image.resolveAssetSource(CoolAvatar).uri,
        author: 'uliterallylovethis'
      }
    });
  };

  // Обработчики для модалки отправки
  const handleSend = () => {
    setIsShareModalVisible(true);
  };

  const handleShareSubmit = () => {
    if (!selectedUser) {
      showError('Выберите получателя');
      return;
    }

    console.log('Отправка поста:', {
      to: selectedUser,
      comment: shareComment,
      postId: postId,
      image: imageUri || Image.resolveAssetSource(CoolAvatar).uri
    });

    showSuccess(`Пост отправлен ${selectedUser.name}`);
    setIsShareModalVisible(false);
    setShareComment("");
    setSelectedUser(null);
  };

  const closeShareModal = () => {
    setIsShareModalVisible(false);
    setShareComment("");
    setSelectedUser(null);
  };

  // Рендер элемента пользователя
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        { 
          backgroundColor: selectedUser?.id === item.id 
            ? (isDark ? '#2A2B42' : '#F0F0F0') 
            : 'transparent' 
        }
      ]}
      onPress={() => setSelectedUser(item)}
    >
      <View style={styles.userAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
      {selectedUser?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Text style={{ color: '#16DBBE', fontSize: 16 }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  useEffect(() => {
    const source = Image.resolveAssetSource(CoolAvatar);
    Image.getSize(
      source.uri,
      (imgWidth, imgHeight) => {
        const scaleFactor = width * 0.95 / imgWidth;
        setImageHeight(imgHeight * scaleFactor);
      },
      (error) => {
        console.log("Ошибка при получении размеров изображения", error);
      }
    );
  }, []);

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? "rgba(15,17,30,0.85)" : "rgba(255,255,255,0.85)",
      marginHorizontal: 8,
      marginBottom: 10,
      marginTop: 10,
    },
    leftGroup: { flexDirection: "row", alignItems: "center" },
    rightGroup: { flexDirection: "row", alignItems: "center" },
    iconBtn: { marginLeft: 32 },
    imageWrapper: {
      alignItems: "center",
      width: width * 0.95,
      justifyContent: "center",
    },
    image: {
      width: "100%",
      height: imageHeight,
      borderRadius: 12,
      resizeMode: "cover",
    },
    descriptionWrapper: {
      padding: 16,
      width: width * 0.95,
    },
commentSection: {
  marginBottom: 10,
},

popularEmojiRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 6,
  paddingHorizontal: 8,
  gap: 10,
},

emojiButton: {
  padding: 4,
},

    descriptionText: {
      color: theme.text,
      fontSize: 15,
      marginBottom: 8,
    },
    authorText: {
      color: theme.text,
      fontSize: 13,
      opacity: 0.7,
    },
    button: {
      backgroundColor: '#16DBBE',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    shareModal: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: height * 0.8,
      backgroundColor: theme.modalBg,
      paddingBottom: 20 + STATUS_BAR_HEIGHT,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingTop: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    usersList: {
      maxHeight: 200,
      marginBottom: 20,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    userAvatarContainer: {
      position: 'relative',
      marginRight: 12,
    },
    userAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4CAF50',
      borderWidth: 2,
      borderColor: theme.modalBg,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
    },
    selectedIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(22, 219, 190, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    commentInputContainer: {
      marginBottom: 20,
      borderWidth: 1,
      borderRadius: 12,
      borderColor: theme.border,
      backgroundColor: isDark ? '#2A2B40' : '#F5F5F5',
      minHeight: 80,
    },
    sendButton: {
      backgroundColor: '#16DBBE',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 10,
    },
    sendButtonDisabled: {
      backgroundColor: '#CCCCCC',
    },
    sendButtonText: {
      color: '#FFF',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  if (isHidden) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={theme.background} 
        />
        <Text style={{ color: theme.text, fontSize: 16 }}>
          Этот пост скрыт из вашей ленты
        </Text>
        <TouchableOpacity 
          style={[styles.button, { marginTop: 20 }]}
          onPress={() => setIsHidden(false)}
        >
          <Text style={styles.buttonText}>Восстановить пост</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.leftGroup}>
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon color='#16DBBE'/>
            </TouchableOpacity>
          </View>

          <View style={styles.rightGroup}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleLike}>
              <MaterialCommunityIcons
                name={isLiked ? "heart" : "heart-outline"}
                size={26}
                color={isLiked ? "#FF2D55" : theme.text}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={handleComments}>
              <Feather name="message-circle" size={24} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={handleSend}>
              <Feather name="send" size={24} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              ref={moreButtonRef}
              style={styles.iconBtn} 
              onPress={handleMorePress}
            >
              <Feather name="more-horizontal" size={24} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={handleSave}>
              <MaterialCommunityIcons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={26}
                color={isSaved ? "#16DBBE" : theme.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ alignItems: "center" }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleDoubleTap}
            style={styles.imageWrapper}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <Image source={CoolAvatar} style={styles.image} />
            )}

            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: [
                    { translateX: -50 },
                    { translateY: -50 },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons
                name="heart"
                size={100}
                color="#FF2D55"
              />
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.descriptionWrapper}>
            <EmojiText 
              text="✨Очень крутой дизайн ногтей в стиле chrome + стразы!"
              style={[styles.descriptionText, { color: theme.text }]}
            />
            <Text style={[styles.authorText, { color: theme.secondaryText }]}>Выложил: uliterallylovethis</Text>
          </View>
        </ScrollView>

        <ActionModal
          visible={isModalVisible}
          onClose={closeModal}
          position={modalPosition}
          items={modalConfig.items}
          theme={modalConfig.theme}
        />

        <ReportModal
          visible={isReportModalVisible}
          onClose={closeReportModal}
          onSubmit={handleReportSubmit}
          theme={theme}
        />

       <Modal
  visible={isShareModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={closeShareModal}
  statusBarTranslucent={true}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.shareModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Отправить пост</Text>
            <TouchableOpacity onPress={closeShareModal}>
              <Text style={{ color: '#16DBBE', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={mockUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.usersList}
            showsVerticalScrollIndicator={false}
          />

          {/* === БЛОК ВВОДА КОММЕНТАРИЯ === */}
          <View style={styles.commentSection}>
            <View style={styles.commentInputContainer}>
              <EmojiTextInput
                value={shareComment}
                onChangeText={setShareComment}
                placeholder="Добавьте комментарий..."
                theme={{
                  inputText: theme.text,
                  inputPlaceholder: theme.secondaryText,
                }}
              />
            </View>

            {/* === РЯД ЭМОДЗИ ПОД ИНПУТОМ === */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularEmojiRow}
            >
              {['😂', '🤣', '🥰', '😍', '😭', '😎', '🔥'].map((emoji, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setShareComment((prev) => (prev || "") + emoji)}
                  style={styles.emojiButton}
                >
                  <Twemoji emoji={emoji} size={30} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* КНОПКА ОТПРАВИТЬ */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              !selectedUser && styles.sendButtonDisabled,
            ]}
            onPress={handleShareSubmit}
            disabled={!selectedUser}
          >
            <Text style={styles.sendButtonText}>
              {selectedUser
                ? `Отправить ${selectedUser.name}`
                : "Выберите получателя"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
</Modal>


        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default PostDetail;
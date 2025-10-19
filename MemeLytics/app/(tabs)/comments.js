// app/comments.js
import React, { useContext, useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SectionList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  FlatList,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemeContext } from "../../src/context/ThemeContext";
import Svg, { Path } from "react-native-svg";
import emojis from "unicode-emoji-json";

const { width, height } = Dimensions.get("window");

// ===== ИКОНКИ =====
const BackIcon = ({ color = "#16DBBE" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendIcon = ({ color = "#16DBBE" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SmileIcon = ({ color = "#16DBBE" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const HeartIcon = ({ color = "#FF4081", filled = false, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"}>
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      stroke={color}
      strokeWidth={filled ? 0 : 2}
      fill={filled ? color : "none"}
    />
  </Svg>
);

// ===== Refresh Spinner Component (идентичный index.js) =====
const RefreshSpinner = ({ isDark, refreshing }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [refreshing]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.refreshSpinner}>
      <Animated.View 
        style={[
          styles.spinnerCircle,
          { 
            transform: [{ rotate: spin }],
            borderTopColor: isDark ? '#00DEE8' : '#00BFA6',
          }
        ]} 
      />
    </View>
  );
};

// ===== Twemoji Component (берем из chat/[id].js) =====
const getTwemojiCodePoints = (emoji) => {
  const codePoints = [];
  for (let i = 0; i < emoji.length; i++) {
    const code = emoji.codePointAt(i);
    if (code === 0x200D || code === 0xFE0F) continue;
    if (code >= 0xD800 && code <= 0xDFFF) continue;
    codePoints.push(code.toString(16).toLowerCase());
    if (code > 0xFFFF) i++;
  }
  return codePoints.join('-');
};

const UNSUPPORTED_EMOJIS = new Set(['🫨', '🫷', '🫸', '🩷', '🩵', '🩶', '🫩']);

const Twemoji = memo(({ emoji, size = 24, style }) => {
  const [error, setError] = useState(false);
  if (!emoji) return null;

  if (error) {
    // fallback на системный emoji
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }

  try {
    const codePoints = Array.from(emoji)
      .map(c => c.codePointAt(0).toString(16).toLowerCase())
      .join('-');

    const uri = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/15.1.0/72x72/${codePoints}.png`;

    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size }, style]}
        onError={() => setError(true)}
      />
    );
  } catch {
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }
});

// ===== EmojiText (универсальный) =====
const EmojiText = memo(({ text, style, numberOfLines }) => {
  if (!text) return null;

  const regex =
    /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}(?:\p{Emoji_Modifier})?|\p{Emoji}(?:\u200D\p{Emoji})+)/gu;

  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const emoji = match[0];
    const index = match.index;

    if (index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={style} numberOfLines={numberOfLines}>
          {text.slice(lastIndex, index)}
        </Text>
      );
    }

    parts.push(
      <Twemoji
        key={`emoji-${index}`}
        emoji={emoji}
        size={style?.fontSize || 16}
        style={{ marginHorizontal: 1 }}
      />
    );

    lastIndex = index + emoji.length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`} style={style} numberOfLines={numberOfLines}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
      {parts}
    </View>
  );
});


// ===== Emoji Input Component =====
const EmojiTextInput = memo(({ value, onChangeText, placeholder, style, theme }) => {
  return (
    <View style={[styles.textInputContainer, style]}>
      {value ? (
        <EmojiText 
          text={value} 
          style={[
            styles.textInputContent,
            { color: theme.inputText }
          ]} 
        />
      ) : (
        <Text style={[styles.textInputContent, { color: theme.inputPlaceholder }]}>
          {placeholder}
        </Text>
      )}
      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        placeholder=""
        multiline
        placeholderTextColor="transparent"
      />
    </View>
  );
});

// ===== Emoji List Component =====
const EmojiList = memo(({ emojiCategories, theme, onSelect }) => {
  const renderItem = useCallback(({ item }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {item.map((emoji, i) => (
        <TouchableOpacity
          key={i}
          style={{ flex: 1, alignItems: "center", marginVertical: 4 }}
          onPress={() => onSelect(emoji)}
        >
          <Twemoji emoji={emoji} size={28} />
        </TouchableOpacity>
      ))}
    </View>
  ), [onSelect]);

  const renderSectionHeader = useCallback(({ section: { title } }) => (
    <Text style={{color:theme.text, fontWeight:"600", fontSize:14, marginVertical:6}}>
      {title}
    </Text>
  ), [theme.text]);

  return (
    <SectionList
      sections={emojiCategories}
      keyExtractor={(item, idx) => `section-${idx}`}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews
      contentContainerStyle={{paddingBottom:30}}
    />
  );
});

// ===== Comment Item Component =====
const CommentItem = memo(({ comment, theme, onLike, onReply }) => {
  const [liked, setLiked] = useState(comment.liked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    onLike?.(comment.id, !liked);
  };

  return (
    <View style={[styles.commentItem, { borderBottomColor: theme.border }]}>
      <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
      
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUsername, { color: theme.text }]}>
            {comment.username}
          </Text>
          <Text style={[styles.commentTime, { color: theme.secondaryText }]}>
            {comment.time}
          </Text>
        </View>
        
        <EmojiText 
          text={comment.text} 
          style={[styles.commentText, { color: theme.text }]}
          numberOfLines={10}
        />
        
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction} onPress={handleLike}>
            <HeartIcon 
              color="#FF4081" 
              filled={liked} 
              size={16} 
            />
            <Text style={[styles.commentActionText, { color: theme.secondaryText }]}>
              {likesCount}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commentAction} onPress={() => onReply?.(comment)}>
            <Text style={[styles.commentActionText, { color: theme.secondaryText }]}>
              Ответить
            </Text>
          </TouchableOpacity>
        </View>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <View key={reply.id} style={styles.replyItem}>
                <Image source={{ uri: reply.avatar }} style={styles.replyAvatar} />
                <View style={styles.replyContent}>
                  <View style={styles.replyHeader}>
                    <Text style={[styles.replyUsername, { color: theme.text }]}>
                      {reply.username}
                    </Text>
                    <Text style={[styles.replyTime, { color: theme.secondaryText }]}>
                      {reply.time}
                    </Text>
                  </View>
                  <EmojiText 
                    text={reply.text} 
                    style={[styles.replyText, { color: theme.text }]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

const CommentsScreen = () => {
  const { isDark } = useContext(ThemeContext);
  const params = useLocalSearchParams();
  const { postId, postImage, author } = params;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef();

  // Mock data - в реальном приложении будет загрузка из API
  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = useCallback(() => {
    const mockComments = [
      {
        id: "1",
        username: "аня_дизайн",
        avatar: "https://i.pravatar.cc/150?img=1",
        text: "Это просто невероятно! 😍 Какой крутой дизайн! ✨",
        time: "2 мин назад",
        likesCount: 24,
        liked: false,
        replies: [
          {
            id: "r1",
            username: "uliterallylovethis",
            avatar: "https://i.pravatar.cc/150?img=5",
            text: "Спасибо! ❤️ Делала в салоне на Арбате 🎉",
            time: "1 мин назад",
            likesCount: 3
          }
        ]
      },
      {
        id: "2",
        username: "максим_стиль",
        avatar: "https://i.pravatar.cc/150?img=2",
        text: "Выглядит потрясающе! 🔥 Где делали? 🤔",
        time: "5 мин назад",
        likesCount: 15,
        liked: true
      },
      {
        id: "3",
        username: "светлана_ногти",
        avatar: "https://i.pravatar.cc/150?img=3",
        text: "Обожаю хромовые покрытия! 💅 Так стильно смотрится ✨",
        time: "10 мин назад",
        likesCount: 8,
        liked: false
      },
      {
        id: "4",
        username: "дима_арт",
        avatar: "https://i.pravatar.cc/150?img=4",
        text: "Надо будет показать жене! 👀 Она обожает такие дизайны 🎨",
        time: "15 мин назад",
        likesCount: 12,
        liked: false
      }
    ];
    setComments(mockComments);
  }, []);

  // Emoji categories (такие же как в чате)
  const emojiCategories = useMemo(() => {
  const grouped = Object.entries(emojis).reduce((acc, [emoji, info]) => {
    const { group } = info;
    if (!acc[group]) acc[group] = [];
    acc[group].push(emoji);
    return acc;
  }, {});

  return Object.entries(grouped).map(([title, data]) => ({
    title,
    data: Array.from({ length: Math.ceil(data.length / 7) }, (_, i) =>
      data.slice(i * 7, i * 7 + 7)
    ),
  }));
}, []);

  // Анимация emoji панели
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showEmojiPicker ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [showEmojiPicker]);

  const panelHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.4],
  });

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadComments();
      setRefreshing(false);
    }, 1500);
  }, [loadComments]);

  const theme = isDark
    ? { 
        background: "#0F111E",
        headerBg: "#1A1B30", 
        text: "#FFF",
        secondaryText: "#A0A3BD",
        border: "#2A2B42",
        inputBackground: "#1A1B30",
        inputText: "#FFF",
        panelBackground: "#1A1B30",
        tabActive: "#16DBBE",
        tabInactive: "#666",
        inputPlaceholder: "#666",
        commentBg: "#1A1B30"
      }
    : { 
        background: "#EAF0FF",
        headerBg: "#FFFFFF",
        text: "#1B1F33",
        secondaryText: "#6B7280",
        border: "#E5E7EB",
        inputBackground: "#FFFFFF",
        inputText: "#000",
        panelBackground: "#FFFFFF",
        tabActive: "#16DBBE",
        tabInactive: "#999",
        inputPlaceholder: "#999",
        commentBg: "#FFFFFF"
      };

  const sendComment = () => {
    if (!newComment.trim()) return;

    const commentText = replyingTo 
      ? `@${replyingTo.username} ${newComment}`
      : newComment;

    const newCommentObj = {
      id: `c${Date.now()}`,
      username: "you", // текущий пользователь
      avatar: "https://i.pravatar.cc/150?img=5",
      text: commentText,
      time: "только что",
      likesCount: 0,
      liked: false
    };

    if (replyingTo) {
      // Добавляем как ответ
      setComments(prev => prev.map(comment => 
        comment.id === replyingTo.id
          ? {
              ...comment,
              replies: [...(comment.replies || []), newCommentObj]
            }
          : comment
      ));
      setReplyingTo(null);
    } else {
      // Добавляем как новый комментарий
      setComments(prev => [newCommentObj, ...prev]);
    }

    setNewComment("");
    setShowEmojiPicker(false);
    
    // Скролл к верху
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  const handleEmojiSelect = (emoji) => {
    setNewComment(prev => prev + emoji);
  };

  const handleLikeComment = (commentId, liked) => {
    // Логика лайка комментария
    console.log(`Comment ${commentId} ${liked ? 'liked' : 'unliked'}`);
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setNewComment("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const CustomRefreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
    />
  ), [refreshing, onRefresh]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon color="#16DBBE" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Комментарии
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Comments List */}
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommentItem 
            comment={item} 
            theme={theme}
            onLike={handleLikeComment}
            onReply={handleReply}
          />
        )}
        contentContainerStyle={styles.commentsList}
        showsVerticalScrollIndicator={false}
        refreshControl={CustomRefreshControl}
      />

      {/* Reply Banner */}
      {replyingTo && (
        <View style={[styles.replyBanner, { backgroundColor: theme.commentBg }]}>
          <Text style={[styles.replyBannerText, { color: theme.text }]}>
            Ответ для @{replyingTo.username}
          </Text>
          <TouchableOpacity onPress={cancelReply}>
            <Text style={{ color: "#16DBBE" }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Container */}
      <View style={[styles.inputContainer, { 
        backgroundColor: theme.inputBackground,
        borderTopColor: theme.border
      }]}>
        <TouchableOpacity 
          style={styles.emojiButton}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <SmileIcon color={showEmojiPicker ? theme.tabActive : theme.tabInactive} />
        </TouchableOpacity>

        <EmojiTextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Добавьте комментарий..."
          style={[styles.textInput, {
            backgroundColor: isDark ? "#2A2B40" : "#F5F5F5"
          }]}
          theme={theme}
        />

        <TouchableOpacity
          style={[styles.sendButton, { opacity: newComment.trim() ? 1 : 0.5 }]}
          onPress={sendComment}
          disabled={!newComment.trim()}
        >
          <SendIcon color="#16DBBE" />
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Panel */}
      <Animated.View style={[styles.emojiPanel, { 
        height: panelHeight, 
        backgroundColor: theme.panelBackground,
        borderTopColor: theme.border
      }]}>
        <EmojiList
          emojiCategories={emojiCategories}
          theme={theme}
          onSelect={handleEmojiSelect}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  commentsList: {
    paddingBottom: 20,
  },
  commentItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(22, 219, 190, 0.3)",
  },
  replyItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  replyUsername: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  replyTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  replyText: {
    fontSize: 13,
    lineHeight: 16,
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
  },
  replyBannerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  emojiButton: {
    padding: 8,
    marginRight: 8,
  },
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
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  emojiPanel: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    borderTopWidth: 1,
  },
  // Refresh Spinner Styles (идентичные index.js)
  refreshSpinner: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderRightColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  refreshContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
});

export default CommentsScreen;
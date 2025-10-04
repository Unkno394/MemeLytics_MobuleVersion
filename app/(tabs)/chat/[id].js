// app/(tabs)/chat/[id].js
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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemeContext } from "../../../src/context/ThemeContext";
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
const GifIcon = ({ color = "#16DBBE" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 8v4l2 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const StickerIcon = ({ color = "#16DBBE" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 3h4a2 2 0 012 2v4M15 3l6 6M9 3H5a2 2 0 00-2 2v4m0 0l6 6m-6-6v10a2 2 0 002 2h10a2 2 0 002-2v-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ===== Утилиты для Twemoji =====
const getTwemojiCodePoints = (emoji) => {
  const codePoints = [];
  
  for (let i = 0; i < emoji.length; i++) {
    const code = emoji.codePointAt(i);
    
    // Пропускаем ZWJ (Zero Width Joiner) и вариационные селекторы
    if (code === 0x200D || code === 0xFE0F) continue;
    
    // Пропускаем суррогатные пары
    if (code >= 0xD800 && code <= 0xDFFF) continue;
    
    codePoints.push(code.toString(16).toLowerCase());
    
    // Если это суррогатная пара, пропускаем следующий символ
    if (code > 0xFFFF) {
      i++;
    }
  }
  
  return codePoints.join('-');
};

// Список эмодзи которые не поддерживаются Twemoji (очень новые)
const UNSUPPORTED_EMOJIS = new Set([
  '🫨', '🫷', '🫸', '🩷', '🩵', '🩶', '🫩'
]);

// ===== Twemoji Image Component =====
const Twemoji = memo(({ emoji, size = 20, style }) => {
  if (!emoji) return null;

  // Проверяем поддерживается ли эмодзи
  if (UNSUPPORTED_EMOJIS.has(emoji)) {
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }

  // Для сложных эмодзи с ZWJ берем только первый компонент
  const simpleEmoji = emoji.split('\u200D')[0];
  
  try {
    const codePoints = getTwemojiCodePoints(simpleEmoji);
    
    if (!codePoints) {
      return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
    }

    const uri = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoints}.png`;

    return (
      <Image 
        source={{ uri }} 
        style={[
          { 
            width: size, 
            height: size,
          },
          style
        ]}
        onError={(e) => {
          return (
            <Text style={[style, { fontSize: size }]}>{emoji}</Text>
          );
        }}
      />
    );
  } catch (error) {
    return <Text style={[style, { fontSize: size }]}>{emoji}</Text>;
  }
});

// ===== EmojiText с Twemoji =====
const EmojiText = memo(({ text, style }) => {
  if (!text) return null;

  // Regex для всех типов эмодзи
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
    const emoji = match[0];
    const index = match.index;

    // Текст перед эмодзи
    if (index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={style}>
          {text.slice(lastIndex, index)}
        </Text>
      );
    }

    // Twemoji для эмодзи
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

  // Оставшийся текст
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`} style={style}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  if (parts.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
      {parts}
    </View>
  );
});

// ===== Emoji List с Twemoji =====
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

// ===== Кастомный TextInput с Twemoji =====
const EmojiTextInput = memo(({ value, onChangeText, placeholder, style, theme }) => {
  return (
    <View style={[styles.textInputContainer, style]}>
      {/* Всегда отображаем Twemoji */}
      {value ? (
        <EmojiText 
          text={value} 
          style={[
            styles.textInputContent,
            { 
              color: theme.inputText, // Текст белый в темной теме
            }
          ]} 
        />
      ) : (
        // Показываем placeholder когда пусто
        <Text style={[styles.textInputContent, { color: theme.inputPlaceholder }]}>
          {placeholder}
        </Text>
      )}
      
      {/* Прозрачный TextInput для ввода */}
      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        placeholder=""
        multiline
      />
    </View>
  );
});

const ChatScreen = () => {
  const { isDark } = useContext(ThemeContext);
  const { id } = useLocalSearchParams();

  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [activeTab, setActiveTab] = useState("emojis");
  const scrollRef = useRef();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showMediaPicker ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [showMediaPicker]);

  const panelHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.5],
  });

  const chatsData = [
    { 
      id: "1", 
      name: "Аня", 
      avatar: "https://i.pravatar.cc/150?img=1", 
      messages: [
        { id: "m1", text: "Привет!", fromMe: false },
        { id: "m2", text: "Привет, как дела? 😃", fromMe: true },
        { id: "m3", text: "Отлично! 🎉 А у тебя? ❤️", fromMe: false },
        { id: "m4", text: "Тоже хорошо! 👍", fromMe: true },
      ]
    }
  ];

  const emojiCategories = useMemo(() => {
    // Фильтруем эмодзи которые не работают с Twemoji
    const filteredEmojis = Object.entries(emojis).filter(([emoji]) => {
      // Исключаем эмодзи с ZWJ (сложные комбинации) и неподдерживаемые
      return !emoji.includes('\u200D') && !UNSUPPORTED_EMOJIS.has(emoji);
    });

    const grouped = filteredEmojis.reduce((acc, [emoji, info]) => {
      const { group } = info;
      if (!acc[group]) acc[group] = [];
      
      // Ограничиваем количество эмодзи в группе для производительности
      if (acc[group].length < 50) {
        acc[group].push(emoji);
      }
      return acc;
    }, {});

    return Object.entries(grouped).map(([title, data]) => ({ 
      title, 
      data: Array.from({ length: Math.ceil(data.length / 7) }, (_, i) =>
        data.slice(i * 7, i * 7 + 7)
      )
    }));
  }, []);

  const gifs = ["🎬 GIF 1", "🎬 GIF 2", "🎬 GIF 3"];

  useEffect(() => {
    const chatObj = chatsData.find(c => c.id === id);
    setChat(chatObj);
  }, [id]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMessage = { id: `m${Date.now()}`, text: message, fromMe: true };
    setChat(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    setMessage("");
    scrollToEnd();
  };

  const sendEmoji = useCallback((emoji) => {
    setMessage(prev => prev + emoji);
  }, []);

  const sendGif = (gif) => {
    const newMessage = { id: `m${Date.now()}`, text: gif, fromMe: true };
    setChat(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    scrollToEnd();
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      if (scrollRef.current && chat?.messages?.length > 0) {
        scrollRef.current.scrollToLocation({
          animated: true,
          sectionIndex: 0,
          itemIndex: chat.messages.length - 1,
          viewPosition: 0,
        });
      }
    }, 100);
  };

  const theme = isDark
    ? { 
        background:"#0F111E", 
        text:"#FFF", 
        bubbleMe:"#17E4C7", 
        bubbleOther:"#1A1B30", 
        inputBackground:"#1A1B30", 
        inputText:"#FFF", 
        panelBackground:"#1A1B30", 
        tabActive:"#16DBBE", 
        tabInactive:"#666",
        inputPlaceholder: "#666"
      }
    : { 
        background:"#EAF0FF", 
        text:"#1B1F33", 
        bubbleMe:"#1FD3B9", 
        bubbleOther:"#FFF", 
        inputBackground:"#FFF", 
        inputText:"#000", 
        panelBackground:"#FFF", 
        tabActive:"#16DBBE", 
        tabInactive:"#999",
        inputPlaceholder: "#999"
      };

  if (!chat) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Text>Чат не найден</Text></View>;

  return (
    <KeyboardAvoidingView 
      style={[styles.container,{backgroundColor:theme.background}]} 
      behavior={Platform.OS==="ios"?"padding":"height"} 
      keyboardVerticalOffset={Platform.OS==="ios"?90:0}
    >
      {/* header */}
      <View style={[styles.header, {borderBottomColor: isDark ? "#333" : "#ccc"}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon color="#16DBBE"/>
        </TouchableOpacity>
        <Image source={{uri:chat.avatar}} style={styles.avatar}/>
        <Text style={[styles.username,{color:theme.text}]}>{chat.name}</Text>
      </View>

      {/* messages */}
      <SectionList
        ref={scrollRef}
        sections={[{ title:"messages", data: chat.messages }]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble,{
            backgroundColor:item.fromMe?theme.bubbleMe:theme.bubbleOther,
            alignSelf:item.fromMe?"flex-end":"flex-start"
          }]}>
            <EmojiText 
              text={item.text} 
              style={{
                color: item.fromMe ? "#000" : theme.text, 
                fontSize: 16,
                lineHeight: 20
              }} 
            />
          </View>
        )}
        contentContainerStyle={{padding:12,paddingBottom:10}}
        onContentSizeChange={scrollToEnd}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* input */}
      <View style={[styles.inputContainer,{
        backgroundColor:theme.inputBackground,
        borderTopColor: isDark ? "#333" : "#ccc"
      }]}>
        <TouchableOpacity 
          style={styles.mediaButton} 
          onPress={() => setShowMediaPicker(p => !p)}
        >
          <SmileIcon color={showMediaPicker ? theme.tabActive : theme.tabInactive} />
        </TouchableOpacity>
        
        <EmojiTextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Написать сообщение..."
          style={[styles.textInput,{
            backgroundColor: isDark ? "#2A2B40" : "#F5F5F5"
          }]}
          theme={theme}
        />
        
        <TouchableOpacity
          style={[styles.sendButton,{opacity:message.trim()?1:0.5}]}
          onPress={sendMessage}
          disabled={!message.trim()}
        >
          <SendIcon color="#16DBBE"/>
        </TouchableOpacity>
      </View>

      {/* панель */}
      <Animated.View style={[styles.panelContainer, { 
        height: panelHeight, 
        backgroundColor: theme.panelBackground,
        borderTopColor: isDark ? "#333" : "#ccc"
      }]}>
        {/* табы */}
        <View style={[styles.tabContainer, { 
          backgroundColor: theme.panelBackground,
          borderBottomColor: isDark ? "#333" : "#ccc"
        }]}>
          <TouchableOpacity style={styles.tab} onPress={()=>setActiveTab("emojis")}>
            <SmileIcon color={activeTab==="emojis" ? theme.tabActive : theme.tabInactive}/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={()=>setActiveTab("stickers")}>
            <StickerIcon color={activeTab==="stickers" ? theme.tabActive : theme.tabInactive}/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={()=>setActiveTab("gifs")}>
            <GifIcon color={activeTab==="gifs" ? theme.tabActive : theme.tabInactive}/>
          </TouchableOpacity>
        </View>

        {/* контент */}
        <View style={styles.mediaContent}>
          {activeTab==="emojis" && (
            <EmojiList
              emojiCategories={emojiCategories}
              theme={theme}
              onSelect={sendEmoji}
            />
          )}

          {activeTab==="stickers" && (
            <View style={{alignItems:"center",marginTop:20}}>
              <Text style={{color:theme.text}}>Стикеры пока пусто</Text>
            </View>
          )}
          {activeTab==="gifs" && (
            <SectionList
              sections={[{ title:"GIFs", data: gifs }]}
              keyExtractor={(item,idx)=>idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.gifItem, {
                    backgroundColor: isDark ? "#2A2B40" : "#F5F5F5"
                  }]} 
                  onPress={()=>sendGif(item)}
                >
                  <EmojiText 
                    text={item} 
                    style={{color:theme.text, fontSize: 16}}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:{flex:1},
  header:{
    height:70,
    flexDirection:"row",
    alignItems:"center",
    paddingHorizontal:12,
    borderBottomWidth:1
  },
  backButton:{padding:8},
  avatar:{width:40,height:40,borderRadius:20,marginHorizontal:8},
  username:{fontSize:16,fontWeight:"600"},
  messageBubble:{
    maxWidth:width*0.7,
    padding:12,
    borderRadius:20,
    marginBottom:8
  },
  inputContainer:{
    flexDirection:"row",
    alignItems:"center",
    paddingHorizontal:12,
    paddingVertical:8,
    borderTopWidth:1
  },
  mediaButton:{padding:8,marginRight:8},
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
  textInput:{
    flex:1,
    borderRadius:20,
    paddingHorizontal:16,
    paddingVertical:10,
    fontSize:16,
    maxHeight:100
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
  sendButton:{padding:8,marginLeft:8},
  panelContainer:{
    position:"absolute", 
    bottom:60, 
    width:"100%", 
    borderTopLeftRadius:16, 
    borderTopRightRadius:16, 
    overflow:"hidden",
    borderTopWidth:1
  },
  tabContainer:{
    flexDirection:"row", 
    borderBottomWidth:1
  },
  tab:{flex:1,alignItems:"center",paddingVertical:12},
  mediaContent:{flex:1, paddingHorizontal:8},
  gifItem:{
    width:(width-48)/2,
    height:80,
    justifyContent:"center",
    alignItems:"center",
    borderRadius:8,
    margin:4
  }
});

export default ChatScreen;
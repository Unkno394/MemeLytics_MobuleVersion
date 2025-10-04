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
  Animated 
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ThemeContext } from "../../src/context/ThemeContext";
import Svg, { Path } from "react-native-svg";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Импортируем наши компоненты
import ActionModal from "../../components/ActionModal";
import { modalConfigs } from "../../constants/modalConfigs";

import CoolAvatar from "../../src/assets/cool_avatar.jpg";

const { width } = Dimensions.get("window");

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

const PostDetail = () => {
  const { isDark } = useContext(ThemeContext);
  const params = useLocalSearchParams();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(42);
  const [imageHeight, setImageHeight] = useState(200);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalConfig, setModalConfig] = useState({ items: [] });

  // Получаем тип поста из параметров навигации
  const { postType = 'otherPost', postId, imageUri } = params;

  // Анимация сердечка
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Время последнего нажатия для двойного тапа
  const lastTap = useRef(null);
  const moreButtonRef = useRef(null);

  const theme = {
    background: isDark ? "#0F111E" : "#EAF0FF",
    text: isDark ? "#FFF" : "#1B1F33",
    border: isDark ? "#FFF" : "#C7C7CC",
    modalBg: isDark ? "#1A1B30" : "#FFFFFF",
    modalText: isDark ? "#FFFFFF" : "#1B1F33",
    modalBorder: isDark ? "#2A2B42" : "#E5E5E5",
  };

  const handleMorePress = (event) => {
    moreButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
      setModalPosition({
        x: pageX - 100,
        y: pageY + height + 10,
      });
      
      // Устанавливаем конфиг в зависимости от типа поста из параметров
      const config = modalConfigs[postType]({
        background: theme.modalBg,
        text: theme.modalText,
        border: theme.modalBorder,
        danger: '#FF3B30',
      });
      
      setModalConfig(config);
      setIsModalVisible(true);
    });
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleLike = () => {
    if (!isLiked) animateHeart();
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
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
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      marginTop: 40,
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
    debugInfo: {
      padding: 10,
      backgroundColor: isDark ? "#1A1B30" : "#FFFFFF",
      margin: 10,
      borderRadius: 8,
    },
    debugText: {
      color: theme.text,
      fontSize: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftGroup}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon color={theme.text} />
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

          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="message-circle" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="send" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            ref={moreButtonRef}
            style={styles.iconBtn} 
            onPress={handleMorePress}
          >
            <Feather name="more-horizontal" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bookmark" size={24} color={theme.text} />
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
          <Text style={styles.descriptionText}>
            ✨Очень крутой дизайн ногтей в стиле chrome + стразы!
          </Text>
          <Text style={styles.authorText}>Выложил: uliterallylovethis</Text>
        </View>
      </ScrollView>

      {/* Используем переиспользуемую модалку */}
      <ActionModal
        visible={isModalVisible}
        onClose={closeModal}
        position={modalPosition}
        items={modalConfig.items}
        theme={modalConfig.theme}
      />
    </View>
  );
};

export default PostDetail;
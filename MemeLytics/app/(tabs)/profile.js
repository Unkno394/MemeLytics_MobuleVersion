import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  FlatList,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { ThemeContext } from "../../src/context/ThemeContext";
import { router } from 'expo-router';
import { EmojiText } from "../../components/Twemoji";
import { useAuth } from "../../src/context/AuthContext";
import { useProfile } from "../../hooks/useProfile";

const { width, height } = Dimensions.get("window");
const STEP = 70;
const NAVIGATION_DELAY = 80;

// ------------------- ICONS -------------------
const HomeIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
  </Svg>
);

const SearchIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill={color} />
  </Svg>
);

const CubeIcon = ({ active = false }) => {
  if (active) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M11 11H6v2h5v5h2v-5h5v-2h-5V6h-2zM5 1a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4zm16 4v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2"
          fill="#000"
        />
      </Svg>
    );
  }

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Defs>
        <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#16DBBE" />
          <Stop offset="100%" stopColor="#9B8CFF" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M11 11H6v2h5v5h2v-5h5v-2h-5V6h-2zM5 1a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4zm16 4v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2"
        fill="url(#grad)"
      />
    </Svg>
  );
};

const MessageIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M20 2H4c-1.1 0-2 .9-2 2v20l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill={color} />
  </Svg>
);

const AccountIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={color} />
  </Svg>
);

const CloseIcon = ({ color = "#FFF", size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill={color} />
  </Svg>
);

// ------------------- TabItem Component -------------------
const TabItem = React.memo(({ 
  tab, 
  index, 
  isActive, 
  isDark, 
  theme, 
  onPress, 
  circleScales, 
  iconTranslates, 
  textOpacities, 
  textTranslates,
  translateX 
}) => {
  const { id, icon: IconComponent, label } = tab;
  const isRandom = id === "random";

  const activeOpacity = translateX.interpolate({
    inputRange: [(index - 0.36) * STEP, index * STEP, (index + 0.36) * STEP],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });

  const tabItemStyles = createTabItemStyles(isDark);

  return (
    <TouchableOpacity style={tabItemStyles.navItem} onPress={() => onPress(id)} activeOpacity={0.8}>
      <View style={tabItemStyles.navLink}>
        <Animated.View style={[tabItemStyles.iconWrapper, { transform: [{ translateY: iconTranslates[index] }] }]}>
          {isRandom ? <CubeIcon active={isActive} /> : <IconComponent color={theme.inactiveIcon} />}
          {!isRandom && (
            <Animated.View 
              pointerEvents="none" 
              style={{ 
                position: "absolute", 
                left: 0, 
                right: 0, 
                top: 0, 
                bottom: 0, 
                justifyContent: "center", 
                alignItems: "center", 
                opacity: activeOpacity 
              }}
            >
              <IconComponent color={theme.activeIcon} />
            </Animated.View>
          )}
        </Animated.View>

        <Animated.Text 
          style={[
            tabItemStyles.navText, 
            { 
              opacity: textOpacities[index], 
              transform: [{ translateY: textTranslates[index] }], 
              color: isDark ? "#FFFFFF" : "#1B1F33" 
            }
          ]}
        >
          {label}
        </Animated.Text>

        <Animated.View 
          pointerEvents="none" 
          style={[
            tabItemStyles.circleWrapper, 
            { 
              transform: [{ scale: circleScales[index] }], 
              opacity: circleScales[index] 
            }
          ]}
        >
          <LinearGradient 
            colors={theme.indicatorGradient} 
            start={{ x: 0.1, y: 0 }} 
            end={{ x: 0.9, y: 1 }} 
            style={tabItemStyles.circleGradient} 
          />
          <Animated.View 
            pointerEvents="none" 
            style={{ 
              position: "absolute", 
              justifyContent: "center", 
              alignItems: "center", 
              opacity: circleScales[index] 
            }}
          >
            {isRandom ? <CubeIcon active={true} /> : <IconComponent color={"#000"} />}
          </Animated.View>
          <View 
            style={[
              tabItemStyles.circleBorder, 
              { borderColor: isDark ? "#0F111E" : "#FFFFFF" }
            ]} 
            pointerEvents="none" 
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
});

// ------------------- StyleSheet Creators -------------------
const createStyles = (theme, isDark) => StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: theme.background 
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 140,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: theme.accent,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: theme.text,
  },
  statsContainer: {
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 14,
    textAlign: "center",
    width: 100,
    color: theme.secondaryText,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    width: 100,
    color: theme.text,
  },
  shareButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 6,
    backgroundColor: theme.accent,
  },
  shareButtonText: {
    fontWeight: "600",
    color: isDark ? "#0F111E" : "#FFFFFF",
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  tabText: {
    fontWeight: "600",
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  galleryModal: {
    flex: 1,
    backgroundColor: "#000000",
  },
  galleryHeader: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageCounter: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  galleryImage: {
    width: width,
    height: height,
    resizeMode: "contain",
  },
  galleryItem: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
  },
  // Navigation styles
  navigationWrapper: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    alignItems: "center" 
  },
  navigation: { 
    width,  
    height: 70, 
    borderRadius: 10, 
    overflow: "visible" 
  },
  navigationGradient: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 10, 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  indicator: { 
    left: 5, 
    position: "absolute", 
    top: -35, 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    borderWidth: 6, 
    borderColor: isDark ? "#0F111E" : "#EAF0FF", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  indicatorGradient: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 35, 
    justifyContent: "center", 
    alignItems: "center" 
  },
});

const createMasonryStyles = (isDark) => StyleSheet.create({
  masonryContainer: { 
    flexDirection: "row", 
    paddingHorizontal: 8, 
    paddingTop: 8 
  },
  column: { 
    flex: 1, 
    marginHorizontal: 4 
  },
  memeItem: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: isDark ? "#1A1B30" : "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memeImage: {
    width: "100%",
    borderRadius: 10,
  },
});

const createTabItemStyles = (isDark) => StyleSheet.create({
  navItem: { 
    width: STEP, 
    height: 70, 
    zIndex: 1 
  },
  navLink: { 
    width: "100%", 
    height: "100%", 
    justifyContent: "center", 
    alignItems: "center", 
    position: "relative" 
  },
  iconWrapper: { 
    position: "relative", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  navText: { 
    position: "absolute", 
    fontWeight: "400", 
    fontSize: 10, 
    letterSpacing: 0.5 
  },
  circleWrapper: { 
    position: "absolute", 
    top: -25, 
    left: 10, 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 3, 
    overflow: "hidden" 
  },
  circleGradient: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 25 
  },
  circleBorder: { 
    position: "absolute", 
    width: "100%", 
    height: "100%", 
    borderRadius: 25, 
    borderWidth: 1.8, 
    backgroundColor: "transparent" 
  },
});

// ------------------- ProfileScreen -------------------
const ProfileScreen = () => {
  const themeContext = useContext(ThemeContext);
  const isDark = useMemo(() => themeContext?.isDark ?? false, [themeContext]);
  const { user, updateUser } = useAuth();
  
  // Используем хук useProfile для управления данными профиля
  const { 
    memesCreated, 
    memesSaved, 
    isLoading, 
    refreshing, 
    loadProfileData, 
    onRefresh 
  } = useProfile(user?.id);

  // Тема
  const theme = useMemo(
    () =>
      isDark
        ? {
            background: "#0F111E",
            text: "#FFFFFF",
            secondaryText: "#A3B7D2",
            accent: "#16DBBE",
            tabInactive: "#1A1B30",
            navBackground: ["#1A1B30", "#2A2B42"],
            indicatorGradient: ["#00DEE8", "#77EE5F"],
            activeIcon: "#FFFFFF",
            inactiveIcon: "#1FD3B9",
          }
        : {
            background: "#EAF0FF",
            text: "#1B1F33",
            secondaryText: "#64748B",
            accent: "#16A085",
            tabInactive: "#D6E2F5",
            navBackground: ["#FFFFFF", "#F8FAFF"],
            indicatorGradient: ["#00BFA6", "#5CE1E6"],
            activeIcon: "#1FD3B9",
            inactiveIcon: "#7C8599",
          },
    [isDark]
  );

  // Создаем стили
  const mainStyles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [activeTab, setActiveTab] = useState("profile");
  const [activeMemeTab, setActiveMemeTab] = useState("created");
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Функция для преобразования данных из API с рандомными высотами как в index.js
  const transformMemesData = useCallback((apiMemes) => {
    if (!Array.isArray(apiMemes)) return [];
    
    return apiMemes.map(meme => ({
      id: meme.id.toString(),
      image_url: meme.image_url,
      // Используем случайную высоту как в index.js (от 200 до 400)
      height: 200 + Math.random() * 200,
      title: meme.title,
      description: meme.description,
      created_at: meme.created_at,
      likes_count: meme.likes_count,
      tags: meme.tags || []
    }));
  }, []);

  const userAvatar = user?.avatar_url ? { uri: user.avatar_url } : require("../../src/assets/cool_avatar.jpg");
  const username = user?.username || user?.name || "User Name 😎";
  const stats = {
    followers: user?.followers_count || 0,
    following: user?.following_count || 0,
    likes: user?.likes_count || 0
  };

  const currentMemes = useMemo(() => {
    const baseMemes = activeMemeTab === "created" ? memesCreated : memesSaved;
    return transformMemesData(baseMemes);
  }, [activeMemeTab, memesCreated, memesSaved, transformMemesData]);

  const tabs = useMemo(
    () => [
      { id: "home", icon: HomeIcon, label: "Главная" },
      { id: "search", icon: SearchIcon, label: "Поиск" },
      { id: "random", icon: CubeIcon, label: "Создать" },
      { id: "messenger", icon: MessageIcon, label: "Чаты" },
      { id: "profile", icon: AccountIcon, label: "Профиль" },
    ],
    []
  );

  const initialIndex = useMemo(() => tabs.findIndex((t) => t.id === activeTab), [tabs]);
  
  const translateX = useRef(new Animated.Value(initialIndex * STEP)).current;
  const circleScales = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? 1 : 0))).current;
  const iconTranslates = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? -32 : 0))).current;
  const textOpacities = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? 1 : 0))).current;
  const textTranslates = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? 10 : 20))).current;

  const navTimeoutRef = useRef(null);

  // Анимация навигации
  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab);

    Animated.spring(translateX, {
      toValue: index * STEP,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    tabs.forEach((tab, i) => {
      const isActive = tab.id === activeTab;
      Animated.spring(circleScales[i], { toValue: isActive ? 1 : 0, useNativeDriver: true }).start();
      Animated.spring(iconTranslates[i], { toValue: isActive ? -32 : 0, useNativeDriver: true }).start();
      Animated.parallel([
        Animated.timing(textOpacities[i], { toValue: isActive ? 1 : 0, duration: 200, useNativeDriver: true }),
        Animated.spring(textTranslates[i], { toValue: isActive ? 10 : 20, useNativeDriver: true }),
      ]).start();
    });
  }, [activeTab, tabs]);

  // Навигация
  const navigateTo = useCallback((tabId) => {
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);

    const navigate = () => {
      switch (tabId) {
        case "home":
          router.push("/");
          break;
        case "search":
          router.push("/search");
          break;
        case "random":
          router.push("/create");
          break;
        case "messenger":
          router.push("/messenger");
          break;
        case "profile":
          router.push("/profile");
          break;
        default:
          break;
      }
    };

    if (NAVIGATION_DELAY > 0) {
      navTimeoutRef.current = setTimeout(navigate, NAVIGATION_DELAY);
    } else {
      navigate();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
    navigateTo(tabId);
  }, [navigateTo]);

  // Функции для галереи
  const openGallery = useCallback((index) => {
    setCurrentImageIndex(index);
    setIsGalleryVisible(true);
  }, []);

  const closeGallery = useCallback(() => {
    setIsGalleryVisible(false);
  }, []);

  const handleImageSwipe = useCallback((event) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / width);
    setCurrentImageIndex(index);
  }, []);

const renderMasonryGrid = useCallback((memes, isCreatedTab) => {
  const safeMemes = Array.isArray(memes) ? memes : [];
  
  // Если нет мемов, показываем заглушку
  if (safeMemes.length === 0) {
    return (
      <View style={mainStyles.emptyState}>
        <Text style={[mainStyles.emptyStateText, { color: theme.secondaryText }]}>
          {isCreatedTab ? "Вы еще не создали мемы" : "У вас нет сохраненных мемов"}
        </Text>
      </View>
    );
  }
  
  const columnWidth = (width - 24) / 2;
  const columns = [[], []];
  const columnHeights = [0, 0];

  // Распределяем мемы по колонкам как в index.js
  safeMemes.forEach((meme) => {
    const shortest = columnHeights[0] <= columnHeights[1] ? 0 : 1;
    columns[shortest].push(meme);
    columnHeights[shortest] += meme.height;
  });

  const masonryStyles = createMasonryStyles(isDark);

  return (
    <View style={masonryStyles.masonryContainer}>
      {columns.map((column, colIndex) => (
        <View key={colIndex} style={masonryStyles.column}>
          {column.map((meme) => (
           <TouchableOpacity 
  key={meme.id} 
  style={[masonryStyles.memeItem, { width: columnWidth }]}
  onPress={() => router.push({
    pathname: '/post-detail',
    params: {
      postId: meme.id,
      imageUri: meme.image_url,
      description: meme.description || "", // ← ДОБАВЬТЕ ЭТУ СТРОКУ
      postType: isCreatedTab ? 'ownPost' : 'savedPost'
    }
  })}
>
              <Image
                source={{ uri: meme.image_url }}
                style={[masonryStyles.memeImage, { height: meme.height }]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}, [currentMemes, isDark, width, theme]); // ЗАМЕНИТЬ memes НА currentMemes

  return (
    <View style={mainStyles.container}>
      <ScrollView
        style={mainStyles.scrollView}
        contentContainerStyle={mainStyles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
          />
        }
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={mainStyles.header}>
          <TouchableOpacity onPress={() => setIsAvatarVisible(true)}>
            <Image
              source={userAvatar}
              style={mainStyles.avatar}
            />
          </TouchableOpacity>
          <EmojiText 
            text={username} 
            style={mainStyles.userName}
          />

          <TouchableOpacity
            style={mainStyles.shareButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={mainStyles.shareButtonText}>
              Изменить профиль
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={mainStyles.statsContainer}>
          <View style={mainStyles.statsRow}>
            <Text style={mainStyles.statLabel}>Подписки</Text>
            <Text style={mainStyles.statLabel}>Подписчики</Text>
            <Text style={mainStyles.statLabel}>Лайки</Text>
          </View>
          <View style={mainStyles.statsRow}>
            <Text style={mainStyles.statNumber}>{stats.following}</Text>
            <Text style={mainStyles.statNumber}>{stats.followers}</Text>
            <Text style={mainStyles.statNumber}>{stats.likes}</Text>
          </View>
        </View>

        {/* Meme Tabs */}
        <View style={mainStyles.tabsRow}>
          <TouchableOpacity
            style={[
              mainStyles.tabButton,
              { backgroundColor: activeMemeTab === "created" ? theme.accent : theme.tabInactive },
            ]}
            onPress={() => setActiveMemeTab("created")}
          >
            <Text
              style={[
                mainStyles.tabText,
                { color: activeMemeTab === "created" ? (isDark ? "#0F111E" : "#FFFFFF") : theme.secondaryText },
              ]}
            >
              Созданные
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              mainStyles.tabButton,
              { backgroundColor: activeMemeTab === "saved" ? theme.accent : theme.tabInactive },
            ]}
            onPress={() => setActiveMemeTab("saved")}
          >
            <Text
              style={[
                mainStyles.tabText,
                { color: activeMemeTab === "saved" ? (isDark ? "#0F111E" : "#FFFFFF") : theme.secondaryText },
              ]}
            >
              Сохранённые
            </Text>
          </TouchableOpacity>
        </View>

        {/* Memes */}
        {renderMasonryGrid(currentMemes, activeMemeTab === "created")}
        
        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Avatar modal */}
      <Modal visible={isAvatarVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsAvatarVisible(false)}>
          <View style={mainStyles.modalContainer}>
            <Image 
              source={user?.avatar_url ? { uri: user.avatar_url } : require("../../src/assets/cool_avatar.jpg")} 
              style={mainStyles.fullscreenImage} 
            />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Gallery modal */}
      <Modal visible={isGalleryVisible} transparent animationType="fade">
        <View style={mainStyles.galleryModal}>
          <View style={mainStyles.galleryHeader}>
            <TouchableOpacity style={mainStyles.closeButton} onPress={closeGallery}>
              <CloseIcon />
            </TouchableOpacity>
            <Text style={mainStyles.imageCounter}>
              {currentImageIndex + 1} / {(currentMemes && currentMemes.length) || 0}
            </Text>
          </View>
          
          <FlatList
            data={currentMemes || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item?.id || Math.random().toString()}
            initialScrollIndex={currentImageIndex}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={handleImageSwipe}
            renderItem={({ item }) => (
              <View style={mainStyles.galleryItem}>
                <Image source={{ uri: item?.image_url }} style={mainStyles.galleryImage} />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={mainStyles.navigationWrapper}>
        <View style={mainStyles.navigation}>
          <LinearGradient 
            colors={theme.navBackground} 
            start={{ x: 1, y: 0 }} 
            end={{ x: 0, y: 0 }} 
            style={mainStyles.navigationGradient}
          >
            {tabs.map((tab, index) => (
              <TabItem
                key={tab.id}
                tab={tab}
                index={index}
                isActive={tab.id === activeTab}
                isDark={isDark}
                theme={theme}
                onPress={handleTabPress}
                circleScales={circleScales}
                iconTranslates={iconTranslates}
                textOpacities={textOpacities}
                textTranslates={textTranslates}
                translateX={translateX}
              />
            ))}
          </LinearGradient>

          <Animated.View style={[mainStyles.indicator, { transform: [{ translateX: translateX }] }]}>
            <LinearGradient 
              colors={theme.indicatorGradient} 
              start={{ x: 0.5, y: 0 }} 
              end={{ x: 0.4, y: 1.5 }} 
              style={mainStyles.indicatorGradient} 
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default ProfileScreen;
import React, { useState, useRef, useEffect, useContext } from "react";
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
} from "react-native";
import { ThemeContext } from "../../src/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { router } from 'expo-router';

const { width } = Dimensions.get("window");
const STEP = 70;

// --- SVG Icons ---
const HomeIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
    <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </Svg>
);

const SearchIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
    <Path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </Svg>
);

const CubeIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
    <Path d="M11 11H6v2h5v5h2v-5h5v-2h-5V6h-2zM5 1a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4zm16 4v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2" />
  </Svg>
);

const MessageIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
    <Path d="M20 2H4c-1.1 0-2 .9-2 2v20l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </Svg>
);

const AccountIcon = ({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </Svg>
);

const ProfileScreen = () => {
  const { isDark } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [activeMemeTab, setActiveMemeTab] = useState("created");
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);

  const tabs = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "search", icon: SearchIcon, label: "Search" },
    { id: "random", icon: CubeIcon, label: "Create" },
    { id: "messenger", icon: MessageIcon, label: "Messenger" },
    { id: "profile", icon: AccountIcon, label: "Profile" },
  ];

  const theme = isDark
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
      };

  // Анимационные значения как в index.js
  const translateX = useRef(new Animated.Value(tabs.findIndex((t) => t.id === activeTab) * STEP)).current;
  const circleScales = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? 1 : 0))).current;
  const iconTranslates = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? -32 : 0))).current;
  const textOpacities = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? 1 : 0))).current;
  const textTranslates = useRef(tabs.map((t) => new Animated.Value(t.id === activeTab ? 10 : 20))).current;

  // Анимация как в index.js
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
  }, [activeTab]);

  // opacity активной иконки как в index.js
  const iconActiveOpacity = (index) =>
    translateX.interpolate({
      inputRange: [(index - 0.36) * STEP, index * STEP, (index + 0.36) * STEP],
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    switch (tabId) {
      case 'home':
        router.push('/');
        break;
      case 'search':
        router.push('/search');
        break;
      case 'random':
        router.push('/create');
        break;
      case 'messenger':
        router.push('/messenger');
        break;
      case 'profile':
        router.push('/profile');
        break;
    }
  };

  // Стили
  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      paddingTop: 40,
      backgroundColor: theme.background 
    },
    header: {
      alignItems: "center",
      marginBottom: 10,
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
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 140,
    },
    masonryContainer: {
      flexDirection: "row",
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    column: {
      flex: 1,
      marginHorizontal: 4,
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
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: "100%",
      height: "100%",
    },

    // Стили навигации как в index.js
    navigationWrapper: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
    navigation: { width, height: 70, borderRadius: 10, overflow: "visible" },
    navigationGradient: { width: "100%", height: "100%", borderRadius: 10, flexDirection: "row", justifyContent: "center", alignItems: "center" },
    navItem: { width: STEP, height: 70, zIndex: 1 },
    navLink: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", position: "relative" },
    iconWrapper: { position: "relative", alignItems: "center", justifyContent: "center" },
    navText: { position: "absolute", fontWeight: "400", fontSize: 10, letterSpacing: 0.5 },

    // градиентный кружок как в index.js
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
      overflow: "hidden",
    },
    circleGradient: {
      width: "100%",
      height: "100%",
      borderRadius: 25,
    },
    circleBorder: {
      position: "absolute",
      width: "100%",
      height: "100%",
      borderRadius: 25,
      borderWidth: 1.8,
      backgroundColor: "transparent",
    },

    indicator: { left: 5, position: "absolute", top: -35, width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: isDark ? "#0F111E" : "#EAF0FF", justifyContent: "center", alignItems: "center" },
    indicatorGradient: { width: "100%", height: "100%", borderRadius: 35, justifyContent: "center", alignItems: "center" },
  });

  // Моки
  const memesCreated = Array.from({ length: 6 }).map((_, i) => ({
    id: `created-${i}`,
    uri: `https://picsum.photos/200/300?random=${i}`,
    height: 200 + Math.random() * 200,
  }));

  const memesSaved = Array.from({ length: 6 }).map((_, i) => ({
    id: `saved-${i}`,
    uri: `https://picsum.photos/200/300?random=${i + 10}`,
    height: 200 + Math.random() * 200,
  }));

  const currentMemes = activeMemeTab === "created" ? memesCreated : memesSaved;

  // Masonry grid
  const renderMasonryGrid = (memes) => {
    const columnWidth = (width - 24) / 2;
    const columns = [[], []];
    const columnHeights = [0, 0];

    memes.forEach((meme) => {
      const shortestColumnIndex = columnHeights[0] <= columnHeights[1] ? 0 : 1;
      columns[shortestColumnIndex].push(meme);
      columnHeights[shortestColumnIndex] += meme.height;
    });

    return (
      <View style={styles.masonryContainer}>
        {columns.map((column, columnIndex) => (
          <View key={columnIndex} style={styles.column}>
            {column.map((meme) => (
              <TouchableOpacity key={meme.id} style={[styles.memeItem, { width: columnWidth }]}>
                <Image
                  source={{ uri: meme.uri }}
                  style={[styles.memeImage, { height: meme.height }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsAvatarVisible(true)}>
          <Image
            source={require("../../src/assets/cool_avatar.jpg")}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.userName}>User Name</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={styles.shareButtonText}>
            Изменить профиль
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Подписки</Text>
          <Text style={styles.statLabel}>Подписчики</Text>
          <Text style={styles.statLabel}>Лайки</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statNumber}>0</Text>
        </View>
      </View>

      {/* Meme Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: activeMemeTab === "created" ? theme.accent : theme.tabInactive },
          ]}
          onPress={() => setActiveMemeTab("created")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeMemeTab === "created" ? (isDark ? "#0F111E" : "#FFFFFF") : theme.secondaryText },
            ]}
          >
            Созданные
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: activeMemeTab === "saved" ? theme.accent : theme.tabInactive },
          ]}
          onPress={() => setActiveMemeTab("saved")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeMemeTab === "saved" ? (isDark ? "#0F111E" : "#FFFFFF") : theme.secondaryText },
            ]}
          >
            Сохранённые
          </Text>
        </TouchableOpacity>
      </View>

      {/* Memes */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {renderMasonryGrid(currentMemes)}
      </ScrollView>

      {/* Avatar modal */}
      <Modal visible={isAvatarVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsAvatarVisible(false)}>
          <View style={styles.modalContainer}>
            <Image source={require("../../src/assets/cool_avatar.jpg")} style={styles.fullscreenImage} resizeMode="contain" />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bottom Navigation как в index.js */}
      <View style={styles.navigationWrapper}>
        <View style={styles.navigation}>
          <LinearGradient colors={theme.navBackground} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={styles.navigationGradient}>
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              const activeOpacity = iconActiveOpacity(index);

              return (
                <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => handleTabPress(tab.id)} activeOpacity={0.8}>
                  <View style={styles.navLink}>
                    <Animated.View style={[styles.iconWrapper, { transform: [{ translateY: iconTranslates[index] }] }]}> 
                      {/* inactive */}
                      <IconComponent color={theme.inactiveIcon} />

                      {/* active overlay */}
                      <Animated.View
                        pointerEvents="none"
                        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, justifyContent: "center", alignItems: "center", opacity: activeOpacity }}
                      >
                        <IconComponent color={theme.activeIcon} />
                      </Animated.View>
                    </Animated.View>

                    <Animated.Text style={[styles.navText, { opacity: textOpacities[index], transform: [{ translateY: textTranslates[index] }], color: isDark ? "#FFFFFF" : "#1B1F33" }]}> 
                      {tab.label}
                    </Animated.Text>

                    {/* Градиентный кружок как в index.js */}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.circleWrapper,
                        { transform: [{ scale: circleScales[index] }], opacity: circleScales[index] },
                      ]}
                    >
                      <LinearGradient
                        colors={theme.indicatorGradient}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.circleGradient}
                      />

                      {/* ЧЁРНАЯ иконка поверх градиента */}
                      <Animated.View pointerEvents="none" style={{ position: "absolute", justifyContent: "center", alignItems: "center", opacity: circleScales[index] }}>
                        <IconComponent color={"#000"} />
                      </Animated.View>

                      <View style={[styles.circleBorder, { borderColor: isDark ? "#0F111E" : "#FFFFFF" }]} pointerEvents="none" />
                    </Animated.View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </LinearGradient>

          {/* Перемещающийся индикатор/обводка */}
          <Animated.View style={[styles.indicator, { transform: [{ translateX: translateX }] }]}> 
            <LinearGradient colors={theme.indicatorGradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.4, y: 1.5 }} style={styles.indicatorGradient} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default ProfileScreen;
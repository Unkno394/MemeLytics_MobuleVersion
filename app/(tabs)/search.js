import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Image,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // ✅ expo
import Svg, { Path } from "react-native-svg"; // ✅ expo уже включает
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../../src/context/ThemeContext";
import { router } from 'expo-router';



const { width } = Dimensions.get("window");

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

const SearchScreen = () => {
  const { isDark } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");

  // Анимационные значения
  const translateX = useRef(new Animated.Value(0)).current;
  const circleScales = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const iconTranslates = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const textOpacities = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const textTranslates = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(20))).current;

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
        inputBg: "#1A1B30",
        inputText: "#E5EAF5",
        placeholder: "#8A92A6",
        navBackground: ["#1A1B30", "#2A2B42"],
        indicatorGradient: ["#00DEE8", "#77EE5F"],
      }
    : {
        background: "#EAF0FF",
        text: "#1B1F33",
        inputBg: "#FFFFFF",
        inputText: "#1B1F33",
        placeholder: "#64748B",
        navBackground: ["#FFFFFF", "#F8FAFF"],
        indicatorGradient: ["#00BFA6", "#5CE1E6"],
      };

  // Анимация bottom nav
  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab);

    Animated.spring(translateX, {
      toValue: index * 70,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    tabs.forEach((tab, i) => {
      const isActive = tab.id === activeTab;

      Animated.spring(circleScales[i], {
        toValue: isActive ? 1 : 0,
        delay: isActive ? 200 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      Animated.spring(iconTranslates[i], {
        toValue: isActive ? -32 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      Animated.parallel([
        Animated.timing(textOpacities[i], {
          toValue: isActive ? 1 : 0,
          duration: 300,
          delay: isActive ? 200 : 0,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslates[i], {
          toValue: isActive ? 10 : 20,
          delay: isActive ? 200 : 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
      ]).start();
    });
  }, [activeTab]);

  // тестовые "результаты поиска"
  const memes = Array.from({ length: 20 }).map((_, i) => ({
    uri: `https://picsum.photos/300/${300 + Math.random() * 300}?random=${i}`,
    id: i.toString(),
    height: 200 + Math.random() * 200,
  }));

  // Водопадная сетка
  const renderMasonryGrid = () => {
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
              <TouchableOpacity
                key={meme.id}
                style={[styles.memeItem, { width: columnWidth }]}
              >
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Поисковая строка */}
      <View style={[styles.searchBar, { backgroundColor: theme.inputBg }]}>
        <SearchIcon color={theme.placeholder} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск мемов..."
          placeholderTextColor={theme.placeholder}
          style={[styles.input, { color: theme.inputText }]}
        />
      </View>

      {/* Результаты поиска */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {renderMasonryGrid()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navigationWrapper}>
        <View style={styles.navigation}>
          <LinearGradient
            colors={theme.navBackground}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.navigationGradient}
          >
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <TouchableOpacity
  key={tab.id}
  style={styles.navItem}
  onPress={() => {
    setActiveTab(tab.id);

    switch (tab.id) {
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
  }}
  activeOpacity={0.8}
                >
                  <View style={styles.navLink}>
                    <Animated.View
                      style={[
                        styles.iconWrapper,
                        { transform: [{ translateY: iconTranslates[index] }] },
                      ]}
                    >
                      <IconComponent
                        color={
                          isActive
                            ? isDark
                              ? "#0F111E"
                              : "#FFFFFF"
                            : isDark
                            ? "#16DBBE"
                            : "#1FD3B9"
                        }
                      />
                    </Animated.View>
                    <Animated.Text
                      style={[
                        styles.navText,
                        {
                          opacity: textOpacities[index],
                          transform: [{ translateY: textTranslates[index] }],
                          color: isDark ? "#FFFFFF" : "#1B1F33",
                        },
                      ]}
                    >
                      {tab.label}
                    </Animated.Text>
                    <Animated.View
                      style={[
                        styles.circle,
                        {
                          transform: [{ scale: circleScales[index] }],
                          borderColor: isDark ? "#0F111E" : "#FFFFFF",
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </LinearGradient>

          <Animated.View
            style={[
              styles.indicator,
              {
                transform: [{ translateX }],
                borderColor: isDark ? "#0F111E" : "#EAF0FF",
              },
            ]}
          >
            <LinearGradient
              colors={theme.indicatorGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.4, y: 1.5 }}
              style={styles.indicatorGradient}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
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
    backgroundColor: "#fff",
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
  navigationWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  navigation: {
    width: 400,
    height: 70,
    borderRadius: 10,
    position: "relative",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  navigationGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  navItem: {
    width: 70,
    height: 70,
    zIndex: 1,
  },
  navLink: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    position: "absolute",
    fontWeight: "400",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  circle: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.8,
    borderColor: "#0F111E",
    backgroundColor: "transparent",
    top: -25,
    left: 10,
  },
  indicator: {
    left: 25,
    position: "absolute",
    top: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 6,
    borderColor: "#0F111E",
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SearchScreen;
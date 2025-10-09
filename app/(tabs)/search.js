import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { ThemeContext } from "../../src/context/ThemeContext";
import { router } from 'expo-router';

const { width } = Dimensions.get("window");
const STEP = 70;
const NAVIGATION_DELAY = 80;

// --- Memoized SVG Icons ---
const HomeIcon = React.memo(({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
  </Svg>
));

const SearchIcon = React.memo(({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill={color} />
  </Svg>
));

const CubeIcon = React.memo(({ active = false }) => {
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
});

const MessageIcon = React.memo(({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M20 2H4c-1.1 0-2 .9-2 2v20l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill={color} />
  </Svg>
));

const AccountIcon = React.memo(({ color = "#000" }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={color} />
  </Svg>
));

// Memoized Navigation Item Component
const NavItem = React.memo(({ 
  tab, 
  index, 
  isActive, 
  onPress, 
  theme, 
  isDark,
  animations 
}) => {
  const { iconTranslates, circleScales, textOpacities, textTranslates, iconActiveOpacity } = animations;
  const isRandom = tab.id === "random";
  const IconComponent = tab.icon;

  const activeOpacity = iconActiveOpacity(index);

  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.navLink}>
        <Animated.View style={[styles.iconWrapper, { transform: [{ translateY: iconTranslates[index] }] }]}>
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
            styles.navText, 
            { 
              opacity: textOpacities[index], 
              transform: [{ translateY: textTranslates[index] }], 
              color: isDark ? "#FFFFFF" : "#1B1F33" 
            }
          ]}
        >
          {tab.label}
        </Animated.Text>

        <Animated.View 
          pointerEvents="none" 
          style={[
            styles.circleWrapper, 
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
            style={styles.circleGradient} 
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
            {tab.id === "random" ? <CubeIcon active={true} /> : <IconComponent color={"#000"} />}
          </Animated.View>
          <View 
            style={[
              styles.circleBorder, 
              { borderColor: isDark ? "#0F111E" : "#FFFFFF" }
            ]} 
            pointerEvents="none" 
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
});

// Memoized Masonry Grid Component
const MasonryGrid = React.memo(({ memes, isDark }) => {
  const columnWidth = (width - 24) / 2;
  const columns = [[], []];
  const columnHeights = [0, 0];

  memes.forEach((meme) => {
    const shortestColumnIndex = columnHeights[0] <= columnHeights[1] ? 0 : 1;
    columns[shortestColumnIndex].push(meme);
    columnHeights[shortestColumnIndex] += meme.height;
  });

  const handleMemePress = useCallback((meme) => {
    router.push({
      pathname: '/post-detail',
      params: {
        postId: meme.id,
        imageUri: meme.uri,
        postType: 'otherPost'
      }
    });
  }, []);

  return (
    <View style={styles.masonryContainer}>
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={styles.column}>
          {column.map((meme) => (
            <TouchableOpacity 
              key={meme.id} 
              style={[styles.memeItem, { width: columnWidth }, { backgroundColor: isDark ? "#1A1B30" : "#FFFFFF" }]}
              onPress={() => handleMemePress(meme)}
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
});

const SearchScreen = () => {
  const { isDark } = useContext(ThemeContext);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Memoized tabs
  const tabs = useMemo(() => [
    { id: "home", icon: HomeIcon, label: "Главная" },
    { id: "search", icon: SearchIcon, label: "Поиск" },
    { id: "random", icon: CubeIcon, label: "Создать" },
    { id: "messenger", icon: MessageIcon, label: "Чаты" },
    { id: "profile", icon: AccountIcon, label: "Профиль" },
  ], []);

  // Memoized theme
  const theme = useMemo(() => isDark
    ? {
        background: "#0F111E",
        text: "#FFFFFF",
        inputBg: "#1A1B30",
        inputText: "#E5EAF5",
        placeholder: "#8A92A6",
        navBackground: ["#1A1B30", "#2A2B42"],
        indicatorGradient: ["#00DEE8", "#77EE5F"],
        activeIcon: "#FFFFFF",
        inactiveIcon: "#1FD3B9",
      }
    : {
        background: "#EAF0FF",
        text: "#1B1F33",
        inputBg: "#FFFFFF",
        inputText: "#1B1F33",
        placeholder: "#64748B",
        navBackground: ["#FFFFFF", "#F8FAFF"],
        indicatorGradient: ["#00BFA6", "#5CE1E6"],
        activeIcon: "#1FD3B9",
        inactiveIcon: "#7C8599",
      }, [isDark]);

  // Memoized animations
  const animations = useMemo(() => {
    const initialIndex = tabs.findIndex((t) => t.id === activeTab);
    
    return {
      translateX: new Animated.Value(initialIndex * STEP),
      circleScales: tabs.map((t) => new Animated.Value(t.id === activeTab ? 1 : 0)),
      iconTranslates: tabs.map((t) => new Animated.Value(t.id === activeTab ? -32 : 0)),
      textOpacities: tabs.map((t) => new Animated.Value(t.id === activeTab ? 1 : 0)),
      textTranslates: tabs.map((t) => new Animated.Value(t.id === activeTab ? 10 : 20)),
    };
  }, [tabs, activeTab]);

  // Search icon animation
  const searchIconPosition = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const navTimeoutRef = useRef(null);

  // Memoized search icon interpolation
  const searchIconTranslateX = useMemo(() => 
    searchIconPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, width - 90]
    }), [searchIconPosition]);

  // Memoized icon active opacity interpolation
  const iconActiveOpacity = useCallback((index) => 
    animations.translateX.interpolate({
      inputRange: [(index - 0.36) * STEP, index * STEP, (index + 0.36) * STEP],
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    }), [animations.translateX]);

  // Search icon animation
  useEffect(() => {
    Animated.timing(searchIconPosition, {
      toValue: isInputFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isInputFocused, searchIconPosition]);

  // Navigation animations
  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab);

    const animationConfig = {
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    };

    const animationsBatch = [
      Animated.spring(animations.translateX, {
        toValue: index * STEP,
        ...animationConfig,
      })
    ];

    tabs.forEach((tab, i) => {
      const isActive = tab.id === activeTab;
      
      animationsBatch.push(
        Animated.parallel([
          Animated.spring(animations.circleScales[i], { 
            toValue: isActive ? 1 : 0, 
            ...animationConfig 
          }),
          Animated.spring(animations.iconTranslates[i], { 
            toValue: isActive ? -32 : 0, 
            ...animationConfig 
          }),
          Animated.timing(animations.textOpacities[i], { 
            toValue: isActive ? 1 : 0, 
            duration: 200, 
            useNativeDriver: true 
          }),
          Animated.spring(animations.textTranslates[i], { 
            toValue: isActive ? 10 : 20, 
            ...animationConfig 
          }),
        ])
      );
    });

    Animated.parallel(animationsBatch).start();
  }, [activeTab, tabs, animations]);

  // Navigation handler
  const navigateTo = useCallback((tabId) => {
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
    }

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
      }
    };

    if (NAVIGATION_DELAY > 0) {
      navTimeoutRef.current = setTimeout(navigate, NAVIGATION_DELAY);
    } else {
      navigate();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  // Tab press handler
  const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
    navigateTo(tabId);
  }, [navigateTo]);

  // Search handler
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      console.log("Searching for:", query);
      // Search logic here
    }
  }, [query]);

  // Input focus/blur handlers
  const handleFocus = useCallback(() => setIsInputFocused(true), []);
  const handleBlur = useCallback(() => setIsInputFocused(false), []);

  // Memoized search data
  const memes = useMemo(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      uri: `https://picsum.photos/300/${300 + Math.random() * 300}?random=${i}`,
      id: i.toString(),
      height: 200 + Math.random() * 200,
    })), []);

  // Memoized masonry grid
  const renderedGrid = useMemo(() => 
    <MasonryGrid memes={memes} isDark={isDark} />, 
    [memes, isDark]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.inputBg }]}>
        <Animated.View 
          style={[
            styles.searchIconContainer, 
            { 
              transform: [{ translateX: searchIconTranslateX }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.searchIconButton}
            onPress={isInputFocused ? handleSearch : () => inputRef.current?.focus()}
          >
            <SearchIcon color={isInputFocused ? theme.activeIcon : theme.placeholder} />
          </TouchableOpacity>
        </Animated.View>
        
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Поиск мемов..."
          placeholderTextColor={theme.placeholder}
          style={[styles.input, { marginLeft: 40, color: theme.inputText }]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          multiline={true}
          numberOfLines={2}
          maxLength={100}
        />
      </View>

      {/* Search Results */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {renderedGrid}
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
            {tabs.map((tab, index) => (
              <NavItem
                key={tab.id}
                tab={tab}
                index={index}
                isActive={tab.id === activeTab}
                onPress={() => handleTabPress(tab.id)}
                theme={theme}
                isDark={isDark}
                animations={{ ...animations, iconActiveOpacity }}
              />
            ))}
          </LinearGradient>

          <Animated.View 
            style={[
              styles.indicator, 
              { 
                transform: [{ translateX: animations.translateX }],
                borderColor: isDark ? "#0F111E" : "#EAF0FF" 
              }
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

// Styles outside component to prevent recreation
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    position: "relative",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingRight: 50,
    textAlignVertical: 'top',
  },
  searchIconContainer: {
    position: "absolute",
    left: 12,
    zIndex: 10,
  },
  searchIconButton: {
    padding: 4,
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
  indicator: { 
    left: 5, 
    position: "absolute", 
    top: -35, 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    borderWidth: 6, 
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

export default SearchScreen;
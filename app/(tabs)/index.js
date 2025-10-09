import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from "react";
import {
  View,
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
import { router, useLocalSearchParams } from "expo-router";
import CustomAlert from "../../components/CustomAlert";

const { width } = Dimensions.get("window");
const STEP = 70;

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

  const styles = useMemo(() => createTabItemStyles(isDark), [isDark]);

  return (
    <TouchableOpacity style={styles.navItem} onPress={() => onPress(id)} activeOpacity={0.8}>
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
          {label}
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
            {isRandom ? <CubeIcon active={true} /> : <IconComponent color={"#000"} />}
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

// ------------------- MainScreen -------------------
const MainScreen = () => {
  const params = useLocalSearchParams();
  const themeContext = useContext(ThemeContext);
  const isDark = useMemo(() => themeContext?.isDark ?? false, [themeContext]);

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

  const theme = useMemo(
    () =>
      isDark
        ? {
            background: "#0F111E",
            navBackground: ["#1A1B30", "#2A2B42"],
            indicatorGradient: ["#00DEE8", "#77EE5F"],
            activeIcon: "#FFFFFF",
            inactiveIcon: "#1FD3B9",
          }
        : {
            background: "#EAF0FF",
            navBackground: ["#FFFFFF", "#F8FAFF"],
            indicatorGradient: ["#00BFA6", "#5CE1E6"],
            activeIcon: "#1FD3B9",
            inactiveIcon: "#7C8599",
          },
    [isDark]
  );

  const NAVIGATION_DELAY = 80;
  const initialActive = "home";
  const [activeTab, setActiveTab] = useState(initialActive);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "" });

  const initialIndex = useMemo(() => tabs.findIndex((t) => t.id === initialActive), [tabs]);
  
  const translateX = useRef(new Animated.Value(initialIndex * STEP)).current;
  const circleScales = useRef(tabs.map((t) => new Animated.Value(t.id === initialActive ? 1 : 0))).current;
  const iconTranslates = useRef(tabs.map((t) => new Animated.Value(t.id === initialActive ? -32 : 0))).current;
  const textOpacities = useRef(tabs.map((t) => new Animated.Value(t.id === initialActive ? 1 : 0))).current;
  const textTranslates = useRef(tabs.map((t) => new Animated.Value(t.id === initialActive ? 10 : 20))).current;

  const navTimeoutRef = useRef(null);

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

  useEffect(() => {
    if (params.showSuccessAlert === "true") {
      setAlertConfig({ title: "Успех!", message: "Мем успешно выложен!" });
      setAlertVisible(true);
      router.setParams({ showSuccessAlert: undefined });
    }
  }, [params]);

  const navigateTo = useCallback((tabId) => {
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);

    const navigate = () => {
      switch (tabId) {
        case "home":
          router.push("/index");
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

  const memes = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        uri: `https://picsum.photos/300/${300 + Math.random() * 300}?random=${i}`,
        id: i.toString(),
        height: 200 + Math.random() * 200,
      })),
    []
  );

  const renderMasonryGrid = useCallback(() => {
    const columnWidth = (width - 24) / 2;
    const columns = [[], []];
    const columnHeights = [0, 0];

    memes.forEach((meme) => {
      const shortest = columnHeights[0] <= columnHeights[1] ? 0 : 1;
      columns[shortest].push(meme);
      columnHeights[shortest] += meme.height;
    });

    const styles = createMasonryStyles(isDark);

    return (
      <View style={styles.masonryContainer}>
        {columns.map((column, colIndex) => (
          <View key={colIndex} style={styles.column}>
            {column.map((meme) => (
              <TouchableOpacity 
                key={meme.id} 
                style={[styles.memeItem, { width: columnWidth }]}
                onPress={() => router.push({
                  pathname: '/post-detail',
                  params: {
                    postId: meme.id,
                    imageUri: meme.uri,
                    postType: 'feedPost'
                  }
                })}
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
  }, [memes, isDark]);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent} 
        showsVerticalScrollIndicator={false}
      >
        {renderMasonryGrid()}
      </ScrollView>

      <View style={styles.navigationWrapper}>
        <View style={styles.navigation}>
          <LinearGradient 
            colors={theme.navBackground} 
            start={{ x: 1, y: 0 }} 
            end={{ x: 0, y: 0 }} 
            style={styles.navigationGradient}
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

          <Animated.View style={[styles.indicator, { transform: [{ translateX: translateX }] }]}>
            <LinearGradient 
              colors={theme.indicatorGradient} 
              start={{ x: 0.5, y: 0 }} 
              end={{ x: 0.4, y: 1.5 }} 
              style={styles.indicatorGradient} 
            />
          </Animated.View>
        </View>
      </View>

      <CustomAlert 
        visible={alertVisible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onClose={() => setAlertVisible(false)} 
      />
    </View>
  );
};

// ------------------- StyleSheet Creators -------------------
const createStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: 100 },
  navigationWrapper: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  navigation: { width, height: 70, borderRadius: 10, overflow: "visible" },
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
  masonryContainer: { flexDirection: "row", paddingHorizontal: 8, paddingTop: 8 },
  column: { flex: 1, marginHorizontal: 4 },
  memeItem: { 
    marginBottom: 8, 
    borderRadius: 10, 
    overflow: "hidden", 
    backgroundColor: isDark ? "#1A1B30" : "#FFFFFF", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  memeImage: { width: "100%", borderRadius: 10 },
});

const createTabItemStyles = (isDark) => StyleSheet.create({
  navItem: { width: STEP, height: 70, zIndex: 1 },
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

export default MainScreen;
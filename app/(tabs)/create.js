import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  PanResponder,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";
import { ThemeContext } from "../../src/context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  useAnimatedProps,
} from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import Sticker from "../../src/components/Sticker";
import { Svg, Path } from "react-native-svg";
import {
  Grayscale,
  Sepia,
  Invert,
  Contrast,
  Brightness,
  Saturate,
  HueRotate,
} from "react-native-color-matrix-image-filters";
import TextEditModal from "../../components/TextEditModal";
import { LogBox } from "react-native";
import { useAppFonts } from "../../src/assets/fonts/fonts";
import Icon from 'react-native-vector-icons/MaterialIcons';
import Magnifier from "../../components/magnifier.js";
import PixelPicker  from "../../components/ColorPicker.js";
import { GLView } from "expo-gl";
import Expo2DContext from "expo-2d-context";
import { Asset } from "expo-asset";

LogBox.ignoreLogs([
  "Warning: Cannot update a component from inside the function body of a different component",
]);

async function loadImageToGL(uri) {
  try {
    // Если URI уже локальный, Asset.fromURI всё равно вернёт его
    const asset = Asset.fromURI(uri);

    // Скачиваем, если это удалённый ресурс
    await asset.downloadAsync();

    // Возвращаем локальный URI, который можно передавать в ctx.drawImage
    return asset.localUri;
  } catch (e) {
    console.error("Ошибка загрузки изображения для GL:", e);
    return null;
  }
}


const SCREEN_WIDTH = Dimensions.get("window").width;
const AnimatedPath = Animated.createAnimatedComponent(Path);

const BackIcon = ({ color = "#16DBBE" }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const memeTemplates = [
  { id: "1", uri: "https://i.imgur.com/Jk7Oa.jpg" },
  { id: "2", uri: "https://i.imgur.com/k2P9l.jpg" },
  { id: "3", uri: "https://i.imgur.com/Qk7vA.jpg" },
];

const DRAFT_KEY = "MEME_DRAFT_v3";

// Обновленный DraggableText с поддержкой блокировки
const DraggableText = ({
  id,
  text,
  fontSize,
  color,
  fontFamily,
  background = false,
  backgroundColor = "transparent",
  startX = 0,
  startY = 0,
  onOpenEditor,
  disabled = false,
}) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const savedX = useSharedValue(startX);
  const savedY = useSharedValue(startY);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      if (disabled) return;
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (disabled) return;
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!disabled)
    .hitSlop(250)
    .onBegin(() => {
      if (disabled) return;
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      if (disabled) return;
      scale.value = Math.max(0.5, Math.min(4, savedScale.value * e.scale));
    });

  const rotationGesture = Gesture.Rotation()
    .enabled(!disabled)
    .hitSlop(250)
    .onBegin(() => {
      if (disabled) return;
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      if (disabled) return;
      rotation.value = savedRotation.value + e.rotation;
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(250)
    .onEnd(() => {
      if (disabled) return;
      runOnJS(onOpenEditor)?.({
        id,
        text,
        fontSize,
        color,
        fontFamily,
        x: translateX.value,
        y: translateY.value,
        scale: scale.value,
        rotation: rotation.value,
        background,
        backgroundColor,
      });
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
    position: "absolute",
    left: 0,
    top: 0,
    opacity: disabled ? 0.7 : 1,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: background ? backgroundColor : "transparent",
            padding: background ? 8 : 0,
            borderRadius: background ? 4 : 0,
            alignSelf: "flex-start",
          }}
        >
          <Text
            style={{
              fontSize,
              color,
              fontFamily,
              textAlign: "center",
              textShadowColor: "#000",
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 3,
              includeFontPadding: false,
            }}
          >
            {text}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const FilteredImage = ({ filter, uri, style }) => {
  if (!uri) return <View style={[style, { backgroundColor: "#ccc" }]} />;
  const img = <Image source={{ uri }} style={style} />;
  switch (filter) {
    case "grayscale":
      return <Grayscale>{img}</Grayscale>;
    case "sepia":
      return <Sepia>{img}</Sepia>;
    case "invert":
      return <Invert>{img}</Invert>;
    case "contrast":
      return <Contrast amount={2.0}>{img}</Contrast>;
    case "brightness":
      return <Brightness amount={1.4}>{img}</Brightness>;
    case "saturate":
      return <Saturate amount={2.0}>{img}</Saturate>;
    case "hue":
      return <HueRotate amount={Math.PI / 2}>{img}</HueRotate>;
    default:
      return img;
  }
};

const CreateMemeScreen = () => {
  const [fontsLoaded] = useAppFonts();
  const { isDark } = useContext(ThemeContext);
  const navigation = useNavigation();
  const magnifierRef = useRef(null);
  // useState для лупы
  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const glContextRef = useRef(null);
  // ref на контейнер изображения
  const imageRef = useRef(null);
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [sliderLayout, setSliderLayout] = useState({ y: 0, height: 0 });
  const sliderTrackRef = useRef(null);
  const [isSliding, setIsSliding] = useState(false);
  const [isTextModalVisible, setIsTextModalVisible] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [filter, setFilter] = useState("none");
  const [image, setImage] = useState(null);
  const [fontSize, setFontSize] = useState(28);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [stickers, setStickers] = useState([]);
  const [textBlocks, setTextBlocks] = useState([]);
  const [drawingPaths, setDrawingPaths] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [hashtags, setHashtags] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [brushType, setBrushType] = useState("pen");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isDrawing = useSharedValue(false);
  const viewShotRef = useRef();
  const currentPathD = useSharedValue("");
  const currentPathColor = useSharedValue("#FF0000");
  const [eyedropperActive, setEyedropperActive] = useState(false);

  const handleSliderMove = (pageY) => {
    if (!sliderLayout.height || !sliderLayout.y) return;
    const relativeY = pageY - sliderLayout.y;
    const clampedY = Math.max(0, Math.min(sliderLayout.height, relativeY));
    const percentage = 1 - clampedY / sliderLayout.height;
    const newSize = 1 + percentage * (30 - 1);
    setBrushSize(Math.round(newSize));
  };

  const onSliderLayout = () => {
    sliderTrackRef.current?.measureInWindow((x, y, width, height) => {
      setSliderLayout({ y, height });
    });
  };

  const activateEyedropper = () => {
    if (!image) return Alert.alert("Ошибка", "Сначала выберите изображение");
    setEyedropperActive(true);
    setMagnifierVisible(true);
  };
  

  const handleTouchMove = (e) => {
    if (!imageLayout) return;
  
    const { pageX, pageY } = e.nativeEvent;
    const localX = pageX - imageLayout.x;
    const localY = pageY - imageLayout.y;
  
    const isInsideImage = localX >= 0 && localX <= imageLayout.width && localY >= 0 && localY <= imageLayout.height;
    if (!isInsideImage) return;
  
    const clampedX = Math.max(0, Math.min(imageLayout.width - 1, localX));
    const clampedY = Math.max(0, Math.min(imageLayout.height - 1, localY));
    setMagnifierPos({ x: clampedX, y: clampedY });
  };

  const handleTouchEnd = async () => {
    if (image && magnifierRef.current) {
      // Получаем цвет под центром лупы
      const color = await magnifierRef.current.getColorAt(
        Math.floor(magnifierPos.x),
        Math.floor(magnifierPos.y)
      );
      if (color) {
        setBrushColor(color);
        console.log("Выбранный цвет:", color);
      }
    }
    
    setMagnifierVisible(false);
    setEyedropperActive(false);
  };
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsSliding(true);
      handleSliderMove(evt.nativeEvent.pageY);
    },
    onPanResponderMove: (evt) => handleSliderMove(evt.nativeEvent.pageY),
    onPanResponderRelease: () => setIsSliding(false),
    onPanResponderTerminate: () => setIsSliding(false),
  });

  const animatedPathProps = useAnimatedProps(() => ({
    d: currentPathD.value,
    stroke: currentPathColor.value,
  }));

  const addPath = (d, color, type, start, end) => {
    // Проверяем валидность цвета перед сохранением
    const validColor = color && color.startsWith('#') && 
                     (color.length === 7 || color.length === 9) 
                     ? color 
                     : "#FFFFFF";
  
    if (type === "arrow" && start && end) {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arrowLength = 15;
      const arrowAngle = Math.PI / 6;
      
      const x1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
      const y1 = end.y - arrowLength * Math.sin(angle - arrowAngle);
      
      const x2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
      const y2 = end.y - arrowLength * Math.sin(angle + arrowAngle);
      
      const arrowD = `M ${start.x},${start.y} L ${end.x},${end.y} M ${end.x},${end.y} L ${x1},${y1} M ${end.x},${end.y} L ${x2},${y2}`;
      
      setDrawingPaths((prev) => [
        ...prev,
        { 
          d: arrowD, 
          color: validColor,
          strokeWidth: brushSize, 
          type, 
          start, 
          end,
          arrowData: { x1, y1, x2, y2, angle }
        },
      ]);
    } else {
      setDrawingPaths((prev) => [
        ...prev,
        { d, color: validColor, strokeWidth: brushSize, type, start, end },
      ]);
    }
  };

  useEffect(() => {
    if (!image || !glContextRef.current || !imageLayout.width || !imageLayout.height) return;
  
    const loadImageToGL = async () => {
      try {
        const ctx = glContextRef.current;
        if (!ctx) return;
  
        // Используем expo-asset для правильной загрузки
        const asset = Asset.fromURI(image);
        await asset.downloadAsync();
  
        if (!asset.localUri) {
          console.error("❌ Не удалось загрузить локальный URI");
          return;
        }
  
        // Создаем изображение через React Native Image
        Image.getSize(asset.localUri, (width, height) => {
          ctx.clearRect(0, 0, imageLayout.width, imageLayout.height);
          
          // Рисуем изображение с правильными пропорциями
          const scale = Math.min(imageLayout.width / width, imageLayout.height / height);
          const drawWidth = width * scale;
          const drawHeight = height * scale;
          const x = (imageLayout.width - drawWidth) / 2;
          const y = (imageLayout.height - drawHeight) / 2;
          
          ctx.drawImage(asset.localUri, x, y, drawWidth, drawHeight);
          ctx.flush();
          console.log("✅ Изображение загружено в GLContext");
        });
        
      } catch (err) {
        console.error("Ошибка при drawImage в GLContext:", err);
      }
    };
  
    loadImageToGL();
  }, [image, glContextRef.current, imageLayout.width, imageLayout.height]);

  useEffect(() => {
    if (brushColor && brushColor.startsWith('#') && (brushColor.length === 7 || brushColor.length === 9)) {
      currentPathColor.value = brushColor;
    } else {
      currentPathColor.value = "#FFFFFF";
    }
  }, [brushColor]);

  const startPoint = useSharedValue(null);

  // Жест для рисования (работает только когда включен режим рисования)
  const pan = Gesture.Pan()
    .enabled(isDrawingMode && !eyedropperActive)
    .onBegin((e) => {
      if (!isDrawingMode || eyedropperActive) return;
      isDrawing.value = true;
      currentPathColor.value = brushColor;
      
      if (brushType === "arrow") {
        currentPathD.value = `M ${e.x},${e.y}`;
        startPoint.value = { x: e.x, y: e.y };
      } else {
        currentPathD.value = `M ${e.x},${e.y}`;
        startPoint.value = { x: e.x, y: e.y };
      }
    })
    .onUpdate((e) => {
      if (!isDrawingMode || !isDrawing.value || eyedropperActive) return;
      
      if (brushType === "arrow") {
        currentPathD.value = `M ${startPoint.value.x},${startPoint.value.y} L ${e.x},${e.y}`;
      } else {
        currentPathD.value = currentPathD.value + ` L ${e.x},${e.y}`;
      }
    })
    .onEnd((e) => {
      if (!isDrawingMode || !isDrawing.value || eyedropperActive) return;
      
      runOnJS(addPath)(
        currentPathD.value,
        currentPathColor.value,
        brushType,
        startPoint.value,
        { x: e.x, y: e.y }
      );
      
      currentPathD.value = "";
      isDrawing.value = false;
    });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          setImage(draft.image || null);
          setFilter(draft.filter || "none");
          setFontSize(draft.fontSize || 28);
          setFontColor(draft.fontColor || "#fff");
          setFontFamily(draft.fontFamily || "Roboto");
          setStickers(draft.stickers || []);
          setTextBlocks(draft.textBlocks || []);
          setHashtags(draft.hashtags || "");
          setDrawingPaths(draft.drawingPaths || []);
        }
      } catch (e) {
        console.warn("Load draft error:", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const payload = {
          image,
          filter,
          fontSize,
          fontColor,
          fontFamily,
          stickers,
          textBlocks,
          hashtags,
          drawingPaths,
        };
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("Save draft error:", e);
      }
    })();
  }, [image, filter, fontSize, fontColor, fontFamily, stickers, textBlocks, hashtags, drawingPaths]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const pickRandomTemplate = () => {
    const random = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
    setImage(random.uri);
  };

  const clearDraft = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
    setImage(null);
    setStickers([]);
    setTextBlocks([]);
    setHashtags("");
    setFilter("none");
    setDrawingPaths([]);
    Alert.alert("Черновик", "Черновик удалён");
  };

  const addTextBlock = () => {
    const newId = textBlocks.length
      ? Math.max(...textBlocks.map((t) => Number(t.id) || 0)) + 1
      : 1;

    const newBlock = {
      id: newId,
      text: "Новый текст",
      fontSize,
      color: fontColor,
      fontFamily,
      x: 20,
      y: 50,
      scale: 1,
      background: false,
      backgroundColor: "#ffffff",
    };

    setTextBlocks([...textBlocks, newBlock]);
    setSelectedText(newBlock);
    setIsTextModalVisible(true);
  };

  const saveMeme = async () => {
    if (!image) return Alert.alert("Ошибка", "Выберите изображение для мема");
    setIsLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return Alert.alert("Ошибка", "Нет доступа к галерее");
      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      await AsyncStorage.removeItem(DRAFT_KEY);
      Alert.alert("Успех", "Мем сохранён!", [
        {
          text: "OK",
          onPress: () => {
            setImage(null);
            setTextBlocks([]);
            setDrawingPaths([]);
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Ошибка", "Не удалось сохранить мем.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterOptions = [
    "none",
    "grayscale",
    "sepia",
    "invert",
    "contrast",
    "brightness",
    "saturate",
    "hue",
  ];

  const clearDrawingPaths = () => {
    setDrawingPaths([]);
    currentPathD.value = "";
    isDrawing.value = false;
  };
  
  const undoLastPath = () => {
    if (drawingPaths.length === 0) return;
    setDrawingPaths((prev) => prev.slice(0, -1));
  };

  const handleUndo = () => {
    undoLastPath();
  };

  const handleBrushType = () => {
    setBrushType((prev) => {
      if (prev === "pen") return "marker";
      if (prev === "marker") return "arrow";
      if (prev === "arrow") return "pen";
      return "pen";
    });
  };

  const handleColorPicker = () => {
    setShowColorPicker(prev => !prev);
  };

  const handleColorSelect = (color) => {
    // Проверяем, что это валидный hex цвет
    if (color && color.startsWith('#') && (color.length === 7 || color.length === 9)) {
      setBrushColor(color);
    } else {
      console.warn('Invalid color selected:', color);
      setBrushColor("#FFFFFF"); // фолбэк на белый
    }
  };

  const getBrushIcon = () => {
    switch (brushType) {
      case "pen": return "edit";
      case "marker": return "brush";
      case "arrow": return "arrow-forward";
      default: return "edit";
    }
  };

  const renderDrawingPaths = () => {
    return drawingPaths.map((p, i) => {
      // Проверяем валидность цвета
      const isValidColor = p.color && p.color.startsWith('#') && 
                          (p.color.length === 7 || p.color.length === 9);
      const strokeColor = isValidColor ? p.color : "#FFFFFF";
      
      // Проверяем валидность ширины линии
      const strokeWidth = p.strokeWidth && p.strokeWidth > 0 ? p.strokeWidth : 5;
  
      if (p.type !== "arrow" || !p.start || !p.end) {
        return (
          <Path
            key={i}
            d={p.d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={p.type === "marker" ? 0.6 : 1}
            strokeDasharray={p.type === "marker" ? "5,3" : null}
          />
        );
      }
  
      // Обработка стрелок
      const angle = Math.atan2(p.end.y - p.start.y, p.end.x - p.start.x);
      const arrowLength = 15;
      const arrowAngle = Math.PI / 6;
  
      const x1 = p.end.x - arrowLength * Math.cos(angle - arrowAngle);
      const y1 = p.end.y - arrowLength * Math.sin(angle - arrowAngle);
  
      const x2 = p.end.x - arrowLength * Math.cos(angle + arrowAngle);
      const y2 = p.end.y - arrowLength * Math.sin(angle + arrowAngle);
  
      return (
        <React.Fragment key={i}>
          <Path
            d={p.d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={`M ${p.end.x},${p.end.y} L ${x1},${y1} M ${p.end.x},${p.end.y} L ${x2},${y2}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </React.Fragment>
      );
    });
  };

  return (
    <ScrollView
      scrollEnabled={!eyedropperActive}
      style={{ flex: 1, backgroundColor: isDark ? "#0F111E" : "#EAF0FF" }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon color={isDark ? "#16DBBE" : "#16A085"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#000" }]}>
          Создание мема
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Выбрать</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pickRandomTemplate}>
          <Text style={styles.buttonText}>🎲 Рандом</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FF8C69" }]}
          onPress={clearDraft}
        >
          <Text style={styles.buttonText}>Очистить</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: isDark ? "#fff" : "#000" }]}>
        Или выбери шаблон:
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {memeTemplates.map((tpl) => (
          <TouchableOpacity
            key={tpl.id}
            onPress={() => setImage(tpl.uri)}
            style={styles.templateWrapper}
          >
            <Image source={{ uri: tpl.uri }} style={styles.template} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <GLView
  style={{ width: 1, height: 1, opacity: 0 }}
  onContextCreate={(gl) => {
    const ctx = new Expo2DContext(gl);
    glContextRef.current = ctx;
  }}
/>

      <ScrollView horizontal style={{ marginBottom: 8 }}>
        {filterOptions.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ marginRight: 8 }}>
            <FilteredImage
              uri={image || "https://via.placeholder.com/60"}
              filter={f}
              style={styles.filterPreview}
            />
            <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 12, textAlign: "center" }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
        <View
          ref={imageRef}
          style={styles.previewContainer}
          onLayout={() => {
            imageRef.current?.measureInWindow((x, y, width, height) => {
              setImageLayout({ x, y, width, height });
            });
          }}
        >
          {image ? (
            <FilteredImage uri={image} filter={filter} style={styles.image} />
          ) : (
            <View
              style={[
                styles.emptyPlaceholder,
                { backgroundColor: isDark ? "#1B2030" : "#f2f6ff" },
              ]}
            >
              <Text style={{ color: isDark ? "#ccc" : "#888" }}>
                Выберите картинку
              </Text>
            </View>
          )}

{magnifierVisible && image && (
  <View
    style={{
      position: "absolute",
      left: magnifierPos.x - 60,
      top: magnifierPos.y - 60,
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: "#16DBBE",
      overflow: "hidden",
      zIndex: 1000,
    }}
  >
    <PixelPicker
      imageUri={image}
      x={Math.floor(magnifierPos.x)}
      y={Math.floor(magnifierPos.y)}
      size={120}
      zoom={3}
      onColorPicked={(color) => setBrushColor(color)}
    />
  </View>
)}

{eyedropperActive && (
  <View style={{ position: 'absolute', top: 100, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, zIndex: 1000 }}>
    <Text style={{ color: '#fff', fontSize: 12 }}>
      Отладка:{'\n'}
      Координаты: {Math.round(magnifierPos.x)}, {Math.round(magnifierPos.y)}{'\n'}
      Размер изображения: {imageLayout.width}x{imageLayout.height}
    </Text>
  </View>
)}

          {/* Рисунки и линии */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg style={StyleSheet.absoluteFill}>
              {renderDrawingPaths()}
              {isDrawingMode && (
  <AnimatedPath
    animatedProps={animatedPathProps}
    strokeWidth={brushSize}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeOpacity={brushType === "marker" ? 0.6 : 1}
    strokeDasharray={
      brushType === "marker"
        ? "5,3"
        : brushType === "arrow"
        ? "10,5"
        : null
    }
    stroke={brushColor && brushColor.startsWith('#') && 
           (brushColor.length === 7 || brushColor.length === 9) 
           ? brushColor 
           : "#FFFFFF"}
  />
)}
            </Svg>
          </View>

          {/* Текстовые блоки */}
          {image &&
            textBlocks.map((t) => (
              <DraggableText
                key={t.id}
                id={t.id}
                text={t.text}
                fontSize={t.fontSize}
                color={t.color}
                fontFamily={t.fontFamily}
                background={t.background}
                backgroundColor={t.backgroundColor}
                startX={t.x}
                startY={t.y}
                onOpenEditor={(block) => {
                  setSelectedText({
                    ...block,
                    background: t.background,
                    backgroundColor: t.backgroundColor,
                  });
                  setIsTextModalVisible(true);
                }}
              />
            ))}

          {/* Стикеры */}
          {image &&
            stickers.map((s) => (
              <Sticker key={s.id} emoji={s.emoji} initialX={80} initialY={80} />
            ))}

          {/* Инструменты рисования */}
          {isDrawingMode && (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {/* Верхняя панель */}
              <View style={styles.topToolbar}>
                <TouchableOpacity onPress={handleUndo}>
                  <Icon name="undo" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBrushType}>
                  <Icon name={getBrushIcon()} size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={clearDrawingPaths}>
                  <Icon name="delete" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleColorPicker}>
                  <Icon name="color-lens" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Ползунок кисти */}
              {!isDrawing.value && (
                <View style={styles.brushSliderContainer}>
                  <View
                    ref={sliderTrackRef}
                    style={styles.brushSliderTrack}
                    onLayout={onSliderLayout}
                    {...panResponder.panHandlers}
                  >
                    <View
                      style={[
                        styles.brushSliderProgress,
                        { height: `${((brushSize - 1) / (30 - 1)) * 100}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.brushSliderThumb,
                        {
                          bottom: `${((brushSize - 1) / (30 - 1)) * 100}%`,
                          width: isSliding ? brushSize * 1.5 : 20,
                          height: isSliding ? brushSize * 1.5 : 20,
                          borderRadius: isSliding ? brushSize * 0.75 : 10,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Цветовая палитра */}
              {showColorPicker && !isDrawing.value && (
                <View style={styles.bottomPalette}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.paletteContent}
                  >
                    <TouchableOpacity
                      onPress={activateEyedropper}
                      onLongPress={activateEyedropper}
                      delayLongPress={300}
                    >
                      <View
                        style={[
                          styles.colorBox,
                          {
                            backgroundColor: "#fff",
                            justifyContent: "center",
                            alignItems: "center",
                            borderColor: eyedropperActive ? "#16DBBE" : "#fff",
                          },
                        ]}
                      >
                        <Icon name="colorize" size={20} color="#000" />
                      </View>
                    </TouchableOpacity>

                    {[
                      "#ffffff", "#000000", "#FF0000", "#00FF00", "#0000FF",
                      "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                      "#FFC0CB", "#008000", "#800000", "#000080", "#808080",
                      "#A52A2A", "#FFD700", "#DA70D6", "#FF6347", "#40E0D0",
                      "#EE82EE", "#F5DEB3", "#9ACD32", "#FF4500", "#6A5ACD",
                    ].map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => handleColorSelect(color)}
                      >
                        <View style={[styles.colorBox, { backgroundColor: color }]} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* область пипетки */}
              {eyedropperActive && (
                <View
                  style={StyleSheet.absoluteFill}
                  pointerEvents="auto"
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={handleTouchMove}
                  onResponderMove={handleTouchMove}
                  onResponderRelease={handleTouchEnd}
                />
              )}

              {/* Область для жестов рисования */}
              {isDrawingMode && !eyedropperActive ? (
                <GestureDetector gesture={pan}>
                  <View style={StyleSheet.absoluteFill} />
                </GestureDetector>
              ) : null}
            </View>
          )}
        </View>
      </ViewShot>

      <TextEditModal
        visible={isTextModalVisible}
        textBlock={selectedText}
        onClose={() => {
          setIsTextModalVisible(false);
          setSelectedText(null);
        }}
        onChange={(updatedText) => {
          setTextBlocks((prev) =>
            prev.map((t) =>
              t.id === updatedText.id ? {
                ...t,
                text: updatedText.text,
                fontSize: updatedText.fontSize,
                color: updatedText.color,
                fontFamily: updatedText.fontFamily,
                background: updatedText.background,
                backgroundColor: updatedText.backgroundColor,
                x: updatedText.x || t.x,
                y: updatedText.y || t.y,
              } : t
            )
          );
          setIsTextModalVisible(false);
          setSelectedText(null);
        }}
      />

      <View style={styles.bottomMenu}>
        <TouchableOpacity 
          style={[styles.menuButton, (!image || isDrawingMode) && styles.disabledButton]} 
          onPress={addTextBlock}
          disabled={!image || isDrawingMode}
        >
          <Text style={[styles.menuText, (!image || isDrawingMode) && styles.disabledText]}>
            ✍️ Текст
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuButton, !image && styles.disabledButton]} 
          onPress={() => {
            if (eyedropperActive) {
              setEyedropperActive(false);
              setMagnifierVisible(false);
            }
            setIsDrawingMode((prev) => !prev);
            setShowColorPicker(false);
          }}
          disabled={!image}
        >
          <Text style={[styles.menuText, !image && styles.disabledText]}>
            {isDrawingMode ? "✖️ Закончить рисование" : "🎨 Рисовать"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuButton, (!image || isDrawingMode) && styles.disabledButton]} 
          onPress={() => Alert.alert("Стикеры", "Добавление стикеров")}
          disabled={!image || isDrawingMode}
        >
          <Text style={[styles.menuText, (!image || isDrawingMode) && styles.disabledText]}>
            🎭 Стикеры
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, (!image || isLoading) && styles.buttonDisabled]}
        onPress={saveMeme}
        disabled={!image || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "⏳ Сохранение..." : "💾 Сохранить мем"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bottomMenu: {
    flexDirection: "row",
    marginBottom: 13,
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#1B2030",
    borderRadius: 12,
    marginTop: 12,
  },
  bottomPalette: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 10,
    borderRadius: 12,
    zIndex: 10,
    maxHeight: 60,
  },
  paletteContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  colorBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#fff",
  },
  brushSliderContainer: {
    position: "absolute",
    left: 15,
    top: 140,
    zIndex: 10,
  },
  brushSliderTrack: {
    width: 6,
    height: 125,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    position: "relative",
  },
  brushSliderThumb: {
    position: "absolute",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#16DBBE",
    left: -7,
    marginTop: -10,
  },
  brushSliderProgress: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#16DBBE",
    borderRadius: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#888",
  },
  topToolbar: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 8,
    borderRadius: 12,
    marginHorizontal: 20,
    zIndex: 10,
  },
  menuButton: { padding: 8 },
  menuText: { color: "#fff", fontWeight: "700" },
  container: { alignItems: "center", padding: 16, paddingTop: 20 },
  header: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  controlsRow: { width: "100%", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  button: { backgroundColor: "#16DBBE", padding: 10, borderRadius: 10, marginBottom: 8, minWidth: 96, alignItems: "center", marginHorizontal: 4 },
  buttonDisabled: { backgroundColor: "#888", opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
  subtitle: { fontSize: 15, marginBottom: 9, alignSelf: "flex-start" },
  templateWrapper: { marginRight: 10, borderRadius: 8, marginBottom: 9, overflow: "hidden" },
  template: { width: 100, height: 100 },
  previewContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  emptyPlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  filterPreview: { width: 60, height: 60, borderRadius: 8, overflow: "hidden" },
});

export default CreateMemeScreen;
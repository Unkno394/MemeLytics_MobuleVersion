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
    const asset = Asset.fromURI(uri);
    await asset.downloadAsync();
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

// DraggableText с отключенными жестами в режиме рисования
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
  containerWidth = SCREEN_WIDTH,
  containerHeight = SCREEN_WIDTH,
  isDrawingMode = false,
}) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const savedX = useSharedValue(startX);
  const savedY = useSharedValue(startY);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const textRef = useRef(null);
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });

  const TOP_PANEL_HEIGHT = 120;
  const BOTTOM_PANEL_HEIGHT = 100;
  const SIDE_PANEL_WIDTH = 50;

  const onTextLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setTextDimensions({ width, height });
  };

  const clampToContainer = (x, y, currentScale) => {
    'worklet';
    const scaledWidth = textDimensions.width * currentScale;
    const scaledHeight = textDimensions.height * currentScale;
    
    const minX = -SIDE_PANEL_WIDTH;
    const maxX = containerWidth + SIDE_PANEL_WIDTH;
    
    const minY = -TOP_PANEL_HEIGHT;
    const maxY = containerHeight + BOTTOM_PANEL_HEIGHT - scaledHeight;
    
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  // Отключаем жесты в режиме рисования
  const panGesture = Gesture.Pan()
    .enabled(!disabled && !isDrawingMode)
    .onBegin(() => {
      'worklet';
      if (disabled || isDrawingMode) return;
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (disabled || isDrawingMode) return;
      
      const newX = savedX.value + e.translationX;
      const newY = savedY.value + e.translationY;
      
      const clamped = clampToContainer(newX, newY, scale.value);
      
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!disabled && !isDrawingMode)
    .hitSlop(250)
    .onBegin(() => {
      'worklet';
      if (disabled || isDrawingMode) return;
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (disabled || isDrawingMode) return;
      const newScale = Math.max(0.5, Math.min(4, savedScale.value * e.scale));
      scale.value = newScale;
      
      const clamped = clampToContainer(translateX.value, translateY.value, newScale);
      
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    });

  const rotationGesture = Gesture.Rotation()
    .enabled(!disabled && !isDrawingMode)
    .hitSlop(250)
    .onBegin(() => {
      'worklet';
      if (disabled || isDrawingMode) return;
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (disabled || isDrawingMode) return;
      rotation.value = savedRotation.value + e.rotation;
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled && !isDrawingMode)
    .maxDuration(250)
    .onEnd(() => {
      'worklet';
      if (disabled || isDrawingMode) return;
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
    zIndex: 2,
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
            ref={textRef}
            onLayout={onTextLayout}
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
  
  const imageElement = <Image source={{ uri }} style={style} />;
  
  // Применяем фильтры только если они не "none"
  if (filter === "none") {
    return imageElement;
  }

  switch (filter) {
    case "grayscale":
      return <Grayscale>{imageElement}</Grayscale>;
    case "sepia":
      return <Sepia>{imageElement}</Sepia>;
    case "invert":
      return <Invert>{imageElement}</Invert>;
    case "contrast":
      return <Contrast amount={2.0}>{imageElement}</Contrast>;
    case "brightness":
      return <Brightness amount={1.4}>{imageElement}</Brightness>;
    case "saturate":
      return <Saturate amount={2.0}>{imageElement}</Saturate>;
    case "hue":
      return <HueRotate amount={Math.PI / 2}>{imageElement}</HueRotate>;
    default:
      return imageElement;
  }
};

const ScalableFilteredImage = ({ 
  filter, 
  uri, 
  style, 
  isDrawingMode = false 
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Жест панорамирования (перемещение)
  const panGesture = Gesture.Pan()
    .enabled(!isDrawingMode)
    .onBegin(() => {
      'worklet';
      if (isDrawingMode) return;
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (isDrawingMode) return;
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    });

  // Жест масштабирования
  const pinchGesture = Gesture.Pinch()
    .enabled(!isDrawingMode)
    .onBegin(() => {
      'worklet';
      if (isDrawingMode) return;
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (isDrawingMode) return;
      scale.value = Math.max(0.5, Math.min(3, savedScale.value * e.scale));
    });

  // Жест вращения
  const rotationGesture = Gesture.Rotation()
    .enabled(!isDrawingMode)
    .onBegin(() => {
      'worklet';
      if (isDrawingMode) return;
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (isDrawingMode) return;
      rotation.value = savedRotation.value + e.rotation;
    });

  // Комбинируем жесты
  const composedGesture = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  if (!uri) return <View style={[style, { backgroundColor: "#ccc" }]} />;
  
  const imageElement = (
    <Animated.View style={[style, animatedStyle, { overflow: 'hidden' }]}>
      <Image 
        source={{ uri }} 
        style={{ 
          width: '100%', 
          height: '100%',
          resizeMode: 'contain'
        }} 
      />
    </Animated.View>
  );
  
  // Применяем фильтры только если они не "none"
  if (filter === "none") {
    return (
      <GestureDetector gesture={composedGesture}>
        {imageElement}
      </GestureDetector>
    );
  }

  const filteredElement = (() => {
    switch (filter) {
      case "grayscale":
        return <Grayscale>{imageElement}</Grayscale>;
      case "sepia":
        return <Sepia>{imageElement}</Sepia>;
      case "invert":
        return <Invert>{imageElement}</Invert>;
      case "contrast":
        return <Contrast amount={2.0}>{imageElement}</Contrast>;
      case "brightness":
        return <Brightness amount={1.4}>{imageElement}</Brightness>;
      case "saturate":
        return <Saturate amount={2.0}>{imageElement}</Saturate>;
      case "hue":
        return <HueRotate amount={Math.PI / 2}>{imageElement}</HueRotate>;
      default:
        return imageElement;
    }
  })();

  return (
    <GestureDetector gesture={composedGesture}>
      {filteredElement}
    </GestureDetector>
  );
};

const CreateMemeScreen = () => {
  const [fontsLoaded] = useAppFonts();
  const { isDark } = useContext(ThemeContext);
  const navigation = useNavigation();
  const magnifierRef = useRef(null);
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const glContextRef = useRef(null);
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
  const lastPickedColor = useRef("#FFFFFF");
  const [imageDimensions, setImageDimensions] = useState({ 
    width: SCREEN_WIDTH, 
    height: SCREEN_WIDTH 
  });

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
  const updateImageDimensions = (uri) => {
    if (!uri) {
      setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
      return;
    }
    
    Image.getSize(uri, (width, height) => {
      // Вычисляем высоту на основе реальных пропорций изображения
      const aspectRatio = height / width;
      const calculatedHeight = SCREEN_WIDTH * aspectRatio;
      
      // Устанавливаем минимальную и максимальную высоту для удобства
      const minHeight = 200; // минимальная высота
      const maxHeight = SCREEN_WIDTH * 2; // максимальная высота (в 2 раза больше ширины)
      
      setImageDimensions({
        width: SCREEN_WIDTH,
        height: Math.max(minHeight, Math.min(maxHeight, calculatedHeight))
      });
    }, (error) => {
      console.error("Ошибка получения размеров изображения:", error);
      setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
    });
  };
  
  const handleTouchMove = (e) => {
    if (!image || !imageLayout.width || !imageDimensions.height) return;
  
    const { pageX, pageY } = e.nativeEvent;
    const localX = pageX - imageLayout.x;
    const localY = pageY - imageLayout.y;
  
    const isInsideImage =
      localX >= 0 && localX <= imageLayout.width &&
      localY >= 0 && localY <= imageDimensions.height;
    if (!isInsideImage) return;
  
    Image.getSize(image, (imgW, imgH) => {
      const scale = Math.min(
        imageLayout.width / imgW,
        imageDimensions.height / imgH
      );
  
      const drawW = imgW * scale;
      const drawH = imgH * scale;
  
      const offsetX = (imageLayout.width - drawW) / 2;
      const offsetY = (imageDimensions.height - drawH) / 2;
  
      const normX = (localX - offsetX) / drawW;
      const normY = (localY - offsetY) / drawH;
  
      const imgX = Math.round(normX * imgW);
      const imgY = Math.round(normY * imgH);
  
      setMagnifierPos({ x: imgX, y: imgY });
    });
  };

  const handleTouchEnd = () => {
    const color = magnifierRef.current?.getPickedColor() || lastPickedColor.current;
    if (color) {
      setBrushColor(color);
      console.log("🎨 Выбранный цвет:", color);
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

 // 3. Исправляем useEffect для GL контекста (добавляем imageLayout.width)
useEffect(() => {
  if (!image || !glContextRef.current || !imageLayout.width || !imageDimensions.height) return;

  const loadImageToGL = async () => {
    try {
      const ctx = glContextRef.current;
      if (!ctx) return;

      const asset = Asset.fromURI(image);
      await asset.downloadAsync();

      if (!asset.localUri) {
        console.error("❌ Не удалось загрузить локальный URI");
        return;
      }

      Image.getSize(asset.localUri, (width, height) => {
        ctx.clearRect(0, 0, SCREEN_WIDTH, imageDimensions.height);
        
        const scale = Math.min(SCREEN_WIDTH / width, imageDimensions.height / height);
        const drawWidth = width * scale;
        const drawHeight = height * scale;
        const x = (SCREEN_WIDTH - drawWidth) / 2;
        const y = (imageDimensions.height - drawHeight) / 2;
        
        ctx.drawImage(asset.localUri, x, y, drawWidth, drawHeight);
        ctx.flush();
        console.log("✅ Изображение загружено в GLContext");
      });
      
    } catch (err) {
      console.error("Ошибка при drawImage в GLContext:", err);
    }
  };

  loadImageToGL();
}, [image, glContextRef.current, imageDimensions.height, imageLayout.width]);

  useEffect(() => {
    if (brushColor && brushColor.startsWith('#') && (brushColor.length === 7 || brushColor.length === 9)) {
      currentPathColor.value = brushColor;
    } else {
      currentPathColor.value = "#FFFFFF";
    }
  }, [brushColor]);

  const startPoint = useSharedValue(null);

  // Жест для рисования
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
            
            // Обновляем размеры если есть изображение
            if (draft.image) {
              updateImageDimensions(draft.image);
            }
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
    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      setImage(selectedImage);
      updateImageDimensions(selectedImage);
    }
  };
  
  const pickRandomTemplate = () => {
    const random = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
    setImage(random.uri);
    updateImageDimensions(random.uri);
  };

  const clearDraft = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
    setImage(null);
    setStickers([]);
    setTextBlocks([]);
    setHashtags("");
    setFilter("none");
    setDrawingPaths([]);
    
    // Сбрасываем размеры к квадратным
    setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
    
    setIsDrawingMode(false);
    setShowColorPicker(false);
    setEyedropperActive(false);
    setMagnifierVisible(false);
    
    setBrushType("pen");
    setBrushColor("#ffffff");
    setBrushSize(5);
    isDrawing.value = false;
    currentPathD.value = "";
    
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
    if (color && color.startsWith('#') && (color.length === 7 || color.length === 9)) {
      setBrushColor(color);
    } else {
      console.warn('Invalid color selected:', color);
      setBrushColor("#FFFFFF");
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
      const isValidColor = p.color && p.color.startsWith('#') && 
                          (p.color.length === 7 || p.color.length === 9);
      const strokeColor = isValidColor ? p.color : "#FFFFFF";
      
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
    <View style={{ flex: 1, backgroundColor: isDark ? "#0F111E" : "#EAF0FF" }}>
      <ScrollView
        scrollEnabled={!eyedropperActive}
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
  <View style={styles.buttonContent}>
    <Icon name="shuffle" size={18} color="#fff" />
    <Text style={styles.buttonText}>Рандом</Text>
  </View>
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
      onPress={() => {
        setImage(tpl.uri);
        updateImageDimensions(tpl.uri);
      }}
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

        {/* ОСНОВНОЙ КОНТЕЙНЕР */}
        <View style={styles.previewWrapper}>
  <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
    <View
      ref={imageRef}
      style={[
        styles.previewContainer,
        { height: imageDimensions.height } // Адаптивная высота
      ]}
      onLayout={() => {
        imageRef.current?.measureInWindow((x, y, width, height) => {
          setImageLayout({ x, y, width, height: imageDimensions.height });
        });
      }}
    >
      {/* Изображение */}
      {image ? (
        <View style={[
          styles.imageContainer,
          { height: imageDimensions.height }
        ]}>
          <ScalableFilteredImage
            filter={filter}
            uri={image}
            style={[
              styles.image,
              { height: imageDimensions.height }
            ]}
            isDrawingMode={isDrawingMode}
          />
        </View>
      ) : (
        <View
          style={[
            styles.emptyPlaceholder,
            { 
              backgroundColor: isDark ? "#1B2030" : "#f2f6ff",
              height: imageDimensions.height
            },
          ]}
        >
          <Text style={{ color: isDark ? "#ccc" : "#888" }}>
            Выберите картинку
          </Text>
        </View>
      )}
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
      containerWidth={SCREEN_WIDTH}
      containerHeight={imageDimensions.height} // Передаем адаптивную высоту
      isDrawingMode={isDrawingMode}
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

              {/* Лупа */}
              {magnifierVisible && image && (
                <View
                  style={{
                    position: "absolute",
                    left: magnifierPos.x - 60,
                    top: magnifierPos.y - 60,
                    width: 120,
                    height: 120,
                    zIndex: 10,
                  }}
                >
                  <Magnifier
                    ref={magnifierRef}
                    imageUri={image}
                    x={Math.floor(magnifierPos.x)}
                    y={Math.floor(magnifierPos.y)}
                    size={120}
                    zoom={3}
                    onColorPicked={(color) => {
                      lastPickedColor.current = color;
                    }}
                  />
                </View>
              )}

              {/* Рисунки */}
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

              {/* Стикеры */}
              {image &&
                stickers.map((s) => (
                  <Sticker key={s.id} emoji={s.emoji} initialX={80} initialY={80} />
                ))}
            </View>
          </ViewShot>

          {/* ИНСТРУМЕНТЫ РИСОВАНИЯ - ОТДЕЛЬНО ОТ ViewShot */}
          {isDrawingMode && (
            <>
              {/* Панель инструментов */}
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
                <TouchableOpacity onPress={() => setIsDrawingMode(false)}>
                  <Icon name="close" size={26} color="#E0E0E0" />
                </TouchableOpacity>
              </View>

              {/* Ползунок кисти */}
              {!isDrawing.value && !eyedropperActive && (
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
              {showColorPicker && !isDrawing.value && !eyedropperActive && (
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

              {/* Область для рисования - ТОЛЬКО ДЛЯ ЖЕСТОВ */}
              {isDrawingMode && !eyedropperActive && (
                <GestureDetector gesture={pan}>
                  <View style={styles.drawingArea} />
                </GestureDetector>
              )}

              {/* Область для пипетки */}
              {eyedropperActive && (
                <View
                  style={styles.drawingArea}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={handleTouchMove}
                  onResponderMove={handleTouchMove}
                  onResponderRelease={handleTouchEnd}
                />
              )}
            </>
          )}
        </View>

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

        {/* Нижнее меню */}
        <View style={styles.bottomMenu}>
  <TouchableOpacity 
    style={[styles.menuButton, (!image) && styles.disabledButton]} 
    onPress={addTextBlock}
    disabled={!image}
  >
    <View style={styles.menuItem}>
      <Icon name="text-fields" size={16} color={!image ? "#888" : "#fff"} />
      <Text style={[styles.menuText, (!image) && styles.disabledText]}>Текст</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={[styles.menuButton, !image && styles.disabledButton]} 
    onPress={() => {
      if (image) {
        setIsDrawingMode(true);
        setShowColorPicker(false);
      }
    }}
    disabled={!image}
  >
    <View style={styles.menuItem}>
      <Icon name="brush" size={16} color={!image ? "#888" : "#fff"} />
      <Text style={[styles.menuText, !image && styles.disabledText]}>Рисовать</Text>
    </View>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={[styles.menuButton, (!image) && styles.disabledButton]} 
    onPress={() => Alert.alert("Стикеры", "Добавление стикеров")}
    disabled={!image}
  >
    <View style={styles.menuItem}>
      <Icon name="emoji-emotions" size={16} color={!image ? "#888" : "#fff"} />
      <Text style={[styles.menuText, (!image) && styles.disabledText]}>Стикеры</Text>
    </View>
  </TouchableOpacity>
</View>

<TouchableOpacity
  style={[styles.button, (!image || isLoading) && styles.buttonDisabled]}
  onPress={saveMeme}
  disabled={!image || isLoading}
>
  <View style={styles.buttonContent}>
    <Icon name="cloud-upload" size={18} color="#fff" />
    <Text style={styles.buttonText}>
      {isLoading ? "Сохранение..." : "Выложить"}
    </Text>
  </View>
</TouchableOpacity>


        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  drawingArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  previewWrapper: {
    position: 'relative',
    width: SCREEN_WIDTH,
  },
  previewContainer: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  image: { 
    width: "100%", 
    height: "100%" 
  },
  emptyPlaceholder: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: "#fff", 
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: "#fff", 
    fontWeight: "700",
    marginLeft: 6,
  },
  menuButton: { 
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
    zIndex: 20, // ВЫШЕ области рисования
  },
  container: { alignItems: "center", padding: 16, paddingTop: 20 },
  header: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  controlsRow: { width: "100%", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  button: { backgroundColor: "#16DBBE", padding: 10, borderRadius: 10, marginBottom: 8, minWidth: 96, alignItems: "center", marginHorizontal: 4 },
  buttonDisabled: { backgroundColor: "#888", opacity: 0.7 },
  subtitle: { fontSize: 15, marginBottom: 9, alignSelf: "flex-start" },
  templateWrapper: { marginRight: 10, borderRadius: 8, marginBottom: 9, overflow: "hidden" },
  template: { width: 100, height: 100 },
  filterPreview: { width: 60, height: 60, borderRadius: 8, overflow: "hidden" },
});

export default CreateMemeScreen;
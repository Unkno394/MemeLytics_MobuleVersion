import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  LogBox,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSharedValue } from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";
import Icon from 'react-native-vector-icons/MaterialIcons';
import ViewShot from "react-native-view-shot";
import CustomAlert from '../../components/CustomAlert';
import Magnifier from "../../components/magnifier.js";
import TextEditModal from "../../components/TextEditModal";
import { useAppFonts } from "../../src/assets/fonts/fonts";
import { ThemeContext } from "../../src/context/ThemeContext";

// Импортируем оптимизированные компоненты
import StickerModal from '../../components/StickerModal';
import DraggableText from '../../components/DraggableText';
import DrawingCanvas from '../../components/DrawingCanvas';
import DrawingTools from '../../components/DrawingTools';
import ScalableFilteredImage from '../../components/ScalableFilteredImage';
import StaticFilteredImage from '../../components/StaticFilteredImage';

LogBox.ignoreLogs([
  "Warning: Cannot update a component from inside the function body of a different component",
]);

const SCREEN_WIDTH = Dimensions.get("window").width;
const DRAFT_KEY = "MEME_DRAFT_v3";

// Дебаунс функция
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const memeTemplates = [
  { 
    id: "1", 
    uri: "https://www.meme-arsenal.com/memes/048348d157ac1073c62e7a3773555349.jpg",
    name: "Умная собака"
  },
  { 
    id: "2", 
    uri: "https://i.imgur.com/k2P9l.jpg", // Оставляем один старый
    name: "Два стула" 
  },
  { 
    id: "3", 
    uri: "https://www.meme-arsenal.com/memes/b1324f80bcabe41001eda331da990721.jpg",
    name: "Смена мнения"
  },
  { 
    id: "4", 
    uri: "https://www.meme-arsenal.com/memes/626826c0f062900009bd8cef819c79c9.jpg",
    name: "Парень смотрит"
  },
  { 
    id: "5", 
    uri: "https://www.meme-arsenal.com/memes/0e0c408c69f65612eda7e2bd658a6cca.jpg",
    name: "Две кнопки"
  },
  { 
    id: "6", 
    uri: "https://www.meme-arsenal.com/memes/5ffa674b455877fec179123b6dac0694.jpg",
    name: "Джонни Депп"
  },
  { 
    id: "7", 
    uri: "https://sun9-49.userapi.com/s/v1/if2/YZHH8WfjV5iIfKVRtid4ySc2DR2rtBkn9Gaf8JmvWX-kDPSsw9mzwauaXMdwH-aOZvq1LlYX3NzZ-CIrq_TXzusa.jpg?quality=95&as=32x14,48x21,72x31,108x46,160x69,240x103,360x155,480x206,540x232,640x275,720x309,726x312&from=bu&cs=726x0",
    name: "Сердитый кот"
  },
  { 
    id: "8", 
    uri: "https://sun9-66.userapi.com/s/v1/ig2/h3GEgvJbRISTBsSgt_j-Ku4Eq-JOWwejNqd1a1RFjwggLZKBW-28Ddd8CwoC0mYQ_PTf4-xjJnt-CN2n_ZkjyS-5.jpg?quality=95&as=32x56,48x84,72x126,108x189,160x279,240x419,360x629,480x838,540x943,640x1117,720x1257,1080x1886,1280x2235,1284x2242&from=bu&u=iD-6b_GDLq6cLnY29tpA0UhM523w9TmkECyB7TFJ4zs&cs=640x0",
    name: "Сова"
  },
  { 
    id: "9", 
    uri: "https://sun9-51.userapi.com/s/v1/ig2/vOmLqUXKef9HUkqloI8pppwxqY2dTSd-7cw0FyXH2Ehr3X22VnYnYJXDlYWk0E6sIC4MZkYznAZOID8V3gDptjxr.jpg?quality=95&as=32x52,48x77,72x116,108x174,160x258,240x387,360x580,480x773,540x870,640x1031,720x1160,1080x1740&from=bu&u=UwMtahY3bDJTvITg3Tda7aGsx4U4l3C228FSoxRDV38&cs=640x0",
    name: "Парень с телефоном"
  },
  { 
    id: "10", 
    uri: "https://sun9-71.userapi.com/s/v1/ig2/GDqG6_R0mXwV351rV8Sx7g6IixcEGeyItd05EVBJOSrTVXyRr1h549lufpBw7SbXvnOSrPi9KSQwOX5Wf9IX1ogj.jpg?quality=95&as=32x40,48x60,72x89,108x134,160x199,240x298,360x447,480x596,540x670,640x794,720x894,928x1152&from=bu&u=R-icafP4YeIrb2quGJDiQlQt_sw1hOZ8yA7sNGCTVj8&cs=928x0",
    name: "Мем с деньгами"
  },
  { 
    id: "11", 
    uri: "https://sun9-63.userapi.com/s/v1/ig2/7TYN9AapeAx8KYszA6N518zglctrmZ0R3tgWQnmCb0Z_NCS5mPXvgTpeUgTjtAmNHIIYHzZWnUiptKoYYZfmfwq6.jpg?quality=95&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640&from=bu&cs=640x0",
    name: "Смайлик"
  },
  {
    id: '12',
    uri: 'https://images.genius.com/5886d958b593a234b63ef5f8b643c359.500x500x1.jpg',
    name:'idk'
  }
];

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

const CreateMemeScreen = () => {
  // Состояния
  const [editMode, setEditMode] = useState(false);
  const [incomingImageUri, setIncomingImageUri] = useState(null);
  const [fontsLoaded] = useAppFonts();
  const { isDark } = useContext(ThemeContext);
  const navigation = useNavigation();
  
  // Рефы
  const magnifierRef = useRef(null);
  const glContextRef = useRef(null);
  const imageRef = useRef(null);
  const viewShotRef = useRef();
  const [screenPos, setScreenPos] = useState({ x: SCREEN_WIDTH / 2, y: 200 });
  // Shared values для анимаций
  const isDrawing = useSharedValue(false);
  const magnifierPosRef = useRef({ x: 0, y: 0 });
  // Состояния UI
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
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ 
    width: SCREEN_WIDTH, 
    height: SCREEN_WIDTH 
  });
  const params = useLocalSearchParams();
  const [isStickerModalVisible, setIsStickerModalVisible] = useState(false);
const [selectedEmoji, setSelectedEmoji] = useState(null);
  const lastPickedColor = useRef("#FFFFFF");
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const magnifierUpdateTimeout = useRef(null);
  const lastMagnifierCoords = useRef({ x: 0, y: 0 });
  const imageSizeCache = useRef({ width: 0, height: 0 });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: []
  });
  const [isDrawingActive, setIsDrawingActive] = useState(false);

  // Константы
  const filterOptions = useMemo(() => [
    "none", "grayscale", "sepia", "invert", "contrast", 
    "brightness", "saturate", "hue"
  ], []);

  // Дебаунсированные функции
  const saveDraftDebounced = useMemo(
    () => debounce(async (payload) => {
      try {
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("Save draft error:", e);
      }
    }, 500),
    []
  );
const handleSaveDrawing = useCallback(() => {
setIsDrawingMode(false);
  setIsDrawingActive(false);
  setShowColorPicker(false);
  setEyedropperActive(false);
  setMagnifierVisible(false);
}, [drawingPaths.length]);

useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Проверяем параметры на необходимость очистки
    if (params?.clearDraft === 'true') {
      clearDraft();
    }
  });

  return unsubscribe;
}, [navigation, clearDraft]);

  // Дебаунсированное обновление координат лупы
  const updateMagnifierCoordsDebounced = useMemo(
    () => debounce((imgX, imgY) => {
      // Проверяем, изменились ли координаты значительно
      const deltaX = Math.abs(imgX - lastMagnifierCoords.current.x);
      const deltaY = Math.abs(imgY - lastMagnifierCoords.current.y);
      
      if (deltaX > 2 || deltaY > 2) { // Обновляем только при значительном изменении
        lastMagnifierCoords.current = { x: imgX, y: imgY };
        setMagnifierPos({ x: imgX, y: imgY });
        
        if (magnifierRef.current?.updateCoords) {
          magnifierRef.current.updateCoords(imgX, imgY);
        }
      }
    }, 16), // ~60fps
    []
  );

  // Alert функции
  const showAlert = useCallback((title, message, buttons) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  }, []);

  const showError = useCallback((message) => {
    showAlert('Ошибка', message, [
      { text: 'OK', onPress: () => setAlertVisible(false) }
    ]);
  }, [showAlert]);

  const showSuccess = useCallback((message, onOk) => {
    showAlert('Успех', message, [
      { 
        text: 'OK', 
        onPress: () => {
          setAlertVisible(false);
          setTimeout(() => {
            onOk?.();
          }, 100);
        }
      }
    ]);
  }, [showAlert]);

  // Обновление размеров изображения
  const updateImageDimensions = useCallback((uri) => {
    if (!uri) {
      setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
      return;
    }
    
    Image.getSize(uri, (width, height) => {
      // Кэшируем размеры изображения
      imageSizeCache.current = { width, height };
      
      const aspectRatio = height / width;
      const calculatedHeight = SCREEN_WIDTH * aspectRatio;
      const minHeight = 200;
      const maxHeight = SCREEN_WIDTH * 2;
      
      setImageDimensions({
        width: SCREEN_WIDTH,
        height: Math.max(minHeight, Math.min(maxHeight, calculatedHeight))
      });
    }, (error) => {
      console.error("Ошибка получения размеров изображения:", error);
      setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
    });
  }, []);

  // Обновляем imageLayout при изменении imageDimensions
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.measureInWindow((x, y, width, height) => {
        console.log('Updating imageLayout from useEffect:', { x, y, width, height, imageDimensions });
        setImageLayout({ x, y, width, height: imageDimensions.height });
      });
    }
  }, [imageDimensions]);

  // Загрузка черновика
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
          
          if (draft.image) {
            updateImageDimensions(draft.image);
          }
        }
      } catch (e) {
        console.warn("Load draft error:", e);
      }
    })();
  }, [updateImageDimensions]);
const handleSelectEmoji = useCallback((emoji) => {
  // Создаем текстовый блок с эмодзи
  const newId = textBlocks.length
    ? Math.max(...textBlocks.map((t) => Number(t.id) || 0)) + 1
    : 1;

  const newBlock = {
    id: newId,
    text: emoji,
    fontSize: Math.max(40, fontSize), // Эмодзи обычно больше
    color: fontColor,
    fontFamily,
    x: SCREEN_WIDTH / 2 - 20, // Центрируем
    y: imageDimensions.height / 2 - 20,
    scale: 1,
    background: false,
    backgroundColor: "#ffffff",
  };

  setTextBlocks([...textBlocks, newBlock]);
  // Просто закрываем модалку, без алерта
}, [textBlocks, fontSize, fontColor, fontFamily, imageDimensions]);

const handleStickers = useCallback(() => {
  if (!image) {
    showError("Сначала выберите изображение");
    return;
  }
  setIsStickerModalVisible(true);
}, [image, showError]);

  // Сохранение черновика
  useEffect(() => {
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
    saveDraftDebounced(payload);
  }, [
    image, filter, fontSize, fontColor, fontFamily, 
    stickers, textBlocks, hashtags, drawingPaths, saveDraftDebounced
  ]);

  // Обработчики изображений
  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      setImage(selectedImage);
      updateImageDimensions(selectedImage);
    }
  }, [updateImageDimensions]);

  const pickRandomTemplate = useCallback(() => {
    const random = memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
    setImage(random.uri);
    updateImageDimensions(random.uri);
  }, [updateImageDimensions]);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
    setImage(null);
    setStickers([]);
    setTextBlocks([]);
    setHashtags("");
    setFilter("none");
    setDrawingPaths([]);
    setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
    setIsDrawingMode(false);
    setShowColorPicker(false);
    setEyedropperActive(false);
    setMagnifierVisible(false);
    setBrushType("pen");
    setBrushColor("#ffffff");
    setBrushSize(5);
    isDrawing.value = false;
    showSuccess("Черновик удалён");
  }, [showSuccess]);

  // Обработчики текста
  const addTextBlock = useCallback(() => {
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
  }, [textBlocks, fontSize, fontColor, fontFamily]);

  // Обработчики рисования
  const addPath = useCallback((d, color, type, start, end) => {
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
  }, [brushSize]);

  const clearDrawingPaths = useCallback(() => {
    setDrawingPaths([]);
  }, []);

  const undoLastPath = useCallback(() => {
    if (drawingPaths.length === 0) return;
    setDrawingPaths((prev) => prev.slice(0, -1));
  }, [drawingPaths.length]);

  const handleBrushType = useCallback(() => {
    setBrushType((prev) => {
      if (prev === "pen") return "marker";
      if (prev === "marker") return "arrow";
      if (prev === "arrow") return "pen";
      return "pen";
    });
  }, []);

  const handleColorPicker = useCallback(() => {
    setShowColorPicker(prev => !prev);
  }, []);

  const handleColorSelect = useCallback((color) => {
    if (color && color.startsWith('#') && (color.length === 7 || color.length === 9)) {
      setBrushColor(color);
    } else {
      console.warn('Invalid color selected:', color);
      setBrushColor("#FFFFFF");
    }
  }, []);

  const activateEyedropper = useCallback(() => {
    if (!image) return showError("Сначала выберите изображение");
    setEyedropperActive(true);
    setMagnifierVisible(true);
    // Инициализируем позицию лупы в центре экрана
    setScreenPos({ x: SCREEN_WIDTH / 2, y: 200 });
  }, [image, showError]);

const handleTouchMove = (e) => {
  console.log('Touch move called', e.nativeEvent);
  if (!image || !imageLayout.width || !imageDimensions.height) {
    console.log('Missing requirements in move:', { image: !!image, imageLayout, imageDimensions });
    return;
  }

  const { locationX, locationY, pageX, pageY } = e.nativeEvent;
  
  // Получаем абсолютные координаты касания
  const absoluteX = pageX || (imageLayout.x + locationX);
  const absoluteY = pageY || (imageLayout.y + locationY);

  console.log('Touch move:', { locationX, locationY, pageX, pageY, absoluteX, absoluteY });
  // Обновляем позицию лупы на экране в реальном времени
  setScreenPos({ x: absoluteX, y: absoluteY });

  const localX = locationX;
  const localY = locationY;

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

    // Обновляем позицию лупы на изображении
    setMagnifierPos({ x: imgX, y: imgY });

    // Обновляем координаты внутри webview
    if (magnifierRef.current?.updateCoords) {
      magnifierRef.current.updateCoords(imgX, imgY);
    }
  });
};

const handleTouchStart = (e) => {
  console.log('Touch start called', e.nativeEvent);
  if (!image || !imageLayout.width || !imageDimensions.height) {
    console.log('Missing requirements:', { image: !!image, imageLayout, imageDimensions });
    return;
  }
  
  const { locationX, locationY, pageX, pageY } = e.nativeEvent;
  const absoluteX = pageX || (imageLayout.x + locationX);
  const absoluteY = pageY || (imageLayout.y + locationY);
  
  console.log('Touch start:', { locationX, locationY, pageX, pageY, absoluteX, absoluteY, imageLayout });
  setScreenPos({ x: absoluteX, y: absoluteY });
};

const handleTouchEnd = useCallback(() => {
  console.log('Touch end called');
  const color = magnifierRef.current?.getPickedColor();
  console.log('Picked color:', color);
  if (color) setBrushColor(color);

  setMagnifierVisible(false);
  setEyedropperActive(false);
}, []);

  // Функция для кнопки "Далее"
const handleNext = useCallback(async () => {
  if (!image) return showError("Выберите изображение для мема");
  
  setIsLoading(true);
  try {
    const uri = await viewShotRef.current.capture();
    
    console.log("📸 Итоговое изображение создано:", uri);
    
    // Переходим на экран предпросмотра с передачей ВСЕХ параметров
    router.push({
      pathname: '/previewPost',
      params: { 
        memeUri: uri,
        // Передаем реальные размеры изображения из редактора
        imageWidth: SCREEN_WIDTH,
        imageHeight: imageDimensions.height,
        // Передаем описание если есть
        initialDescription: hashtags || ""
      },
    });
  } catch (err) {
    console.error("❌ Ошибка при создании предпросмотра:", err);
    showError("Не удалось создать предпросмотр");
  } finally {
    setIsLoading(false);
  }
}, [image, imageDimensions.height, hashtags, showError]);

  // Рендер
  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0F111E" : "#EAF0FF" }}>
      <ScrollView
        scrollEnabled={!eyedropperActive}
        contentContainerStyle={styles.container}
      >
        {/* Хедер */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIcon color={isDark ? "#16DBBE" : "#16A085"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#000" }]}>
            Создание мема
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Контролы */}
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

        {/* Шаблоны */}
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

        {/* Фильтры */}
        <ScrollView horizontal style={{ marginBottom: 8 }}>
          {filterOptions.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ marginRight: 8 }}>
              <StaticFilteredImage
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

        {/* Основной контейнер */}
        <View style={styles.previewWrapper}>
          <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.previewWrapper}>
            <View
              ref={imageRef}
              style={[
                styles.previewContainer,
                { height: imageDimensions.height }
              ]}
              onLayout={() => {
                console.log('onLayout called');
                imageRef.current?.measureInWindow((x, y, width, height) => {
                  console.log('measureInWindow result:', { x, y, width, height, imageDimensions });
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

              {image && isDrawingMode && !isDrawingActive && (
<DrawingTools
  brushSize={brushSize}
  brushType={brushType}
  brushColor={brushColor}
  isDrawing={isDrawingMode}
  eyedropperActive={eyedropperActive}
  onBrushSizeChange={setBrushSize}
  onBrushTypeChange={handleBrushType}
  onColorSelect={handleColorSelect}
  onEyedropperActivate={activateEyedropper}
  onUndo={undoLastPath}
  onClear={clearDrawingPaths}
  onColorPickerToggle={handleColorPicker}
  onSaveDrawing={handleSaveDrawing} // Заменяем onDrawingModeToggle на onSaveDrawing
  showColorPicker={showColorPicker}
  containerHeight={imageDimensions.height}
/>
              )}

            {(image && (isDrawingMode || drawingPaths.length > 0)) && (
  <DrawingCanvas
    onDrawingActiveChange={setIsDrawingActive}
    brushColor={brushColor}
    brushSize={brushSize}
    brushType={brushType}
    isDrawingMode={isDrawingMode}
    eyedropperActive={eyedropperActive}
    onPathAdd={addPath}
    drawingPaths={drawingPaths}
    containerWidth={SCREEN_WIDTH}
    containerHeight={imageDimensions.height}
  />
)}

{/* Текстовые блоки - ТЕПЕРЬ НАД РИСУНКОМ */}
{image && textBlocks.map((t) => (
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
    containerHeight={imageDimensions.height}
    isDrawingMode={isDrawingMode} // <- КЛЮЧЕВОЕ: передаём флаг
    isSelected={selectedText?.id === t.id}
    onSelect={() => {
      setSelectedText(t);
      setFontSize(t.fontSize);
      setFontColor(t.color);
      setFontFamily(t.fontFamily);
      setIsTextModalVisible(true);
    }}
    onUpdate={(updates) => {
      setTextBlocks(prev => prev.map(item => 
        item.id === t.id ? { ...item, ...updates } : item
      ));
    }}
  />
))}
{eyedropperActive && (
  <PanGestureHandler
    onGestureEvent={(event) => {
      const { x, y } = event.nativeEvent;
      
      if (!image || !imageLayout.width || !imageDimensions.height) return;
      
      // Обновляем позицию лупы (используем координаты относительно контейнера)
      setScreenPos({ x: x, y: y });
      
      // Вычисляем координаты на изображении
      const localX = x;
      const localY = y;
      
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

        // Используем дебаунсированное обновление для плавности
        updateMagnifierCoordsDebounced(imgX, imgY);
      });
    }}
    onHandlerStateChange={(event) => {
      if (event.nativeEvent.state === State.END) {
        const color = magnifierRef.current?.getPickedColor();
        if (color) setBrushColor(color);
        
        setMagnifierVisible(false);
        setEyedropperActive(false);
      }
    }}
  >
    <View style={StyleSheet.absoluteFill} />
  </PanGestureHandler>
)}
{magnifierVisible && image && (
  <View
    style={{
      position: "absolute",
      left: screenPos.x - 60, // Центрируем относительно пальца
      top: screenPos.y - 60,
      width: 120,
      height: 120,
      zIndex: 1000,
      pointerEvents: "none", // Важно: лупа не должна перехватывать касания
    }}
  >
    <Magnifier
      ref={magnifierRef}
      imageUri={image}
      x={magnifierPos.x}
      y={magnifierPos.y}
      size={120}
      zoom={3}
      onColorPicked={(color) => {
        lastPickedColor.current = color;
      }}
    />
  </View>
)}
            </View>
          </ViewShot>
        </View>

        {/* Нижняя панель с кнопками (Текст, Рисование, Стикеры) */}
        <View style={styles.bottomRow}>
          <TouchableOpacity 
            style={[styles.actionButton, !image && styles.disabledButton]} 
            onPress={addTextBlock}
            disabled={!image}
          >
            <Icon name="text-fields" size={24} color={!image ? "#888" : "#fff"} />
            <Text style={[styles.actionButtonText, !image && styles.disabledText]}>Текст</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, !image && styles.disabledButton]} 
            onPress={() => setIsDrawingMode(!isDrawingMode)}
            disabled={!image}
          >
            <Icon name="brush" size={24} color={!image ? "#888" : "#fff"} />
            <Text style={[styles.actionButtonText, !image && styles.disabledText]}>Рисование</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, !image && styles.disabledButton]} 
            onPress={handleStickers}
            disabled={!image}
          >
            <Icon name="emoji-emotions" size={24} color={!image ? "#888" : "#fff"} />
            <Text style={[styles.actionButtonText, !image && styles.disabledText]}>Стикеры</Text>
          </TouchableOpacity>
        </View>

        {/* Кнопка "Далее" */}
        <TouchableOpacity
          style={[styles.nextButton, (!image || isLoading) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!image || isLoading}
        >
          <View style={styles.nextButtonContent}>
            <Icon name="arrow-forward" size={18} color="#fff" />
            <Text style={styles.nextButtonText}>
              {isLoading ? "Загрузка..." : "Далее"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Модальное окно редактирования текста */}
        <TextEditModal
          visible={isTextModalVisible}
          onClose={() => {
            setIsTextModalVisible(false);
            setSelectedText(null);
          }}
          text={selectedText}
          onSave={(updatedText) => {
            if (selectedText) {
              setTextBlocks((prev) =>
                prev.map((t) =>
                  t.id === selectedText.id
                    ? { ...t, ...updatedText }
                    : t
                )
              );
            }
            setIsTextModalVisible(false);
            setSelectedText(null);
          }}
          onDelete={() => {
            if (selectedText) {
              setTextBlocks((prev) =>
                prev.filter((t) => t.id !== selectedText.id)
              );
            }
            setIsTextModalVisible(false);
            setSelectedText(null);
          }}
        />
<StickerModal
  visible={isStickerModalVisible}
  onClose={() => setIsStickerModalVisible(false)}
  onSelectEmoji={handleSelectEmoji}
  onSelectSticker={(sticker) => {
    // Будет реализовано когда появятся стикеры
    showError("Стикеры появятся в следующем обновлении");
  }}
/>
        {/* Кастомный алерт */}
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={() => setAlertVisible(false)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#16DBBE",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  templateWrapper: {
    marginRight: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  template: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  previewWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    alignSelf: "center",
    width: SCREEN_WIDTH,
  },
  previewContainer: {
    width: SCREEN_WIDTH,
    position: "relative",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: "100%",
    resizeMode: "contain",
  },
  emptyPlaceholder: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  // Стили для нижней панели с кнопками
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(22, 219, 190, 0.1)",
    borderRadius: 12,
    marginTop: 5,
    marginBottom: 20,
    
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
    flex: 1,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#888",
  },
  // Стили для кнопки "Далее"
  nextButton: {
    backgroundColor: "#16DBBE",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  nextButtonDisabled: {
    backgroundColor: "#888",
    opacity: 0.7,
  },
  nextButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CreateMemeScreen;
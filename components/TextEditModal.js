import React, { useState, useEffect, useRef } from "react";
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView, 
  Platform, 
  Keyboard,
  PanResponder
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { fontList } from '../src/assets/fonts/fonts';

const { width, height } = Dimensions.get("window");

const TextEditModal = ({ visible, textBlock, onClose, onChange }) => {
  const [localFontSize, setLocalFontSize] = useState(28);
  const [localText, setLocalText] = useState("");
  const [localColor, setLocalColor] = useState("#ffffff");
  const [localFontFamily, setLocalFontFamily] = useState("Roboto");
  const [hasBackground, setHasBackground] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const sliderTrackRef = useRef(null);
  const [sliderLayout, setSliderLayout] = useState({ y: 0, height: 0 });
  const insets = useSafeAreaInsets();

  // Используем шрифты из общего файла
  const fonts = fontList;

  const textColors = [
    "#ffffff", "#000000", "#ff0000", "#ff4000", "#ff8000", "#ffbf00",
    "#ffff00", "#bfff00", "#80ff00", "#40ff00", "#00ff00", "#00ff40",
    "#00ff80", "#00ffbf", "#00ffff", "#00bfff", "#0080ff", "#0040ff",
    "#0000ff", "#4000ff", "#8000ff", "#bf00ff", "#ff00ff", "#ff00bf",
    "#ff0080", "#ff0040", "#ff007f", "#ff3399", "#ff66b2", "#ff99cc",
  ];

  // Инициализация при открытии
  useEffect(() => {
    if (visible && textBlock) {
      setLocalText(textBlock.text === "Новый текст" ? "" : textBlock.text || "");
      setLocalFontSize(textBlock.fontSize || 28);
      setLocalColor(textBlock.color || "#ffffff");
      setLocalFontFamily(textBlock.fontFamily || "Roboto");
      setHasBackground(textBlock.background || false);
      setBackgroundColor(textBlock.backgroundColor || "#ffffff");
    }
  }, [visible, textBlock]);

  // Слушатель клавиатуры
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleClose = () => {
    onSave?.({
      ...textBlock,
      text: localText,
      fontSize: localFontSize,
      color: localColor,
      fontFamily: localFontFamily,
      background: hasBackground,
      backgroundColor
    });
    onClose?.();
  };
  

  // Слайдер размера шрифта
  const handleSliderMove = (pageY) => {
    if (!sliderLayout.height || !sliderLayout.y) return;
    const relativeY = pageY - sliderLayout.y;
    const clampedY = Math.max(0, Math.min(sliderLayout.height, relativeY));
    const percentage = 1 - clampedY / sliderLayout.height;
    const newSize = 12 + percentage * (120 - 12);
    setLocalFontSize(Math.round(newSize));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => handleSliderMove(evt.nativeEvent.pageY),
    onPanResponderMove: (evt) => handleSliderMove(evt.nativeEvent.pageY),
  });

  const onSliderLayout = () => {
    sliderTrackRef.current?.measureInWindow((x, y, width, height) => {
      setSliderLayout({ y, height });
    });
  };

  if (!visible) return null;

  const progressPercentage = ((localFontSize - 12) / (120 - 12)) * 100;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        >
          <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
            
            {/* Слайдер размера */}
            <View style={styles.sliderContainer}>
              <View 
                ref={sliderTrackRef}
                style={styles.sliderTrack}
                onLayout={onSliderLayout}
                {...panResponder.panHandlers}
              >
                <View style={[styles.sliderProgress, { height: `${progressPercentage}%` }]} />
                <LinearGradient
                  colors={['#00DEEB', '#77EE5F']}
                  style={[styles.sliderThumb, { bottom: `${progressPercentage}%` }]}
                />
              </View>
            </View>

            {/* Кнопка закрытия */}
            <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 20 }]} onPress={handleClose}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path 
                  d="M18.624 5.06401C18.8722 5.22951 19.0446 5.48684 19.1031 5.77939C19.1616 6.07195 19.1015 6.37576 18.936 6.62401L11.436 17.874C11.3436 18.0124 11.2217 18.1285 11.0791 18.2141C10.9364 18.2997 10.7765 18.3526 10.611 18.3689C10.4454 18.3853 10.2783 18.3647 10.1216 18.3087C9.96496 18.2527 9.82267 18.1626 9.70501 18.045L5.20501 13.545C5.00629 13.3317 4.89811 13.0497 4.90325 12.7582C4.90839 12.4668 5.02646 12.1887 5.23258 11.9826C5.4387 11.7765 5.71678 11.6584 6.00823 11.6532C6.29968 11.6481 6.58175 11.7563 6.79501 11.955L10.3245 15.4845L17.064 5.37451C17.2298 5.12652 17.4872 5.95451 17.7797 5.89628C18.0723 5.83806 18.3759 5.89839 18.624 5.06401Z"
                  fill="#fff"
                />
              </Svg>
            </TouchableOpacity>

            {/* Поле ввода текста */}
            <View style={styles.previewWrapper}>
              <View style={{ minHeight: localFontSize * 3, paddingHorizontal: 10 }}>
                <TextInput
                  style={[
                    {
                      fontFamily: localFontFamily,
                      fontSize: localFontSize,
                      color: localColor,
                      backgroundColor: hasBackground ? backgroundColor : "transparent",
                      paddingHorizontal: hasBackground ? 8 : 0,
                      borderRadius: hasBackground ? 4 : 0,
                      textAlign: "center",
                      textShadowColor: "rgba(0,0,0,0.5)",
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 2,
                      lineHeight: localFontSize * 1.2,
                      includeFontPadding: false,
                    }
                  ]}
                  value={localText}
                  onChangeText={setLocalText}
                  placeholder="Введите текст"
                  placeholderTextColor="#ccc"
                  multiline
                  textAlignVertical="center"
                />
              </View>
            </View>

            {/* Панель настроек */}
            <View style={[styles.menu, keyboardVisible && styles.menuWithKeyboard]}>
              
              {/* Выбор шрифта */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuRow}>
                {fonts.map(font => (
                  <TouchableOpacity 
                    key={font.name} 
                    onPress={() => setLocalFontFamily(font.name)} 
                    style={[
                      styles.fontItem, 
                      localFontFamily === font.name && styles.itemSelected
                    ]}
                  >
                    <Text style={[
                      { fontFamily: font.name },
                      styles.fontItemText,
                      localFontFamily === font.name && styles.fontItemTextSelected
                    ]}>
                      Aa
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Выбор цвета текста */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuRow}>
                {textColors.map(color => (
                  <TouchableOpacity 
                    key={color} 
                    onPress={() => setLocalColor(color)} 
                    style={[
                      styles.colorItem, 
                      { backgroundColor: color },
                      localColor === color && styles.itemSelected
                    ]} 
                  />
                ))}
              </ScrollView>

              {/* Выбор фона текста */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuRow}>
                <TouchableOpacity 
                  onPress={() => { setHasBackground(true); setBackgroundColor("#ffffff"); }} 
                  style={[
                    styles.bgItem, 
                    { backgroundColor: "#ffffff" },
                    hasBackground && backgroundColor === "#ffffff" && styles.itemSelected
                  ]}
                >
                  <Text style={styles.bgItemText}>A</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => { setHasBackground(true); setBackgroundColor("#000000"); }} 
                  style={[
                    styles.bgItem, 
                    { backgroundColor: "#000000" },
                    hasBackground && backgroundColor === "#000000" && styles.itemSelected
                  ]} 
                />
                
                <TouchableOpacity 
                  onPress={() => { setHasBackground(true); setBackgroundColor("rgba(255,255,255,0.3)"); }} 
                  style={[
                    styles.bgItem, 
                    { backgroundColor: "rgba(255,255,255,0.3)" },
                    hasBackground && backgroundColor === "rgba(255,255,255,0.3)" && styles.itemSelected
                  ]} 
                />
                
                <TouchableOpacity 
                  onPress={() => { setHasBackground(true); setBackgroundColor("rgba(0,0,0,0.3)"); }} 
                  style={[
                    styles.bgItem, 
                    { backgroundColor: "rgba(0,0,0,0.3)" },
                    hasBackground && backgroundColor === "rgba(0,0,0,0.3)" && styles.itemSelected
                  ]} 
                />
                
                <TouchableOpacity 
                  onPress={() => { setHasBackground(false); setBackgroundColor("transparent"); }} 
                  style={[
                    styles.bgItem, 
                    { backgroundColor: "transparent", borderWidth: 2, borderColor: "#fff" },
                    !hasBackground && styles.itemSelected
                  ]}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M7 17L17 7M7 7L17 17" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
                  </Svg>
                </TouchableOpacity>
              </ScrollView>
            </View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sliderContainer: {
    position: "absolute",
    left: 10,
    top: '30%',
    alignItems: "center",
    zIndex: 10,
    padding: 10,
  },
  sliderTrack: {
    width: 5,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    position: 'relative',
  },
  sliderProgress: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(119,238,95,0.6)',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    left: -9,
    marginTop: -12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  previewWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  menu: {
    backgroundColor: "rgba(34,34,34,0.7)",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  menuWithKeyboard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  menuRow: {
    flexDirection: "row",
    marginBottom: 8
  },
  fontItem: {
    marginHorizontal: 6,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fff",
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  fontItemText: {
    color: "#fff",
    fontSize: 16,
  },
  fontItemTextSelected: {
    color: "#16DBBE",
  },
  colorItem: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: "transparent"
  },
  bgItem: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  bgItemText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  itemSelected: {
    borderColor: "#16DBBE",
    borderWidth: 2,
  },
});

export default TextEditModal;
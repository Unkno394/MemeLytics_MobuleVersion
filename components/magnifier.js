// Magnifier.js
import React, { useEffect } from "react";
import { StyleSheet, View, Image } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate 
} from "react-native-reanimated";

const Magnifier = ({
  imageUri,
  x,
  y,
  size = 120,
  zoom = 3,
  imageWidth = 300,
  imageHeight = 300,
}) => {
  const halfSize = size / 2;

  const magnifierX = useSharedValue(x - halfSize);
  const magnifierY = useSharedValue(y - halfSize);
  
  // Добавляем анимированные значения для позиции изображения внутри лупы
  const imageOffsetX = useSharedValue(0);
  const imageOffsetY = useSharedValue(0);

  useEffect(() => {
    // Анимация позиции лупы
    magnifierX.value = withSpring(x - halfSize, { damping: 15, stiffness: 120 });
    magnifierY.value = withSpring(y - halfSize, { damping: 15, stiffness: 120 });
    
    // Плавная анимация смещения изображения внутри лупы
    const newImageLeft = -x * zoom + halfSize;
    const newImageTop = -y * zoom + halfSize;
  
    // Используем withSpring для более натурального движения
    imageOffsetX.value = withSpring(newImageLeft, { damping: 20, stiffness: 80 });
    imageOffsetY.value = withSpring(newImageTop, { damping: 20, stiffness: 80 });
  }, [x, y]);
  

  const animatedStyle = useAnimatedStyle(() => ({
    left: magnifierX.value,
    top: magnifierY.value,
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    width: imageWidth * zoom,
    height: imageHeight * zoom,
    position: "absolute",
    left: imageOffsetX.value,
    top: imageOffsetY.value,
  }));

  return (
    <Animated.View style={[styles.magnifier, { width: size, height: size }, animatedStyle]}>
      <Animated.Image
        source={{ uri: imageUri }}
        style={animatedImageStyle}
        resizeMode="cover"
      />
      <View style={styles.crosshairHorizontal} />
      <View style={styles.crosshairVertical} />
      <View style={styles.centerDot} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  magnifier: {
    position: "absolute",
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#16DBBE",
    overflow: "hidden",
    backgroundColor: "#000",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  crosshairHorizontal: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    top: "50%",
  },
  crosshairVertical: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.7)",
    left: "50%",
  },
  centerDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "red",
    top: "50%",
    left: "50%",
    marginLeft: -2,
    marginTop: -2,
    zIndex: 1001, // Чтобы был поверх всего
  },
});

export default Magnifier;
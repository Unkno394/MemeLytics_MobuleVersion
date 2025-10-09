import React, { useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  Grayscale,
  Sepia,
  Invert,
  Contrast,
  Brightness,
  Saturate,
  HueRotate,
} from 'react-native-color-matrix-image-filters';

const ScalableFilteredImage = React.memo(({ 
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
  const panGesture = useMemo(() => 
    Gesture.Pan()
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
      }),
    [isDrawingMode]
  );

  // Жест масштабирования
  const pinchGesture = useMemo(() => 
    Gesture.Pinch()
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
      }),
    [isDrawingMode]
  );

  // Жест вращения
  const rotationGesture = useMemo(() => 
    Gesture.Rotation()
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
      }),
    [isDrawingMode]
  );

  // Комбинируем жесты
  const composedGesture = useMemo(() => 
    Gesture.Simultaneous(
      panGesture,
      Gesture.Simultaneous(pinchGesture, rotationGesture)
    ),
    [panGesture, pinchGesture, rotationGesture]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  if (!uri) return <Animated.View style={[style, { backgroundColor: "#ccc" }]} />;
  
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
});

export default ScalableFilteredImage;